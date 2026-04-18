import { createRoot } from 'react-dom/client'
import App from './App'
import ErrorBoundary, { logIssue } from './ErrorBoundary'

// Global error handler — catches unhandled JS errors outside React
window.addEventListener('error', (event) => {
  logIssue({
    type: 'crash',
    severity: 'critical',
    message: event.message || 'Unhandled error',
    stack: event.error?.stack?.split('\n').slice(0, 5).join('\n') || '',
    timestamp: new Date().toISOString(),
    url: window.location.href,
    screen: `${window.innerWidth}x${window.innerHeight}`,
  })
})

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  logIssue({
    type: 'crash',
    severity: 'high',
    message: `Unhandled promise: ${event.reason?.message || event.reason || 'Unknown'}`,
    stack: event.reason?.stack?.split('\n').slice(0, 5).join('\n') || '',
    timestamp: new Date().toISOString(),
    url: window.location.href,
    screen: `${window.innerWidth}x${window.innerHeight}`,
  })
})

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
