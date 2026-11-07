import { useRef, type MouseEvent } from 'react'
import { HandHeart, Wind, Feather, type LucideIcon } from 'lucide-react'
import Reveal from './Reveal'
import WriteIn from './WriteIn'
import { cn } from '../lib/cn'

// ==========================================
// Treatment cards data | נתוני כרטיסי הטיפולים
// ==========================================
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

// ==========================================
// Treatment card | כרטיס טיפול
// ==========================================
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
        'glass group relative flex h-full flex-col overflow-hidden rounded-[28px] p-7 transition-transform duration-500 hover:-translate-y-1 md:p-8',
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
        <span className="font-display text-sm text-bark-toned" aria-hidden>
          {t.num}
        </span>
        <span aria-hidden className="h-px flex-1 bg-gradient-to-l from-stream-aqua/50 to-transparent" />
      </div>

      <ul className="mt-6 flex flex-wrap gap-2" aria-label="מאפיינים">
        {t.tags.map((tag) => (
          <li key={tag} className="rounded-full bg-white/55 px-3 py-1 text-xs text-forest-moss/85 ring-1 ring-stream-aqua/25">
            {tag}
          </li>
        ))}
      </ul>

      <WriteIn
        as="h3"
        by="char"
        text={t.title}
        className={cn('mt-5 font-display font-medium text-forest-moss', large ? 'text-3xl md:text-4xl lg:text-[2.1rem]' : 'text-2xl')}
      />
      <WriteIn delay={0.3} text={t.body} className={cn('mt-3 leading-relaxed text-forest-moss/85', large && 'md:text-lg')} />

      <p className="mt-auto pt-6 text-sm text-forest-moss/85">
        <span className="font-medium text-bark-toned">מתאים ל: </span>
        {t.forWho}
      </p>
    </article>
  )
}

// ==========================================
// Section 2: Treatments | אזור הטיפולים - ממורכז למסך המשתמש
// ==========================================
export default function TreatmentsSection() {
  const [first, ...others] = TREATMENTS
  return (
    // Fills the screen with its content centred both ways, so the three cards sit in the middle of the viewport.
    // ממלא את המסך והתוכן ממורכז אנכית ואופקית, כך ששלושת הכרטיסים יושבים באמצע מסך המשתמש.
    <section
      id="treatments"
      aria-labelledby="treatments-title"
      className="relative isolate flex min-h-[100svh] flex-col justify-center bg-gradient-to-b from-tint-petal from-60% to-tint-sage py-24 md:py-20"
    >
      <div aria-hidden className="absolute -top-20 start-[10%] -z-10 h-72 w-72 rounded-full bg-river-mist blur-3xl" />
      <div aria-hidden className="absolute bottom-24 end-[15%] -z-10 h-64 w-64 rounded-full bg-flower-bloom/40 blur-3xl" />

      <div className="page-container md:px-16 lg:px-20">
        <Reveal className="max-w-2xl lg:flex lg:max-w-none lg:items-end lg:justify-between lg:gap-12">
          <div>
            <span className="glass-mist inline-block rounded-full px-4 py-1.5 text-sm text-stream-blue">הטיפולים</span>
            <WriteIn
              as="h2"
              by="char"
              id="treatments-title"
              text="שלוש דרכים לחזור לעצמך"
              className="mt-4 font-display text-4xl font-light text-forest-moss md:text-5xl"
            />
          </div>
          <WriteIn
            delay={0.3}
            text="כל מפגש נבנה סביב מה שנכון לך עכשיו – לפעמים מגע, לפעמים נשימה, ולפעמים פשוט שקט."
            className="mt-4 text-lg leading-relaxed text-forest-moss/85 lg:mt-0 lg:max-w-md"
          />
        </Reveal>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr]">
          <Reveal className="h-full md:col-span-2 lg:col-span-1">
            <BentoCard t={first} large />
          </Reveal>
          {others.map((t, i) => (
            <Reveal key={t.id} delay={0.1 * (i + 1)} className="h-full">
              <BentoCard t={t} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
