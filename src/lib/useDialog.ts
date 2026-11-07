import { useEffect, type RefObject } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// ==========================================
// Modal behaviour | התנהגות של חלון קופץ
// ==========================================
/**
 * Keyboard and focus behaviour for anything modal: focus moves in on opening and back to the opener on closing,
 * Tab and Shift+Tab loop inside, and Escape or a click outside closes it.
 *
 * התנהגות מקלדת ומיקוד: המיקוד נכנס בפתיחה וחוזר לכפתור הפותח בסגירה, Tab נשאר בתוך החלון, ו-Escape או לחיצה מחוץ לחלון סוגרים אותו.
 */
export function useDialog(dialogRef: RefObject<HTMLElement | null>, open: boolean, onClose: () => void) {
  useEffect(() => {
    const dialog = dialogRef.current
    if (!open || !dialog) return

    const opener = document.activeElement as HTMLElement | null
    const focusable = () => [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)]
    focusable()[0]?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const items = focusable()
      const first = items[0]
      const last = items[items.length - 1]
      const inside = dialog.contains(document.activeElement)
      if (e.shiftKey && (!inside || document.activeElement === first)) {
        e.preventDefault()
        last?.focus()
      } else if (!e.shiftKey && (!inside || document.activeElement === last)) {
        e.preventDefault()
        first?.focus()
      }
    }

    // The opener toggles the dialog itself, so a press on it is left to its own click.
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (!dialog.contains(target) && !opener?.contains(target)) onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
      opener?.focus()
    }
  }, [dialogRef, open, onClose])
}
