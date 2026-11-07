# may-therapy-website

React + Vite + Tailwind CSS + Framer Motion (Hebrew, RTL).

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

- Contact details (WhatsApp number, email, prefilled messages): `src/config.ts`
- Intro-call booking (working days, time slots, call lengths, blocked dates, WhatsApp message): `BOOKING` in `src/config.ts`
- Contact form email (EmailJS keys and templates): `EMAILJS` in `src/config.ts`
- Hero imagery: `src/App.tsx` (drop your own photo in `public/` and point `mediaSrc` at it, e.g. `/tree.jpg`)
- Colour tokens and the `.glass` utility: `tailwind.config.js`
- The previous static site is kept in `legacy/` for reference.
