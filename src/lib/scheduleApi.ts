import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { BOOKING, SUPABASE } from '../config'
import type { Override, Schedule, Slot, TimeWindow } from './booking'

// ==========================================
// Supabase access for the schedule | גישה ל-Supabase עבור היומן
// ==========================================
export type Contact = { name: string; phone: string; email: string }
export type Booking = Contact & { id: string; start_at: string }

export const scheduleConfigured = () => Boolean(SUPABASE.url && SUPABASE.anonKey)

let client: SupabaseClient | null = null
const db = () => (client ??= createClient(SUPABASE.url, SUPABASE.anonKey))

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }) {
  if (error) throw new Error(error.message)
  return data as T
}

// Public site | האתר הציבורי
export async function loadSchedule(): Promise<Schedule> {
  if (!scheduleConfigured()) {
    return { workDays: BOOKING.defaultWorkDays, windows: BOOKING.defaultWindows, overrides: [], busy: [] }
  }
  const [settings, overrides, busy] = await Promise.all([
    db().from('schedule_settings').select('work_days, windows').single(),
    db().from('schedule_overrides').select('date, time, is_open'),
    db().rpc('busy_times'),
  ])
  const { work_days, windows } = unwrap(settings)
  return {
    workDays: work_days,
    windows,
    overrides: unwrap(overrides),
    busy: (unwrap(busy) as { start_at: string; blocked_until: string }[]).map((b) => ({
      start: Date.parse(b.start_at),
      end: Date.parse(b.blocked_until),
    })),
  }
}

/** Resolves to false if the slot was taken or closed in the meantime. */
export async function holdSlot({ date, time }: Slot, contact: Contact) {
  if (!scheduleConfigured()) return true
  const held = await db().rpc('book_slot', {
    p_date: date,
    p_time: time,
    p_name: contact.name,
    p_phone: contact.phone,
    p_email: contact.email,
  })
  return unwrap(held) as boolean
}

// May's admin panel | פאנל הניהול של מאי
export async function isAdminSession() {
  const { data } = await db().auth.getSession()
  if (!data.session) return false
  return unwrap(await db().rpc('is_admin')) as boolean
}

export async function signIn(email: string, password: string) {
  const { error } = await db().auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return isAdminSession()
}

export const signOut = () => db().auth.signOut()

export async function loadBookings() {
  const bookings = await db()
    .from('bookings')
    .select('id, start_at, name, phone, email')
    .eq('status', 'held')
    .gte('start_at', new Date().toISOString())
    .order('start_at')
  return unwrap(bookings) as Booking[]
}

export async function releaseBooking(id: string) {
  unwrap(await db().from('bookings').update({ status: 'released' }).eq('id', id))
}

export async function setOverride(override: Override) {
  unwrap(await db().from('schedule_overrides').upsert(override))
}

export async function clearOverride(date: string, time: string) {
  unwrap(await db().from('schedule_overrides').delete().eq('date', date).eq('time', time))
}

export async function saveWeek(workDays: number[], windows: TimeWindow[]) {
  unwrap(await db().from('schedule_settings').update({ work_days: workDays, windows }).eq('id', 1))
}
