import { useState } from 'react'

const COMMON_PUMPS = [
  { name: 'Tetra Whisper 10', lph: 85, maxDepth: 12, type: 'Diaphragm', price: '$8', tanks: '1' },
  { name: 'Tetra Whisper 40', lph: 140, maxDepth: 18, type: 'Diaphragm', price: '$12', tanks: '2–3' },
  { name: 'Tetra Whisper 60', lph: 170, maxDepth: 18, type: 'Diaphragm', price: '$15', tanks: '2–3' },
  { name: 'Tetra Whisper 100', lph: 250, maxDepth: 24, type: 'Diaphragm', price: '$20', tanks: '3–4' },
  { name: 'Aquatop AP-20', lph: 360, maxDepth: 24, type: 'Diaphragm', price: '$20', tanks: '5–6' },
  { name: 'Aquatop AP-40', lph: 720, maxDepth: 24, type: 'Diaphragm', price: '$35', tanks: '10–12' },
  { name: 'EcoPlus 1 (18W)', lph: 793, maxDepth: 36, type: 'Diaphragm', price: '$30', tanks: '12–14' },
  { name: 'Alita AL-6A', lph: 510, maxDepth: 48, type: 'Linear Piston', price: '$90', tanks: '8–10' },
  { name: 'Alita AL-15A', lph: 1020, maxDepth: 48, type: 'Linear Piston', price: '$130', tanks: '16–18' },
  { name: 'Medo LA-45B', lph: 765, maxDepth: 48, type: 'Linear Piston', price: '$150', tanks: '12–14' },
  { name: 'Medo LA-80B', lph: 1360, maxDepth: 60, type: 'Linear Piston', price: '$220', tanks: '20–22' },
  { name: 'Medo LA-120B', lph: 2040, maxDepth: 72, type: 'Linear Piston', price: '$300', tanks: '30–35' },
  { name: 'Secoh SLL-30', lph: 850, maxDepth: 48, type: 'Linear Piston', price: '$160', tanks: '12–15' },
  { name: 'Secoh SLL-40', lph: 1133, maxDepth: 48, type: 'Linear Piston', price: '$200', tanks: '18–20' },
]

const cardStyle = { background: '#16213e', border: '1px solid #0f3460', borderRadius: 6, padding: 12, marginBottom: 8 }
const inputStyle = { background: '#0d1b2a', border: '1px solid #333', color: '#e0e0e0', borderRadius: 4, padding: '4px 8px', fontSize: 12, width: 70, textAlign: 'center' }

export default function AirPumpCalculator({ tankRegistry, equipment }) {
  const [filters, setFilters] = useState([
    // Default: one sponge filter per tank
  ])
  const [customFilters, setCustomFilters] = useState(() => {
    // Auto-populate from tank registry
    return tankRegistry.map(t => ({
      tankLabel: t.nickname || t.label,
      gallons: t.gallons,
      spongeCount: 1,
      depthInches: 12, // default estimate
      hasAirstone: false,
    }))
  })

  const updateFilter = (idx, field, value) => {
    setCustomFilters(customFilters.map((f, i) => i === idx ? { ...f, [field]: value } : f))
  }

  const addCustom = () => {
    setCustomFilters([...customFilters, { tankLabel: 'Custom Tank', gallons: 10, spongeCount: 1, depthInches: 12, hasAirstone: false }])
  }

  const removeFilter = (idx) => setCustomFilters(customFilters.filter((_, i) => i !== idx))

  // Calculate total air needed
  // Base: ~56 LPH per sponge filter at surface level
  // Depth adjustment: +10% per foot of depth beyond 12"
  // Airstones: ~30 LPH each
  // Gang valve loss: ~5% per valve (estimate 1 valve per output)
  // Headroom: +20%
  const BASE_LPH_PER_SPONGE = 56
  const LPH_PER_AIRSTONE = 30
  const GANG_VALVE_LOSS = 0.05
  const HEADROOM = 0.20

  let totalSponges = 0
  let totalAirstones = 0
  let totalBaseLPH = 0
  let maxDepth = 0

  customFilters.forEach(f => {
    const depthFeet = Math.max(0, (f.depthInches - 12)) / 12
    const depthMultiplier = 1 + (depthFeet * 0.10)
    const sponge = f.spongeCount * BASE_LPH_PER_SPONGE * depthMultiplier
    const airstone = f.hasAirstone ? LPH_PER_AIRSTONE * depthMultiplier : 0
    totalBaseLPH += sponge + airstone
    totalSponges += f.spongeCount
    totalAirstones += f.hasAirstone ? 1 : 0
    maxDepth = Math.max(maxDepth, f.depthInches)
  })

  const totalOutputs = totalSponges + totalAirstones
  const gangValveLoss = totalBaseLPH * GANG_VALVE_LOSS * Math.min(totalOutputs, 10) / 10 // diminishing returns
  const withLoss = totalBaseLPH + gangValveLoss
  const withHeadroom = withLoss * (1 + HEADROOM)
  const totalCFM = withHeadroom / 1699 // LPH to CFM

  // Find suitable pumps
  const suitable = COMMON_PUMPS.filter(p => p.lph >= withHeadroom && p.maxDepth >= maxDepth)
  const recommended = suitable.length > 0 ? suitable[0] : null

  const existingPumps = equipment.filter(e => e.type === 'Air Pump')

  return (
    <div style={{ padding: 16, maxWidth: 900 }}>
      <h3 style={{ fontSize: 16, color: '#4fc3f7', marginBottom: 4 }}>Air Pump Sizing Calculator</h3>
      <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
        Calculate total air output needed for your sponge filter array. Accounts for water depth back-pressure, gang valve losses, and 20% headroom.
      </p>

      {/* How it works */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <h4 style={{ fontSize: 13, color: '#ff9800', margin: '0 0 6px' }}>How Air Pump Sizing Works</h4>
        <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.6 }}>
          <div><strong style={{ color: '#e0e0e0' }}>Base need:</strong> ~56 LPH (0.033 CFM) per sponge filter for adequate flow</div>
          <div><strong style={{ color: '#e0e0e0' }}>Depth penalty:</strong> +10% output needed per foot of water depth beyond 12″. At 24″ depth, pumps lose 30–40% of rated output due to back-pressure</div>
          <div><strong style={{ color: '#e0e0e0' }}>Gang valve loss:</strong> ~5% per valve in the manifold system</div>
          <div><strong style={{ color: '#e0e0e0' }}>Headroom:</strong> Always add 20% for airline length, aging, and unexpected needs</div>
          <div style={{ marginTop: 4, color: '#4fc3f7' }}><strong>For 30+ tanks:</strong> Linear piston pumps (Medo, Secoh, Alita) are far superior — quieter, more efficient, consistent pressure, and last 3–5 years</div>
        </div>
      </div>

      {/* Per-tank config */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h4 style={{ fontSize: 13, color: '#e0e0e0', margin: 0 }}>Tank Air Requirements ({customFilters.length} tanks)</h4>
          <button onClick={addCustom} style={{ padding: '4px 10px', background: '#0f3460', color: '#4fc3f7', border: '1px solid #4fc3f7', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>+ Add Tank</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 6 }}>
          {customFilters.map((f, idx) => (
            <div key={idx} style={{ ...cardStyle, padding: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <input style={{ ...inputStyle, width: 140, textAlign: 'left' }} value={f.tankLabel} onChange={e => updateFilter(idx, 'tankLabel', e.target.value)} />
                <button onClick={() => removeFilter(idx)} style={{ background: 'none', border: 'none', color: '#e53935', cursor: 'pointer', fontSize: 14 }}>×</button>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ fontSize: 10, color: '#888' }}>Sponges: <input style={inputStyle} type="number" min="0" max="10" value={f.spongeCount} onChange={e => updateFilter(idx, 'spongeCount', parseInt(e.target.value) || 0)} /></label>
                <label style={{ fontSize: 10, color: '#888' }}>Depth: <input style={inputStyle} type="number" min="4" max="36" value={f.depthInches} onChange={e => updateFilter(idx, 'depthInches', parseInt(e.target.value) || 12)} />″</label>
                <label style={{ fontSize: 10, color: '#888', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <input type="checkbox" checked={f.hasAirstone} onChange={e => updateFilter(idx, 'hasAirstone', e.target.checked)} /> Airstone
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      <div style={{ ...cardStyle, borderColor: '#4fc3f7' }}>
        <h4 style={{ fontSize: 14, color: '#4fc3f7', margin: '0 0 8px' }}>Total Air Requirements</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase' }}>Sponge Filters</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#e0e0e0' }}>{totalSponges}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase' }}>Max Depth</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#e0e0e0' }}>{maxDepth}″</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase' }}>Airstones</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#e0e0e0' }}>{totalAirstones}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase' }}>Base Need</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#ff9800' }}>{Math.round(totalBaseLPH)} LPH</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase' }}>With Losses + 20%</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#e53935' }}>{Math.round(withHeadroom)} LPH</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase' }}>CFM Needed</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#e53935' }}>{totalCFM.toFixed(2)}</div>
          </div>
        </div>

        {recommended && (
          <div style={{ marginTop: 12, padding: 8, background: '#0d1b2a', borderRadius: 4 }}>
            <span style={{ fontSize: 12, color: '#4adf80', fontWeight: 600 }}>Recommended: {recommended.name}</span>
            <span style={{ fontSize: 11, color: '#888', marginLeft: 8 }}>{recommended.lph} LPH · {recommended.type} · {recommended.price}</span>
          </div>
        )}
      </div>

      {/* Existing pumps */}
      {existingPumps.length > 0 && (
        <div style={{ ...cardStyle, marginTop: 12 }}>
          <h4 style={{ fontSize: 13, color: '#e0e0e0', margin: '0 0 6px' }}>Your Current Air Pumps</h4>
          {existingPumps.map(p => (
            <div key={p.id} style={{ fontSize: 12, color: '#aaa', padding: '2px 0' }}>
              {p.name} {p.brand && `(${p.brand})`} — {p.gph || '?'} GPH · Status: {p.status}
            </div>
          ))}
        </div>
      )}

      {/* Pump reference table */}
      <div style={{ marginTop: 16 }}>
        <h4 style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>Air Pump Reference</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead><tr style={{ borderBottom: '1px solid #333' }}>
            <th style={{ textAlign: 'left', padding: '4px 6px', color: '#888' }}>Pump</th>
            <th style={{ textAlign: 'right', padding: '4px 6px', color: '#888' }}>LPH</th>
            <th style={{ textAlign: 'right', padding: '4px 6px', color: '#888' }}>Max Depth</th>
            <th style={{ textAlign: 'left', padding: '4px 6px', color: '#888' }}>Type</th>
            <th style={{ textAlign: 'center', padding: '4px 6px', color: '#888' }}>Tanks</th>
            <th style={{ textAlign: 'right', padding: '4px 6px', color: '#888' }}>Price</th>
          </tr></thead>
          <tbody>{COMMON_PUMPS.map(p => {
            const sufficient = p.lph >= withHeadroom && p.maxDepth >= maxDepth
            return (
              <tr key={p.name} style={{ borderBottom: '1px solid #222', background: sufficient ? 'rgba(74,223,128,0.05)' : 'transparent' }}>
                <td style={{ padding: '4px 6px', color: sufficient ? '#4adf80' : '#e0e0e0', fontWeight: sufficient ? 600 : 400 }}>{p.name}{sufficient && ' ✓'}</td>
                <td style={{ padding: '4px 6px', textAlign: 'right' }}>{p.lph}</td>
                <td style={{ padding: '4px 6px', textAlign: 'right' }}>{p.maxDepth}″</td>
                <td style={{ padding: '4px 6px', color: p.type === 'Linear Piston' ? '#4fc3f7' : '#888' }}>{p.type}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center' }}>{p.tanks}</td>
                <td style={{ padding: '4px 6px', textAlign: 'right' }}>{p.price}</td>
              </tr>
            )
          })}</tbody>
        </table>
      </div>
    </div>
  )
}
