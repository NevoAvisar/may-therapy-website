import { lazy, StrictMode, Suspense, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const AdminPanel = lazy(() => import('./components/AdminPanel'))

const isAdminUrl = () => location.hash === '#admin'

/** May's panel lives at /#admin, unlinked from the site and loaded only when opened. */
function Root() {
  const [admin, setAdmin] = useState(isAdminUrl)

  useEffect(() => {
    const onHashChange = () => setAdmin(isAdminUrl())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  if (!admin) return <App />
  return (
    <Suspense fallback={null}>
      <AdminPanel />
    </Suspense>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
