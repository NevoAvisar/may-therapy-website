import { ANALYTICS } from '../config'
import { consentState, hasConsent, whenConsented, type ConsentCategory } from './consent'

// ==========================================
// Analytics and marketing scripts | סקריפטים של סטטיסטיקה ושיווק
// ==========================================
/* Nothing loads until its ID is set in ANALYTICS (src/config.ts) and the visitor has approved its category. */
type TrackerWindow = Window & {
  dataLayer?: unknown[]
  gtag?: (...args: unknown[]) => void
  fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string; callMethod?: unknown }
  _fbq?: unknown
}

const page = window as TrackerWindow

const addScript = (src: string) => {
  const script = document.createElement('script')
  script.src = src
  script.async = true
  document.head.append(script)
}

function startGoogleAnalytics(id: string) {
  page.dataLayer = page.dataLayer ?? []
  page.gtag = function () {
    // gtag reads the raw `arguments` object, not an array | gtag קורא את האובייקט `arguments` ולא מערך
    // eslint-disable-next-line prefer-rest-params
    page.dataLayer!.push(arguments)
  }
  page.gtag('js', new Date())
  page.gtag('config', id, { anonymize_ip: true })
  addScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`)
}

function startMetaPixel(id: string) {
  const fbq: NonNullable<TrackerWindow['fbq']> = (...args) => fbq.queue!.push(args)
  fbq.queue = []
  fbq.loaded = true
  fbq.version = '2.0'
  page.fbq = page._fbq = fbq
  fbq('init', id)
  fbq('track', 'PageView')
  addScript('https://connect.facebook.net/en_US/fbevents.js')
}

// ==========================================
// Withdrawing consent | ביטול הסכמה
// ==========================================
const TRACKER_COOKIES: Record<ConsentCategory, RegExp> = {
  analytics: /^(_ga|_gid|_gat)/,
  marketing: /^(_fbp|_fbc)/,
}

/** A cookie is only removed by naming the domain it was set on, which may be any level of the host. */
function clearCookies(pattern: RegExp) {
  const parts = location.hostname.split('.')
  const domains = ['', ...parts.map((_, i) => `.${parts.slice(i).join('.')}`)]
  for (const cookie of document.cookie.split('; ')) {
    const name = cookie.split('=')[0]
    if (!pattern.test(name)) continue
    for (const domain of domains) document.cookie = `${name}=; Max-Age=0; path=/${domain && `; domain=${domain}`}`
  }
}

export function initTrackers() {
  // On every load, as trackers can write their cookies once more while the page unloads after a withdrawal.
  // בכל טעינה, כי סקריפטים יכולים לכתוב את העוגיות שלהם פעם נוספת בזמן שהדף נסגר אחרי ביטול הסכמה.
  for (const [category, pattern] of Object.entries(TRACKER_COOKIES)) {
    if (!hasConsent(category as ConsentCategory)) clearCookies(pattern)
  }

  const started = new Set<ConsentCategory>()
  const start = (category: ConsentCategory, id: string, run: (id: string) => void) => {
    if (!id) return
    whenConsented(category, () => {
      started.add(category)
      run(id)
    })
  }

  start('analytics', ANALYTICS.googleAnalyticsId, startGoogleAnalytics)
  start('marketing', ANALYTICS.metaPixelId, startMetaPixel)

  // A running script can't be unloaded, so a withdrawal reloads the page without it.
  // אי אפשר להסיר סקריפט שכבר רץ, ולכן ביטול הסכמה טוען את הדף מחדש בלעדיו.
  consentState.subscribe(() => {
    if (![...started].every(hasConsent)) location.reload()
  })
}
