import { useSyncExternalStore } from 'react'

// ==========================================
// State kept in localStorage | מצב שנשמר ב-localStorage
// ==========================================
/**
 * A value mirrored to localStorage, shared by React and plain code, and in step across tabs.
 * `read` turns whatever is stored (or null) into a valid value, so an old or edited entry can't break the page.
 * Storage can be blocked in private browsing: the value then simply lasts until the tab closes.
 */
export function createStoredState<T>(key: string, read: (stored: unknown) => T) {
  const load = () => {
    try {
      return read(JSON.parse(localStorage.getItem(key) ?? 'null'))
    } catch {
      return read(null)
    }
  }

  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach((listener) => listener())
  let value = load()

  const get = () => value
  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  window.addEventListener('storage', (e) => {
    if (e.key !== key) return
    value = load()
    notify()
  })

  return {
    get,
    subscribe,
    set(next: T) {
      value = next
      try {
        localStorage.setItem(key, JSON.stringify(next))
      } catch {
        // Blocked storage: keep the value for this visit | אחסון חסום: הערך נשמר לביקור הנוכחי בלבד
      }
      notify()
    },
    /** React hook for the current value | הוק של React לערך הנוכחי */
    use: () => useSyncExternalStore(subscribe, get),
  }
}
