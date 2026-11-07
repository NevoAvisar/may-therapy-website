import { BOOKING, whatsappLink } from '../config'

/**
 * Date and link logic for the booking picker. Dates are 'YYYY-MM-DD' strings and times 'HH:MM', both
 * meaning Israel wall-clock time, so a client's own time zone can never shift a slot to another day.
 */

export type Slot = { date: string; time: string; minutes: number }

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

function clinicParts(at: Date) {
  return Object.fromEntries(clinicClock.formatToParts(at).map((part) => [part.type, part.value]))
}

/** Calendar date in Israel right now. */
export function clinicToday(now: Date) {
  const { year, month, day } = clinicParts(now)
  return `${year}-${month}-${day}`
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

/** Slot times still open on `date`: the times in `times` that are far enough ahead of `now`. */
export function openTimes(date: string, times: string[], now: Date) {
  const earliest = now.getTime() + BOOKING.minLeadHours * 3_600_000
  return times.filter((time) => slotStart({ date, time }).getTime() >= earliest)
}

export function isBookable(date: string, now: Date) {
  const today = clinicToday(now)
  if (date < today || date > addDays(today, BOOKING.daysAhead)) return false
  if (!BOOKING.workDays.includes(utcDate(date).getUTCDay()) || BOOKING.blockedDates.includes(date)) return false
  return openTimes(date, [...BOOKING.morningSlots, ...BOOKING.eveningSlots], now).length > 0
}

export function firstBookableDate(now: Date) {
  const today = clinicToday(now)
  for (let i = 0; i <= BOOKING.daysAhead; i++) {
    const date = addDays(today, i)
    if (isBookable(date, now)) return date
  }
  return today
}

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
