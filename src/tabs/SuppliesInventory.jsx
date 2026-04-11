import { useState } from 'react'

const SUPPLY_CATEGORIES = [
  'Food - Dry', 'Food - Frozen', 'Food - Live', 'Water Conditioner', 'Medication',
  'Filter Media', 'Substrate', 'Plants/Fertilizer', 'Test Kits', 'Replacement Parts', 'Other',
]

const EQUIPMENT_TYPES = [
  'Sponge Filter', 'HOB Filter', 'Canister Filter', 'Internal Filter',
  'Heater', 'Thermometer', 'Light', 'Air Pump', 'Air Stone',
  'Airline Tubing', 'Check Valve', 'Gang Valve', 'Timer',
  'Gravel Vacuum', 'Net', 'Bucket', 'Hose', 'Other',
]

const EQUIP_STATUS = ['Active', 'Spare', 'Needs Replacement', 'Broken']

const inputStyle = { background: '#0d1b2a', border: '1px solid #333', color: '#e0e0e0', borderRadius: 4, padding: '4px 8px', fontSize: 12, width: '100%' }
const selectStyle = { ...inputStyle, appearance: 'auto' }
const btnStyle = { padding: '6px 12px', background: '#0f3460', color: '#4fc3f7', border: '1px solid #4fc3f7', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }
const cardStyle = { background: '#16213e', border: '1px solid #0f3460', borderRadius: 6, padding: 10, marginBottom: 6 }

const MEDS_TO_STOCK = [
  'Ich-X / Super Ick Cure', 'Methylene Blue', 'Kanaplex', 'Furan-2',
  'API General Cure', 'Prazipro', 'Melafix/Pimafix', 'Aquarium Salt',
  'Epsom Salt', 'Seachem StressGuard',
]

let nextId = Date.now()

export default function SuppliesInventory({ supplies, setSupplies, equipment, setEquipment }) {
  const [view, setView] = useState('supplies')
  const [showAdd, setShowAdd] = useState(false)
  const [supplyForm, setSupplyForm] = useState({ name: '', category: 'Food - Dry', quantity: '', unit: '', reorderAt: '', expiry: '', cost: '', supplier: '', notes: '' })
  const [equipForm, setEquipForm] = useState({ name: '', type: 'Sponge Filter', brand: '', model: '', tankAssigned: '', status: 'Active', wattage: '', gph: '', datePurchased: '', notes: '' })

  const addSupply = () => {
    if (!supplyForm.name.trim()) return
    setSupplies([...supplies, { ...supplyForm, id: nextId++, quantity: parseFloat(supplyForm.quantity) || 0, reorderAt: parseFloat(supplyForm.reorderAt) || 0 }])
    setSupplyForm({ name: '', category: 'Food - Dry', quantity: '', unit: '', reorderAt: '', expiry: '', cost: '', supplier: '', notes: '' })
    setShowAdd(false)
  }

  const addEquip = () => {
    if (!equipForm.name.trim()) return
    setEquipment([...equipment, { ...equipForm, id: nextId++ }])
    setEquipForm({ name: '', type: 'Sponge Filter', brand: '', model: '', tankAssigned: '', status: 'Active', wattage: '', gph: '', datePurchased: '', notes: '' })
    setShowAdd(false)
  }

  const removeSupply = (id) => setSupplies(supplies.filter(s => s.id !== id))
  const removeEquip = (id) => setEquipment(equipment.filter(e => e.id !== id))
  const updateSupplyQty = (id, qty) => setSupplies(supplies.map(s => s.id === id ? { ...s, quantity: parseFloat(qty) || 0 } : s))
  const updateEquipStatus = (id, status) => setEquipment(equipment.map(e => e.id === id ? { ...e, status } : e))

  const lowStock = supplies.filter(s => s.reorderAt > 0 && s.quantity <= s.reorderAt)
  const needsReplacement = equipment.filter(e => e.status === 'Needs Replacement' || e.status === 'Broken')

  const tabBtn = (id, label) => (
    <button onClick={() => { setView(id); setShowAdd(false) }}
      style={{ ...btnStyle, background: view === id ? '#0f3460' : 'transparent', color: view === id ? '#4fc3f7' : '#888', border: view === id ? '1px solid #4fc3f7' : '1px solid #333' }}>
      {label}
    </button>
  )

  return (
    <div style={{ padding: 16, maxWidth: 900 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {tabBtn('supplies', `Supplies (${supplies.length})`)}
        {tabBtn('equipment', `Equipment (${equipment.length})`)}
        {tabBtn('meds', 'Meds to Stock')}
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowAdd(!showAdd)} style={btnStyle}>+ Add {view === 'equipment' ? 'Equipment' : 'Supply'}</button>
      </div>

      {/* Alerts */}
      {(lowStock.length > 0 || needsReplacement.length > 0) && (
        <div style={{ ...cardStyle, borderColor: '#ff9800', marginBottom: 12 }}>
          <h4 style={{ fontSize: 13, color: '#ff9800', margin: '0 0 6px' }}>Alerts</h4>
          {lowStock.map(s => <div key={s.id} style={{ fontSize: 11, color: '#ff9800' }}>⚠️ Low stock: {s.name} ({s.quantity} {s.unit} — reorder at {s.reorderAt})</div>)}
          {needsReplacement.map(e => <div key={e.id} style={{ fontSize: 11, color: '#e53935' }}>⚠️ {e.status}: {e.name} {e.brand && `(${e.brand})`}</div>)}
        </div>
      )}

      {/* Add form */}
      {showAdd && view !== 'meds' && (
        <div style={{ ...cardStyle, marginBottom: 12 }}>
          {view === 'supplies' ? (
            <>
              <h4 style={{ fontSize: 13, color: '#4fc3f7', margin: '0 0 8px' }}>Add Supply</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div><label style={{ fontSize: 10, color: '#888' }}>Name *</label><input style={inputStyle} value={supplyForm.name} onChange={e => setSupplyForm({ ...supplyForm, name: e.target.value })} placeholder="e.g. Hikari Micro Pellets" /></div>
                <div><label style={{ fontSize: 10, color: '#888' }}>Category</label><select style={selectStyle} value={supplyForm.category} onChange={e => setSupplyForm({ ...supplyForm, category: e.target.value })}>{SUPPLY_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
                <div><label style={{ fontSize: 10, color: '#888' }}>Quantity</label><input style={inputStyle} type="number" value={supplyForm.quantity} onChange={e => setSupplyForm({ ...supplyForm, quantity: e.target.value })} /></div>
                <div><label style={{ fontSize: 10, color: '#888' }}>Unit</label><input style={inputStyle} value={supplyForm.unit} onChange={e => setSupplyForm({ ...supplyForm, unit: e.target.value })} placeholder="oz, bottles, packs" /></div>
                <div><label style={{ fontSize: 10, color: '#888' }}>Reorder At</label><input style={inputStyle} type="number" value={supplyForm.reorderAt} onChange={e => setSupplyForm({ ...supplyForm, reorderAt: e.target.value })} /></div>
                <div><label style={{ fontSize: 10, color: '#888' }}>Expiry</label><input style={inputStyle} type="date" value={supplyForm.expiry} onChange={e => setSupplyForm({ ...supplyForm, expiry: e.target.value })} /></div>
                <div><label style={{ fontSize: 10, color: '#888' }}>Cost</label><input style={inputStyle} value={supplyForm.cost} onChange={e => setSupplyForm({ ...supplyForm, cost: e.target.value })} placeholder="$" /></div>
                <div><label style={{ fontSize: 10, color: '#888' }}>Supplier</label><input style={inputStyle} value={supplyForm.supplier} onChange={e => setSupplyForm({ ...supplyForm, supplier: e.target.value })} /></div>
                <div><label style={{ fontSize: 10, color: '#888' }}>Notes</label><input style={inputStyle} value={supplyForm.notes} onChange={e => setSupplyForm({ ...supplyForm, notes: e.target.value })} /></div>
              </div>
              <button onClick={addSupply} style={{ ...btnStyle, marginTop: 8 }}>Add Supply</button>
            </>
          ) : (
            <>
              <h4 style={{ fontSize: 13, color: '#4fc3f7', margin: '0 0 8px' }}>Add Equipment</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div><label style={{ fontSize: 10, color: '#888' }}>Name *</label><input style={inputStyle} value={equipForm.name} onChange={e => setEquipForm({ ...equipForm, name: e.target.value })} placeholder="e.g. Aquaclear 50" /></div>
                <div><label style={{ fontSize: 10, color: '#888' }}>Type</label><select style={selectStyle} value={equipForm.type} onChange={e => setEquipForm({ ...equipForm, type: e.target.value })}>{EQUIPMENT_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                <div><label style={{ fontSize: 10, color: '#888' }}>Brand</label><input style={inputStyle} value={equipForm.brand} onChange={e => setEquipForm({ ...equipForm, brand: e.target.value })} /></div>
                <div><label style={{ fontSize: 10, color: '#888' }}>Model</label><input style={inputStyle} value={equipForm.model} onChange={e => setEquipForm({ ...equipForm, model: e.target.value })} /></div>
                <div><label style={{ fontSize: 10, color: '#888' }}>Tank Assigned</label><input style={inputStyle} value={equipForm.tankAssigned} onChange={e => setEquipForm({ ...equipForm, tankAssigned: e.target.value })} placeholder="Tank name or ID" /></div>
                <div><label style={{ fontSize: 10, color: '#888' }}>Status</label><select style={selectStyle} value={equipForm.status} onChange={e => setEquipForm({ ...equipForm, status: e.target.value })}>{EQUIP_STATUS.map(s => <option key={s}>{s}</option>)}</select></div>
                <div><label style={{ fontSize: 10, color: '#888' }}>Wattage</label><input style={inputStyle} value={equipForm.wattage} onChange={e => setEquipForm({ ...equipForm, wattage: e.target.value })} placeholder="W" /></div>
                <div><label style={{ fontSize: 10, color: '#888' }}>GPH / LPH</label><input style={inputStyle} value={equipForm.gph} onChange={e => setEquipForm({ ...equipForm, gph: e.target.value })} /></div>
                <div><label style={{ fontSize: 10, color: '#888' }}>Date Purchased</label><input style={inputStyle} type="date" value={equipForm.datePurchased} onChange={e => setEquipForm({ ...equipForm, datePurchased: e.target.value })} /></div>
              </div>
              <button onClick={addEquip} style={{ ...btnStyle, marginTop: 8 }}>Add Equipment</button>
            </>
          )}
        </div>
      )}

      {/* Lists */}
      {view === 'supplies' && (
        <>
          {SUPPLY_CATEGORIES.map(cat => {
            const items = supplies.filter(s => s.category === cat)
            if (!items.length) return null
            return (
              <div key={cat} style={{ marginBottom: 12 }}>
                <h4 style={{ fontSize: 12, color: '#888', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{cat} ({items.length})</h4>
                {items.map(s => {
                  const low = s.reorderAt > 0 && s.quantity <= s.reorderAt
                  return (
                    <div key={s.id} style={{ ...cardStyle, borderColor: low ? '#ff9800' : '#0f3460', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: low ? '#ff9800' : '#e0e0e0' }}>{s.name}</span>
                        {s.supplier && <span style={{ fontSize: 10, color: '#666', marginLeft: 6 }}>{s.supplier}</span>}
                        {s.cost && <span style={{ fontSize: 10, color: '#666', marginLeft: 6 }}>{s.cost}</span>}
                        {s.expiry && <span style={{ fontSize: 10, color: '#666', marginLeft: 6 }}>exp: {s.expiry}</span>}
                        {s.notes && <div style={{ fontSize: 10, color: '#555' }}>{s.notes}</div>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input style={{ ...inputStyle, width: 50, textAlign: 'center' }} type="number" value={s.quantity} onChange={e => updateSupplyQty(s.id, e.target.value)} />
                        <span style={{ fontSize: 10, color: '#888' }}>{s.unit}</span>
                        <button onClick={() => removeSupply(s.id)} style={{ background: 'none', border: 'none', color: '#e53935', cursor: 'pointer', fontSize: 14 }}>×</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
          {supplies.length === 0 && <div style={{ color: '#555', fontSize: 13, textAlign: 'center', marginTop: 40 }}>No supplies tracked yet</div>}
        </>
      )}

      {view === 'equipment' && (
        <>
          {EQUIPMENT_TYPES.map(type => {
            const items = equipment.filter(e => e.type === type)
            if (!items.length) return null
            return (
              <div key={type} style={{ marginBottom: 12 }}>
                <h4 style={{ fontSize: 12, color: '#888', margin: '0 0 4px' }}>{type} ({items.length})</h4>
                {items.map(e => (
                  <div key={e.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e0' }}>{e.name}</span>
                      {e.brand && <span style={{ fontSize: 10, color: '#888', marginLeft: 6 }}>{e.brand}</span>}
                      {e.model && <span style={{ fontSize: 10, color: '#666', marginLeft: 4 }}>{e.model}</span>}
                      {e.tankAssigned && <span style={{ fontSize: 10, color: '#4fc3f7', marginLeft: 6 }}>→ {e.tankAssigned}</span>}
                      <div style={{ fontSize: 10, color: '#555' }}>
                        {e.wattage && `${e.wattage}W `}{e.gph && `${e.gph} GPH `}{e.datePurchased && `Bought: ${e.datePurchased}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <select style={{ ...selectStyle, width: 'auto', fontSize: 10, padding: '2px 4px' }} value={e.status} onChange={ev => updateEquipStatus(e.id, ev.target.value)}>
                        {EQUIP_STATUS.map(s => <option key={s}>{s}</option>)}
                      </select>
                      <button onClick={() => removeEquip(e.id)} style={{ background: 'none', border: 'none', color: '#e53935', cursor: 'pointer', fontSize: 14 }}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
          {equipment.length === 0 && <div style={{ color: '#555', fontSize: 13, textAlign: 'center', marginTop: 40 }}>No equipment tracked yet</div>}
        </>
      )}

      {view === 'meds' && (
        <div style={cardStyle}>
          <h4 style={{ fontSize: 13, color: '#ff9800', margin: '0 0 8px' }}>Recommended Medications to Keep on Hand</h4>
          <p style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>For a fish room with 30+ tanks, stock these to handle emergencies fast:</p>
          {MEDS_TO_STOCK.map(med => {
            const inStock = supplies.some(s => s.name.toLowerCase().includes(med.toLowerCase().split('/')[0].split(' ')[0].toLowerCase()))
            return (
              <div key={med} style={{ padding: '4px 0', fontSize: 12, color: inStock ? '#4adf80' : '#e0e0e0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: inStock ? '#4adf80' : '#e53935' }}>{inStock ? '✓' : '✗'}</span>
                {med}
                {!inStock && <span style={{ fontSize: 10, color: '#e53935' }}>— NOT IN INVENTORY</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
