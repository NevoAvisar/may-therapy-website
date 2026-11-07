import { BOOKING, whatsappLink } from '../config'

/**
 * Date and link logic for the booking picker. Dates are 'YYYY-MM-DD' strings and times 'HH:MM', both
 * meaning Israel wall-clock time, so a client's own time zone can never shift a slot to another day.
 */

// ==========================================
// Booking logic: types | לוגיקת התיאום: טיפוסים
// ==========================================
export type Slot = { date: string; time: string; minutes: number }
export type TimeWindow = { start: string; end: string }
/** An exception to the regular week. An empty time means the whole day. */
export type Override = { date: string; time: string; is_open: boolean }
/** Taken stretches in epoch ms, call and buffer included. */
export type Busy = { start: number; end: number }
export type Schedule = { workDays: number[]; windows: TimeWindow[]; overrides: Override[]; busy: Busy[] }

const CLINIC_TIME_ZONE = 'Asia/Jerusalem'

const clinicClock = new Intl.DateTimeFormat('en-CA', {
  timeZone: CLINIC_TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

// ==========================================
// Clinic time and dates | זמן ותאריכים לפי שעון הקליניקה
// ==========================================
function clinicParts(at: Date) {
  return Object.fromEntries(clinicClock.formatToParts(at).map((part) => [part.type, part.value]))
}

/** Calendar date in Israel right now. */
export function clinicToday(now: Date) {
  const { year, month, day } = clinicParts(now)
  return `${year}-${month}-${day}`
}

/** Israel date and time of an instant, e.g. a booking loaded from the database. */
export function clinicSlot(at: string | Date) {
  const { year, month, day, hour, minute } = clinicParts(new Date(at))
  return { date: `${year}-${month}-${day}`, time: `${hour}:${minute}` }
}

const utcDate = (date: string) => new Date(`${date}T00:00:00Z`)

export function addDays(date: string, days: number) {
  return new Date(utcDate(date).getTime() + days * 86_400_000).toISOString().slice(0, 10)
}

/** The real instant a slot starts, with Israel's daylight saving applied for that date. */
export function slotStart({ date, time }: Pick<Slot, 'date' | 'time'>) {
  const wallClock = Date.parse(`${date}T${time}:00Z`)
  const offsetAt = (instant: number) => {
    const p = clinicParts(new Date(instant))
    return Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`) - instant
  }
  return new Date(wallClock - offsetAt(wallClock - offsetAt(wallClock)))
}

// ==========================================
// Which times are on offer | אילו שעות פנויות
// ==========================================
const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const toTime = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

const slotLength = BOOKING.callMinutes + BOOKING.bufferMinutes

/** Regular start times: back to back, one call plus its buffer apart, ending inside the window. */
export function windowTimes(windows: TimeWindow[]) {
  return windows.flatMap(({ start, end }) => {
    const times: string[] = []
    for (let at = toMinutes(start); at + BOOKING.callMinutes <= toMinutes(end); at += slotLength) times.push(toTime(at))
    return times
  })
}

const findOverride = (schedule: Schedule, date: string, time: string) =>
  schedule.overrides.find((o) => o.date === date && o.time === time)

/** Whether the day is open: May's choice for that date, otherwise the regular week. */
export function isDayOpen(date: string, schedule: Schedule) {
  return findOverride(schedule, date, '')?.is_open ?? schedule.workDays.includes(utcDate(date).getUTCDay())
}

function offeredTimes(date: string, schedule: Schedule) {
  if (findOverride(schedule, date, '')?.is_open === false) return []
  const regular = isDayOpen(date, schedule) ? windowTimes(schedule.windows) : []
  const custom = schedule.overrides.filter((o) => o.date === date && o.time && o.is_open).map((o) => o.time)
  return [...new Set([...regular, ...custom])]
    .filter((time) => findOverride(schedule, date, time)?.is_open !== false)
    .sort()
}

/** Whether a call here, with its buffer, would touch a taken time. */
function isTaken(start: number, schedule: Schedule) {
  const end = start + slotLength * 60_000
  return schedule.busy.some((busy) => start < busy.end && busy.start < end)
}

/** Times a client can book on `date`: offered, far enough ahead of `now`, and clear of other calls. */
export function openTimes(date: string, schedule: Schedule, now: Date) {
  const earliest = now.getTime() + BOOKING.minLeadHours * 3_600_000
  return offeredTimes(date, schedule).filter((time) => {
    const start = slotStart({ date, time }).getTime()
    return start >= earliest && !isTaken(start, schedule)
  })
}

export function isBookable(date: string, schedule: Schedule, now: Date) {
  const today = clinicToday(now)
  if (date < today || date > addDays(today, BOOKING.daysAhead)) return false
  return openTimes(date, schedule, now).length > 0
}

export function firstBookableDate(schedule: Schedule, now: Date) {
  const today = clinicToday(now)
  for (let i = 0; i <= BOOKING.daysAhead; i++) {
    const date = addDays(today, i)
    if (isBookable(date, schedule, now)) return date
  }
  return today
}

/** Every slot May can act on for a date. Closed regular slots stay listed so she can reopen them. */
export function adminSlots(date: string, schedule: Schedule) {
  const regular = windowTimes(schedule.windows)
  const custom = schedule.overrides.filter((o) => o.date === date && o.time).map((o) => o.time)
  const offered = offeredTimes(date, schedule)
  return [...new Set([...(isDayOpen(date, schedule) ? regular : []), ...custom])].sort().map((time) => ({
    time,
    isOpen: offered.includes(time),
    isCustom: !regular.includes(time),
    isBooked: schedule.busy.some((busy) => busy.start === slotStart({ date, time }).getTime()),
  }))
}

// ==========================================
// Calendar grid and date text | לוח השנה ותצוגת תאריכים
// ==========================================
export function shiftMonth(month: string, by: number) {
  const [year, m] = month.split('-').map(Number)
  return new Date(Date.UTC(year, m - 1 + by, 1)).toISOString().slice(0, 7)
}

/** Dates of a 'YYYY-MM' month, led by nulls so the 1st lands under its weekday in a Sunday-first grid. */
export function monthGrid(month: string) {
  const first = `${month}-01`
  const cells: (string | null)[] = Array(utcDate(first).getUTCDay()).fill(null)
  for (let date = first; date.startsWith(month); date = addDays(date, 1)) cells.push(date)
  return cells
}

const hebrewDate = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('he-IL', { timeZone: 'UTC', ...options })
const longDate = hebrewDate({ weekday: 'long', day: 'numeric', month: 'long' })
const monthTitle = hebrewDate({ month: 'long', year: 'numeric' })

export const formatLongDate = (date: string) => longDate.format(utcDate(date))
export const formatMonth = (month: string) => monthTitle.format(utcDate(`${month}-01`))

/** 8.11.2026 */
function formatShortDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return `${day}.${month}.${year}`
}

// ==========================================
// WhatsApp message and calendar files | הודעת וואטסאפ וקובצי יומן
// ==========================================
export function bookingWhatsappUrl({ date, time, minutes }: Slot) {
  return whatsappLink(
    BOOKING.whatsappMessage
      .replace('{minutes}', String(minutes))
      .replace('{date}', formatShortDate(date))
      .replace('{time}', time),
  )
}

/** UTC stamp both calendar formats accept: 20261108T070000Z */
const calendarStamp = (at: Date) => at.toISOString().replace(/[-:]|\.\d{3}/g, '')

function eventTimes(slot: Slot) {
  const start = slotStart(slot)
  const end = new Date(start.getTime() + slot.minutes * 60_000)
  return { start: calendarStamp(start), end: calendarStamp(end) }
}

export function googleCalendarUrl(slot: Slot) {
  const { start, end } = eventTimes(slot)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: BOOKING.eventTitle,
    dates: `${start}/${end}`,
    details: BOOKING.eventDetails,
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

const icsText = (text: string) => text.replace(/([\\;,])/g, '\\$1').replace(/\n/g, '\\n')
// iCalendar caps lines at 75 bytes; 18 characters stays under that even at 4 bytes each.
const foldIcsLine = (line: string) => line.match(/.{1,18}/gu)?.join('\r\n ') ?? line

export function buildIcs(slot: Slot) {
  const { start, end } = eventTimes(slot)
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//May Therapy//Booking//HE',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${start}-${Date.now()}@may-therapy`,
    `DTSTAMP:${calendarStamp(new Date())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    foldIcsLine(`SUMMARY:${icsText(BOOKING.eventTitle)}`),
    foldIcsLine(`DESCRIPTION:${icsText(BOOKING.eventDetails)}`),
    'STATUS:TENTATIVE',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}

export function downloadIcs(slot: Slot) {
  const url = URL.createObjectURL(new Blob([buildIcs(slot)], { type: 'text/calendar;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'may-intro-call.ics'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
