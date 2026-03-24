import { useState } from 'react'
import { colors, loadState, saveState } from '../App'

const CHANNELS = [
  { id: 'sms', name: 'SMS', icon: '💬', color: colors.success, desc: 'Send & receive texts' },
  { id: 'email', name: 'Email', icon: '📧', color: colors.primary, desc: 'Gmail, Outlook integration' },
  { id: 'whatsapp', name: 'WhatsApp', icon: '📱', color: '#25D366', desc: 'WhatsApp messaging' },
  { id: 'slack', name: 'Slack', icon: '⊶', color: '#E01E5A', desc: 'Workspace messaging' },
  { id: 'phone', name: 'Phone', icon: '📞', color: colors.warning, desc: 'Make & receive calls' },
]

const DEMO_MESSAGES = {
  sms: [
    { from: 'Mom', text: "Don't forget dinner tonight at 7!", time: '2:15 PM', unread: true },
    { from: 'John', text: 'Can you pick up the kids from practice?', time: '1:30 PM', unread: true },
    { from: 'Dentist Office', text: 'Reminder: Your appointment is tomorrow at 10am.', time: '11:00 AM', unread: false },
  ],
  email: [
    { from: 'sarah@work.com', subject: 'Q2 Planning', text: 'Hey, can we move the meeting to Thursday?', time: '3:00 PM', unread: true },
    { from: 'school@district.edu', subject: 'Spring Break Schedule', text: 'Please see the attached schedule for spring break activities...', time: '12:30 PM', unread: true },
    { from: 'noreply@bank.com', subject: 'Statement Ready', text: 'Your monthly statement is now available.', time: '9:00 AM', unread: false },
  ],
  whatsapp: [
    { from: 'Family Group', text: "Who's coming to Sunday brunch?", time: '4:00 PM', unread: true },
    { from: 'Coach Mike', text: 'Practice moved to Field B tomorrow', time: '2:45 PM', unread: false },
  ],
  slack: [
    { from: '#general', text: 'Team lunch is at the new Italian place!', time: '12:00 PM', unread: true },
    { from: '@boss', text: 'Great work on the presentation!', time: '10:15 AM', unread: false },
  ],
  phone: [
    { from: 'Unknown (555-0123)', text: 'Missed call', time: '1:45 PM', unread: true },
    { from: 'Dr. Smith Office', text: 'Voicemail: Calling about your test results', time: '11:30 AM', unread: true },
  ],
}

const modalOverlay = (R) => ({
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: R.sp(20),
})
const modalContent = (R) => ({
  background: colors.surface, borderRadius: R.sp(16), padding: R.sp(24), width: '100%', maxWidth: R.modalMaxWidth,
  border: `${R.borderWidth}px solid ${colors.border}`,
})

export default function Channels({ user, addMemory, R }) {
  const [activeChannel, setActiveChannel] = useState(null)
  const [compose, setCompose] = useState(false)
  const [composeData, setComposeData] = useState({ to: '', message: '', channel: 'sms' })
  const [drafts, setDrafts] = useState(() => loadState('drafts', []))
  const [sentMessages, setSentMessages] = useState(() => loadState('sentMessages', []))

  const totalUnread = Object.values(DEMO_MESSAGES).reduce((sum, msgs) => sum + msgs.filter(m => m.unread).length, 0)

  const sendMessage = () => {
    if (!composeData.to.trim() || !composeData.message.trim()) return
    const msg = { ...composeData, id: Date.now(), sentAt: new Date().toISOString() }
    const updated = [msg, ...sentMessages]
    setSentMessages(updated)
    saveState('sentMessages', updated)
    addMemory(`Sent ${composeData.channel} to ${composeData.to}: ${composeData.message.slice(0, 50)}`)
    setComposeData({ to: '', message: '', channel: 'sms' })
    setCompose(false)
  }

  const generateDraft = () => {
    const drafts_options = [
      { to: 'Mom', message: "Hi Mom! Just confirming dinner tonight at 7. Should I bring anything?" },
      { to: 'John', message: "Hey John, I can pick up the kids at 4:30. Does that work?" },
      { to: 'sarah@work.com', message: "Hi Sarah, Thursday works perfectly for the Q2 planning meeting. I'll update the calendar invite." },
    ]
    const draft = drafts_options[Math.floor(Math.random() * drafts_options.length)]
    setComposeData({ ...composeData, ...draft })
  }

  const replyBtn = {
    padding: `${R.sp(4)}px ${R.sp(12)}px`, background: `${colors.primary}15`, border: `${R.borderWidth}px solid ${colors.primary}30`,
    borderRadius: R.sp(6), color: colors.primaryLight, fontSize: R.fs(11), cursor: 'pointer', fontFamily: 'inherit',
    minHeight: R.minTouchTarget,
  }
  const inputStyle = {
    width: '100%', padding: `${R.sp(12)}px ${R.sp(14)}px`, background: colors.surfaceLight,
    border: `${R.borderWidth}px solid ${colors.border}`, borderRadius: R.sp(10), color: colors.text,
    fontSize: R.fs(14), fontFamily: 'inherit', marginBottom: R.sp(10), minHeight: R.minTouchTarget,
  }
  const actionBtn = {
    flex: 1, padding: `${R.sp(12)}px ${R.sp(16)}px`, border: 'none', borderRadius: R.sp(10),
    fontSize: R.fs(14), fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minHeight: R.minTouchTarget,
  }

  return (
    <div style={{ padding: R.sp(16) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: R.sp(16) }}>
        <div>
          <h2 style={{ color: colors.text, fontSize: R.fs(20), fontWeight: 700 }}>Channels</h2>
          <p style={{ color: colors.textSecondary, fontSize: R.fs(12) }}>{totalUnread} unread across all channels</p>
        </div>
        <button onClick={() => setCompose(true)} style={{
          padding: `${R.sp(8)}px ${R.sp(16)}px`, background: colors.gradient1, color: '#fff',
          border: 'none', borderRadius: R.sp(8), fontSize: R.fs(13), fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          minHeight: R.minTouchTarget,
        }}>Compose</button>
      </div>

      {/* Proxy Actions Banner */}
      <div style={{
        padding: R.sp(14), background: `${colors.accent}10`, border: `${R.borderWidth}px solid ${colors.accent}25`,
        borderRadius: R.sp(12), marginBottom: R.sp(16), display: 'flex', gap: R.sp(10), alignItems: 'center',
      }}>
        <span style={{ fontSize: R.fs(18), color: colors.accent }}>◉</span>
        <div>
          <div style={{ color: colors.accent, fontSize: R.fs(11), fontWeight: 600 }}>PROXY ACTIONS</div>
          <div style={{ color: colors.textSecondary, fontSize: R.fs(12) }}>Jarvis can send texts, emails, and make calls on your behalf. You approve before anything is sent.</div>
        </div>
      </div>

      {!activeChannel ? (
        /* Channel List */
        <div>
          {CHANNELS.map(ch => {
            const msgs = DEMO_MESSAGES[ch.id] || []
            const unread = msgs.filter(m => m.unread).length
            return (
              <button key={ch.id} onClick={() => setActiveChannel(ch.id)} style={{
                display: 'flex', alignItems: 'center', gap: R.sp(14), width: '100%', padding: R.sp(16),
                background: colors.surfaceLight, border: `${R.borderWidth}px solid ${colors.border}`,
                borderRadius: R.sp(12), marginBottom: R.sp(8), cursor: 'pointer', textAlign: 'left',
                minHeight: R.minTouchTarget,
              }}>
                <div style={{
                  width: R.sp(44), height: R.sp(44), borderRadius: R.sp(12), background: `${ch.color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: R.fs(20), flexShrink: 0,
                }}>{ch.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: colors.text, fontSize: R.fs(15), fontWeight: 500 }}>{ch.name}</div>
                  <div style={{ color: colors.textSecondary, fontSize: R.fs(12) }}>{ch.desc}</div>
                </div>
                {unread > 0 && (
                  <span style={{
                    minWidth: R.sp(22), height: R.sp(22), borderRadius: R.sp(11), background: colors.accent,
                    color: '#fff', fontSize: R.fs(11), fontWeight: 700, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', padding: `0 ${R.sp(6)}px`,
                  }}>{unread}</span>
                )}
              </button>
            )
          })}

          {/* Recent Sent */}
          {sentMessages.length > 0 && (
            <div style={{ marginTop: R.sp(16) }}>
              <h3 style={{ color: colors.text, fontSize: R.fs(14), fontWeight: 600, marginBottom: R.sp(10) }}>RECENTLY SENT</h3>
              {sentMessages.slice(0, 3).map(m => (
                <div key={m.id} style={{
                  padding: R.sp(12), background: colors.surfaceLight, border: `${R.borderWidth}px solid ${colors.border}`,
                  borderRadius: R.sp(8), marginBottom: R.sp(6),
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: R.sp(4) }}>
                    <span style={{ color: colors.primaryLight, fontSize: R.fs(12) }}>To: {m.to}</span>
                    <span style={{ color: colors.textMuted, fontSize: R.fs(10) }}>{m.channel}</span>
                  </div>
                  <div style={{ color: colors.textSecondary, fontSize: R.fs(12) }}>{m.message.slice(0, 60)}...</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Channel Messages */
        <div>
          <button onClick={() => setActiveChannel(null)} style={{
            background: 'none', border: 'none', color: colors.primaryLight, fontSize: R.fs(13),
            cursor: 'pointer', marginBottom: R.sp(12), fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: R.sp(4),
            minHeight: R.minTouchTarget,
          }}>‹ Back to Channels</button>

          <h3 style={{ color: colors.text, fontSize: R.fs(16), fontWeight: 600, marginBottom: R.sp(12) }}>
            {CHANNELS.find(c => c.id === activeChannel)?.name} Messages
          </h3>

          {(DEMO_MESSAGES[activeChannel] || []).map((msg, i) => (
            <div key={i} style={{
              padding: R.sp(14), background: msg.unread ? `${colors.primary}08` : colors.surfaceLight,
              border: `${R.borderWidth}px solid ${msg.unread ? colors.primary + '30' : colors.border}`,
              borderRadius: R.sp(10), marginBottom: R.sp(8),
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: R.sp(4) }}>
                <span style={{ color: colors.text, fontSize: R.fs(14), fontWeight: msg.unread ? 600 : 400 }}>{msg.from}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: R.sp(6) }}>
                  {msg.unread && <span style={{ width: R.sp(6), height: R.sp(6), borderRadius: R.sp(3), background: colors.accent }} />}
                  <span style={{ color: colors.textMuted, fontSize: R.fs(11) }}>{msg.time}</span>
                </div>
              </div>
              {msg.subject && <div style={{ color: colors.primaryLight, fontSize: R.fs(12), marginBottom: R.sp(2) }}>{msg.subject}</div>}
              <div style={{ color: colors.textSecondary, fontSize: R.fs(13) }}>{msg.text}</div>
              <div style={{ display: 'flex', gap: R.sp(8), marginTop: R.sp(8) }}>
                <button onClick={() => { setCompose(true); setComposeData({ ...composeData, to: msg.from, channel: activeChannel }) }} style={replyBtn}>Reply</button>
                <button style={{ ...replyBtn, background: `${colors.secondary}15`, color: colors.secondary, borderColor: colors.secondary + '30' }}>AI Draft</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compose Modal */}
      {compose && (
        <div style={modalOverlay(R)} onClick={() => setCompose(false)}>
          <div style={modalContent(R)} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: R.sp(16) }}>
              <h3 style={{ color: colors.text, fontSize: R.fs(18), fontWeight: 600 }}>New Message</h3>
              <button onClick={generateDraft} style={{
                padding: `${R.sp(6)}px ${R.sp(12)}px`, background: `${colors.primary}15`, border: `${R.borderWidth}px solid ${colors.primary}30`,
                borderRadius: R.sp(8), color: colors.primaryLight, fontSize: R.fs(11), cursor: 'pointer', fontFamily: 'inherit',
                minHeight: R.minTouchTarget,
              }}>◉ AI Draft</button>
            </div>
            <select value={composeData.channel} onChange={e => setComposeData({ ...composeData, channel: e.target.value })} style={inputStyle}>
              {CHANNELS.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
            </select>
            <input
              value={composeData.to}
              onChange={e => setComposeData({ ...composeData, to: e.target.value })}
              placeholder="To (name, phone, or email)"
              style={inputStyle}
            />
            <textarea
              value={composeData.message}
              onChange={e => setComposeData({ ...composeData, message: e.target.value })}
              placeholder="Your message..."
              style={{ ...inputStyle, minHeight: R.sp(100), resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: R.sp(8) }}>
              <button onClick={() => setCompose(false)} style={{ ...actionBtn, background: colors.surfaceLight, color: colors.textSecondary }}>Cancel</button>
              <button onClick={sendMessage} style={{ ...actionBtn, background: colors.gradient1, color: '#fff' }}>Send via {CHANNELS.find(c => c.id === composeData.channel)?.name}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
