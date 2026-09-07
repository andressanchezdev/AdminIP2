import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import '@/shared/styles/variables.css'
import '@/shared/styles/publicScale.css'
import '@/shared/styles/motion.css'
import '@/shared/styles/responsive.css'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
