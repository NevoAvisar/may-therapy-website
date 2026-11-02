/* Contact settings – edit here */
export const CONTACT = {
  // International format, digits only, no "+" or leading 0 (e.g. 972501234567)
  whatsappNumber: '972XXXXXXXXX',
  whatsappMessage: 'היי מאי 🌿 הגעתי דרך האתר ואשמח לשמוע עוד על הטיפולים ולתאם שיחת היכרות.',
  email: 'may@example.com',
  emailSubject: 'פנייה מהאתר – שאלה / תיאום טיפול',
  emailBody: 'היי מאי,\n\nאשמח לשמוע פרטים נוספים על הטיפולים ולתאם שיחת היכרות.\n\nשם:\nטלפון:\n\nתודה!',
}

export const whatsappUrl = `https://wa.me/${CONTACT.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(CONTACT.whatsappMessage)}`

export const mailtoUrl = `mailto:${CONTACT.email}?subject=${encodeURIComponent(CONTACT.emailSubject)}&body=${encodeURIComponent(CONTACT.emailBody)}`

/** Fired by in-page links: expands the hero (if needed), then scrolls to `detail.targetId`. */
export const HERO_EXPAND_EVENT = 'hero:expand'

export function goToSection(targetId: string) {
  window.dispatchEvent(new CustomEvent(HERO_EXPAND_EVENT, { detail: { targetId } }))
}
