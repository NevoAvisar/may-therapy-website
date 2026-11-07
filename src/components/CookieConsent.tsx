import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { COOKIE_SETTINGS_EVENT, consentState, saveConsent, type ConsentCategory, type ConsentChoices } from '../lib/consent'
import { cn } from '../lib/cn'

// ==========================================
// Cookie categories | קטגוריות העוגיות
// ==========================================
const CATEGORIES: { id: ConsentCategory; label: string; about: string }[] = [
  { id: 'analytics', label: 'סטטיסטיקה', about: 'עוזרות להבין איך משתמשים באתר, כדי לשפר אותו.' },
  { id: 'marketing', label: 'שיווק', about: 'מאפשרות למדוד פרסום ולהציג תוכן מותאם.' },
]

const button = 'rounded-full px-5 py-2.5 text-sm font-medium transition-colors'
const solidButton = cn(button, 'border-2 border-forest-moss bg-forest-moss text-primary hover:bg-[#2F4035]')
const outlineButton = cn(button, 'border-2 border-forest-moss bg-white text-forest-moss hover:bg-river-mist')

/** On/off switch | מתג הפעלה */
function Switch({ label, on, disabled, onChange }: { label: string; on: boolean; disabled?: boolean; onChange?: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        'relative h-7 w-12 shrink-0 rounded-full border-2 border-forest-moss transition-colors disabled:opacity-60',
        on ? 'bg-forest-moss' : 'bg-white',
      )}
    >
      <span
        aria-hidden
        data-switch-knob
        className={cn('absolute top-0.5 h-5 w-5 rounded-full transition-all', on ? 'start-[1.4rem] bg-primary' : 'start-0.5 bg-forest-moss')}
      />
    </button>
  )
}

// ==========================================
// Cookie banner | באנר עוגיות
// ==========================================
/**
 * Docked to the bottom on a first visit, with nothing allowed until a choice is made. It doesn't take focus or block
 * the page, so it comes early in the DOM to keep it close to the Tab key's start. While it shows, its height is
 * published as --consent-h, so the floating buttons and page ends can stay clear of it.
 */
export default function CookieConsent() {
  const consent = consentState.use()
  const [reopened, setReopened] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [choices, setChoices] = useState<ConsentChoices>({ analytics: false, marketing: false })

  const panelRef = useRef<HTMLElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const settingsButtonRef = useRef<HTMLButtonElement>(null)
  const settingsTitleRef = useRef<HTMLHeadingElement>(null)

  const visible = !consent || reopened

  useEffect(() => {
    const reopen = () => {
      const saved = consentState.get()
      openerRef.current = document.activeElement as HTMLElement | null
      setChoices({ analytics: saved?.analytics ?? false, marketing: saved?.marketing ?? false })
      setReopened(true)
      setShowSettings(true)
    }
    window.addEventListener(COOKIE_SETTINGS_EVENT, reopen)
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, reopen)
  }, [])

  useEffect(() => {
    const panel = panelRef.current
    if (!visible || !panel) return
    const root = document.documentElement
    const observer = new ResizeObserver(() => root.style.setProperty('--consent-h', `${panel.offsetHeight}px`))
    observer.observe(panel)
    return () => {
      observer.disconnect()
      root.style.removeProperty('--consent-h')
    }
  }, [visible])

  // The settings view replaces the button that opened it, so focus has to move with it.
  useEffect(() => {
    if (showSettings) settingsTitleRef.current?.focus()
  }, [showSettings])

  const finish = () => {
    setShowSettings(false)
    setReopened(false)
    openerRef.current?.focus()
    openerRef.current = null
  }

  const decide = (next: ConsentChoices) => {
    saveConsent(next)
    finish()
  }

  const leaveSettings = () => {
    if (reopened) return finish()
    setShowSettings(false)
    // Runs once React has put the button back | רץ אחרי שהכפתור חזר למסך
    requestAnimationFrame(() => settingsButtonRef.current?.focus())
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && showSettings) leaveSettings()
  }

  if (!visible) return null

  return (
    <section
      ref={panelRef}
      aria-label="הסכמה לשימוש בעוגיות"
      data-surface
      data-lenis-prevent
      onKeyDown={onKeyDown}
      className="fixed inset-x-0 bottom-0 z-[80] max-h-[80dvh] overflow-y-auto border-t border-forest-moss/30 bg-primary text-forest-moss shadow-[0_-12px_32px_-20px_rgba(62,84,69,0.5)]"
    >
      <div className="mx-auto max-w-5xl px-5 py-4">
        {showSettings ? (
          <>
            <h2 ref={settingsTitleRef} tabIndex={-1} className="font-display text-xl font-medium">
              הגדרות עוגיות
            </h2>
            <ul className="mt-3 divide-y divide-forest-moss/20">
              <li className="flex items-center justify-between gap-4 py-2.5">
                <div className="text-sm">
                  <p className="font-medium">הכרחיות (תמיד פעילות)</p>
                  <p>נדרשות כדי שהאתר יפעל וכדי לזכור את הבחירות שלך.</p>
                </div>
                <Switch label="עוגיות הכרחיות, תמיד פעילות" on disabled />
              </li>
              {CATEGORIES.map(({ id, label, about }) => (
                <li key={id} className="flex items-center justify-between gap-4 py-2.5">
                  <div className="text-sm">
                    <p className="font-medium">{label}</p>
                    <p>{about}</p>
                  </div>
                  <Switch label={`עוגיות ${label}`} on={choices[id]} onChange={() => setChoices({ ...choices, [id]: !choices[id] })} />
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => decide(choices)} className={solidButton}>
                שמירת הבחירה
              </button>
              <button type="button" onClick={leaveSettings} className={outlineButton}>
                חזרה
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
            <p className="text-sm leading-relaxed">
              האתר משתמש בעוגיות כדי לשפר את חוויית השימוש, למדוד תנועה ולאפשר את פעולתו. עוגיות שאינן הכרחיות יופעלו רק באישורך.{' '}
              <a href="/privacy" className="font-medium underline underline-offset-4">
                מדיניות הפרטיות
              </a>
            </p>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button type="button" onClick={() => decide({ analytics: true, marketing: true })} className={solidButton}>
                אישור הכל
              </button>
              <button type="button" onClick={() => decide({ analytics: false, marketing: false })} className={outlineButton}>
                עוגיות הכרחיות בלבד
              </button>
              <button ref={settingsButtonRef} type="button" onClick={() => setShowSettings(true)} className={outlineButton}>
                הגדרות עוגיות
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
