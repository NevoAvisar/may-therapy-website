import type { ReactNode } from 'react'

// text-base (16px) stops iOS zooming the page when a field is focused | גודל 16px מונע מ-iOS להגדיל את הדף בלחיצה על שדה
export const fieldClasses =
  'w-full rounded-2xl border border-forest-moss/70 bg-white/60 px-4 py-3 text-base text-forest-moss placeholder:text-forest-moss/85 transition focus:bg-white/80'

/** Labelled form field | שדה טופס עם תווית */
export default function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-start text-sm text-forest-moss/85">
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  )
}
