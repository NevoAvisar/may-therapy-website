import { Leaf } from 'lucide-react'
import Reveal from './Reveal'
import WriteIn from './WriteIn'

// ==========================================
// About content | תוכן אזור עליי
// ==========================================
/* May's portrait – put a square photo in /public (e.g. may.jpg) and set '/may.jpg'. Empty shows the monogram. */
const PORTRAIT_SRC = ''

const VALUES = ['הקשבה לפני הכול', 'בקצב שלך', 'מגע רק בהסכמה']

// ==========================================
// Section 4: About May | אזור עליי - ממוסגר בגובה המסך
// ==========================================
export default function AboutSection() {
  return (
    <section id="about" aria-labelledby="about-title" className="relative isolate flex min-h-[100svh] items-center bg-gradient-to-b from-tint-lavender from-60% to-tint-river py-24">
      <div aria-hidden className="absolute -top-10 end-[12%] -z-10 h-72 w-72 rounded-full bg-flower-bloom/35 blur-3xl" />
      <div aria-hidden className="absolute bottom-24 start-[8%] -z-10 h-80 w-80 rounded-full bg-river-mist blur-3xl" />

      <div className="page-container max-w-5xl">
        <Reveal>
          {/* Floating frosted card */}
          <article className="glass relative grid items-center gap-10 rounded-[36px] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_40px_80px_-40px_rgba(62,84,69,0.45)] md:grid-cols-[auto_1fr] md:gap-14 md:p-14">
            {/* Round portrait inside a soft, organic ring */}
            <div className="relative mx-auto h-44 w-44 md:h-56 md:w-56">
              <span
                aria-hidden
                className="absolute -inset-3 rotate-12 border border-stream-aqua/50"
                style={{ borderRadius: '58% 42% 54% 46% / 47% 56% 44% 53%' }}
              />
              <span
                aria-hidden
                className="absolute -inset-5 -rotate-6 border border-sage-leaf/30"
                style={{ borderRadius: '44% 56% 47% 53% / 55% 43% 57% 45%' }}
              />
              <div className="relative h-full w-full overflow-hidden rounded-full ring-4 ring-white/70 shadow-bloom">
                {PORTRAIT_SRC ? (
                  <img src={PORTRAIT_SRC} alt="מאי" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                ) : (
                  <span className="grid h-full w-full place-items-center bg-gradient-to-br from-flower-bloom to-flower-center font-display text-6xl text-forest-moss md:text-7xl">
                    מ
                  </span>
                )}
              </div>
            </div>

            <div className="text-center md:text-start">
              <span className="glass-mist inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm text-stream-blue">
                <Leaf className="h-4 w-4" aria-hidden /> עליי
              </span>
              <WriteIn
                as="h2"
                by="char"
                id="about-title"
                text="נעים להכיר, אני מאי"
                className="mt-4 font-display text-4xl font-light text-forest-moss md:text-5xl"
              />
              <div className="mt-5 space-y-4 text-lg leading-relaxed text-forest-moss/80">
                <WriteIn delay={0.3} text="הדרך שלי לטיפול התחילה כשהגוף שלי ביקש ממני לעצור ולהקשיב. גיליתי שכשנותנים לו מקום – הוא יודע לספר מה הוא צריך, הרבה לפני שהמילים מגיעות." />
                <WriteIn delay={0.6} text="היום אני מלווה אנשים לחזור לקרקע: דרך מגע קשוב, נשימה ומודעות גופנית עדינה. אני מאמינה שאין צורך להילחם במה שכבד, אלא לפנות לו מקום – בקצב שלך, בביטחון ובהקשבה מלאה." />
              </div>

              <ul className="mt-7 flex flex-wrap justify-center gap-2 md:justify-start" aria-label="הגישה שלי">
                {VALUES.map((v) => (
                  <li key={v} className="rounded-full bg-white/55 px-4 py-1.5 text-sm text-forest-moss/80 ring-1 ring-stream-aqua/25">
                    {v}
                  </li>
                ))}
              </ul>

              <p className="mt-7 font-display text-xl text-forest-moss">
                מאי <span className="text-base text-forest-moss/60">· מטפלת במגע ובאיזון גוף-נפש</span>
              </p>
            </div>
          </article>
        </Reveal>
      </div>
    </section>
  )
}
