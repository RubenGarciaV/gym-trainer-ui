import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

const renderApp = () => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

if (import.meta.env.DEV && import.meta.env.VITE_API_MOCKING === 'enabled') {
  import('./mocks/browser')
    .then(({ worker }) =>
      worker.start({
        onUnhandledFrame: 'bypass',
      }),
    )
    .then(renderApp)
    .catch((error) => {
      console.error('Mock Service Worker failed to start.', error)
      throw error
    })
} else {
  renderApp()
}
