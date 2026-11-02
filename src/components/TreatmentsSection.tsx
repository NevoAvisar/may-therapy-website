import { useRef, type MouseEvent } from 'react'
import { HandHeart, Wind, Feather, type LucideIcon } from 'lucide-react'
import Reveal from './Reveal'
import { cn } from '../lib/cn'

interface Treatment {
  id: string
  num: string
  title: string
  body: string
  forWho: string
  tags: string[]
  Icon: LucideIcon
  tint: string
}

const TREATMENTS: Treatment[] = [
  {
    id: 'care-touch',
    num: '01',
    title: 'טיפול במגע וקרקוע',
    body: 'מגע קשוב ועמוק שמזמין את הגוף להניח את המשקל, להאט ולהרגיש שוב את הקרקע מתחת לרגליים.',
    forWho: 'מי שחווים עומס, כאבים או תחושת ניתוק מהגוף.',
    tags: ['60–90 דק׳', 'מגע עמוק ועדין'],
    Icon: HandHeart,
    tint: 'from-flower-bloom/45 via-white/10 to-river-mist/40',
  },
  {
    id: 'care-breath',
    num: '02',
    title: 'איזון גוף-נפש ונשימה',
    body: 'עבודה עדינה עם נשימה, תנועה ומודעות גופנית, שמשחררת את מה שנאגר ומחברת בין הלב לגוף.',
    forWho: 'תקופות של שינוי, חרדה או רגשות מציפים.',
    tags: ['נשימה', 'מודעות גופנית'],
    Icon: Wind,
    tint: 'from-river-mist/70 via-white/10 to-stream-aqua/25',
  },
  {
    id: 'care-rest',
    num: '03',
    title: 'מרחב לפריקה וטעינה',
    body: 'שעה שקטה שכולה שלך: מקום בטוח להניח את מה שכבד, לנוח באמת ולצאת עם מצברים מלאים.',
    forWho: 'הורים, אנשי טיפול ומי שנותנים הרבה לאחרים.',
    tags: ['שקט', 'מנוחה עמוקה'],
    Icon: Feather,
    tint: 'from-flower-center/70 via-white/10 to-sage-leaf/20',
  },
]

function BentoCard({ t, large }: { t: Treatment; large?: boolean }) {
  const ref = useRef<HTMLElement>(null)

  // Soft spotlight that follows the pointer
  const onMove = (e: MouseEvent) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
  }

  return (
    <article
      ref={ref}
      id={t.id}
      onMouseMove={onMove}
      className={cn(
        'glass group relative flex h-full flex-col overflow-hidden rounded-[28px] p-7 transition-transform duration-500 hover:-translate-y-1 md:p-9',
        large && 'md:min-h-[460px]',
      )}
    >
      <div aria-hidden className={cn('absolute inset-0 -z-10 bg-gradient-to-br opacity-90', t.tint)} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: 'radial-gradient(420px circle at var(--mx) var(--my), rgba(255,255,255,0.55), transparent 60%)' }}
      />

      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/60 text-stream-blue ring-1 ring-stream-aqua/30">
          <t.Icon className="h-6 w-6" strokeWidth={1.5} aria-hidden />
        </span>
        <span className="font-serif text-sm text-bark-toned/80" aria-hidden>
          {t.num}
        </span>
        <span aria-hidden className="h-px flex-1 bg-gradient-to-l from-stream-aqua/50 to-transparent" />
      </div>

      <ul className="mt-6 flex flex-wrap gap-2" aria-label="מאפיינים">
        {t.tags.map((tag) => (
          <li key={tag} className="rounded-full bg-white/55 px-3 py-1 text-xs text-forest-moss/80 ring-1 ring-stream-aqua/25">
            {tag}
          </li>
        ))}
      </ul>

      <h3 className={cn('mt-5 font-serif font-medium text-forest-moss', large ? 'text-3xl md:text-4xl' : 'text-2xl')}>{t.title}</h3>
      <p className={cn('mt-3 leading-relaxed text-forest-moss/80', large && 'md:text-lg')}>{t.body}</p>

      <p className="mt-auto pt-6 text-sm text-forest-moss/70">
        <span className="font-medium text-bark-toned">מתאים ל: </span>
        {t.forWho}
      </p>
    </article>
  )
}

export default function TreatmentsSection() {
  const [first, ...others] = TREATMENTS
  return (
    <section id="treatments" aria-labelledby="treatments-title" className="relative py-24 md:py-32">
      <div aria-hidden className="absolute -top-20 start-[10%] -z-10 h-72 w-72 rounded-full bg-river-mist blur-3xl" />
      <div aria-hidden className="absolute bottom-10 end-[15%] -z-10 h-64 w-64 rounded-full bg-flower-bloom/40 blur-3xl" />

      <div className="page-container">
        <Reveal className="max-w-2xl">
          <span className="glass-mist inline-block rounded-full px-4 py-1.5 text-sm text-stream-blue">הטיפולים</span>
          <h2 id="treatments-title" className="mt-4 font-serif text-4xl font-light text-forest-moss md:text-5xl">
            שלוש דרכים לחזור לעצמך
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-forest-moss/75">
            כל מפגש נבנה סביב מה שנכון לך עכשיו – לפעמים מגע, לפעמים נשימה, ולפעמים פשוט שקט.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2 md:grid-rows-2">
          <Reveal className="md:row-span-2">
            <BentoCard t={first} large />
          </Reveal>
          {others.map((t, i) => (
            <Reveal key={t.id} delay={0.1 * (i + 1)}>
              <BentoCard t={t} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
