/* Contact settings – edit here */
export const CONTACT = {
  // International format, digits only, no "+" or leading 0 (e.g. 972501234567)
  whatsappNumber: '972504401515',
  whatsappMessage: 'היי מאי 🌿 הגעתי דרך האתר ואשמח לשמוע עוד על הטיפולים ולתאם שיחת היכרות.',
  email: 'may@example.com',
  emailSubject: 'פנייה מהאתר – שאלה / תיאום טיפול',
  emailBody: 'היי מאי,\n\nאשמח לשמוע פרטים נוספים על הטיפולים ולתאם שיחת היכרות.\n\nשם:\nטלפון:\n\nתודה!',
}

/* Intro-call booking. May's working hours live in Supabase and are edited at /#admin. */
export const BOOKING = {
  // Keep these three in sync with book_slot in supabase/schema.sql
  callMinutes: 10,
  bufferMinutes: 5,
  minLeadHours: 3,
  daysAhead: 45,
  // Used only until Supabase is connected, and as the starting week in schema.sql
  defaultWorkDays: [0, 1, 2, 3, 4],
  defaultWindows: [
    { start: '09:00', end: '12:00' },
    { start: '17:00', end: '20:00' },
  ],
  // {minutes}, {date} and {time} are filled in by the picker
  whatsappMessage: 'היי מאי, אשמח לתאם שיחת הכרות של {minutes} דקות בתאריך {date} בשעה {time}.',
  eventTitle: 'שיחת היכרות עם מאי',
  eventDetails: 'המועד ממתין לאישור של מאי בוואטסאפ.',
}

/* Fill in both from Supabase: Project Settings → API. The anon key is meant to be public. */
export const SUPABASE = {
  url: '',
  anonKey: '',
}

/*
 * Contact form and booking email, sent through EmailJS (emailjs.com). Fill in all four to turn it on; until then the
 * form passes the inquiry to WhatsApp instead and never tells the client an email went out.
 * Both templates receive {{name}}, {{email}}, {{phone}} and {{message}}. In the client template, set the
 * "To Email" field to {{email}}.
 */
export const EMAILJS = {
  publicKey: '',
  serviceId: '',
  templateToMay: '',
  templateToClient: '',
}

export const whatsappLink = (text: string) =>
  `https://wa.me/${CONTACT.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`

export const whatsappUrl = whatsappLink(CONTACT.whatsappMessage)

export const mailtoUrl = `mailto:${CONTACT.email}?subject=${encodeURIComponent(CONTACT.emailSubject)}&body=${encodeURIComponent(CONTACT.emailBody)}`

/** Fired by in-page links: expands the hero (if needed), then scrolls to `detail.targetId`. */
export const HERO_EXPAND_EVENT = 'hero:expand'

export function goToSection(targetId: string) {
  window.dispatchEvent(new CustomEvent(HERO_EXPAND_EVENT, { detail: { targetId } }))
}
