import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'boxicons/css/boxicons.min.css'
import './index.css'
import App from './App.jsx'

// Import Bootstrap JS - needed for tabs, modals, etc.
import * as bootstrap from 'bootstrap'
window.bootstrap = bootstrap

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
