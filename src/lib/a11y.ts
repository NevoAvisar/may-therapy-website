import { MotionGlobalConfig, useReducedMotion } from 'framer-motion'
import { createStoredState } from './storedState'

// ==========================================
// Accessibility preferences | העדפות נגישות
// ==========================================
/**
 * The widget's choices, saved in localStorage and applied as classes on <html>, so they cascade over the whole
 * site from one stylesheet (src/a11y.css). They run before the first render, so a reload never flashes the default look.
 *
 * הבחירות בתפריט הנגישות נשמרות ב-localStorage ומוחלות כמחלקות על <html>, ומשם חלות על כל האתר מקובץ עיצוב אחד.
 */
export type Contrast = 'none' | 'high' | 'invert' | 'gray'
export type BigCursor = 'none' | 'white' | 'black'

export type A11yPrefs = {
  textLevel: number
  contrast: Contrast
  readableFont: boolean
  highlightLinks: boolean
  stopMotion: boolean
  cursor: BigCursor
  focusRing: boolean
}

export const MAX_TEXT_LEVEL = 3

export const A11Y_DEFAULTS: A11yPrefs = {
  textLevel: 0,
  contrast: 'none',
  readableFont: false,
  highlightLinks: false,
  stopMotion: false,
  cursor: 'none',
  focusRing: false,
}

export const a11yPrefs = createStoredState<A11yPrefs>('a11y_prefs_v1', (stored) => ({
  ...A11Y_DEFAULTS,
  ...(stored && typeof stored === 'object' ? stored : {}),
}))

function applyPrefs(prefs: A11yPrefs) {
  const classes: Record<string, boolean> = {
    'a11y-text-1': prefs.textLevel === 1,
    'a11y-text-2': prefs.textLevel === 2,
    'a11y-text-3': prefs.textLevel === 3,
    'a11y-contrast-high': prefs.contrast === 'high',
    'a11y-contrast-invert': prefs.contrast === 'invert',
    'a11y-contrast-gray': prefs.contrast === 'gray',
    'a11y-font': prefs.readableFont,
    'a11y-links': prefs.highlightLinks,
    'a11y-no-motion': prefs.stopMotion,
    'a11y-cursor-white': prefs.cursor === 'white',
    'a11y-cursor-black': prefs.cursor === 'black',
    'a11y-focus': prefs.focusRing,
  }
  for (const [name, on] of Object.entries(classes)) document.documentElement.classList.toggle(name, on)
  MotionGlobalConfig.skipAnimations = prefs.stopMotion
}

/** Applies the saved choices and keeps <html> in step with later ones | מחיל את הבחירות השמורות ועוקב אחרי שינויים */
export function initA11y() {
  applyPrefs(a11yPrefs.get())
  a11yPrefs.subscribe(() => applyPrefs(a11yPrefs.get()))
}

// ==========================================
// Stopping motion | עצירת תנועה
// ==========================================
/** The "stop animations" choice or the system's reduced-motion setting, for code outside React | לקוד שמחוץ ל-React */
export const motionStopped = () => a11yPrefs.get().stopMotion || matchMedia('(prefers-reduced-motion: reduce)').matches

/** The same, for components: use this rather than framer's useReducedMotion, which only knows the system setting. */
export function useMotionStopped() {
  const system = useReducedMotion()
  const { stopMotion } = a11yPrefs.use()
  return !!system || stopMotion
}
