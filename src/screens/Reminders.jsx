import { useState } from 'react'
import { colors, loadState, saveState } from '../App'

const modalOverlay = (R) => ({
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: R.sp(20),
})
const modalContent = (R) => ({
  background: colors.surface, borderRadius: R.sp(16), padding: R.sp(24), width: '100%', maxWidth: R.modalMaxWidth,
  border: `${R.borderWidth}px solid ${colors.border}`,
})

export default function Reminders({ user, addMemory, R }) {
  const [reminders, setReminders] = useState(() => loadState('reminders', []))
  const [showAdd, setShowAdd] = useState(false)
  const [newReminder, setNewReminder] = useState({ text: '', date: '', time: '09:00', repeat: 'none', priority: 'normal' })

  const save = (r) => { setReminders(r); saveState('reminders', r) }

  const addReminder = () => {
    if (!newReminder.text.trim()) return
    const reminder = { ...newReminder, id: Date.now(), dismissed: false, createdAt: new Date().toISOString() }
    save([reminder, ...reminders])
    addMemory(`Set reminder: ${newReminder.text}`)
    setNewReminder({ text: '', date: '', time: '09:00', repeat: 'none', priority: 'normal' })
    setShowAdd(false)
  }

  const dismiss = (id) => {
    save(reminders.map(r => r.id === id ? { ...r, dismissed: true } : r))
  }

  const deleteReminder = (id) => {
    save(reminders.filter(r => r.id !== id))
  }

  const active = reminders.filter(r => !r.dismissed)
  const dismissed = reminders.filter(r => r.dismissed)

  const iconBtn = {
    width: R.minTouchTarget, height: R.minTouchTarget, borderRadius: R.sp(6), background: `${colors.success}15`,
    border: 'none', color: colors.success, fontSize: R.fs(12), cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
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
        <h2 style={{ color: colors.text, fontSize: R.fs(20), fontWeight: 700 }}>Reminders</h2>
        <button onClick={() => setShowAdd(true)} style={{
          padding: `${R.sp(8)}px ${R.sp(16)}px`, background: colors.gradient1, color: '#fff',
          border: 'none', borderRadius: R.sp(8), fontSize: R.fs(13), fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          minHeight: R.minTouchTarget,
        }}>+ Reminder</button>
      </div>

      {/* Smart Reminders Info */}
      <div style={{
        padding: R.sp(14), background: `${colors.warning}10`, border: `${R.borderWidth}px solid ${colors.warning}25`,
        borderRadius: R.sp(12), marginBottom: R.sp(16), display: 'flex', gap: R.sp(10), alignItems: 'flex-start',
      }}>
        <span style={{ color: colors.warning, fontSize: R.fs(18) }}>◉</span>
        <div>
          <div style={{ color: colors.warning, fontSize: R.fs(11), fontWeight: 600 }}>SMART REMINDERS</div>
          <div style={{ color: colors.textSecondary, fontSize: R.fs(12), marginTop: R.sp(2) }}>
            Jarvis nudges you before things become urgent, sends day-of prompts, and follows up on lingering items.
          </div>
        </div>
      </div>

      {/* Active Reminders */}
      <h3 style={{ color: colors.text, fontSize: R.fs(14), fontWeight: 600, marginBottom: R.sp(10) }}>
        ACTIVE ({active.length})
      </h3>
      {active.length === 0 ? (
        <div style={{ padding: R.sp(30), textAlign: 'center', color: colors.textMuted, fontSize: R.fs(13) }}>
          No active reminders. Set one to get nudged at the right time.
        </div>
      ) : (
        active.map(r => (
          <div key={r.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: R.sp(12), padding: R.sp(14),
            background: colors.surfaceLight, border: `${R.borderWidth}px solid ${colors.border}`,
            borderRadius: R.sp(10), marginBottom: R.sp(8),
            borderLeft: `3px solid ${r.priority === 'urgent' ? colors.danger : r.priority === 'important' ? colors.warning : colors.primary}`,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: colors.text, fontSize: R.fs(14), fontWeight: 500 }}>{r.text}</div>
              <div style={{ display: 'flex', gap: R.sp(8), marginTop: R.sp(6), flexWrap: 'wrap' }}>
                {r.date && <span style={{ fontSize: R.fs(11), color: colors.primaryLight }}>{r.date}</span>}
                <span style={{ fontSize: R.fs(11), color: colors.textSecondary }}>{r.time}</span>
                {r.repeat !== 'none' && (
                  <span style={{
                    fontSize: R.fs(10), padding: `${R.sp(1)}px ${R.sp(6)}px`, borderRadius: R.sp(6),
                    background: `${colors.secondary}22`, color: colors.secondary,
                  }}>↻ {r.repeat}</span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: R.sp(4) }}>
              <button onClick={() => dismiss(r.id)} style={iconBtn} title="Dismiss">✓</button>
              <button onClick={() => deleteReminder(r.id)} style={{ ...iconBtn, color: colors.danger }}>✕</button>
            </div>
          </div>
        ))
      )}

      {/* Dismissed */}
      {dismissed.length > 0 && (
        <div style={{ marginTop: R.sp(20) }}>
          <h3 style={{ color: colors.textMuted, fontSize: R.fs(14), fontWeight: 600, marginBottom: R.sp(10) }}>
            DISMISSED ({dismissed.length})
          </h3>
          {dismissed.slice(0, 5).map(r => (
            <div key={r.id} style={{
              padding: R.sp(10), background: colors.surfaceLight, border: `${R.borderWidth}px solid ${colors.border}`,
              borderRadius: R.sp(8), marginBottom: R.sp(6), opacity: 0.5,
            }}>
              <div style={{ color: colors.text, fontSize: R.fs(13), textDecoration: 'line-through' }}>{r.text}</div>
            </div>
          ))}
        </div>
      )}

      {/* Add Reminder Modal */}
      {showAdd && (
        <div style={modalOverlay(R)} onClick={() => setShowAdd(false)}>
          <div style={modalContent(R)} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: colors.text, fontSize: R.fs(18), fontWeight: 600, marginBottom: R.sp(16) }}>New Reminder</h3>
            <input
              value={newReminder.text}
              onChange={e => setNewReminder({ ...newReminder, text: e.target.value })}
              placeholder="What do you want to remember?"
              style={inputStyle}
              autoFocus
            />
            <div style={{ display: 'flex', gap: R.sp(8) }}>
              <input type="date" value={newReminder.date}
                onChange={e => setNewReminder({ ...newReminder, date: e.target.value })}
                style={{ ...inputStyle, flex: 1 }} />
              <input type="time" value={newReminder.time}
                onChange={e => setNewReminder({ ...newReminder, time: e.target.value })}
                style={{ ...inputStyle, flex: 1 }} />
            </div>
            <div style={{ display: 'flex', gap: R.sp(8) }}>
              <select value={newReminder.repeat} onChange={e => setNewReminder({ ...newReminder, repeat: e.target.value })} style={{ ...inputStyle, flex: 1 }}>
                <option value="none">No repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <select value={newReminder.priority} onChange={e => setNewReminder({ ...newReminder, priority: e.target.value })} style={{ ...inputStyle, flex: 1 }}>
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: R.sp(8), marginTop: R.sp(4) }}>
              <button onClick={() => setShowAdd(false)} style={{ ...actionBtn, background: colors.surfaceLight, color: colors.textSecondary }}>Cancel</button>
              <button onClick={addReminder} style={{ ...actionBtn, background: colors.gradient1, color: '#fff' }}>Set Reminder</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
