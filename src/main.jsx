import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

import { NotificationProvider } from './context/NotificationContext.jsx'
import { ConfirmationProvider } from './context/ConfirmationContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <NotificationProvider>
        <ConfirmationProvider>
          <App />
        </ConfirmationProvider>
      </NotificationProvider>
    </BrowserRouter>
  </StrictMode>,
)
