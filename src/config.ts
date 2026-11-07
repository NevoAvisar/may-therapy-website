/* Contact settings – edit here */
export const CONTACT = {
  // International format, digits only, no "+" or leading 0 (e.g. 972501234567)
  whatsappNumber: '972504401515',
  whatsappMessage: 'היי מאי 🌿 הגעתי דרך האתר ואשמח לשמוע עוד על הטיפולים ולתאם שיחת היכרות.',
  email: 'may@example.com',
  emailSubject: 'פנייה מהאתר – שאלה / תיאום טיפול',
  emailBody: 'היי מאי,\n\nאשמח לשמוע פרטים נוספים על הטיפולים ולתאם שיחת היכרות.\n\nשם:\nטלפון:\n\nתודה!',
}

/* Intro-call booking – the picker only offers these; May still confirms each request by hand. */
export const BOOKING = {
  // 0 = Sunday … 6 = Saturday
  workDays: [0, 1, 2, 3, 4],
  // Israel time, whatever the client's own time zone is
  morningSlots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'],
  eveningSlots: ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30'],
  // Lengths the client can choose between; the first is preselected
  callDurations: [15, 30],
  daysAhead: 45,
  // Slots sooner than this from now are hidden
  minLeadHours: 3,
  // Holidays and days off, as 'YYYY-MM-DD'
  blockedDates: [] as string[],
  // {minutes}, {date} and {time} are filled in by the picker
  whatsappMessage: 'היי מאי, אשמח לתאם שיחת הכרות של {minutes} דקות בתאריך {date} בשעה {time}.',
  eventTitle: 'שיחת היכרות עם מאי',
  eventDetails: 'המועד ממתין לאישור של מאי בוואטסאפ.',
}

/*
 * Contact form email, sent through EmailJS (emailjs.com). Fill in all four to turn it on; until then the
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
