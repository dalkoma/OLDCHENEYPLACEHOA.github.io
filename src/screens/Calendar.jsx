import { useState, useMemo } from 'react'
import { colors, loadState, saveState } from '../App'
import { HudIcon } from '../components/HudReactor'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function Calendar({ user, addMemory, R }) {
  const [events, setEvents] = useState(() => loadState('events', []))
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showAdd, setShowAdd] = useState(false)
  const [newEvent, setNewEvent] = useState({ title: '', time: '09:00', location: '', calendar: 'personal', color: colors.primary })
  const [view, setView] = useState('month')

  const save = (evts) => { setEvents(evts); saveState('events', evts) }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = new Date().toISOString().split('T')[0]

  const calendarDays = useMemo(() => {
    const days = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(d)
    return days
  }, [firstDay, daysInMonth])

  const dayEvents = useMemo(() => {
    return events.filter(e => e.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time))
  }, [events, selectedDate])

  const addEvent = () => {
    if (!newEvent.title.trim()) return
    const evt = { ...newEvent, id: Date.now(), date: selectedDate }
    save([...events, evt])
    addMemory(`Added event: ${newEvent.title} on ${selectedDate}`)
    setNewEvent({ title: '', time: '09:00', location: '', calendar: 'personal', color: colors.primary })
    setShowAdd(false)
  }

  const deleteEvent = (id) => { save(events.filter(e => e.id !== id)) }
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const getDateStr = (day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const hasEvents = (day) => events.some(e => e.date === getDateStr(day))
  const calColors = [colors.primary, colors.secondary, colors.accent, colors.warning, colors.success]

  return (
    <div style={{ padding: R.sp(16) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: R.sp(16) }}>
        <h2 style={{ color: colors.text, fontSize: R.fs(20), fontWeight: 700 }}>Calendar</h2>
        <div style={{ display: 'flex', gap: R.sp(8) }}>
          <button onClick={() => setView(view === 'month' ? 'week' : 'month')} style={smallBtn(R)}>
            {view === 'month' ? 'Week' : 'Month'}
          </button>
          <button onClick={() => setShowAdd(true)} style={{ ...smallBtn(R), background: colors.gradient1, color: '#fff' }}>+ Event</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: R.sp(8), marginBottom: R.sp(16), flexWrap: 'wrap' }}>
        {['Personal', 'Work', 'Family', 'School'].map((cal, i) => (
          <span key={cal} style={{
            padding: `${R.sp(4)}px ${R.sp(10)}px`, borderRadius: R.sp(12), fontSize: R.fs(11),
            background: `${calColors[i]}22`, color: calColors[i], border: `${R.borderWidth}px solid ${calColors[i]}44`,
          }}>{cal}</span>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: R.sp(12) }}>
        <button onClick={prevMonth} aria-label="Previous month" style={navBtn(R)}>‹</button>
        <span style={{ color: colors.text, fontSize: R.fs(16), fontWeight: 600 }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} aria-label="Next month" style={navBtn(R)}>›</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: R.sp(2), marginBottom: R.sp(4) }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', color: colors.textMuted, fontSize: R.fs(11), padding: R.sp(4) }}>{d}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: R.sp(2), marginBottom: R.sp(20) }}>
        {calendarDays.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />
          const dateStr = getDateStr(day)
          const isToday = dateStr === todayStr
          const isSelected = dateStr === selectedDate
          const has = hasEvents(day)
          return (
            <button
              key={i}
              onClick={() => setSelectedDate(dateStr)}
              style={{
                padding: `${R.sp(8)}px 0`, background: isSelected ? colors.primary : 'transparent',
                border: isToday && !isSelected ? `1px solid ${colors.primary}` : `1px solid transparent`,
                borderRadius: 8, color: isSelected ? '#fff' : colors.text,
                fontSize: R.fs(13), cursor: 'pointer', position: 'relative',
                minHeight: R.minTouchTarget,
              }}
            >
              {day}
              {has && (
                <span style={{
                  position: 'absolute', bottom: R.sp(2), left: '50%', transform: 'translateX(-50%)',
                  width: R.sp(4), height: R.sp(4), borderRadius: '50%', background: isSelected ? '#fff' : colors.accent,
                }} />
              )}
            </button>
          )
        })}
      </div>

      <div style={{ marginBottom: R.sp(16) }}>
        <h3 style={{ color: colors.text, fontSize: R.fs(14), fontWeight: 600, marginBottom: R.sp(12) }}>
          {selectedDate === todayStr ? 'Today' : new Date(selectedDate + 'T12:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </h3>
        {dayEvents.length === 0 ? (
          <div style={{ padding: R.sp(24), textAlign: 'center', color: colors.textMuted, fontSize: R.fs(13) }}>
            No events. Tap "+ Event" to add one.
          </div>
        ) : (
          dayEvents.map(e => (
            <div key={e.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: R.sp(12), padding: R.sp(14),
              background: colors.surfaceLight, border: `${R.borderWidth}px solid ${colors.border}`,
              borderRadius: R.sp(10), marginBottom: R.sp(8), borderLeft: `3px solid ${e.color || colors.primary}`,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: colors.text, fontSize: R.fs(14), fontWeight: 500 }}>{e.title}</div>
                <div style={{ color: colors.primaryLight, fontSize: R.fs(12), marginTop: R.sp(2) }}>{e.time}</div>
                {e.location && <div style={{ color: colors.textSecondary, fontSize: R.fs(12), marginTop: R.sp(2) }}>{e.location}</div>}
                <div style={{ marginTop: R.sp(4) }}>
                  <span style={{ fontSize: R.fs(10), padding: `${R.sp(2)}px ${R.sp(6)}px`, borderRadius: R.sp(8), background: `${colors.primary}22`, color: colors.primaryLight }}>{e.calendar}</span>
                </div>
              </div>
              <button onClick={() => deleteEvent(e.id)} aria-label={`Delete event ${e.title}`} style={{
                background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: R.fs(16),
                minWidth: R.minTouchTarget, minHeight: R.minTouchTarget,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
            </div>
          ))
        )}
      </div>

      <div style={{
        padding: R.sp(14), background: `${colors.primary}10`, border: `${R.borderWidth}px solid ${colors.primary}25`,
        borderRadius: R.sp(10), display: 'flex', gap: R.sp(10), alignItems: 'center',
      }}>
        <HudIcon size={R.fs(16)} />
        <div>
          <div style={{ color: colors.primaryLight, fontSize: R.fs(11), fontWeight: 600 }}>SMART SUGGESTION</div>
          <div style={{ color: colors.textSecondary, fontSize: R.fs(12), marginTop: R.sp(2) }}>
            {dayEvents.length > 2 ? "Busy day! Consider blocking time for breaks." : "Looks manageable. Want me to find time for a focus block?"}
          </div>
        </div>
      </div>

      {showAdd && (
        <div style={modalOverlay(R)} onClick={() => setShowAdd(false)}>
          <div style={modalContent(R)} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: colors.text, fontSize: R.fs(18), fontWeight: 600, marginBottom: R.sp(16) }}>New Event</h3>
            <input value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
              placeholder="Event title" style={formInput(R)} autoFocus />
            <div style={{ display: 'flex', gap: R.sp(8) }}>
              <input type="time" value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                style={{ ...formInput(R), flex: 1 }} />
              <select value={newEvent.calendar} onChange={e => { const idx = ['personal', 'work', 'family', 'school'].indexOf(e.target.value); setNewEvent({ ...newEvent, calendar: e.target.value, color: idx >= 0 ? calColors[idx] : colors.primary }) }}
                style={{ ...formInput(R), flex: 1 }}>
                <option value="personal">Personal</option>
                <option value="work">Work</option>
                <option value="family">Family</option>
                <option value="school">School</option>
              </select>
            </div>
            <input value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
              placeholder="Location (optional)" style={formInput(R)} />
            <div style={{ display: 'flex', gap: R.sp(8), marginTop: R.sp(8) }}>
              <button onClick={() => setShowAdd(false)} style={{ ...actionBtn(R), background: colors.surfaceLight, color: colors.textSecondary }}>Cancel</button>
              <button onClick={addEvent} style={{ ...actionBtn(R), background: colors.gradient1, color: '#fff' }}>Add Event</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const smallBtn = (R) => ({
  padding: `${R.sp(6)}px ${R.sp(14)}px`, background: colors.surfaceLight, border: `${R.borderWidth}px solid ${colors.border}`,
  borderRadius: 8, color: colors.textSecondary, fontSize: R.fs(12), cursor: 'pointer', fontFamily: 'inherit',
  minHeight: R.minTouchTarget,
})
const navBtn = (R) => ({
  background: 'none', border: 'none', color: colors.text, fontSize: R.fs(22), cursor: 'pointer', padding: `${R.sp(4)}px ${R.sp(12)}px`,
  minWidth: R.minTouchTarget, minHeight: R.minTouchTarget,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
})
const modalOverlay = (R) => ({
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: R.sp(20),
})
const modalContent = (R) => ({
  background: colors.surface, borderRadius: 16, padding: R.sp(24), width: '100%', maxWidth: R.modalMaxWidth,
  border: `${R.borderWidth}px solid ${colors.border}`,
})
const formInput = (R) => ({
  width: '100%', padding: `${R.sp(12)}px ${R.sp(14)}px`, background: colors.surfaceLight,
  border: `${R.borderWidth}px solid ${colors.border}`, borderRadius: 10, color: colors.text,
  fontSize: R.fs(14), fontFamily: 'inherit', marginBottom: R.sp(10), minHeight: R.minTouchTarget,
})
const actionBtn = (R) => ({
  flex: 1, padding: `${R.sp(12)}px ${R.sp(16)}px`, border: 'none', borderRadius: 10,
  fontSize: R.fs(14), fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minHeight: R.minTouchTarget,
})
