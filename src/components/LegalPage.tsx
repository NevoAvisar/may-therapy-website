import { useEffect, type ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { MAIN_ID } from './SkipLink'

// ==========================================
// Layout of the legal pages | מבנה הדפים המשפטיים
// ==========================================
export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  useEffect(() => {
    const siteTitle = document.title
    document.title = `${title} | מאי`
    window.scrollTo(0, 0)
    return () => {
      document.title = siteTitle
    }
  }, [title])

  return (
    <div dir="rtl" className="min-h-screen bg-primary text-forest-moss">
      <header className="border-b border-forest-moss/20">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-4">
          <a href="/" className="font-display text-2xl font-medium">
            מאי
          </a>
          <a href="/" className="inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4">
            <ArrowRight className="h-4 w-4" aria-hidden />
            חזרה לאתר
          </a>
        </div>
      </header>

      <main
        id={MAIN_ID}
        tabIndex={-1}
        className="mx-auto max-w-3xl px-5 pb-[calc(6rem+var(--consent-h,0px))] pt-10 focus-visible:ring-0 focus-visible:ring-offset-0"
      >
        <h1 className="font-display text-4xl font-light">{title}</h1>
        <p className="mt-2 text-sm">עודכן לאחרונה: {updated}</p>
        <div className="mt-8 space-y-8 leading-relaxed">{children}</div>
      </main>
    </div>
  )
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl font-medium">{title}</h2>
      {children}
    </section>
  )
}

export function BulletList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 ps-5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

/** A detail set in LEGAL (src/config.ts), or a marked gap until it is filled in | פרט מתוך LEGAL, או סימון בולט שעדיין חסר */
export function Detail({ value, missing }: { value: string; missing: string }) {
  if (value) return <>{value}</>
  return <mark className="rounded bg-flower-center px-1 text-forest-moss">[להשלמה: {missing}]</mark>
}
