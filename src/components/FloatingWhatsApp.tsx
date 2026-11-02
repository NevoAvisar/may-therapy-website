import { AnimatePresence, motion } from 'framer-motion'
import WhatsAppIcon from './WhatsAppIcon'
import { whatsappUrl } from '../config'

/** Bottom-left in RTL, away from the TreeSpine on the right. */
export default function FloatingWhatsApp({ visible = true }: { visible?: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="שליחת הודעה בוואטסאפ"
          className="fixed bottom-5 left-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-stream-blue text-primary shadow-bloom"
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <span aria-hidden className="absolute inset-0 animate-soft-pulse rounded-full bg-stream-aqua" />
          <WhatsAppIcon className="relative h-7 w-7" />
        </motion.a>
      )}
    </AnimatePresence>
  )
}
