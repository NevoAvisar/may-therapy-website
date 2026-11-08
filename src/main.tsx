import { lazy, StrictMode, Suspense, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import AccessibilityWidget from './components/AccessibilityWidget'
import CookieConsent from './components/CookieConsent'
import SkipLink from './components/SkipLink'
import { initA11y } from './lib/a11y'
import { initTrackers } from './lib/trackers'
import './index.css'
import './a11y.css'

// ==========================================
// App entry | נקודת הכניסה לאתר
// ==========================================
const AdminPanel = lazy(() => import('./components/AdminPanel'))
const AccessibilityStatement = lazy(() => import('./components/AccessibilityStatement'))
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'))

// Keep in step with STATIC_ROUTES in vite.config.ts | לעדכן יחד עם STATIC_ROUTES ב-vite.config.ts
const PAGES: Record<string, typeof AdminPanel> = {
  '/accessibility': AccessibilityStatement,
  '/privacy': PrivacyPolicy,
}

const isAdminUrl = () => location.hash === '#admin'

/** May's panel lives at /#admin, unlinked from the site and loaded only when opened. */
function Root() {
  const [admin, setAdmin] = useState(isAdminUrl)

  useEffect(() => {
    const onHashChange = () => setAdmin(isAdminUrl())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  if (admin) {
    return (
      <Suspense fallback={null}>
        <AdminPanel />
      </Suspense>
    )
  }

  const Page = PAGES[location.pathname.replace(/\/$/, '')]
  return (
    <>
      {/* In this order, so the Tab key meets them before the page itself | בסדר הזה, כדי שמקש Tab יגיע אליהם לפני הדף */}
      <SkipLink />
      <AccessibilityWidget />
      <CookieConsent />
      {Page ? (
        <Suspense fallback={null}>
          <Page />
        </Suspense>
      ) : (
        <App />
      )}
    </>
  )
}

initA11y()
initTrackers()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
