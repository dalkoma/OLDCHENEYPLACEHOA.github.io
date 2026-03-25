import { useState, useRef, useEffect, useCallback } from 'react'
import { colors, loadState, saveState } from '../App'

function getContextualResponses() {
  const tasks = loadState('tasks', [])
  const events = loadState('events', [])
  const reminders = loadState('reminders', [])
  const mealPlan = loadState('mealPlan', {})
  const trainSchedule = loadState('trainSchedule', [])

  const pendingTasks = tasks.filter(t => !t.completed)
  const todayStr = new Date().toISOString().split('T')[0]
  const todayEvents = events.filter(e => e.date === todayStr)
  const activeReminders = reminders.filter(r => !r.dismissed)
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const todayDay = DAYS[new Date().getDay()]
  const todayTrains = trainSchedule.filter(s => s.days?.includes(todayDay))

  const responses = []

  // Schedule response
  if (todayEvents.length > 0) {
    const eventList = todayEvents.slice(0, 3).map(e => `${e.title}${e.time ? ' at ' + e.time : ''}`).join(', ')
    responses.push({ transcript: "What's on my schedule today?", response: `You have ${todayEvents.length} event${todayEvents.length > 1 ? 's' : ''} today: ${eventList}.` })
  } else {
    responses.push({ transcript: "What's on my schedule today?", response: "Your calendar is clear today. A great day to get ahead on tasks or relax!" })
  }

  // Tasks response
  if (pendingTasks.length > 0) {
    const top = pendingTasks[0]
    responses.push({ transcript: "How many tasks do I have?", response: `You have ${pendingTasks.length} pending task${pendingTasks.length > 1 ? 's' : ''}. The top one is "${top.title}". Want me to go through them?` })
  } else {
    responses.push({ transcript: "How many tasks do I have?", response: "You're all caught up! No pending tasks. Nice work." })
  }

  // Reminders
  if (activeReminders.length > 0) {
    responses.push({ transcript: "Do I have any reminders?", response: `You have ${activeReminders.length} active reminder${activeReminders.length > 1 ? 's' : ''}. The next one is "${activeReminders[0].title || activeReminders[0].text || 'Untitled'}".` })
  } else {
    responses.push({ transcript: "Do I have any reminders?", response: "No active reminders right now. Want me to set one?" })
  }

  // Meal plan (keys are like "Mon_dinner", "Mon_lunch" etc.)
  const todayDayAbbr = DAYS[new Date().getDay()]
  const todayDinner = mealPlan[`${todayDayAbbr}_dinner`]
  const todayLunch = mealPlan[`${todayDayAbbr}_lunch`]
  if (todayDinner || todayLunch) {
    const meal = (todayDinner || todayLunch).name || todayDinner || todayLunch
    responses.push({ transcript: "What's for dinner tonight?", response: `Tonight's plan is ${meal}. Want me to pull up the recipe or adjust the meal plan?` })
  } else {
    responses.push({ transcript: "Plan dinner for tonight", response: "You don't have anything planned for tonight yet. I can suggest something based on your preferences. Want me to open the meal planner?" })
  }

  // Train status
  if (todayTrains.length > 0) {
    const t = todayTrains[0]
    responses.push({ transcript: "What's my train status?", response: `You're on train #${t.train} today, ${t.direction}, boarding at ${t.boardStation}${t.exitStation ? ' to ' + t.exitStation : ''}. Check the train tracker for live delay info.` })
  } else {
    responses.push({ transcript: "Am I working the train today?", response: "No trains on your schedule today. Enjoy the day off the rails!" })
  }

  // Always include these generic useful ones
  responses.push({ transcript: "What can you help me with?", response: "I can help with your calendar, tasks, meal planning, train schedules, reminders, messaging, travel planning, and more. Just ask!" })

  return responses
}

export default function Voice({ user, addMemory, R }) {
  const [listening, setListening] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [conversation, setConversation] = useState(() => loadState('voiceConversation', []))
  const [mode, setMode] = useState('push')
  const [amplitude, setAmplitude] = useState(0)
  const animRef = useRef(null)
  const timeoutRef = useRef(null)
  const responseIndexRef = useRef(0)

  // Cancel all speech synthesis on unmount (fixes repeat on page change)
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel()
      }
      cancelAnimationFrame(animRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

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

  const speak = useCallback((text) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel() // Cancel any ongoing speech first
      const utter = new SpeechSynthesisUtterance(text)
      utter.rate = 1.0
      utter.pitch = 1.0
      speechSynthesis.speak(utter)
    }
  }, [])

  const startListening = () => setListening(true)

  const stopListening = () => {
    setListening(false)
    setProcessing(true)
    timeoutRef.current = setTimeout(() => {
      const responses = getContextualResponses()
      // Cycle through responses in order instead of random repeats
      const vr = responses[responseIndexRef.current % responses.length]
      responseIndexRef.current++
      setConversation(prev => [
        ...prev,
        { role: 'user', text: vr.transcript },
        { role: 'ai', text: vr.response },
      ])
      addMemory(`Voice: "${vr.transcript}"`)
      setProcessing(false)
      speak(vr.response)
    }, 1000)
  }

  // Responsive orb sizing
  const isZFlip = R.device === 'zFlipCover'
  const isSmall = R.isSmall
  const ringSize = isZFlip ? 80 : isSmall ? Math.min(140, R.w * 0.35) : Math.min(160, R.w * 0.25)
  const orbContainerSize = ringSize + R.sp(isZFlip ? 30 : 60)
  const rings = [1, 0.75, 0.5]

  return (
    <div style={{ padding: R.sp(16), display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: `calc(100vh - ${R.sp(R.isLandscape && isSmall ? 150 : 200)}px)` }}>
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
          aria-label={processing ? 'Processing speech' : listening ? 'Release to stop listening' : mode === 'push' ? 'Hold to speak' : 'Tap to start listening'}
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
                  <div style={{ color: colors.primaryLight, fontSize: R.fs(10), fontWeight: 600, marginBottom: R.sp(4) }}>JARVIS</div>
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
