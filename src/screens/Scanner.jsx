import { useState, useRef } from 'react'
import { colors, loadState, saveState } from '../App'

const DEMO_EXTRACTIONS = [
  {
    type: 'School Flyer',
    items: [
      { kind: 'event', title: 'Spring Concert', date: '2026-04-15', time: '7:00 PM', location: 'School Auditorium' },
      { kind: 'event', title: 'Parent-Teacher Conference', date: '2026-04-20', time: '3:00 PM' },
      { kind: 'deadline', title: 'Field Trip Permission Slip Due', date: '2026-04-10' },
    ],
  },
  {
    type: 'Email',
    items: [
      { kind: 'task', title: 'Review Q2 budget proposal', priority: 'high' },
      { kind: 'event', title: 'Team standup moved to 10am', date: '2026-03-19', time: '10:00 AM' },
      { kind: 'reminder', title: 'Submit expense report by Friday' },
    ],
  },
  {
    type: 'Recipe Card',
    items: [
      { kind: 'recipe', title: 'Grandmother\'s Pasta Sauce', servings: '6', prepTime: '15 min', cookTime: '45 min' },
      { kind: 'grocery', items: ['San Marzano tomatoes', 'Fresh basil', 'Garlic', 'Olive oil', 'Onion', 'Red wine'] },
    ],
  },
]

export default function Scanner({ user, addMemory, R }) {
  const [scannedDocs, setScannedDocs] = useState(() => loadState('scannedDocs', []))
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const [textInput, setTextInput] = useState('')
  const [mode, setMode] = useState('upload') // upload, text, camera
  const fileRef = useRef(null)

  const save = (d) => { setScannedDocs(d); saveState('scannedDocs', d) }

  const simulateScan = (source) => {
    setScanning(true)
    setTimeout(() => {
      const extraction = DEMO_EXTRACTIONS[Math.floor(Math.random() * DEMO_EXTRACTIONS.length)]
      const doc = { ...extraction, id: Date.now(), scannedAt: new Date().toISOString(), source }
      save([doc, ...scannedDocs])
      setResult(doc)
      setScanning(false)
      addMemory(`Scanned ${extraction.type}: found ${extraction.items.length} items`)
    }, 1500)
  }

  const handleFile = (e) => {
    if (e.target.files?.length) {
      simulateScan(e.target.files[0].name)
    }
  }

  const handleText = () => {
    if (textInput.trim()) {
      simulateScan('Pasted text')
      setTextInput('')
    }
  }

  const addToCalendar = (item) => {
    const events = loadState('events', [])
    events.push({ id: Date.now(), title: item.title, date: item.date || new Date().toISOString().split('T')[0], time: item.time || '09:00', location: item.location || '', calendar: 'personal', color: colors.primary })
    saveState('events', events)
    addMemory(`Added from scan: ${item.title}`)
  }

  const addToTasks = (item) => {
    const tasks = loadState('tasks', [])
    tasks.push({ id: Date.now(), title: item.title, priority: item.priority || 'medium', assignee: '', dueDate: item.date || '', recurring: false, category: 'personal', completed: false, createdAt: new Date().toISOString() })
    saveState('tasks', tasks)
    addMemory(`Task from scan: ${item.title}`)
  }

  const addBtn = {
    padding: `${R.sp(4)}px ${R.sp(10)}px`, background: `${colors.primary}22`, border: `${R.borderWidth}px solid ${colors.primary}44`,
    borderRadius: R.sp(6), color: colors.primaryLight, fontSize: R.fs(10), cursor: 'pointer', fontFamily: 'inherit',
    fontWeight: 600, whiteSpace: 'nowrap', minHeight: R.minTouchTarget,
  }

  return (
    <div style={{ padding: R.sp(16) }}>
      <h2 style={{ color: colors.text, fontSize: R.fs(20), fontWeight: 700, marginBottom: R.sp(4) }}>Smart Scanner</h2>
      <p style={{ color: colors.textSecondary, fontSize: R.fs(13), marginBottom: R.sp(16) }}>
        Upload photos, PDFs, or paste text. AI extracts events, tasks, and action items.
      </p>

      {/* Mode Tabs */}
      <div style={{ display: 'flex', gap: R.sp(8), marginBottom: R.sp(16) }}>
        {[['upload', 'Upload'], ['text', 'Paste Text'], ['camera', 'Camera']].map(([m, label]) => (
          <button key={m} onClick={() => setMode(m)} style={{
            flex: 1, padding: `${R.sp(10)}px ${R.sp(8)}px`, background: mode === m ? colors.primary : colors.surfaceLight,
            border: `${R.borderWidth}px solid ${mode === m ? colors.primary : colors.border}`,
            borderRadius: R.sp(10), color: mode === m ? '#fff' : colors.textSecondary,
            fontSize: R.fs(12), cursor: 'pointer', fontFamily: 'inherit', minHeight: R.minTouchTarget,
          }}>{label}</button>
        ))}
      </div>

      {/* Upload Mode */}
      {mode === 'upload' && (
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            padding: R.sp(40), border: `2px dashed ${colors.border}`, borderRadius: R.sp(16),
            textAlign: 'center', cursor: 'pointer', marginBottom: R.sp(16),
            background: colors.surfaceLight,
          }}
        >
          <div style={{ fontSize: R.fs(40), marginBottom: R.sp(12), color: colors.primary }}>⊞</div>
          <div style={{ color: colors.text, fontSize: R.fs(14), marginBottom: R.sp(4) }}>Tap to upload</div>
          <div style={{ color: colors.textMuted, fontSize: R.fs(12) }}>Photos, PDFs, screenshots, documents</div>
          <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx" onChange={handleFile} style={{ display: 'none' }} />
        </div>
      )}

      {/* Text Mode */}
      {mode === 'text' && (
        <div style={{ marginBottom: R.sp(16) }}>
          <textarea
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            placeholder="Paste an email, message, or any text here..."
            style={{
              width: '100%', minHeight: R.sp(120), padding: R.sp(14), background: colors.surfaceLight,
              border: `${R.borderWidth}px solid ${colors.border}`, borderRadius: R.sp(12), color: colors.text,
              fontSize: R.fs(14), fontFamily: 'inherit', resize: 'vertical',
            }}
          />
          <button onClick={handleText} disabled={!textInput.trim()} style={{
            width: '100%', padding: R.sp(12), marginTop: R.sp(8), background: textInput.trim() ? colors.gradient1 : colors.surfaceLight,
            color: textInput.trim() ? '#fff' : colors.textMuted, border: 'none', borderRadius: R.sp(10),
            fontSize: R.fs(14), fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minHeight: R.minTouchTarget,
          }}>Scan & Extract</button>
        </div>
      )}

      {/* Camera Mode */}
      {mode === 'camera' && (
        <div style={{
          padding: R.sp(40), border: `2px dashed ${colors.border}`, borderRadius: R.sp(16),
          textAlign: 'center', marginBottom: R.sp(16), background: colors.surfaceLight,
        }}>
          <div style={{ fontSize: R.fs(40), marginBottom: R.sp(12), color: colors.secondary }}>◎</div>
          <div style={{ color: colors.text, fontSize: R.fs(14), marginBottom: R.sp(4) }}>Camera Scan</div>
          <div style={{ color: colors.textMuted, fontSize: R.fs(12), marginBottom: R.sp(12) }}>Point at a document, flyer, or whiteboard</div>
          <button onClick={() => simulateScan('Camera capture')} style={{
            padding: `${R.sp(10)}px ${R.sp(24)}px`, background: colors.gradient2, color: '#000',
            border: 'none', borderRadius: R.sp(10), fontSize: R.fs(13), fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            minHeight: R.minTouchTarget,
          }}>Capture</button>
        </div>
      )}

      {/* Scanning Animation */}
      {scanning && (
        <div style={{ textAlign: 'center', padding: R.sp(24) }}>
          <div style={{ fontSize: R.fs(32), color: colors.primary, animation: 'pulse 1s infinite' }}>◉</div>
          <div style={{ color: colors.primaryLight, fontSize: R.fs(14), marginTop: R.sp(8) }}>Analyzing document...</div>
          <div style={{ color: colors.textMuted, fontSize: R.fs(12), marginTop: R.sp(4) }}>Extracting events, tasks, and action items</div>
        </div>
      )}

      {/* Result */}
      {result && !scanning && (
        <div style={{
          padding: R.sp(16), background: `${colors.success}10`, border: `${R.borderWidth}px solid ${colors.success}30`,
          borderRadius: R.sp(12), marginBottom: R.sp(16),
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: R.sp(12) }}>
            <div>
              <div style={{ color: colors.success, fontSize: R.fs(12), fontWeight: 600 }}>EXTRACTED FROM {result.type.toUpperCase()}</div>
              <div style={{ color: colors.textSecondary, fontSize: R.fs(11) }}>{result.items.length} items found</div>
            </div>
            <button onClick={() => setResult(null)} aria-label="Dismiss scan results" style={{
              background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: R.fs(16),
              minHeight: R.minTouchTarget, minWidth: R.minTouchTarget,
            }}>✕</button>
          </div>
          {result.items.map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: R.sp(10), padding: R.sp(12),
              background: colors.surfaceLight, borderRadius: R.sp(8), marginBottom: R.sp(6),
            }}>
              <span style={{
                fontSize: R.fs(10), padding: `${R.sp(3)}px ${R.sp(6)}px`, borderRadius: R.sp(4),
                background: item.kind === 'event' ? `${colors.primary}22` : item.kind === 'task' ? `${colors.warning}22` : `${colors.secondary}22`,
                color: item.kind === 'event' ? colors.primary : item.kind === 'task' ? colors.warning : colors.secondary,
                textTransform: 'uppercase', fontWeight: 600,
              }}>{item.kind}</span>
              <span style={{ color: colors.text, fontSize: R.fs(13), flex: 1 }}>{item.title || item.items?.join(', ')}</span>
              {item.kind === 'event' && (
                <button onClick={() => addToCalendar(item)} style={addBtn}>+ Cal</button>
              )}
              {(item.kind === 'task' || item.kind === 'deadline' || item.kind === 'reminder') && (
                <button onClick={() => addToTasks(item)} style={addBtn}>+ Task</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* History */}
      {scannedDocs.length > 0 && (
        <div>
          <h3 style={{ color: colors.text, fontSize: R.fs(14), fontWeight: 600, marginBottom: R.sp(10) }}>SCAN HISTORY</h3>
          {scannedDocs.slice(0, 5).map(doc => (
            <div key={doc.id} style={{
              padding: R.sp(12), background: colors.surfaceLight, border: `${R.borderWidth}px solid ${colors.border}`,
              borderRadius: R.sp(8), marginBottom: R.sp(6),
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.text, fontSize: R.fs(13) }}>{doc.type}</span>
                <span style={{ color: colors.textMuted, fontSize: R.fs(11) }}>
                  {new Date(doc.scannedAt).toLocaleDateString()}
                </span>
              </div>
              <div style={{ color: colors.textSecondary, fontSize: R.fs(11), marginTop: R.sp(2) }}>
                {doc.items.length} items extracted from {doc.source}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  )
}
