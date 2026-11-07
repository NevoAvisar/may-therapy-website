import plugin from 'tailwindcss/plugin'

/** 3% paper-grain noise, tiled. */
const grain =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#F6F4F0', // warm natural linen / sand
        'river-mist': '#DCE8E3', // delicate mineral water mist
        'stream-aqua': '#9AB6AB', // gentle river aqua
        'stream-blue': '#5E8079', // calm river teal – CTAs & focus
        'forest-moss': '#3E5445', // deep woodland green – typography
        'sage-leaf': '#8EA691', // soft pastel foliage
        'bark-toned': '#7F6A58', // warm bark accent
        'flower-bloom': '#E8C5C8', // soft pastel blossom pink
        'flower-center': '#F5E5C9', // warm petal core
        // Section backgrounds, top to bottom of the page
        'tint-mist': '#EBF3F0', // soft morning mist
        'tint-petal': '#F7F2EB', // warm petal cream
        'tint-sage': '#E8F0E8', // gentle sage
        'tint-lavender': '#F0EBF4', // lavender mist
        'tint-river': '#E6F0F2', // pale river aqua
      },
      fontFamily: {
        sans: ['"Varela Round"', 'Heebo', 'system-ui', '-apple-system', 'Segoe UI', 'Arial', 'sans-serif'],
        display: ['Fredoka', '"Varela Round"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        grain,
      },
      boxShadow: {
        glass: 'inset 0 1px 0 rgba(255,255,255,0.55), 0 24px 48px -28px rgba(62,84,69,0.35)',
        bloom: '0 0 0 1px rgba(154,182,171,0.25), 0 18px 40px -20px rgba(94,128,121,0.55)',
      },
      keyframes: {
        'soft-pulse': {
          '0%': { transform: 'scale(1)', opacity: '0.55' },
          '100%': { transform: 'scale(1.9)', opacity: '0' },
        },
        drift: {
          '0%, 100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(0,-10px,0)' },
        },
        'sun-spin': {
          to: { transform: 'rotate(360deg)' },
        },
        'sun-breathe': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.12)' },
        },
      },
      animation: {
        'soft-pulse': 'soft-pulse 2.6s cubic-bezier(0.22,0.61,0.36,1) infinite',
        drift: 'drift 7s ease-in-out infinite',
        'sun-spin': 'sun-spin 26s linear infinite',
        'sun-breathe': 'sun-breathe 4.5s ease-in-out infinite',
      },
    },
  },
  plugins: [
    // RTL needs no plugin: Tailwind 3.3+ ships logical utilities (ps-*, pe-*, ms-*, me-*,
    // start-*, end-*, text-start) plus `rtl:` / `ltr:` variants keyed off dir="rtl".
    plugin(({ addComponents, addUtilities }) => {
      addComponents({
        // Frosted glass: backdrop-blur-md + mineral hairline
        '.glass': {
          backgroundColor: 'rgba(255, 255, 255, 0.42)',
          backdropFilter: 'blur(12px) saturate(1.15)',
          WebkitBackdropFilter: 'blur(12px) saturate(1.15)',
          border: '1px solid rgba(154, 182, 171, 0.3)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55), 0 24px 48px -28px rgba(62,84,69,0.35)',
        },
        '.glass-mist': {
          backgroundColor: 'rgba(220, 232, 227, 0.38)',
          backdropFilter: 'blur(12px) saturate(1.15)',
          WebkitBackdropFilter: 'blur(12px) saturate(1.15)',
          border: '1px solid rgba(154, 182, 171, 0.3)',
        },
      })
      addUtilities({
        '.paper-grain': {
          position: 'fixed',
          inset: '0',
          pointerEvents: 'none',
          zIndex: '70',
          opacity: '0.03',
          backgroundImage: grain,
          backgroundSize: '160px 160px',
        },
      })
    }),
  ],
}
