import { useState } from 'react'
import { colors, loadState, saveState } from '../App'

export default function Settings({ user, updateUser, addMemory, R }) {
  const [editName, setEditName] = useState(false)
  const [name, setName] = useState(user.name)
  const [showMemory, setShowMemory] = useState(false)
  const [showCircle, setShowCircle] = useState(false)
  const [newMember, setNewMember] = useState({ name: '', phone: '', role: 'family' })
  const [briefingTime, setBriefingTime] = useState(() => loadState('briefingTime', '07:00'))
  const [briefingDays, setBriefingDays] = useState(() => loadState('briefingDays', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']))

  const saveName = () => {
    updateUser({ name: name || 'Friend' })
    setEditName(false)
    addMemory(`Changed name to ${name}`)
  }

  const toggleIntegration = (key) => {
    updateUser({
      integrations: { ...user.integrations, [key]: !user.integrations[key] },
    })
  }

  const addCircleMember = () => {
    if (!newMember.name.trim()) return
    updateUser({ circle: [...user.circle, { ...newMember, id: Date.now() }] })
    addMemory(`Added ${newMember.name} to circle`)
    setNewMember({ name: '', phone: '', role: 'family' })
  }

  const removeCircleMember = (id) => {
    updateUser({ circle: user.circle.filter(m => m.id !== id) })
  }

  const clearAllData = () => {
    if (confirm('This will delete all your data. Are you sure?')) {
      localStorage.clear()
      window.location.reload()
    }
  }

  const integrations = [
    { key: 'google', name: 'Google Calendar', desc: 'Sync events from Google', icon: '📅' },
    { key: 'apple', name: 'Apple Calendar', desc: 'Sync iCloud Calendar', icon: '🍎' },
    { key: 'outlook', name: 'Outlook', desc: 'Microsoft calendar & email', icon: '📧' },
    { key: 'slack', name: 'Slack', desc: 'Workspace messaging', icon: '⊶' },
    { key: 'whatsapp', name: 'WhatsApp', desc: 'Chat messaging', icon: '📱' },
    { key: 'instacart', name: 'Instacart', desc: 'Grocery delivery', icon: '🛒' },
  ]

  const inputStyle = {
    padding: `${R.sp(8)}px ${R.sp(10)}px`, background: colors.surfaceHover,
    border: `${R.borderWidth}px solid ${colors.border}`, borderRadius: R.sp(8), color: colors.text,
    fontSize: R.fs(13), fontFamily: 'inherit', marginBottom: 0, minHeight: R.minTouchTarget,
  }

  const smBtn = {
    padding: `${R.sp(8)}px ${R.sp(14)}px`, background: colors.primary, color: '#fff',
    border: 'none', borderRadius: R.sp(8), fontSize: R.fs(12), cursor: 'pointer', fontFamily: 'inherit',
    whiteSpace: 'nowrap', minHeight: R.minTouchTarget,
  }

  return (
    <div style={{ padding: R.sp(16) }}>
      <h2 style={{ color: colors.text, fontSize: R.fs(20), fontWeight: 700, marginBottom: R.sp(20) }}>Settings</h2>

      {/* Profile */}
      <Section title="PROFILE" R={R}>
        <div style={{ display: 'flex', alignItems: 'center', gap: R.sp(14), padding: R.sp(14) }}>
          <div style={{
            width: R.sp(48), height: R.sp(48), borderRadius: '50%', background: colors.gradient1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: R.fs(20), fontWeight: 700,
          }}>{(user.name || 'U')[0].toUpperCase()}</div>
          <div style={{ flex: 1 }}>
            {editName ? (
              <div style={{ display: 'flex', gap: R.sp(8) }}>
                <input value={name} onChange={e => setName(e.target.value)} style={{ ...inputStyle, marginBottom: 0, flex: 1 }} autoFocus
                  onKeyDown={e => e.key === 'Enter' && saveName()} />
                <button onClick={saveName} style={smBtn}>Save</button>
              </div>
            ) : (
              <>
                <div style={{ color: colors.text, fontSize: R.fs(16), fontWeight: 600 }}>{user.name}</div>
                <button onClick={() => setEditName(true)} style={{ background: 'none', border: 'none', color: colors.primaryLight, fontSize: R.fs(12), cursor: 'pointer', minHeight: R.minTouchTarget }}>
                  Edit name
                </button>
              </>
            )}
          </div>
        </div>
      </Section>

      {/* Circle / Family */}
      <Section title="YOUR CIRCLE" R={R}>
        <div style={{ padding: `${R.sp(8)}px ${R.sp(14)}px` }}>
          <p style={{ color: colors.textSecondary, fontSize: R.fs(12), marginBottom: R.sp(12) }}>
            Add people to delegate tasks and share calendars. They get notified via SMS.
          </p>
          {user.circle.map(member => (
            <div key={member.id} style={{
              display: 'flex', alignItems: 'center', gap: R.sp(10), padding: `${R.sp(8)}px 0`,
              borderBottom: `${R.borderWidth}px solid ${colors.border}`,
            }}>
              <div style={{
                width: R.sp(32), height: R.sp(32), borderRadius: '50%', background: `${colors.secondary}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: colors.secondary, fontSize: R.fs(14), fontWeight: 600,
              }}>{(member.name || '?')[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: colors.text, fontSize: R.fs(13) }}>{member.name}</div>
                <div style={{ color: colors.textMuted, fontSize: R.fs(11) }}>{member.phone} · {member.role}</div>
              </div>
              <button onClick={() => removeCircleMember(member.id)} aria-label={`Remove ${member.name}`} style={{
                background: 'none', border: 'none', color: colors.textMuted, fontSize: R.fs(14), cursor: 'pointer', minHeight: R.minTouchTarget,
              }}>✕</button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: R.sp(6), marginTop: R.sp(10) }}>
            <input value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value })}
              placeholder="Name" style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
            <input value={newMember.phone} onChange={e => setNewMember({ ...newMember, phone: e.target.value })}
              placeholder="Phone" style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
            <button onClick={addCircleMember} style={smBtn}>Add</button>
          </div>
        </div>
      </Section>

      {/* Morning Briefing */}
      <Section title="MORNING BRIEFING" R={R}>
        <div style={{ padding: `${R.sp(10)}px ${R.sp(14)}px` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: R.sp(10), marginBottom: R.sp(10) }}>
            <span style={{ color: colors.textSecondary, fontSize: R.fs(13) }}>Time:</span>
            <input type="time" value={briefingTime} onChange={e => { setBriefingTime(e.target.value); saveState('briefingTime', e.target.value) }}
              style={{ ...inputStyle, marginBottom: 0, width: 'auto' }} />
          </div>
          <div style={{ display: 'flex', gap: R.sp(4), flexWrap: 'wrap' }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <button key={day} onClick={() => {
                const updated = briefingDays.includes(day) ? briefingDays.filter(d => d !== day) : [...briefingDays, day]
                setBriefingDays(updated)
                saveState('briefingDays', updated)
              }} style={{
                padding: `${R.sp(6)}px ${R.sp(10)}px`, borderRadius: R.sp(6),
                background: briefingDays.includes(day) ? colors.primary : colors.surfaceLight,
                border: `${R.borderWidth}px solid ${briefingDays.includes(day) ? colors.primary : colors.border}`,
                color: briefingDays.includes(day) ? '#fff' : colors.textSecondary,
                fontSize: R.fs(11), cursor: 'pointer', fontFamily: 'inherit', minHeight: R.minTouchTarget,
              }}>{day}</button>
            ))}
          </div>
        </div>
      </Section>

      {/* Integrations */}
      <Section title="INTEGRATIONS" R={R}>
        {integrations.map(int => (
          <div key={int.key} style={{
            display: 'flex', alignItems: 'center', gap: R.sp(12), padding: `${R.sp(12)}px ${R.sp(14)}px`,
            borderBottom: `${R.borderWidth}px solid ${colors.border}`,
          }}>
            <span style={{ fontSize: R.fs(18) }}>{int.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: colors.text, fontSize: R.fs(13) }}>{int.name}</div>
              <div style={{ color: colors.textMuted, fontSize: R.fs(11) }}>{int.desc}</div>
            </div>
            <button onClick={() => toggleIntegration(int.key)} aria-label={`Toggle ${int.name}`} aria-pressed={!!user.integrations?.[int.key]} style={{
              width: R.sp(44), height: R.sp(24), borderRadius: R.sp(12), border: 'none', cursor: 'pointer',
              background: user.integrations?.[int.key] ? colors.success : colors.surfaceHover,
              position: 'relative', transition: 'background 0.2s', minHeight: R.minTouchTarget,
            }}>
              <span style={{
                position: 'absolute', top: R.sp(2), left: user.integrations?.[int.key] ? R.sp(22) : R.sp(2),
                width: R.sp(20), height: R.sp(20), borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s',
              }} />
            </button>
          </div>
        ))}
      </Section>

      {/* AI Memory */}
      <Section title="AI MEMORY" R={R}>
        <div style={{ padding: `${R.sp(10)}px ${R.sp(14)}px` }}>
          <p style={{ color: colors.textSecondary, fontSize: R.fs(12), marginBottom: R.sp(10) }}>
            Jarvis learns your preferences and routines over time. {user.memory.length} memories stored.
          </p>
          <button onClick={() => setShowMemory(!showMemory)} style={{
            background: 'none', border: `${R.borderWidth}px solid ${colors.border}`, borderRadius: R.sp(8),
            padding: `${R.sp(6)}px ${R.sp(14)}px`, color: colors.primaryLight, fontSize: R.fs(12), cursor: 'pointer', fontFamily: 'inherit',
            minHeight: R.minTouchTarget,
          }}>
            {showMemory ? 'Hide' : 'View'} Memories
          </button>
          {showMemory && (
            <div style={{ marginTop: R.sp(10), maxHeight: R.sp(200), overflowY: 'auto' }}>
              {user.memory.length === 0 ? (
                <div style={{ color: colors.textMuted, fontSize: R.fs(12) }}>No memories yet. Use the app and I'll learn!</div>
              ) : (
                user.memory.map((m, i) => (
                  <div key={i} style={{
                    padding: `${R.sp(6)}px 0`, borderBottom: `${R.borderWidth}px solid ${colors.border}`,
                    fontSize: R.fs(11), color: colors.textSecondary,
                  }}>
                    <span style={{ color: colors.textMuted }}>{m.date ? new Date(m.date).toLocaleDateString() : ''}</span>
                    {' '}{m.text}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </Section>

      {/* Danger Zone */}
      <Section title="DATA" R={R}>
        <div style={{ padding: `${R.sp(10)}px ${R.sp(14)}px` }}>
          <button onClick={clearAllData} style={{
            width: '100%', padding: R.sp(12), background: 'transparent',
            border: `${R.borderWidth}px solid ${colors.danger}40`, borderRadius: R.sp(8),
            color: colors.danger, fontSize: R.fs(13), cursor: 'pointer', fontFamily: 'inherit',
            minHeight: R.minTouchTarget,
          }}>Reset All Data</button>
        </div>
      </Section>

      {/* About */}
      <div style={{ textAlign: 'center', padding: `${R.sp(24)}px 0 ${R.sp(40)}px`, color: colors.textMuted, fontSize: R.fs(11) }}>
        <div style={{ marginBottom: R.sp(4) }}>Jarvis v1.0</div>
        <div>Your Personal AI Life Manager</div>
        <div style={{ marginTop: R.sp(4) }}>Your AI, your way.</div>
      </div>
    </div>
  )
}

function Section({ title, children, R }) {
  return (
    <div style={{
      background: colors.surfaceLight, border: `${R.borderWidth}px solid ${colors.border}`,
      borderRadius: R.sp(12), marginBottom: R.sp(12), overflow: 'hidden',
    }}>
      <div style={{ padding: `${R.sp(10)}px ${R.sp(14)}px`, borderBottom: `${R.borderWidth}px solid ${colors.border}` }}>
        <h3 style={{ color: colors.textSecondary, fontSize: R.fs(11), fontWeight: 600, letterSpacing: 0.5 }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}
