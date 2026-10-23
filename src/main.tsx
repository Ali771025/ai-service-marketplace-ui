import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { MockStoreProvider } from './data/MockStore'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <MockStoreProvider>
          <App />
        </MockStoreProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
