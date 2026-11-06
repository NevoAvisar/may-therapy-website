import { useEffect, useState } from 'react'
import { ArrowLeft, Leaf } from 'lucide-react'
import ScrollExpandMedia from './components/ScrollExpandMedia'
import Navbar from './components/Navbar'
import TreeSpine from './components/TreeSpine'
import TreatmentsSection from './components/TreatmentsSection'
import FaqSection from './components/FaqSection'
import AboutSection from './components/AboutSection'
import ContactSection from './components/ContactSection'
import FloatingWhatsApp from './components/FloatingWhatsApp'
import Reveal from './components/Reveal'
import { goToSection } from './config'
import { addRestPoint, initSmoothScroll, sectionTop } from './lib/smoothScroll'

/* Hero imagery – swap for your own (e.g. put tree.jpg in /public and use '/tree.jpg'). */
const HERO = {
  bgImageSrc: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2000&q=75',
  mediaType: 'image' as const,
  mediaSrc: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=2000&q=80',
}

// Reaching each of these sprouts a flower on the spine.
const BLOOM_AT = ['intro', 'treatments', 'care-touch', 'care-breath', 'care-rest', 'faq', 'about']

function ExpandedCaption() {
  return (
    <div className="glass flex max-w-xl flex-col items-center gap-5 rounded-[32px] !bg-primary/55 px-8 py-9 text-center">
      <span className="inline-flex items-center gap-2 text-sm text-stream-blue">
        <Leaf className="h-4 w-4" aria-hidden /> מרחב טיפולי אישי
      </span>
      <p className="font-serif text-3xl font-light leading-snug text-forest-moss md:text-4xl">
        מקום לעצור, לנשום ולהתחבר מחדש
      </p>
      <p className="text-forest-moss/75">מאי · טיפול במגע ואיזון גוף-נפש</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => goToSection('contact')}
          className="inline-flex items-center gap-2 rounded-full bg-stream-blue px-6 py-3 font-medium text-primary transition hover:bg-forest-moss"
        >
          לתיאום שיחת היכרות <ArrowLeft className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => goToSection('treatments')}
          className="rounded-full bg-white/60 px-6 py-3 font-medium text-forest-moss ring-1 ring-stream-aqua/40 transition hover:bg-white/80"
        >
          לגלות את הטיפולים
        </button>
      </div>
    </div>
  )
}

function IntroSection() {
  return (
    // A full breath between the hero and the treatments: centred, unhurried, with a soft mist glow behind.
    <section
      id="intro"
      aria-labelledby="intro-title"
      className="relative isolate flex min-h-[75svh] items-center py-24 md:min-h-[85svh]"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-1/2 -z-10 mx-auto h-[26rem] max-w-4xl -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(220,232,227,0.9),rgba(245,229,201,0.35)_55%,transparent_75%)] blur-2xl"
      />
      <div className="page-container max-w-3xl text-center">
        <Reveal>
          <h2 id="intro-title" className="font-serif text-3xl font-light leading-snug text-forest-moss md:text-[2.6rem]">
            לפעמים הגוף יודע לפני שהמילים מגיעות.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-forest-moss/75">
            המרחב שלי נועד לרגעים שבהם צריך להאט: להניח את המשקל, לחזור לנשימה ולהרגיש שוב קרקע יציבה. בלי מהירות
            ובלי ציפיות – רק הקשבה, מגע עדין והזמנה לחזור לעצמך.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

// Each chapter of the page gets a soft resting point at its top.
const REST_AT = ['intro', 'treatments', 'faq', 'about', 'contact']

export default function App() {
  const [heroExpanded, setHeroExpanded] = useState(false)

  useEffect(() => initSmoothScroll(), [])
  useEffect(() => {
    const removers = REST_AT.map((id) =>
      addRestPoint(() => {
        const el = document.getElementById(id)
        return el ? sectionTop(el) : null
      }),
    )
    return () => removers.forEach((remove) => remove())
  }, [])

  return (
    <div dir="rtl" id="top" className="relative min-h-screen bg-primary text-forest-moss">
      <a
        href="#contact"
        onClick={(e) => {
          e.preventDefault()
          goToSection('contact')
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:right-4 focus:top-20 focus:z-[80] focus:rounded-full focus:bg-stream-blue focus:px-4 focus:py-2 focus:text-primary"
      >
        דלגו ליצירת קשר
      </a>

      <Navbar />
      <TreeSpine bloomAt={BLOOM_AT} rootsAt="contact" visible={heroExpanded} />

      <ScrollExpandMedia
        {...HERO}
        title="מקום לעצור, לנשום ולהתחבר מחדש"
        eyebrow="מאי · טיפול במגע ואיזון גוף-נפש"
        scrollToExpand="גללו כדי להעמיק אל המרחב"
        expandedCaption={<ExpandedCaption />}
        onExpandChange={setHeroExpanded}
      >
        <main>
          <IntroSection />
          <TreatmentsSection />
          <FaqSection />
          <AboutSection />
          <ContactSection />
        </main>

        <footer className="bg-[#E9DCCB] pb-8">
          <div className="page-container flex flex-col items-center justify-between gap-2 border-t border-bark-toned/15 pt-6 text-sm text-bark-toned sm:flex-row">
            <p>© {new Date().getFullYear()} מאי · טיפול במגע ואיזון גוף-נפש</p>
            <p>נבנה באהבה ובנשימה עמוקה 🌿</p>
          </div>
        </footer>
      </ScrollExpandMedia>

      <FloatingWhatsApp visible={heroExpanded} />
      <div aria-hidden className="paper-grain" />
    </div>
  )
}
