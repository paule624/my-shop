import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// Self-hosted variable fonts (same files Google Fonts served): wght axis for DM Sans, opsz + wght for Fraunces
import '@fontsource-variable/dm-sans'
import '@fontsource-variable/fraunces/opsz.css'
import '@/index.css'
import App from '@/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
