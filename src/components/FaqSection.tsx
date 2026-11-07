import { useId, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import Reveal from './Reveal'
import WriteIn from './WriteIn'
import { cn } from '../lib/cn'

// ==========================================
// Questions and answers | שאלות ותשובות
// ==========================================
const FAQS = [
  {
    q: 'איך מתנהל המפגש הראשון?',
    a: 'המפגש הראשון מתחיל בשיחה רגועה: מה הביא אותך, איך הגוף מרגיש ומה היית רוצה לקחת מהתהליך. משם נעבור בהדרגה לטיפול עצמו – בקצב שלך, עם הסבר על כל שלב ובהסכמה מלאה. אין צורך בהכנה מיוחדת, רק להגיע בבגדים נוחים.',
  },
  {
    q: 'למי הטיפולים מתאימים?',
    a: 'לכל מי שמרגישים עומס, מתח, כאבים או ניתוק מהגוף; לתקופות של שינוי, שחיקה או רגשות מציפים; ולכל מי שפשוט צריכים רגע של שקט. כל מפגש נבנה אישית סביב מה שנכון לך עכשיו.',
  },
  {
    q: 'איפה מתקיימים הטיפולים?',
    a: 'הטיפולים מתקיימים בקליניקה פרטית ושקטה, בימים א׳–ה׳ בשעות הבוקר והערב. את הכתובת המדויקת והוראות ההגעה אשלח עם תיאום המפגש.',
  },
  {
    q: 'כמה זמן נמשך מפגש, וכמה מפגשים צריך?',
    a: 'מפגש נמשך בין 60 ל־90 דקות. יש מי שמגיעים למפגש בודד של פריקה, ויש מי שבוחרים בתהליך של כמה מפגשים – נחליט על זה יחד, בלי התחייבות מראש.',
  },
  {
    q: 'מה אם לא נוח לי עם מגע?',
    a: 'זה בסדר גמור. לפני כל מגע נדבר על מה שמרגיש לך נכון, ואפשר לעצור, לשנות או לוותר בכל רגע. אפשר גם לעבוד בלבוש מלא, או להתמקד בנשימה ובמודעות גופנית בלבד.',
  },
]

// ==========================================
// Single question | שאלה בודדת (נפתחת ונסגרת)
// ==========================================
function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  const id = useId()
  return (
    <div className={cn('glass overflow-hidden rounded-3xl transition-colors', open && '!bg-white/60')}>
      <h3>
        <button
          type="button"
          id={`${id}-q`}
          aria-expanded={open}
          aria-controls={`${id}-a`}
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-4 px-6 py-3.5 text-start text-lg font-medium text-forest-moss md:px-8"
        >
          <span>{q}</span>
          <motion.span
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className={cn(
              'grid h-9 w-9 shrink-0 place-items-center rounded-full ring-1 ring-stream-aqua/40 transition-colors',
              open ? 'bg-stream-blue text-primary' : 'bg-white/50 text-stream-blue',
            )}
          >
            <Plus className="h-4 w-4" aria-hidden />
          </motion.span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`${id}-a`}
            role="region"
            aria-labelledby={`${id}-q`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <p className="px-6 pb-5 leading-relaxed text-forest-moss/80 md:px-8">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ==========================================
// Section 3: FAQ | אזור השאלות הנפוצות - מעט מעל מרכז המסך
// ==========================================
export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    // More padding below than above lifts it just over dead-centre, and the bottom stays on screen.
    // יותר רווח למטה מאשר למעלה מרים את התוכן מעט מעל המרכז, והחלק התחתון נשאר בתוך המסך.
    <section id="faq" aria-labelledby="faq-title" className="relative isolate flex min-h-[100svh] flex-col justify-center bg-gradient-to-b from-tint-sage from-60% to-tint-lavender pb-24 pt-[4.5rem]">
      <div aria-hidden className="absolute inset-x-0 top-1/3 -z-10 mx-auto h-80 max-w-3xl rounded-full bg-river-mist/70 blur-3xl" />
      <div className="page-container max-w-4xl">
        <Reveal className="text-center">
          <span className="glass-mist inline-block rounded-full px-4 py-1 text-sm text-stream-blue">שאלות נפוצות</span>
          <WriteIn
            as="h2"
            by="char"
            id="faq-title"
            text="לפני שנפגשים"
            className="mt-2 font-display text-4xl font-light text-forest-moss md:text-5xl"
          />
          <WriteIn delay={0.3} text="כמה דברים שכדאי לדעת – ואם נשארה שאלה, אני כאן." className="mt-2 text-lg text-forest-moss/75" />
        </Reveal>

        <div className="mt-7 flex flex-col gap-2.5">
          {FAQS.map((item, i) => (
            <Reveal key={item.q} delay={i * 0.05}>
              <FaqItem {...item} open={openIndex === i} onToggle={() => setOpenIndex(openIndex === i ? null : i)} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
