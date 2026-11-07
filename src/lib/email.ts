import { EMAILJS } from '../config'

// ==========================================
// Booking email through EmailJS | שליחת מייל תיאום דרך EmailJS
// ==========================================
export type Inquiry = { name: string; email: string; phone: string; message: string }

const SEND_URL = 'https://api.emailjs.com/api/v1.0/email/send'

export const emailConfigured = () => Object.values(EMAILJS).every(Boolean)

async function sendTemplate(templateId: string, inquiry: Inquiry) {
  const response = await fetch(SEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: EMAILJS.serviceId,
      template_id: templateId,
      user_id: EMAILJS.publicKey,
      template_params: inquiry,
    }),
  })
  if (!response.ok) throw new Error(`EmailJS responded ${response.status}`)
}

/**
 * Sends the inquiry to May, then the confirmation to the client. Throws if May's copy fails.
 * Resolves to whether the client's confirmation really went out, so the page only claims what happened.
 */
export async function sendInquiry(inquiry: Inquiry) {
  await sendTemplate(EMAILJS.templateToMay, inquiry)
  return sendTemplate(EMAILJS.templateToClient, inquiry).then(
    () => true,
    () => false,
  )
}
