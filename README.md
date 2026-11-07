# may-therapy-website

React + Vite + Tailwind CSS + Framer Motion (Hebrew, RTL).

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

- Contact details (WhatsApp number, prefilled message): `src/config.ts`
- Intro-call booking (call length, buffer, WhatsApp message): `BOOKING` in `src/config.ts`
- Booking email (EmailJS keys and templates): `EMAILJS` in `src/config.ts`
- May's schedule and bookings: admin panel at `/#admin`, stored in Supabase
- Hero imagery: `src/App.tsx` (drop your own photo in `public/` and point `mediaSrc` at it, e.g. `/tree.jpg`)
- Colour tokens and the `.glass` utility: `tailwind.config.js`
- The previous static site is kept in `legacy/` for reference.

## Connecting Supabase

Until this is done the booking section still works, but it can't hold slots, prevent overlaps or show May's changes.

1. Create a project at supabase.com and run `supabase/schema.sql` in its SQL editor.
2. Under Authentication → Users, add a user for May with an email and password.
3. In the SQL editor, make that user the admin:
   ```sql
   insert into public.admins select id from auth.users where email = 'MAY_EMAIL_HERE';
   ```
4. Under Authentication → Sign In / Providers, turn off new sign-ups.
5. Copy the project URL and anon key into `SUPABASE` in `src/config.ts`.
