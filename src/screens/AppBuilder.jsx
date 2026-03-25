import { useState } from 'react'
import { colors, loadState, saveState } from '../App'

const TEMPLATES = [
  {
    name: 'Expense Tracker',
    icon: '💰',
    desc: 'Track spending and budgets',
    fields: [
      { label: 'Amount', type: 'number' },
      { label: 'Category', type: 'select', options: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other'] },
      { label: 'Description', type: 'text' },
      { label: 'Date', type: 'date' },
    ],
  },
  {
    name: 'Habit Tracker',
    icon: '✅',
    desc: 'Build and track daily habits',
    fields: [
      { label: 'Habit Name', type: 'text' },
      { label: 'Frequency', type: 'select', options: ['Daily', 'Weekdays', 'Weekly', 'Custom'] },
      { label: 'Time of Day', type: 'select', options: ['Morning', 'Afternoon', 'Evening', 'Anytime'] },
    ],
  },
  {
    name: 'Workout Log',
    icon: '💪',
    desc: 'Log exercises and progress',
    fields: [
      { label: 'Exercise', type: 'text' },
      { label: 'Sets', type: 'number' },
      { label: 'Reps', type: 'number' },
      { label: 'Weight (lbs)', type: 'number' },
      { label: 'Notes', type: 'text' },
    ],
  },
  {
    name: 'Reading List',
    icon: '📚',
    desc: 'Track books and reading progress',
    fields: [
      { label: 'Title', type: 'text' },
      { label: 'Author', type: 'text' },
      { label: 'Status', type: 'select', options: ['Want to Read', 'Reading', 'Finished'] },
      { label: 'Rating', type: 'select', options: ['1', '2', '3', '4', '5'] },
    ],
  },
  {
    name: 'Pet Care',
    icon: '🐕',
    desc: 'Track pet care and vet visits',
    fields: [
      { label: 'Pet Name', type: 'text' },
      { label: 'Activity', type: 'select', options: ['Feeding', 'Walk', 'Vet Visit', 'Grooming', 'Medicine'] },
      { label: 'Notes', type: 'text' },
      { label: 'Date', type: 'date' },
    ],
  },
  {
    name: 'Custom App',
    icon: '⬡',
    desc: 'Build anything you want with AI',
    fields: [],
  },
]

export default function AppBuilder({ user, addMemory, R }) {
  const [apps, setApps] = useState(() => loadState('customApps', []))
  const [building, setBuilding] = useState(false)
  const [activeApp, setActiveApp] = useState(null)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [appName, setAppName] = useState('')
  const [entries, setEntries] = useState({})

  const save = (a) => { setApps(a); saveState('customApps', a) }

  const createApp = (template) => {
    const app = {
      id: Date.now(),
      name: appName || template.name,
      icon: template.icon,
      fields: template.fields,
      entries: [],
      createdAt: new Date().toISOString(),
    }
    save([app, ...apps])
    setActiveApp(app)
    setBuilding(false)
    setAppName('')
    setSelectedTemplate(null)
    addMemory(`Created app: ${app.name}`)
  }

  const addEntry = (appId) => {
    const app = apps.find(a => a.id === appId)
    if (!app) return
    const entry = { id: Date.now(), data: { ...entries }, createdAt: new Date().toISOString() }
    const updated = apps.map(a => a.id === appId ? { ...a, entries: [entry, ...a.entries] } : a)
    save(updated)
    setActiveApp(updated.find(a => a.id === appId))
    setEntries({})
  }

  const deleteApp = (id) => {
    save(apps.filter(a => a.id !== id))
    setActiveApp(null)
  }

  const inputStyle = {
    width: '100%', padding: `${R.sp(12)}px ${R.sp(14)}px`, background: colors.surfaceLight,
    border: `${R.borderWidth}px solid ${colors.border}`, borderRadius: R.sp(10), color: colors.text,
    fontSize: R.fs(14), fontFamily: 'inherit', marginBottom: R.sp(10), minHeight: R.minTouchTarget,
  }

  const modalOverlay = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: R.sp(20),
  }

  const modalContent = {
    background: colors.surface, borderRadius: R.sp(16), padding: R.sp(24), width: '100%', maxWidth: R.modalMaxWidth,
    border: `${R.borderWidth}px solid ${colors.border}`,
  }

  const actionBtn = {
    flex: 1, padding: `${R.sp(12)}px ${R.sp(16)}px`, border: 'none', borderRadius: R.sp(10),
    fontSize: R.fs(14), fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minHeight: R.minTouchTarget,
  }

  if (activeApp) {
    const app = apps.find(a => a.id === activeApp.id) || activeApp
    return (
      <div style={{ padding: R.sp(16) }}>
        <button onClick={() => setActiveApp(null)} style={{
          background: 'none', border: 'none', color: colors.primaryLight, fontSize: R.fs(13),
          cursor: 'pointer', marginBottom: R.sp(12), fontFamily: 'inherit', minHeight: R.minTouchTarget,
        }}>&#8249; Back to Apps</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: R.sp(10), marginBottom: R.sp(20) }}>
          <span style={{ fontSize: R.fs(28) }}>{app.icon}</span>
          <div>
            <h2 style={{ color: colors.text, fontSize: R.fs(20), fontWeight: 700 }}>{app.name}</h2>
            <span style={{ color: colors.textSecondary, fontSize: R.fs(12) }}>{app.entries.length} entries</span>
          </div>
        </div>

        {/* Add Entry Form */}
        <div style={{
          padding: R.sp(16), background: colors.surfaceLight, border: `${R.borderWidth}px solid ${colors.border}`,
          borderRadius: R.sp(12), marginBottom: R.sp(16),
        }}>
          <h3 style={{ color: colors.text, fontSize: R.fs(14), fontWeight: 600, marginBottom: R.sp(12) }}>ADD ENTRY</h3>
          {app.fields.map(field => (
            <div key={field.label} style={{ marginBottom: R.sp(10) }}>
              <label style={{ color: colors.textSecondary, fontSize: R.fs(11), marginBottom: R.sp(4), display: 'block' }}>{field.label}</label>
              {field.type === 'select' ? (
                <select
                  value={entries[field.label] || ''}
                  onChange={e => setEntries({ ...entries, [field.label]: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">Select...</option>
                  {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input
                  type={field.type}
                  value={entries[field.label] || ''}
                  onChange={e => setEntries({ ...entries, [field.label]: e.target.value })}
                  placeholder={field.label}
                  style={inputStyle}
                />
              )}
            </div>
          ))}
          <button onClick={() => addEntry(app.id)} style={{
            width: '100%', padding: R.sp(12), background: colors.gradient1, color: '#fff',
            border: 'none', borderRadius: R.sp(10), fontSize: R.fs(13), fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            minHeight: R.minTouchTarget,
          }}>Add Entry</button>
        </div>

        {/* Entries List */}
        {app.entries.length > 0 && (
          <div>
            <h3 style={{ color: colors.text, fontSize: R.fs(14), fontWeight: 600, marginBottom: R.sp(10) }}>ENTRIES</h3>
            {app.entries.map(entry => (
              <div key={entry.id} style={{
                padding: R.sp(12), background: colors.surfaceLight, border: `${R.borderWidth}px solid ${colors.border}`,
                borderRadius: R.sp(8), marginBottom: R.sp(6),
              }}>
                {Object.entries(entry.data).filter(([_, v]) => v).map(([key, val]) => (
                  <div key={key} style={{ display: 'flex', gap: R.sp(8), marginBottom: R.sp(2) }}>
                    <span style={{ color: colors.textMuted, fontSize: R.fs(11), minWidth: R.sp(70) }}>{key}:</span>
                    <span style={{ color: colors.text, fontSize: R.fs(12) }}>{val}</span>
                  </div>
                ))}
                <div style={{ color: colors.textMuted, fontSize: R.fs(10), marginTop: R.sp(4) }}>
                  {new Date(entry.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => deleteApp(app.id)} style={{
          width: '100%', padding: R.sp(10), background: 'transparent', border: `${R.borderWidth}px solid ${colors.danger}40`,
          borderRadius: R.sp(8), color: colors.danger, fontSize: R.fs(12), cursor: 'pointer', marginTop: R.sp(20), fontFamily: 'inherit',
          minHeight: R.minTouchTarget,
        }}>Delete App</button>
      </div>
    )
  }

  return (
    <div style={{ padding: R.sp(16) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: R.sp(4) }}>
        <h2 style={{ color: colors.text, fontSize: R.fs(20), fontWeight: 700 }}>App Builder</h2>
        <span style={{ fontSize: R.fs(9), color: colors.accent, background: `${colors.accent}22`, padding: `${R.sp(3)}px ${R.sp(8)}px`, borderRadius: R.sp(8), fontWeight: 600 }}>NEW</span>
      </div>
      <p style={{ color: colors.textSecondary, fontSize: R.fs(13), marginBottom: R.sp(16) }}>
        Create custom mini-apps for anything. Track expenses, habits, workouts, or anything else.
      </p>

      {/* Your Apps */}
      {apps.length > 0 && (
        <div style={{ marginBottom: R.sp(20) }}>
          <h3 style={{ color: colors.text, fontSize: R.fs(14), fontWeight: 600, marginBottom: R.sp(10) }}>YOUR APPS</h3>
          <div style={{ display: 'grid', gridTemplateColumns: R.isSmall ? '1fr' : '1fr 1fr', gap: R.sp(8) }}>
            {apps.map(app => (
              <button key={app.id} onClick={() => setActiveApp(app)} style={{
                padding: R.sp(16), background: colors.surfaceLight, border: `${R.borderWidth}px solid ${colors.border}`,
                borderRadius: R.sp(12), cursor: 'pointer', textAlign: 'left', minHeight: R.minTouchTarget,
              }}>
                <span style={{ fontSize: R.fs(24) }}>{app.icon}</span>
                <div style={{ color: colors.text, fontSize: R.fs(13), fontWeight: 600, marginTop: R.sp(6) }}>{app.name}</div>
                <div style={{ color: colors.textSecondary, fontSize: R.fs(11) }}>{app.entries.length} entries</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Templates */}
      <h3 style={{ color: colors.text, fontSize: R.fs(14), fontWeight: 600, marginBottom: R.sp(10) }}>
        {apps.length > 0 ? 'CREATE NEW' : 'CHOOSE A TEMPLATE'}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: R.isSmall ? '1fr' : '1fr 1fr', gap: R.sp(8) }}>
        {TEMPLATES.map(template => (
          <button
            key={template.name}
            onClick={() => { setSelectedTemplate(template); setBuilding(true); setAppName(template.name) }}
            style={{
              padding: R.sp(16), background: colors.surfaceLight, border: `${R.borderWidth}px solid ${colors.border}`,
              borderRadius: R.sp(12), cursor: 'pointer', textAlign: 'left', minHeight: R.minTouchTarget,
            }}
          >
            <span style={{ fontSize: R.fs(24) }}>{template.icon}</span>
            <div style={{ color: colors.text, fontSize: R.fs(13), fontWeight: 600, marginTop: R.sp(6) }}>{template.name}</div>
            <div style={{ color: colors.textSecondary, fontSize: R.fs(11) }}>{template.desc}</div>
          </button>
        ))}
      </div>

      {/* AI Build Prompt */}
      <div style={{
        marginTop: R.sp(20), padding: R.sp(14), background: `${colors.primary}10`,
        border: `${R.borderWidth}px solid ${colors.primary}25`, borderRadius: R.sp(10),
      }}>
        <div style={{ display: 'flex', gap: R.sp(8), alignItems: 'center', marginBottom: R.sp(8) }}>
          <span style={{ color: colors.primary }}>&#9673;</span>
          <span style={{ color: colors.primaryLight, fontSize: R.fs(11), fontWeight: 600 }}>AI APP GENERATOR</span>
        </div>
        <div style={{ color: colors.textSecondary, fontSize: R.fs(12), marginBottom: R.sp(10) }}>
          Describe any app you want and AI will build it for you. "Build me a wine journal" or "I need a chore chart for the kids."
        </div>
        <div style={{ display: 'flex', gap: R.sp(8) }}>
          <input
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            placeholder="Describe your app..."
            style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
          />
          <button onClick={() => {
            if (customPrompt.trim()) {
              setSelectedTemplate({ name: customPrompt.trim().slice(0, 30), icon: '⬡', desc: customPrompt, fields: [
                { label: 'Name', type: 'text' },
                { label: 'Details', type: 'text' },
                { label: 'Date', type: 'date' },
                { label: 'Status', type: 'select', options: ['Active', 'Done', 'Archived'] },
              ]})
              setBuilding(true)
              setAppName(customPrompt.trim().slice(0, 30))
              setCustomPrompt('')
            }
          }} style={{
            padding: `0 ${R.sp(16)}px`, background: colors.gradient1, color: '#fff',
            border: 'none', borderRadius: R.sp(10), fontSize: R.fs(13), cursor: 'pointer',
            minHeight: R.minTouchTarget,
          }}>Build</button>
        </div>
      </div>

      {/* Build Modal */}
      {building && selectedTemplate && (
        <div style={modalOverlay} onClick={() => setBuilding(false)}>
          <div style={modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: R.sp(16) }}>
              <span style={{ fontSize: R.fs(40) }}>{selectedTemplate.icon}</span>
              <h3 style={{ color: colors.text, fontSize: R.fs(20), fontWeight: 600, marginTop: R.sp(8) }}>Create App</h3>
            </div>
            <input
              value={appName}
              onChange={e => setAppName(e.target.value)}
              placeholder="App name"
              style={inputStyle}
              autoFocus
            />
            <div style={{ color: colors.textSecondary, fontSize: R.fs(12), marginBottom: R.sp(12) }}>
              Fields: {selectedTemplate.fields.map(f => f.label).join(', ') || 'Custom'}
            </div>
            <div style={{ display: 'flex', gap: R.sp(8) }}>
              <button onClick={() => setBuilding(false)} style={{ ...actionBtn, background: colors.surfaceLight, color: colors.textSecondary }}>Cancel</button>
              <button onClick={() => createApp(selectedTemplate)} style={{ ...actionBtn, background: colors.gradient1, color: '#fff' }}>Create App</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
