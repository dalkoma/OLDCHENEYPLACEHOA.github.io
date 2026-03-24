import { useState } from 'react'
import { colors, loadState, saveState } from '../App'

export default function Tasks({ user, addMemory, R }) {
  const [tasks, setTasks] = useState(() => loadState('tasks', []))
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState('all')
  const [newTask, setNewTask] = useState({ title: '', priority: 'medium', assignee: '', dueDate: '', recurring: false, category: 'personal' })

  const save = (t) => { setTasks(t); saveState('tasks', t) }

  const addTask = () => {
    if (!newTask.title.trim()) return
    const task = { ...newTask, id: Date.now(), completed: false, createdAt: new Date().toISOString() }
    save([task, ...tasks])
    addMemory(`Added task: ${newTask.title}${newTask.assignee ? ` (assigned to ${newTask.assignee})` : ''}`)
    setNewTask({ title: '', priority: 'medium', assignee: '', dueDate: '', recurring: false, category: 'personal' })
    setShowAdd(false)
  }

  const toggle = (id) => { save(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)) }
  const deleteTask = (id) => { save(tasks.filter(t => t.id !== id)) }

  const filtered = tasks.filter(t => {
    if (filter === 'pending') return !t.completed
    if (filter === 'completed') return t.completed
    if (filter === 'delegated') return !!t.assignee
    return true
  })

  const pendingCount = tasks.filter(t => !t.completed).length
  const completedCount = tasks.filter(t => t.completed).length
  const priorityColors = { high: colors.danger, medium: colors.warning, low: colors.success }

  return (
    <div style={{ padding: R.sp(16) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: R.sp(16) }}>
        <h2 style={{ color: colors.text, fontSize: R.fs(20), fontWeight: 700 }}>Tasks</h2>
        <button onClick={() => setShowAdd(true)} style={{
          padding: `${R.sp(8)}px ${R.sp(16)}px`, background: colors.gradient1, color: '#fff',
          border: 'none', borderRadius: 8, fontSize: R.fs(13), fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          minHeight: R.minTouchTarget,
        }}>+ Task</button>
      </div>

      <div style={{ display: 'flex', gap: R.sp(8), marginBottom: R.sp(16) }}>
        {[
          [pendingCount, 'Pending', colors.warning],
          [completedCount, 'Done', colors.success],
          [tasks.filter(t => !!t.assignee).length, 'Delegated', colors.primary],
        ].map(([n, l, c]) => (
          <div key={l} style={{
            flex: 1, padding: `${R.sp(12)}px ${R.sp(8)}px`, background: `${c}15`, border: `1px solid ${c}30`,
            borderRadius: 10, textAlign: 'center',
          }}>
            <div style={{ color: c, fontSize: R.fs(20), fontWeight: 700 }}>{n}</div>
            <div style={{ color: colors.textSecondary, fontSize: R.fs(10) }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: R.sp(6), marginBottom: R.sp(16), overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {['all', 'pending', 'completed', 'delegated'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: `${R.sp(6)}px ${R.sp(14)}px`, background: filter === f ? colors.primary : colors.surfaceLight,
            border: `${R.borderWidth}px solid ${filter === f ? colors.primary : colors.border}`,
            borderRadius: 20, color: filter === f ? '#fff' : colors.textSecondary,
            fontSize: R.fs(12), cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
            textTransform: 'capitalize', minHeight: R.minTouchTarget,
          }}>{f}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: R.sp(40), textAlign: 'center', color: colors.textMuted, fontSize: R.fs(13) }}>
          {filter === 'all' ? 'No tasks yet. Tap "+ Task" to create one.' : `No ${filter} tasks.`}
        </div>
      ) : (
        filtered.map(t => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: R.sp(12), padding: R.sp(14),
            background: colors.surfaceLight, border: `${R.borderWidth}px solid ${colors.border}`,
            borderRadius: 10, marginBottom: 8, opacity: t.completed ? 0.6 : 1,
          }}>
            <button onClick={() => toggle(t.id)} style={{
              width: R.sp(22), height: R.sp(22), minWidth: R.sp(22), borderRadius: 6, flexShrink: 0, marginTop: 1,
              background: t.completed ? colors.success : 'transparent',
              border: `2px solid ${t.completed ? colors.success : colors.textMuted}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: R.fs(12),
            }}>
              {t.completed && '✓'}
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ color: colors.text, fontSize: R.fs(14), fontWeight: 500, textDecoration: t.completed ? 'line-through' : 'none' }}>{t.title}</div>
              <div style={{ display: 'flex', gap: R.sp(6), marginTop: R.sp(6), flexWrap: 'wrap' }}>
                <span style={{ fontSize: R.fs(10), padding: '2px 6px', borderRadius: 6, background: `${priorityColors[t.priority]}22`, color: priorityColors[t.priority] }}>{t.priority}</span>
                <span style={{ fontSize: R.fs(10), padding: '2px 6px', borderRadius: 6, background: `${colors.primary}22`, color: colors.primaryLight }}>{t.category}</span>
                {t.assignee && <span style={{ fontSize: R.fs(10), padding: '2px 6px', borderRadius: 6, background: `${colors.secondary}22`, color: colors.secondary }}>→ {t.assignee}</span>}
                {t.dueDate && <span style={{ fontSize: R.fs(10), padding: '2px 6px', borderRadius: 6, background: `${colors.warning}22`, color: colors.warning }}>{t.dueDate}</span>}
                {t.recurring && <span style={{ fontSize: R.fs(10), padding: '2px 6px', borderRadius: 6, background: `${colors.accent}22`, color: colors.accent }}>↻ Recurring</span>}
              </div>
            </div>
            <button onClick={() => deleteTask(t.id)} style={{
              background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: R.fs(14), padding: 4,
              minWidth: R.minTouchTarget, minHeight: R.minTouchTarget,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
          </div>
        ))
      )}

      <div style={{
        marginTop: R.sp(16), padding: R.sp(14), background: `${colors.secondary}10`, border: `1px solid ${colors.secondary}25`,
        borderRadius: 10, display: 'flex', gap: R.sp(10), alignItems: 'flex-start',
      }}>
        <span style={{ color: colors.secondary, fontSize: R.fs(16), flexShrink: 0 }}>⊶</span>
        <div>
          <div style={{ color: colors.secondary, fontSize: R.fs(11), fontWeight: 600 }}>DELEGATION</div>
          <div style={{ color: colors.textSecondary, fontSize: R.fs(12), marginTop: 2 }}>
            Assign tasks to circle members. They'll get notified via SMS even if they don't use the app.
          </div>
        </div>
      </div>

      {showAdd && (
        <div style={modalOverlay(R)} onClick={() => setShowAdd(false)}>
          <div style={modalContent(R)} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: colors.text, fontSize: R.fs(18), fontWeight: 600, marginBottom: R.sp(16) }}>New Task</h3>
            <input value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="What needs to be done?" style={formInput(R)} autoFocus />
            <div style={{ display: 'flex', gap: R.sp(8) }}>
              <select value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })} style={{ ...formInput(R), flex: 1 }}>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <select value={newTask.category} onChange={e => setNewTask({ ...newTask, category: e.target.value })} style={{ ...formInput(R), flex: 1 }}>
                <option value="personal">Personal</option>
                <option value="work">Work</option>
                <option value="family">Family</option>
                <option value="home">Home</option>
              </select>
            </div>
            <input value={newTask.assignee} onChange={e => setNewTask({ ...newTask, assignee: e.target.value })}
              placeholder="Assign to (name or phone)" style={formInput(R)} />
            <input type="date" value={newTask.dueDate} onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
              style={formInput(R)} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: colors.textSecondary, fontSize: R.fs(13), marginBottom: R.sp(12), cursor: 'pointer' }}>
              <input type="checkbox" checked={newTask.recurring} onChange={e => setNewTask({ ...newTask, recurring: e.target.checked })} />
              Recurring task
            </label>
            <div style={{ display: 'flex', gap: R.sp(8) }}>
              <button onClick={() => setShowAdd(false)} style={{ ...actionBtn(R), background: colors.surfaceLight, color: colors.textSecondary }}>Cancel</button>
              <button onClick={addTask} style={{ ...actionBtn(R), background: colors.gradient1, color: '#fff' }}>Add Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

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
