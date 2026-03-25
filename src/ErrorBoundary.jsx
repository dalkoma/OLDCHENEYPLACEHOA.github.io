import { Component } from 'react'

const colors = {
  bg: '#0a0a1a', surface: '#12122a', surfaceLight: '#1a1a3a',
  border: '#2a2a4a', primary: '#6c5ce7', danger: '#e17055',
  text: '#f0f0ff', textSecondary: '#8888aa', textMuted: '#555577',
}

function logIssue(issue) {
  try {
    const issues = JSON.parse(localStorage.getItem('jarvis_issueLog') || '[]')
    issues.unshift(issue)
    localStorage.setItem('jarvis_issueLog', JSON.stringify(issues.slice(0, 200)))
  } catch {}
}

export { logIssue }

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    logIssue({
      type: 'crash',
      severity: 'critical',
      message: error?.message || 'Unknown error',
      stack: error?.stack?.split('\n').slice(0, 5).join('\n') || '',
      component: info?.componentStack?.split('\n').slice(0, 3).join('\n') || '',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      screen: `${window.innerWidth}x${window.innerHeight}`,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', background: colors.bg, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 20,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}>
          <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠</div>
            <h1 style={{ color: colors.text, fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
              Something went wrong
            </h1>
            <p style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 1.5, marginBottom: 24 }}>
              Jarvis hit an unexpected error. This has been logged automatically.
            </p>
            <div style={{
              background: colors.surfaceLight, borderRadius: 10, padding: 14,
              border: `1px solid ${colors.border}`, marginBottom: 20, textAlign: 'left',
            }}>
              <div style={{ color: colors.danger, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>ERROR</div>
              <div style={{ color: colors.textMuted, fontSize: 11, wordBreak: 'break-word' }}>
                {this.state.error?.message || 'Unknown error'}
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                width: '100%', padding: '14px 24px',
                background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
                color: '#fff', border: 'none', borderRadius: 12, fontSize: 16,
                fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10,
              }}
            >Reload App</button>
            <button
              onClick={() => {
                localStorage.clear()
                window.location.reload()
              }}
              style={{
                width: '100%', padding: '12px 24px', background: 'transparent',
                color: colors.danger, border: `1px solid ${colors.danger}40`,
                borderRadius: 12, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Reset All Data & Reload</button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
