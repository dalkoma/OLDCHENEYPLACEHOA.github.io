import { useState, useRef, useEffect } from 'react'
import { colors } from '../App'

const VOICE_RESPONSES = [
  { transcript: "What's on my schedule today?", response: "You have 3 events today. A team standup at 10am, lunch with Sarah at noon, and a dentist appointment at 3pm." },
  { transcript: "Add a reminder to pick up groceries", response: "I've added a reminder to pick up groceries. When would you like me to remind you?" },
  { transcript: "Plan dinner for tonight", response: "Based on what's in your meal plan, tonight is Chicken Stir-Fry. It takes about 20 minutes. Want me to pull up the recipe?" },
  { transcript: "Send a text to Mom", response: "Sure! What would you like me to say to Mom? I can draft something based on your recent conversation." },
  { transcript: "What's the weather like?", response: "It's currently 72°F and sunny. Perfect day to get outside! The evening will cool to around 58°F." },
  { transcript: "How many tasks do I have?", response: "You have 5 pending tasks. The highest priority one is 'Review Q2 budget proposal'. Want me to go through them?" },
]

export default function Voice({ user, addMemory, R }) {
  const [listening, setListening] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [conversation, setConversation] = useState([])
  const [mode, setMode] = useState('push')
  const [amplitude, setAmplitude] = useState(0)
  const animRef = useRef(null)

  useEffect(() => {
    if (listening) {
      const animate = () => {
        setAmplitude(0.3 + Math.random() * 0.7)
        animRef.current = requestAnimationFrame(animate)
      }
      animRef.current = requestAnimationFrame(animate)
    } else {
      cancelAnimationFrame(animRef.current)
      setAmplitude(0)
    }
    return () => cancelAnimationFrame(animRef.current)
  }, [listening])

  const startListening = () => setListening(true)

  const stopListening = () => {
    setListening(false)
    setProcessing(true)
    setTimeout(() => {
      const vr = VOICE_RESPONSES[Math.floor(Math.random() * VOICE_RESPONSES.length)]
      setConversation(prev => [
        ...prev,
        { role: 'user', text: vr.transcript },
        { role: 'ai', text: vr.response },
      ])
      addMemory(`Voice: "${vr.transcript}"`)
      setProcessing(false)
      if ('speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(vr.response)
        utter.rate = 1.0
        utter.pitch = 1.0
        speechSynthesis.speak(utter)
      }
    }, 1000)
  }

  // Responsive orb sizing
  const isZFlip = R.device === 'zFlipCover'
  const isSmall = R.isSmall
  const ringSize = isZFlip ? 80 : isSmall ? Math.min(140, R.w * 0.35) : Math.min(160, R.w * 0.25)
  const orbContainerSize = ringSize + (isZFlip ? 30 : 60)
  const rings = [1, 0.75, 0.5]

  return (
    <div style={{ padding: R.sp(16), display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: `calc(100vh - ${R.isLandscape && isSmall ? 150 : 200}px)` }}>
      <h2 style={{ color: colors.text, fontSize: R.fs(20), fontWeight: 700, marginBottom: 4, alignSelf: 'flex-start' }}>Voice Assistant</h2>
      <p style={{ color: colors.textSecondary, fontSize: R.fs(13), marginBottom: R.sp(24), alignSelf: 'flex-start' }}>
        Talk to Jarvis hands-free. {mode === 'push' ? 'Hold the button to speak.' : 'Jarvis is always listening.'}
      </p>

      {/* Mode Toggle */}
      <div style={{ display: 'flex', gap: R.sp(8), marginBottom: R.sp(isZFlip ? 16 : 32), alignSelf: 'flex-start' }}>
        {[['push', 'Push to Talk'], ['continuous', 'Always On']].map(([m, label]) => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: `${R.sp(6)}px ${R.sp(14)}px`, background: mode === m ? colors.primary : colors.surfaceLight,
            border: `${R.borderWidth}px solid ${mode === m ? colors.primary : colors.border}`,
            borderRadius: 20, color: mode === m ? '#fff' : colors.textSecondary,
            fontSize: R.fs(12), cursor: 'pointer', fontFamily: 'inherit',
            minHeight: R.minTouchTarget,
          }}>{label}</button>
        ))}
      </div>

      {/* Voice Orb */}
      <div style={{ position: 'relative', width: orbContainerSize, height: orbContainerSize, marginBottom: R.sp(isZFlip ? 16 : 32) }}>
        {rings.map((scale, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: ringSize * (1 + (listening ? amplitude * 0.3 * (i + 1) : 0)),
            height: ringSize * (1 + (listening ? amplitude * 0.3 * (i + 1) : 0)),
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.primary}${listening ? '40' : '10'}, transparent)`,
            border: `1px solid ${colors.primary}${listening ? '60' : '20'}`,
            transform: 'translate(-50%, -50%)',
            transition: listening ? 'none' : 'all 0.3s ease',
          }} />
        ))}
        <button
          onMouseDown={mode === 'push' ? startListening : undefined}
          onMouseUp={mode === 'push' ? stopListening : undefined}
          onTouchStart={mode === 'push' ? (e) => { e.preventDefault(); startListening() } : undefined}
          onTouchEnd={mode === 'push' ? stopListening : undefined}
          onClick={mode === 'continuous' ? () => listening ? stopListening() : startListening() : undefined}
          style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: ringSize, height: ringSize, borderRadius: '50%',
            background: colors.gradient1,
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: listening ? `0 0 40px ${colors.primary}60` : `0 0 20px ${colors.primary}30`,
            transition: 'box-shadow 0.3s ease',
          }}
        >
          <span style={{ fontSize: R.fs(isZFlip ? 28 : 48), color: '#fff' }}>
            {processing ? '...' : listening ? '◎' : '◉'}
          </span>
        </button>
      </div>

      <div style={{ color: listening ? colors.primaryLight : colors.textMuted, fontSize: R.fs(14), marginBottom: R.sp(24) }}>
        {processing ? 'Processing...' : listening ? 'Listening...' : mode === 'push' ? 'Hold to speak' : 'Tap to start'}
      </div>

      {/* Conversation History */}
      {conversation.length > 0 && (
        <div style={{ width: '100%', maxWidth: R.modalMaxWidth }}>
          <h3 style={{ color: colors.text, fontSize: R.fs(14), fontWeight: 600, marginBottom: R.sp(10) }}>CONVERSATION</h3>
          {conversation.map((msg, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: R.sp(8),
            }}>
              <div style={{
                maxWidth: '85%', padding: `${R.sp(10)}px ${R.sp(14)}px`, borderRadius: 12,
                background: msg.role === 'user' ? colors.primary : colors.surfaceLight,
                border: msg.role === 'ai' ? `${R.borderWidth}px solid ${colors.border}` : 'none',
              }}>
                {msg.role === 'ai' && (
                  <div style={{ color: colors.primaryLight, fontSize: R.fs(10), fontWeight: 600, marginBottom: 4 }}>JARVIS</div>
                )}
                <p style={{ color: '#fff', fontSize: R.fs(13), margin: 0, lineHeight: 1.4 }}>{msg.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Voice Commands */}
      {!isZFlip && (
        <div style={{ width: '100%', maxWidth: R.modalMaxWidth, marginTop: R.sp(20) }}>
          <h3 style={{ color: colors.text, fontSize: R.fs(14), fontWeight: 600, marginBottom: R.sp(10) }}>TRY SAYING</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: R.sp(6) }}>
            {["What's on my schedule?", "Set a reminder", "Plan dinner", "Send a text", "Check my tasks"].map(cmd => (
              <span key={cmd} style={{
                padding: `${R.sp(6)}px ${R.sp(12)}px`, background: colors.surfaceLight, border: `${R.borderWidth}px solid ${colors.border}`,
                borderRadius: 16, color: colors.textSecondary, fontSize: R.fs(11),
              }}>{cmd}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
