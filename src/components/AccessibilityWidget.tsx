import { useCallback, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Accessibility,
  Blend,
  Check,
  Contrast as ContrastIcon,
  Droplet,
  Focus,
  Link as LinkIcon,
  Minus,
  MousePointer2,
  Pause,
  Plus,
  RotateCcw,
  Type,
  X,
  type LucideIcon,
} from 'lucide-react'
import { A11Y_DEFAULTS, MAX_TEXT_LEVEL, a11yPrefs, type A11yPrefs, type BigCursor, type Contrast } from '../lib/a11y'
import { useDialog } from '../lib/useDialog'
import { cn } from '../lib/cn'

// ==========================================
// Menu pieces | רכיבי התפריט
// ==========================================
const TEXT_LEVELS = ['רגיל', 'גדול', 'גדול יותר', 'הגדול ביותר']

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="mt-5">
      <legend className="mb-2 text-sm font-medium text-forest-moss">{title}</legend>
      {children}
    </fieldset>
  )
}

/** A setting that is on or off. The check mark means its state never rests on colour alone. */
function Tile({ icon: Icon, label, on, onToggle }: { icon: LucideIcon; label: string; on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onToggle}
      className={cn(
        'relative flex min-h-[4.75rem] flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-2.5 text-center text-sm leading-tight transition-colors',
        on ? 'border-forest-moss bg-forest-moss text-primary' : 'border-forest-moss/70 bg-white text-forest-moss hover:bg-river-mist',
      )}
    >
      {on && <Check className="absolute end-2 top-2 h-4 w-4" aria-hidden />}
      <Icon className="h-5 w-5" aria-hidden />
      {label}
    </button>
  )
}

const stepButton =
  'grid h-11 w-11 place-items-center rounded-full border border-forest-moss/70 bg-white text-forest-moss transition-colors hover:bg-river-mist aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:bg-white'

function TextSize({ level, onChange }: { level: number; onChange: (level: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      {/* aria-disabled, not disabled: a disabled button would drop the keyboard user's focus at the end of the range */}
      <button
        type="button"
        aria-label="הקטנת טקסט"
        aria-disabled={level === 0}
        onClick={() => level > 0 && onChange(level - 1)}
        className={stepButton}
      >
        <Minus className="h-5 w-5" aria-hidden />
      </button>
      <p aria-live="polite" className="text-center text-sm text-forest-moss">
        <Type className="me-1.5 inline h-4 w-4" aria-hidden />
        גודל: {TEXT_LEVELS[level]}
      </p>
      <button
        type="button"
        aria-label="הגדלת טקסט"
        aria-disabled={level === MAX_TEXT_LEVEL}
        onClick={() => level < MAX_TEXT_LEVEL && onChange(level + 1)}
        className={stepButton}
      >
        <Plus className="h-5 w-5" aria-hidden />
      </button>
    </div>
  )
}

// ==========================================
// Accessibility widget | תפריט נגישות
// ==========================================
/** Sits above the WhatsApp button, clear of the TreeSpine on the right. Rises over the cookie banner while it shows. */
export default function AccessibilityWidget() {
  const prefs = a11yPrefs.use()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setOpen(false), [])
  useDialog(panelRef, open, close)

  const update = (change: Partial<A11yPrefs>) => a11yPrefs.set({ ...a11yPrefs.get(), ...change })
  const toggle = (key: 'readableFont' | 'highlightLinks' | 'stopMotion' | 'focusRing') => () => update({ [key]: !prefs[key] })
  // These two are either-or, so pressing one again turns it off | אלה בחירות בלעדיות, ולחיצה חוזרת מכבה
  const setContrast = (contrast: Contrast) => () => update({ contrast: prefs.contrast === contrast ? 'none' : contrast })
  const setCursor = (cursor: BigCursor) => () => update({ cursor: prefs.cursor === cursor ? 'none' : cursor })

  return (
    <>
      <button
        type="button"
        data-surface
        aria-label="תפריט נגישות"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? 'a11y-panel' : undefined}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="fixed bottom-[calc(5.75rem+var(--consent-h,0px))] left-5 z-[60] grid h-14 w-14 place-items-center rounded-full bg-forest-moss text-primary shadow-bloom transition-colors hover:bg-stream-blue"
      >
        <Accessibility className="h-7 w-7" aria-hidden />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            id="a11y-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="a11y-title"
            data-surface
            data-lenis-prevent
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
            className="fixed bottom-5 left-5 z-[90] max-h-[calc(100dvh-2.5rem)] w-[min(23rem,calc(100vw-2.5rem))] overflow-y-auto overscroll-contain rounded-3xl border border-forest-moss/30 bg-primary p-5 text-forest-moss shadow-glass"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="a11y-title" className="font-display text-2xl font-medium">
                תפריט נגישות
              </h2>
              <button
                type="button"
                aria-label="סגירת תפריט הנגישות"
                onClick={close}
                className="grid h-11 w-11 place-items-center rounded-full border border-forest-moss/70 bg-white transition-colors hover:bg-river-mist"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <Group title="גודל טקסט">
              <TextSize level={prefs.textLevel} onChange={(textLevel) => update({ textLevel })} />
            </Group>

            <Group title="ניגודיות וצבע">
              <div className="grid grid-cols-3 gap-2">
                <Tile icon={ContrastIcon} label="ניגודיות גבוהה" on={prefs.contrast === 'high'} onToggle={setContrast('high')} />
                <Tile icon={Blend} label="צבעים הפוכים" on={prefs.contrast === 'invert'} onToggle={setContrast('invert')} />
                <Tile icon={Droplet} label="גווני אפור" on={prefs.contrast === 'gray'} onToggle={setContrast('gray')} />
              </div>
            </Group>

            <Group title="קריאות וניווט">
              <div className="grid grid-cols-3 gap-2">
                <Tile icon={Type} label="גופן קריא" on={prefs.readableFont} onToggle={toggle('readableFont')} />
                <Tile icon={LinkIcon} label="הדגשת קישורים" on={prefs.highlightLinks} onToggle={toggle('highlightLinks')} />
                <Tile icon={Focus} label="סימון מיקוד" on={prefs.focusRing} onToggle={toggle('focusRing')} />
              </div>
            </Group>

            <Group title="תנועה וסמן">
              <div className="grid grid-cols-3 gap-2">
                <Tile icon={Pause} label="עצירת אנימציות" on={prefs.stopMotion} onToggle={toggle('stopMotion')} />
                <Tile icon={MousePointer2} label="סמן גדול לבן" on={prefs.cursor === 'white'} onToggle={setCursor('white')} />
                <Tile icon={MousePointer2} label="סמן גדול שחור" on={prefs.cursor === 'black'} onToggle={setCursor('black')} />
              </div>
            </Group>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => a11yPrefs.set(A11Y_DEFAULTS)}
                className="inline-flex items-center gap-2 rounded-full bg-forest-moss px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-[#2F4035]"
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
                איפוס הגדרות
              </button>
              <a href="/accessibility" className="py-2 text-sm font-medium text-forest-moss underline underline-offset-4">
                הצהרת נגישות
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
