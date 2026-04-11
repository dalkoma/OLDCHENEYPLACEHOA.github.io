import { useState } from 'react'

const PARAM_RANGES = {
  pH:        { min: 6.0, max: 8.0, danger: [5.5, 8.5], unit: '', step: 0.1 },
  Ammonia:   { min: 0, max: 0, danger: [0.25, 999], unit: 'ppm', step: 0.25 },
  Nitrite:   { min: 0, max: 0, danger: [0.5, 999], unit: 'ppm', step: 0.25 },
  Nitrate:   { min: 0, max: 20, danger: [40, 80], unit: 'ppm', step: 5 },
  GH:        { min: 4, max: 12, danger: [2, 20], unit: 'dGH', step: 1 },
  KH:        { min: 3, max: 8, danger: [2, 999], unit: 'dKH', step: 1 },
  Temp:      { min: 72, max: 82, danger: [68, 86], unit: '°F', step: 0.5 },
  TDS:       { min: 100, max: 400, danger: [50, 600], unit: 'ppm', step: 10 },
}

const MAINT_TASKS = [
  { task: 'Water Change', freq: 'Weekly', icon: '💧' },
  { task: 'Test Water Parameters', freq: 'Weekly', icon: '🧪' },
  { task: 'Glass Cleaning', freq: 'Weekly', icon: '🪟' },
  { task: 'Gravel Vacuum', freq: 'With WC', icon: '🫧' },
  { task: 'Sponge/Filter Rinse', freq: '2–4 weeks', icon: '🧽' },
  { task: 'Canister Cleaning', freq: '3–6 months', icon: '⚙️' },
  { task: 'Heater Check', freq: 'Monthly', icon: '🌡️' },
  { task: 'Light/Timer Check', freq: 'Monthly', icon: '💡' },
  { task: 'Tubing/Check Valve Inspect', freq: 'Monthly', icon: '🔧' },
  { task: 'Full Equipment Audit', freq: 'Quarterly', icon: '📋' },
  { task: 'Plant Trimming', freq: 'As needed', icon: '🌿' },
  { task: 'Filter Media Replace', freq: 'As needed', icon: '🔄' },
]

const WC_GUIDELINES = [
  { range: '2.5–10 gal', freq: '2x/week', volume: '25–50%', note: 'Fry tanks: daily small changes' },
  { range: '10–29 gal', freq: 'Weekly', volume: '25–30%', note: 'Heavy bioload: 2x/week' },
  { range: '30–75 gal', freq: 'Weekly', volume: '20–30%', note: '' },
  { range: '75–125 gal', freq: 'Weekly–biweekly', volume: '15–25%', note: '' },
]

const inputStyle = { background: '#0d1b2a', border: '1px solid #333', color: '#e0e0e0', borderRadius: 4, padding: '4px 8px', fontSize: 12, width: '100%' }
const selectStyle = { ...inputStyle, appearance: 'auto' }
const btnStyle = { padding: '6px 12px', background: '#0f3460', color: '#4fc3f7', border: '1px solid #4fc3f7', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }
const cardStyle = { background: '#16213e', border: '1px solid #0f3460', borderRadius: 6, padding: 12, marginBottom: 8 }

let nextId = Date.now()

export default function MaintenanceLog({ tankRegistry, maintenanceLogs, setMaintenanceLogs, waterTests, setWaterTests, waterChanges, setWaterChanges }) {
  const [view, setView] = useState('overview')
  const [selectedTank, setSelectedTank] = useState(null)
  const [showAddTest, setShowAddTest] = useState(false)
  const [showAddWC, setShowAddWC] = useState(false)
  const [showAddMaint, setShowAddMaint] = useState(false)

  const [testForm, setTestForm] = useState({
    date: new Date().toISOString().split('T')[0], pH: '', Ammonia: '', Nitrite: '', Nitrate: '', GH: '', KH: '', Temp: '', TDS: '', tester: 'API Liquid', notes: '',
  })
  const [wcForm, setWcForm] = useState({
    date: new Date().toISOString().split('T')[0], gallons: '', percent: '', conditioner: 'Prime', notes: '',
  })
  const [maintForm, setMaintForm] = useState({
    date: new Date().toISOString().split('T')[0], task: 'Water Change', notes: '',
  })

  const addWaterTest = () => {
    if (!selectedTank) return
    setWaterTests([...waterTests, { ...testForm, id: nextId++, tankId: selectedTank }])
    setTestForm({ date: new Date().toISOString().split('T')[0], pH: '', Ammonia: '', Nitrite: '', Nitrate: '', GH: '', KH: '', Temp: '', TDS: '', tester: 'API Liquid', notes: '' })
    setShowAddTest(false)
  }

  const addWC = () => {
    if (!selectedTank) return
    setWaterChanges([...waterChanges, { ...wcForm, id: nextId++, tankId: selectedTank }])
    setWcForm({ date: new Date().toISOString().split('T')[0], gallons: '', percent: '', conditioner: 'Prime', notes: '' })
    setShowAddWC(false)
  }

  const addMaint = () => {
    const tankId = selectedTank || 'all'
    setMaintenanceLogs([...maintenanceLogs, { ...maintForm, id: nextId++, tankId }])
    setMaintForm({ date: new Date().toISOString().split('T')[0], task: 'Water Change', notes: '' })
    setShowAddMaint(false)
  }

  const getParamColor = (param, value) => {
    if (!value && value !== 0) return '#888'
    const v = parseFloat(value)
    const r = PARAM_RANGES[param]
    if (!r) return '#888'
    if (param === 'Ammonia' || param === 'Nitrite') return v === 0 ? '#4adf80' : v >= r.danger[0] ? '#e53935' : '#ff9800'
    if (v < r.danger[0] || v > r.danger[1]) return '#e53935'
    if (v < r.min || v > r.max) return '#ff9800'
    return '#4adf80'
  }

  const tankTests = selectedTank ? waterTests.filter(t => t.tankId === selectedTank).sort((a, b) => b.date.localeCompare(a.date)) : []
  const tankWCs = selectedTank ? waterChanges.filter(w => w.tankId === selectedTank).sort((a, b) => b.date.localeCompare(a.date)) : []
  const tankMaint = maintenanceLogs.filter(m => m.tankId === selectedTank || m.tankId === 'all').sort((a, b) => b.date.localeCompare(a.date))

  // Overview: last WC per tank
  const tankOverview = tankRegistry.map(tank => {
    const lastWC = waterChanges.filter(w => w.tankId === tank.placedId).sort((a, b) => b.date.localeCompare(a.date))[0]
    const lastTest = waterTests.filter(t => t.tankId === tank.placedId).sort((a, b) => b.date.localeCompare(a.date))[0]
    const daysSinceWC = lastWC ? Math.floor((Date.now() - new Date(lastWC.date).getTime()) / 86400000) : null
    const daysSinceTest = lastTest ? Math.floor((Date.now() - new Date(lastTest.date).getTime()) / 86400000) : null
    return { ...tank, lastWC, lastTest, daysSinceWC, daysSinceTest }
  })

  const tabBtn = (id, label) => (
    <button onClick={() => setView(id)}
      style={{ ...btnStyle, background: view === id ? '#0f3460' : 'transparent', color: view === id ? '#4fc3f7' : '#888', border: view === id ? '1px solid #4fc3f7' : '1px solid #333' }}>
      {label}
    </button>
  )

  return (
    <div style={{ padding: 16, maxWidth: 1000 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {tabBtn('overview', 'Overview')}
        {tabBtn('tank', 'Tank Detail')}
        {tabBtn('schedule', 'Task Schedule')}
        {tabBtn('guide', 'WC Guidelines')}
      </div>

      {/* Overview */}
      {view === 'overview' && (
        <>
          <h3 style={{ fontSize: 14, color: '#4fc3f7', marginBottom: 8 }}>All Tanks — Maintenance Status</h3>
          {tankRegistry.length === 0 && <p style={{ fontSize: 12, color: '#666' }}>Place tanks on shelves first</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 8 }}>
            {tankOverview.map(tank => {
              const wcOverdue = tank.daysSinceWC !== null && tank.daysSinceWC > 7
              const testOverdue = tank.daysSinceTest !== null && tank.daysSinceTest > 7
              const hasAmmonia = tank.lastTest && parseFloat(tank.lastTest.Ammonia) > 0
              return (
                <div key={tank.placedId} onClick={() => { setSelectedTank(tank.placedId); setView('tank') }}
                  style={{ ...cardStyle, cursor: 'pointer', borderColor: wcOverdue || hasAmmonia ? '#e53935' : testOverdue ? '#ff9800' : '#0f3460' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#4fc3f7' }}>{tank.nickname || tank.label}</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                    Last WC: {tank.lastWC ? <span style={{ color: wcOverdue ? '#e53935' : '#4adf80' }}>{tank.daysSinceWC}d ago ({tank.lastWC.percent || '?'}%)</span> : <span style={{ color: '#666' }}>Never</span>}
                  </div>
                  <div style={{ fontSize: 11, color: '#888' }}>
                    Last Test: {tank.lastTest ? <span style={{ color: testOverdue ? '#ff9800' : '#4adf80' }}>{tank.daysSinceTest}d ago</span> : <span style={{ color: '#666' }}>Never</span>}
                  </div>
                  {hasAmmonia && <div style={{ fontSize: 10, color: '#e53935', fontWeight: 600 }}>⚠️ Ammonia detected: {tank.lastTest.Ammonia}ppm</div>}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Tank Detail */}
      {view === 'tank' && (
        <>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
            <select style={{ ...selectStyle, width: 220 }} value={selectedTank || ''} onChange={e => setSelectedTank(parseInt(e.target.value) || null)}>
              <option value="">Select tank...</option>
              {tankRegistry.map(t => <option key={t.placedId} value={t.placedId}>{t.nickname || t.label} ({t.gallons}g)</option>)}
            </select>
            {selectedTank && (
              <>
                <button onClick={() => setShowAddTest(!showAddTest)} style={btnStyle}>+ Water Test</button>
                <button onClick={() => setShowAddWC(!showAddWC)} style={btnStyle}>+ Water Change</button>
                <button onClick={() => setShowAddMaint(!showAddMaint)} style={btnStyle}>+ Task</button>
              </>
            )}
          </div>

          {!selectedTank && <div style={{ color: '#555', fontSize: 13, textAlign: 'center', marginTop: 40 }}>Select a tank above</div>}

          {selectedTank && showAddTest && (
            <div style={{ ...cardStyle, marginBottom: 12 }}>
              <h4 style={{ fontSize: 13, color: '#4fc3f7', margin: '0 0 8px' }}>Log Water Test</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                <div><label style={{ fontSize: 10, color: '#888' }}>Date</label><input style={inputStyle} type="date" value={testForm.date} onChange={e => setTestForm({ ...testForm, date: e.target.value })} /></div>
                {Object.keys(PARAM_RANGES).map(p => (
                  <div key={p}><label style={{ fontSize: 10, color: '#888' }}>{p} ({PARAM_RANGES[p].unit})</label><input style={inputStyle} type="number" step={PARAM_RANGES[p].step} value={testForm[p]} onChange={e => setTestForm({ ...testForm, [p]: e.target.value })} /></div>
                ))}
                <div><label style={{ fontSize: 10, color: '#888' }}>Tester</label><select style={selectStyle} value={testForm.tester} onChange={e => setTestForm({ ...testForm, tester: e.target.value })}><option>API Liquid</option><option>Test Strips</option><option>Digital</option></select></div>
              </div>
              <div style={{ marginTop: 6 }}><label style={{ fontSize: 10, color: '#888' }}>Notes</label><input style={inputStyle} value={testForm.notes} onChange={e => setTestForm({ ...testForm, notes: e.target.value })} /></div>
              <button onClick={addWaterTest} style={{ ...btnStyle, marginTop: 8 }}>Save Test</button>
            </div>
          )}

          {selectedTank && showAddWC && (
            <div style={{ ...cardStyle, marginBottom: 12 }}>
              <h4 style={{ fontSize: 13, color: '#4fc3f7', margin: '0 0 8px' }}>Log Water Change</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                <div><label style={{ fontSize: 10, color: '#888' }}>Date</label><input style={inputStyle} type="date" value={wcForm.date} onChange={e => setWcForm({ ...wcForm, date: e.target.value })} /></div>
                <div><label style={{ fontSize: 10, color: '#888' }}>Gallons</label><input style={inputStyle} type="number" value={wcForm.gallons} onChange={e => setWcForm({ ...wcForm, gallons: e.target.value })} /></div>
                <div><label style={{ fontSize: 10, color: '#888' }}>Percent %</label><input style={inputStyle} type="number" value={wcForm.percent} onChange={e => setWcForm({ ...wcForm, percent: e.target.value })} /></div>
                <div><label style={{ fontSize: 10, color: '#888' }}>Conditioner</label><input style={inputStyle} value={wcForm.conditioner} onChange={e => setWcForm({ ...wcForm, conditioner: e.target.value })} /></div>
              </div>
              <button onClick={addWC} style={{ ...btnStyle, marginTop: 8 }}>Save</button>
            </div>
          )}

          {selectedTank && showAddMaint && (
            <div style={{ ...cardStyle, marginBottom: 12 }}>
              <h4 style={{ fontSize: 13, color: '#4fc3f7', margin: '0 0 8px' }}>Log Maintenance Task</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div><label style={{ fontSize: 10, color: '#888' }}>Date</label><input style={inputStyle} type="date" value={maintForm.date} onChange={e => setMaintForm({ ...maintForm, date: e.target.value })} /></div>
                <div><label style={{ fontSize: 10, color: '#888' }}>Task</label><select style={selectStyle} value={maintForm.task} onChange={e => setMaintForm({ ...maintForm, task: e.target.value })}>{MAINT_TASKS.map(t => <option key={t.task}>{t.task}</option>)}</select></div>
                <div><label style={{ fontSize: 10, color: '#888' }}>Notes</label><input style={inputStyle} value={maintForm.notes} onChange={e => setMaintForm({ ...maintForm, notes: e.target.value })} /></div>
              </div>
              <button onClick={addMaint} style={{ ...btnStyle, marginTop: 8 }}>Save</button>
            </div>
          )}

          {/* Water test history */}
          {selectedTank && tankTests.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 13, color: '#e0e0e0', marginBottom: 6 }}>Water Test History</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead><tr style={{ borderBottom: '1px solid #333' }}>
                    <th style={{ textAlign: 'left', padding: '3px 6px', color: '#888' }}>Date</th>
                    {Object.keys(PARAM_RANGES).map(p => <th key={p} style={{ textAlign: 'center', padding: '3px 6px', color: '#888' }}>{p}</th>)}
                    <th style={{ textAlign: 'left', padding: '3px 6px', color: '#888' }}>Notes</th>
                  </tr></thead>
                  <tbody>{tankTests.slice(0, 20).map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #222' }}>
                      <td style={{ padding: '3px 6px', color: '#aaa' }}>{t.date}</td>
                      {Object.keys(PARAM_RANGES).map(p => (
                        <td key={p} style={{ padding: '3px 6px', textAlign: 'center', color: getParamColor(p, t[p]), fontWeight: 600 }}>
                          {t[p] || '—'}
                        </td>
                      ))}
                      <td style={{ padding: '3px 6px', color: '#666', fontSize: 10 }}>{t.notes}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}

          {/* WC history */}
          {selectedTank && tankWCs.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 13, color: '#e0e0e0', marginBottom: 6 }}>Water Change History</h4>
              {tankWCs.slice(0, 15).map(w => (
                <div key={w.id} style={{ fontSize: 11, color: '#aaa', padding: '3px 0', borderBottom: '1px solid #222' }}>
                  <span style={{ color: '#4fc3f7' }}>{w.date}</span> — {w.percent && `${w.percent}%`} {w.gallons && `(${w.gallons} gal)`} — {w.conditioner} {w.notes && <span style={{ color: '#666' }}>· {w.notes}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Maintenance history */}
          {selectedTank && tankMaint.length > 0 && (
            <div>
              <h4 style={{ fontSize: 13, color: '#e0e0e0', marginBottom: 6 }}>Maintenance Log</h4>
              {tankMaint.slice(0, 20).map(m => (
                <div key={m.id} style={{ fontSize: 11, color: '#aaa', padding: '3px 0', borderBottom: '1px solid #222' }}>
                  <span style={{ color: '#4fc3f7' }}>{m.date}</span> — {m.task} {m.notes && <span style={{ color: '#666' }}>· {m.notes}</span>}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Task Schedule */}
      {view === 'schedule' && (
        <div>
          <h3 style={{ fontSize: 14, color: '#4fc3f7', marginBottom: 8 }}>Recommended Maintenance Schedule</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, maxWidth: 500 }}>
            <thead><tr style={{ borderBottom: '1px solid #333' }}>
              <th style={{ textAlign: 'left', padding: '6px', color: '#888' }}>Task</th>
              <th style={{ textAlign: 'left', padding: '6px', color: '#888' }}>Frequency</th>
            </tr></thead>
            <tbody>{MAINT_TASKS.map(t => (
              <tr key={t.task} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: '6px', color: '#e0e0e0' }}>{t.icon} {t.task}</td>
                <td style={{ padding: '6px', color: '#888' }}>{t.freq}</td>
              </tr>
            ))}</tbody>
          </table>
          <div style={{ marginTop: 16 }}>
            <button onClick={() => { setView('tank'); setShowAddMaint(true) }} style={btnStyle}>+ Log a Task</button>
          </div>
        </div>
      )}

      {/* WC Guidelines */}
      {view === 'guide' && (
        <div>
          <h3 style={{ fontSize: 14, color: '#4fc3f7', marginBottom: 8 }}>Water Change Guidelines</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, maxWidth: 600 }}>
            <thead><tr style={{ borderBottom: '1px solid #333' }}>
              <th style={{ textAlign: 'left', padding: '6px', color: '#888' }}>Tank Size</th>
              <th style={{ textAlign: 'left', padding: '6px', color: '#888' }}>Frequency</th>
              <th style={{ textAlign: 'left', padding: '6px', color: '#888' }}>Volume</th>
              <th style={{ textAlign: 'left', padding: '6px', color: '#888' }}>Notes</th>
            </tr></thead>
            <tbody>{WC_GUIDELINES.map(g => (
              <tr key={g.range} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: '6px', color: '#e0e0e0' }}>{g.range}</td>
                <td style={{ padding: '6px', color: '#4fc3f7' }}>{g.freq}</td>
                <td style={{ padding: '6px', color: '#ff9800' }}>{g.volume}</td>
                <td style={{ padding: '6px', color: '#888' }}>{g.note}</td>
              </tr>
            ))}</tbody>
          </table>
          <div style={{ ...cardStyle, marginTop: 16 }}>
            <h4 style={{ fontSize: 13, color: '#ff9800', margin: '0 0 6px' }}>Water Parameter Safe Ranges</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: '1px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '4px 6px', color: '#888' }}>Parameter</th>
                <th style={{ textAlign: 'center', padding: '4px 6px', color: '#888' }}>Safe Range</th>
                <th style={{ textAlign: 'center', padding: '4px 6px', color: '#888' }}>Danger Zone</th>
              </tr></thead>
              <tbody>{Object.entries(PARAM_RANGES).map(([name, r]) => (
                <tr key={name} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: '4px 6px', color: '#e0e0e0', fontWeight: 600 }}>{name}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: '#4adf80' }}>
                    {name === 'Ammonia' || name === 'Nitrite' ? '0' : `${r.min}–${r.max}`} {r.unit}
                  </td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: '#e53935' }}>
                    {name === 'Ammonia' ? `>${r.danger[0]}` : name === 'Nitrite' ? `>${r.danger[0]}` : `<${r.danger[0]} or >${r.danger[1]}`} {r.unit}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
