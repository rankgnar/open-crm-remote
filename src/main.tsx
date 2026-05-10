import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import { App } from './App'
import { ThemeProvider } from './lib/theme'
import { applyBrandingFromCache } from './lib/branding'

applyBrandingFromCache()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
