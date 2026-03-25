import { useState, useEffect, useCallback, useRef } from 'react'
import { useResponsive } from './useResponsive'
import Dashboard from './screens/Dashboard'
import Chat from './screens/Chat'
import Calendar from './screens/Calendar'
import Tasks from './screens/Tasks'
import MealPlanner from './screens/MealPlanner'
import Scanner from './screens/Scanner'
import Channels from './screens/Channels'
import Voice from './screens/Voice'
import TravelPlanner from './screens/TravelPlanner'
import AppBuilder from './screens/AppBuilder'
import Settings from './screens/Settings'
import Reminders from './screens/Reminders'
import TrainTracker from './screens/TrainTracker'
import IssueTracker from './screens/IssueTracker'
import KioskMode from './modes/KioskMode'
import DisplayMode from './modes/DisplayMode'
import ConductorMode from './modes/ConductorMode'
import MinimalMode from './modes/MinimalMode'

const SCREENS = {
  dashboard: { label: 'Home', icon: '⌂', component: Dashboard },
  trains: { label: 'Trains', icon: '🚂', component: TrainTracker },
  chat: { label: 'Chat', icon: '◉', component: Chat },
  calendar: { label: 'Calendar', icon: '▦', component: Calendar },
  tasks: { label: 'Tasks', icon: '✓', component: Tasks },
  meals: { label: 'Meals', icon: '◈', component: MealPlanner },
  scanner: { label: 'Scan', icon: '⊞', component: Scanner },
  channels: { label: 'Channels', icon: '⊶', component: Channels },
  voice: { label: 'Voice', icon: '◎', component: Voice },
  travel: { label: 'Travel', icon: '➤', component: TravelPlanner },
  builder: { label: 'Builder', icon: '⬡', component: AppBuilder },
  reminders: { label: 'Remind', icon: '⏰', component: Reminders },
  settings: { label: 'Settings', icon: '⚙', component: Settings },
  issues: { label: 'Issues', icon: '⚑', component: IssueTracker },
}

const NAV_ITEMS = ['dashboard', 'trains', 'chat', 'tasks', 'settings']
const MENU_ITEMS = ['meals', 'scanner', 'channels', 'voice', 'travel', 'builder', 'reminders', 'issues']

const colors = {
  bg: '#0a0a1a',
  surface: '#12122a',
  surfaceLight: '#1a1a3a',
  surfaceHover: '#22224a',
  border: '#2a2a4a',
  primary: '#6c5ce7',
  primaryLight: '#a29bfe',
  secondary: '#00cec9',
  accent: '#fd79a8',
  warning: '#fdcb6e',
  success: '#00b894',
  danger: '#e17055',
  text: '#f0f0ff',
  textSecondary: '#8888aa',
  textMuted: '#555577',
  gradient1: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
  gradient2: 'linear-gradient(135deg, #00cec9, #55efc4)',
  gradient3: 'linear-gradient(135deg, #fd79a8, #e17055)',
}

export { colors }

// Persistent storage helpers
const loadState = (key, fallback) => {
  try {
    const v = localStorage.getItem('jarvis_' + key)
    return v ? JSON.parse(v) : fallback
  } catch { return fallback }
}
const saveState = (key, value) => {
  try { localStorage.setItem('jarvis_' + key, JSON.stringify(value)) } catch {}
}

export { loadState, saveState }

// URL parameter mode detection: ?mode=kiosk|display|conductor|minimal
const DISPLAY_MODES = { kiosk: KioskMode, display: DisplayMode, conductor: ConductorMode, minimal: MinimalMode }

function getUrlMode() {
  try {
    const params = new URLSearchParams(window.location.search)
    return params.get('mode')
  } catch { return null }
}

export default function App() {
  const [urlMode] = useState(getUrlMode)

  // If a display mode is active, render only that mode (no chrome, no nav)
  const ModeComponent = urlMode ? DISPLAY_MODES[urlMode] : null
  if (ModeComponent) return <ModeComponent />

  const [screen, setScreen] = useState('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)
  const R = useResponsive()
  const [user, setUser] = useState(() => loadState('user', {
    name: '',
    preferences: {},
    memory: [],
    integrations: { google: false, apple: false, outlook: false, slack: false, whatsapp: false },
    circle: [],
  }))

  const [onboarded, setOnboarded] = useState(() => loadState('onboarded', false))
  const [onboardStep, setOnboardStep] = useState(0)
  const [onboardName, setOnboardName] = useState('')

  useEffect(() => { saveState('user', user) }, [user])

  const navigate = useCallback((s) => {
    // Cancel any ongoing speech synthesis when changing pages
    if ('speechSynthesis' in window) speechSynthesis.cancel()
    setScreen(s); setMenuOpen(false)
  }, [])

  const updateUser = useCallback((updates) => {
    setUser(prev => ({ ...prev, ...updates }))
  }, [])

  const addMemory = useCallback((entry) => {
    setUser(prev => ({
      ...prev,
      memory: [{ text: entry, date: new Date().toISOString() }, ...prev.memory].slice(0, 100)
    }))
  }, [])

  const completeOnboarding = () => {
    updateUser({ name: onboardName || 'Friend' })
    setOnboarded(true)
    saveState('onboarded', true)
  }

  // Z Flip cover: minimal boot screen
  const isZFlip = R.device === 'zFlipCover'

  if (!onboarded) {
    return (
      <div style={{
        minHeight: '100vh', minHeight: '100dvh', background: colors.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: R.sp(20),
      }}>
        <div style={{ maxWidth: R.modalMaxWidth, width: '100%', textAlign: 'center' }}>
          {onboardStep === 0 && (
            <div style={{ animation: 'fadeIn 0.6s ease' }}>
              <div style={{ fontSize: R.fs(isZFlip ? 40 : 64), marginBottom: R.sp(24) }}>◉</div>
              <h1 style={{ color: colors.text, fontSize: R.fs(isZFlip ? 22 : 32), fontWeight: 700, marginBottom: R.sp(8) }}>Jarvis</h1>
              {!isZFlip && <p style={{ color: colors.primaryLight, fontSize: R.fs(18), marginBottom: R.sp(8) }}>Your Personal AI Life Manager</p>}
              {!isZFlip && (
                <p style={{ color: colors.textSecondary, fontSize: R.fs(14), lineHeight: 1.6, marginBottom: R.sp(32) }}>
                  Calendar, tasks, meals, messaging, travel, and more — all managed by AI that learns you.
                </p>
              )}
              <button onClick={() => setOnboardStep(1)} style={btnStyle(R)}>Get Started</button>
            </div>
          )}
          {onboardStep === 1 && (
            <div style={{ animation: 'fadeIn 0.6s ease' }}>
              <h2 style={{ color: colors.text, fontSize: R.fs(24), marginBottom: R.sp(8) }}>What should I call you?</h2>
              {!isZFlip && <p style={{ color: colors.textSecondary, fontSize: R.fs(14), marginBottom: R.sp(24) }}>I'll remember your name and preferences over time.</p>}
              <input
                value={onboardName}
                onChange={e => setOnboardName(e.target.value)}
                placeholder="Your name"
                style={inputStyle(R)}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && setOnboardStep(2)}
              />
              <button onClick={() => setOnboardStep(2)} style={{ ...btnStyle(R), marginTop: R.sp(16) }}>Continue</button>
            </div>
          )}
          {onboardStep === 2 && (
            <div style={{ animation: 'fadeIn 0.6s ease' }}>
              <h2 style={{ color: colors.text, fontSize: R.fs(24), marginBottom: R.sp(8) }}>Here's what I can do</h2>
              <div style={{ textAlign: 'left', margin: `${R.sp(24)}px 0` }}>
                {(isZFlip ? [
                  ['◉', 'AI Chat & Voice'],
                  ['▦', 'Smart Calendar'],
                  ['✓', 'Task Delegation'],
                  ['◈', 'Meal Planning'],
                ] : [
                  ['◉', 'AI Chat & Voice', 'Talk to me anytime — text or voice'],
                  ['▦', 'Smart Calendar', 'Unified calendar with conflict detection'],
                  ['✓', 'Task Delegation', 'Assign tasks to your circle via SMS'],
                  ['◈', 'Meal Planning', 'Personalized meals + grocery lists'],
                  ['⊞', 'Smart Scanning', 'Extract info from photos & documents'],
                  ['⊶', 'Multi-Channel', 'SMS, Email, WhatsApp, Slack — all in one'],
                  ['➤', 'Travel Planning', 'Plan trips with AI assistance'],
                  ['⬡', 'App Builder', 'Create custom mini-apps on the fly'],
                ]).map(([icon, title, desc]) => (
                  <div key={title} style={{ display: 'flex', gap: R.sp(12), padding: `${R.sp(10)}px 0`, borderBottom: `${R.borderWidth}px solid ${colors.border}` }}>
                    <span style={{ fontSize: R.fs(20), color: colors.primary, width: R.sp(28), textAlign: 'center', flexShrink: 0 }}>{icon}</span>
                    <div>
                      <div style={{ color: colors.text, fontSize: R.fs(14), fontWeight: 600 }}>{title}</div>
                      {desc && <div style={{ color: colors.textSecondary, fontSize: R.fs(12) }}>{desc}</div>}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={completeOnboarding} style={btnStyle(R)}>Let's Go, {onboardName || 'Friend'}!</button>
            </div>
          )}
        </div>
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      </div>
    )
  }

  const CurrentScreen = SCREENS[screen]?.component || Dashboard

  // Landscape phone: hide labels in nav, smaller nav
  const isLandscapePhone = R.isLandscape && R.isSmall

  return (
    <div style={{ minHeight: '100vh', minHeight: '100dvh', background: colors.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `${R.sp(12)}px ${R.sp(16)}px`,
        paddingTop: `max(${R.sp(12)}px, env(safe-area-inset-top, 0px))`,
        background: colors.surface, borderBottom: `${R.isRetina ? 0.5 : 1}px solid ${colors.border}`,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: R.sp(10) }}>
          <span style={{ fontSize: R.fs(22), color: colors.primary }}>◉</span>
          {!isZFlip && <span style={{ color: colors.text, fontSize: R.fs(16), fontWeight: 600 }}>Jarvis</span>}
        </div>
        <div style={{ color: colors.textSecondary, fontSize: R.fs(13) }}>
          {SCREENS[screen]?.label}
        </div>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            background: 'none', border: 'none', color: colors.textSecondary,
            fontSize: R.fs(22), cursor: 'pointer', padding: R.sp(4),
            minWidth: R.minTouchTarget, minHeight: R.minTouchTarget,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* Slide-out menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99,
          background: 'rgba(0,0,0,0.6)', animation: 'fadeIn 0.2s ease',
        }} onClick={() => setMenuOpen(false)}>
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: R.sidebarWidth,
            background: colors.surface, borderLeft: `${R.isRetina ? 0.5 : 1}px solid ${colors.border}`,
            padding: `${R.sp(60)}px 0 ${R.sp(20)}px`, overflowY: 'auto', animation: 'slideIn 0.25s ease',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: `0 ${R.sp(16)}px ${R.sp(16)}px`, borderBottom: `${R.borderWidth}px solid ${colors.border}`, marginBottom: R.sp(8) }}>
              <div style={{ color: colors.text, fontSize: R.fs(16), fontWeight: 600 }}>Hi, {user.name}!</div>
              <div style={{ color: colors.textSecondary, fontSize: R.fs(12) }}>All Features</div>
            </div>
            {[...NAV_ITEMS, ...MENU_ITEMS].map(key => (
              <button
                key={key}
                onClick={() => navigate(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: R.sp(12), width: '100%',
                  padding: `${R.sp(12)}px ${R.sp(20)}px`,
                  background: screen === key ? colors.surfaceHover : 'transparent',
                  border: 'none', color: screen === key ? colors.primary : colors.text,
                  fontSize: R.fs(14), cursor: 'pointer', textAlign: 'left',
                  minHeight: R.minTouchTarget,
                }}
              >
                <span style={{ fontSize: R.fs(18), width: R.sp(24), textAlign: 'center' }}>{SCREENS[key]?.icon}</span>
                {SCREENS[key]?.label}
                {['travel', 'builder'].includes(key) && (
                  <span style={{ marginLeft: 'auto', fontSize: R.fs(9), color: colors.accent, background: `${colors.accent}22`, padding: `${R.sp(2)}px ${R.sp(6)}px`, borderRadius: R.sp(8) }}>NEW</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', paddingBottom: isLandscapePhone ? 52 : 72 }}>
        <CurrentScreen user={user} updateUser={updateUser} addMemory={addMemory} navigate={navigate} R={R} />
      </main>

      {/* Bottom nav */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        display: 'flex', background: colors.surface,
        borderTop: `${R.isRetina ? 0.5 : 1}px solid ${colors.border}`,
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
        paddingLeft: 'env(safe-area-inset-left, 0)',
        paddingRight: 'env(safe-area-inset-right, 0)',
      }}>
        {NAV_ITEMS.map(key => (
          <button
            key={key}
            onClick={() => navigate(key)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: isLandscapePhone ? '4px 0 3px' : `${R.sp(8)}px 0 ${R.sp(6)}px`,
              background: 'none', border: 'none',
              color: screen === key ? colors.primary : colors.textMuted,
              fontSize: R.fs(isLandscapePhone ? 8 : 10), cursor: 'pointer', gap: R.sp(2),
              minHeight: R.minTouchTarget,
            }}
          >
            <span style={{ fontSize: R.fs(isLandscapePhone ? 16 : 20) }}>{SCREENS[key]?.icon}</span>
            {!isZFlip && SCREENS[key]?.label}
          </button>
        ))}
      </nav>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        input:focus, textarea:focus, select:focus { outline: none; border-color: ${colors.primary} !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${colors.border}; border-radius: 2px; }
        @media (hover: none) and (pointer: coarse) {
          button, a, [role="button"] { -webkit-tap-highlight-color: transparent; }
        }
        @media (resolution >= 2dppx) {
          * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        }
      `}</style>
    </div>
  )
}

const btnStyle = (R) => ({
  width: '100%', padding: `${R.sp(14)}px ${R.sp(24)}px`, background: colors.gradient1,
  color: '#fff', border: 'none', borderRadius: R.sp(12), fontSize: R.fs(16),
  fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  minHeight: R.minTouchTarget,
})

const inputStyle = (R) => ({
  width: '100%', padding: `${R.sp(14)}px ${R.sp(16)}px`, background: colors.surfaceLight,
  color: colors.text, border: `${R.borderWidth}px solid ${colors.border}`, borderRadius: R.sp(12),
  fontSize: R.fs(16), fontFamily: 'inherit',
  minHeight: R.minTouchTarget,
})
