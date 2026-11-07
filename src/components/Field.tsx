import type { ReactNode } from 'react'

export const fieldClasses =
  'w-full rounded-2xl border border-stream-aqua/40 bg-white/60 px-4 py-3 text-forest-moss placeholder:text-forest-moss/40 transition focus:bg-white/80'

export default function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-start text-sm text-forest-moss/80">
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  )
}
