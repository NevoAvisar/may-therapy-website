import { createStoredState } from './storedState'

// ==========================================
// Cookie consent | הסכמה לעוגיות
// ==========================================
/** Essential cookies are always on, so only these two need a choice | עוגיות הכרחיות תמיד פעילות, ולכן רק לשתי אלה נדרשת בחירה */
export type ConsentCategory = 'analytics' | 'marketing'
export type ConsentChoices = Record<ConsentCategory, boolean>
export type Consent = ConsentChoices & { essential: true; timestamp: string }

/** null until the visitor has chosen, and the banner shows for as long as it stays null. */
export const consentState = createStoredState<Consent | null>('cookie_consent_v1', (stored) => {
  const saved = stored as Partial<Consent> | null
  if (!saved || typeof saved.timestamp !== 'string') return null
  return { essential: true, analytics: saved.analytics === true, marketing: saved.marketing === true, timestamp: saved.timestamp }
})

export const saveConsent = (choices: ConsentChoices) =>
  consentState.set({ essential: true, ...choices, timestamp: new Date().toISOString() })

/** Whether a category has been approved. False until the visitor says otherwise | האם הקטגוריה אושרה */
export const hasConsent = (category: ConsentCategory) => consentState.get()?.[category] === true

/** React hook: whether a category has been approved | הוק של React: האם הקטגוריה אושרה */
export const useConsent = (category: ConsentCategory) => consentState.use()?.[category] === true

/**
 * Runs `load` once, as soon as `category` is approved: at once if it already is. Every third-party script goes through
 * here, so nothing loads before the visitor agrees. Returns a cancel function.
 * מריץ את `load` פעם אחת ברגע שהקטגוריה מאושרת. כל סקריפט חיצוני עובר דרך כאן, כך ששום דבר לא נטען לפני ההסכמה.
 */
export function whenConsented(category: ConsentCategory, load: () => void) {
  if (hasConsent(category)) {
    load()
    return () => {}
  }
  const unsubscribe = consentState.subscribe(() => {
    if (!hasConsent(category)) return
    unsubscribe()
    load()
  })
  return unsubscribe
}

// Reopening the banner | פתיחה מחדש של הגדרות העוגיות
export const COOKIE_SETTINGS_EVENT = 'cookies:settings'

/** Lets a visitor change their mind, from the footer or the privacy policy | מאפשר לשנות את הבחירה מהכותרת התחתונה או ממדיניות הפרטיות */
export const openCookieSettings = () => window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT))
