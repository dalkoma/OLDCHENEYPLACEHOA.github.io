import { useState } from 'react'

const TEMPERAMENTS = ['Peaceful', 'Semi-aggressive', 'Aggressive']
const DIETS = ['Omnivore', 'Herbivore', 'Carnivore', 'Insectivore']
const HEALTH = ['Healthy', 'Stressed', 'Sick', 'Quarantine', 'Deceased']
const BREEDING = ['Not breeding', 'Conditioning', 'Spawned', 'Fry present', 'Holding (mouthbrooder)']

const COMMON_DISEASES = [
  { name: 'Ich (White Spot)', symptoms: 'White spots, flashing, clamped fins', treatment: 'Heat to 86°F + salt, or Ich-X' },
  { name: 'Velvet', symptoms: 'Gold dust coating, rapid breathing, lethargy', treatment: 'Methylene blue, dim lights, raise temp' },
  { name: 'Fin Rot', symptoms: 'Ragged/white-edged fins, redness', treatment: 'Clean water, Kanaplex, salt' },
  { name: 'Columnaris', symptoms: 'White patches, saddle-back lesion, mouth fungus', treatment: 'Furan-2 + Kanaplex combo' },
  { name: 'Dropsy', symptoms: 'Pinecone scales, bloating, lethargy', treatment: 'Kanaplex + Epsom salt (early stage only)' },
  { name: 'Internal Parasites', symptoms: 'Wasting, white stringy feces, loss of color', treatment: 'API General Cure or Prazipro' },
  { name: 'Flukes', symptoms: 'Flashing, excess mucus, gill inflammation', treatment: 'Prazipro' },
  { name: 'Fungal Infection', symptoms: 'Cotton/fuzzy white growths', treatment: 'Methylene blue or Pimafix' },
  { name: 'Swim Bladder', symptoms: 'Floating upside down, difficulty swimming', treatment: 'Fast 3 days, then deshelled peas' },
  { name: 'Popeye', symptoms: 'Bulging eye(s)', treatment: 'Clean water, Kanaplex if bacterial' },
]

const inputStyle = { background: '#0d1b2a', border: '1px solid #333', color: '#e0e0e0', borderRadius: 4, padding: '4px 8px', fontSize: 12, width: '100%' }
const selectStyle = { ...inputStyle, appearance: 'auto' }
const btnStyle = { padding: '6px 12px', background: '#0f3460', color: '#4fc3f7', border: '1px solid #4fc3f7', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }
const dangerBtn = { ...btnStyle, background: '#3a1010', color: '#e53935', border: '1px solid #e53935' }
const cardStyle = { background: '#16213e', border: '1px solid #0f3460', borderRadius: 6, padding: 12, marginBottom: 8 }

let nextFishId = Date.now()

export default function TankInventory({ tankRegistry, livestock, setLivestock, diseaseLogs, setDiseaseLogs }) {
  const [selectedTank, setSelectedTank] = useState(null)
  const [showAddFish, setShowAddFish] = useState(false)
  const [showDiseaseRef, setShowDiseaseRef] = useState(false)
  const [showAddDisease, setShowAddDisease] = useState(null)
  const [form, setForm] = useState({
    species: '', commonName: '', quantity: 1, sex: 'Unknown', size: '',
    temperament: 'Peaceful', diet: 'Omnivore', health: 'Healthy',
    breeding: 'Not breeding', dateAdded: new Date().toISOString().split('T')[0],
    source: '', notes: '', copperSensitive: false, foods: '',
  })
  const [diseaseForm, setDiseaseForm] = useState({
    disease: '', symptoms: '', treatment: '', date: new Date().toISOString().split('T')[0], outcome: '', notes: '',
  })

  const tankFish = selectedTank ? livestock.filter(f => f.tankId === selectedTank) : []
  const tankDiseases = selectedTank ? diseaseLogs.filter(d => d.tankId === selectedTank) : []
  const selectedTankInfo = tankRegistry.find(t => t.placedId === selectedTank)

  const addFish = () => {
    if (!form.commonName.trim()) return
    setLivestock([...livestock, { ...form, id: nextFishId++, tankId: selectedTank }])
    setForm({ species: '', commonName: '', quantity: 1, sex: 'Unknown', size: '', temperament: 'Peaceful', diet: 'Omnivore', health: 'Healthy', breeding: 'Not breeding', dateAdded: new Date().toISOString().split('T')[0], source: '', notes: '', copperSensitive: false, foods: '' })
    setShowAddFish(false)
  }

  const removeFish = (id) => setLivestock(livestock.filter(f => f.id !== id))
  const updateFish = (id, field, value) => setLivestock(livestock.map(f => f.id === id ? { ...f, [field]: value } : f))

  const addDiseaseLog = () => {
    if (!diseaseForm.disease.trim()) return
    setDiseaseLogs([...diseaseLogs, { ...diseaseForm, id: nextFishId++, tankId: selectedTank, fishId: showAddDisease }])
    setDiseaseForm({ disease: '', symptoms: '', treatment: '', date: new Date().toISOString().split('T')[0], outcome: '', notes: '' })
    setShowAddDisease(null)
  }

  return (
    <div style={{ padding: 16, maxWidth: 1000 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Tank list */}
        <div style={{ width: 280, minWidth: 260 }}>
          <h3 style={{ fontSize: 14, color: '#4fc3f7', marginBottom: 8 }}>Your Tanks ({tankRegistry.length})</h3>
          {tankRegistry.length === 0 && <p style={{ fontSize: 12, color: '#666' }}>Place tanks on shelves in the Shelf Organizer tab first</p>}
          {tankRegistry.map(tank => {
            const fishCount = livestock.filter(f => f.tankId === tank.placedId).reduce((s, f) => s + (f.quantity || 1), 0)
            const sickCount = livestock.filter(f => f.tankId === tank.placedId && (f.health === 'Sick' || f.health === 'Quarantine')).length
            return (
              <div key={tank.placedId} onClick={() => setSelectedTank(tank.placedId)}
                style={{ ...cardStyle, cursor: 'pointer', borderColor: selectedTank === tank.placedId ? '#4fc3f7' : '#0f3460' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#4fc3f7' }}>
                  {tank.nickname || tank.label}
                  {tank.nickname && <span style={{ fontSize: 10, color: '#666', marginLeft: 6 }}>{tank.label}</span>}
                </div>
                <div style={{ fontSize: 11, color: '#888' }}>
                  {tank.shelfUnit} · Shelf {tank.shelfTier}
                </div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                  {fishCount} fish/inverts
                  {sickCount > 0 && <span style={{ color: '#e53935', marginLeft: 6 }}>⚠️ {sickCount} sick</span>}
                </div>
              </div>
            )
          })}
        </div>

        {/* Tank detail */}
        <div style={{ flex: 1, minWidth: 300 }}>
          {!selectedTank ? (
            <div style={{ color: '#555', marginTop: 40, textAlign: 'center' }}>
              <p style={{ fontSize: 14 }}>Select a tank to manage livestock</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, color: '#4fc3f7', margin: 0 }}>
                  {selectedTankInfo?.nickname || selectedTankInfo?.label || 'Tank'}
                  <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>{selectedTankInfo?.gallons}g</span>
                </h3>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setShowDiseaseRef(!showDiseaseRef)} style={btnStyle}>Disease Ref</button>
                  <button onClick={() => setShowAddFish(!showAddFish)} style={btnStyle}>+ Add Fish</button>
                </div>
              </div>

              {/* Disease reference */}
              {showDiseaseRef && (
                <div style={{ ...cardStyle, marginBottom: 12 }}>
                  <h4 style={{ fontSize: 13, color: '#ff9800', margin: '0 0 8px' }}>Common Diseases & Treatments</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead><tr style={{ borderBottom: '1px solid #333' }}>
                      <th style={{ textAlign: 'left', padding: '3px 6px', color: '#888' }}>Disease</th>
                      <th style={{ textAlign: 'left', padding: '3px 6px', color: '#888' }}>Symptoms</th>
                      <th style={{ textAlign: 'left', padding: '3px 6px', color: '#888' }}>Treatment</th>
                    </tr></thead>
                    <tbody>{COMMON_DISEASES.map(d => (
                      <tr key={d.name} style={{ borderBottom: '1px solid #222' }}>
                        <td style={{ padding: '3px 6px', color: '#e0e0e0', fontWeight: 600 }}>{d.name}</td>
                        <td style={{ padding: '3px 6px', color: '#aaa' }}>{d.symptoms}</td>
                        <td style={{ padding: '3px 6px', color: '#4fc3f7' }}>{d.treatment}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}

              {/* Add fish form */}
              {showAddFish && (
                <div style={{ ...cardStyle, marginBottom: 12 }}>
                  <h4 style={{ fontSize: 13, color: '#4fc3f7', margin: '0 0 8px' }}>Add Fish / Invertebrate</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div><label style={{ fontSize: 10, color: '#888' }}>Common Name *</label><input style={inputStyle} value={form.commonName} onChange={e => setForm({ ...form, commonName: e.target.value })} placeholder="e.g. Neon Tetra" /></div>
                    <div><label style={{ fontSize: 10, color: '#888' }}>Scientific Name</label><input style={inputStyle} value={form.species} onChange={e => setForm({ ...form, species: e.target.value })} placeholder="e.g. Paracheirodon innesi" /></div>
                    <div><label style={{ fontSize: 10, color: '#888' }}>Quantity</label><input style={inputStyle} type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} /></div>
                    <div><label style={{ fontSize: 10, color: '#888' }}>Sex</label><select style={selectStyle} value={form.sex} onChange={e => setForm({ ...form, sex: e.target.value })}><option>Unknown</option><option>Male</option><option>Female</option><option>Mixed group</option></select></div>
                    <div><label style={{ fontSize: 10, color: '#888' }}>Size (current)</label><input style={inputStyle} value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} placeholder="e.g. 1.5 inches" /></div>
                    <div><label style={{ fontSize: 10, color: '#888' }}>Date Added</label><input style={inputStyle} type="date" value={form.dateAdded} onChange={e => setForm({ ...form, dateAdded: e.target.value })} /></div>
                    <div><label style={{ fontSize: 10, color: '#888' }}>Temperament</label><select style={selectStyle} value={form.temperament} onChange={e => setForm({ ...form, temperament: e.target.value })}>{TEMPERAMENTS.map(t => <option key={t}>{t}</option>)}</select></div>
                    <div><label style={{ fontSize: 10, color: '#888' }}>Diet</label><select style={selectStyle} value={form.diet} onChange={e => setForm({ ...form, diet: e.target.value })}>{DIETS.map(t => <option key={t}>{t}</option>)}</select></div>
                    <div><label style={{ fontSize: 10, color: '#888' }}>Health</label><select style={selectStyle} value={form.health} onChange={e => setForm({ ...form, health: e.target.value })}>{HEALTH.map(t => <option key={t}>{t}</option>)}</select></div>
                    <div><label style={{ fontSize: 10, color: '#888' }}>Breeding Status</label><select style={selectStyle} value={form.breeding} onChange={e => setForm({ ...form, breeding: e.target.value })}>{BREEDING.map(t => <option key={t}>{t}</option>)}</select></div>
                    <div><label style={{ fontSize: 10, color: '#888' }}>Source</label><input style={inputStyle} value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="e.g. PetSmart, local breeder" /></div>
                    <div><label style={{ fontSize: 10, color: '#888' }}>Foods</label><input style={inputStyle} value={form.foods} onChange={e => setForm({ ...form, foods: e.target.value })} placeholder="e.g. flakes, bloodworms, brine shrimp" /></div>
                    <div style={{ gridColumn: '1/-1' }}><label style={{ fontSize: 10, color: '#888' }}>Notes</label><input style={inputStyle} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any notes..." /></div>
                    <div><label style={{ fontSize: 10, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}><input type="checkbox" checked={form.copperSensitive} onChange={e => setForm({ ...form, copperSensitive: e.target.checked })} /> Copper sensitive (invertebrate)</label></div>
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                    <button onClick={addFish} style={btnStyle}>Add</button>
                    <button onClick={() => setShowAddFish(false)} style={{ ...btnStyle, background: 'transparent', color: '#888', border: '1px solid #333' }}>Cancel</button>
                  </div>
                </div>
              )}

              {/* Fish list */}
              {tankFish.length === 0 && !showAddFish && (
                <div style={{ color: '#555', fontSize: 13, marginTop: 20, textAlign: 'center' }}>No fish in this tank yet</div>
              )}
              {tankFish.map(fish => (
                <div key={fish.id} style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: fish.health === 'Sick' ? '#e53935' : fish.health === 'Quarantine' ? '#ff9800' : '#4fc3f7' }}>
                        {fish.commonName}
                      </span>
                      {fish.species && <span style={{ fontSize: 11, color: '#888', marginLeft: 6, fontStyle: 'italic' }}>{fish.species}</span>}
                      <span style={{ fontSize: 11, color: '#888', marginLeft: 6 }}>×{fish.quantity}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => setShowAddDisease(showAddDisease === fish.id ? null : fish.id)} style={{ ...btnStyle, fontSize: 10, padding: '2px 6px' }}>Log Disease</button>
                      <button onClick={() => removeFish(fish.id)} style={{ ...dangerBtn, fontSize: 10, padding: '2px 6px' }}>Remove</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4, fontSize: 11, color: '#aaa' }}>
                    <span>{fish.temperament}</span>
                    <span>{fish.diet}</span>
                    <span style={{ color: fish.health === 'Healthy' ? '#4adf80' : fish.health === 'Sick' ? '#e53935' : '#ff9800' }}>{fish.health}</span>
                    <span>{fish.breeding}</span>
                    {fish.size && <span>{fish.size}</span>}
                    {fish.sex !== 'Unknown' && <span>{fish.sex}</span>}
                  </div>
                  {fish.foods && <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>Foods: {fish.foods}</div>}
                  {fish.notes && <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>Notes: {fish.notes}</div>}
                  {fish.copperSensitive && <div style={{ fontSize: 10, color: '#ff9800', marginTop: 2 }}>⚠️ Copper sensitive</div>}
                  <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>Added: {fish.dateAdded}{fish.source && ` from ${fish.source}`}</div>

                  {/* Inline health update */}
                  <div style={{ marginTop: 6, display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: '#888' }}>Status:</span>
                    <select style={{ ...selectStyle, width: 'auto', fontSize: 10, padding: '2px 4px' }} value={fish.health} onChange={e => updateFish(fish.id, 'health', e.target.value)}>
                      {HEALTH.map(h => <option key={h}>{h}</option>)}
                    </select>
                    <select style={{ ...selectStyle, width: 'auto', fontSize: 10, padding: '2px 4px' }} value={fish.breeding} onChange={e => updateFish(fish.id, 'breeding', e.target.value)}>
                      {BREEDING.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>

                  {/* Disease log form */}
                  {showAddDisease === fish.id && (
                    <div style={{ marginTop: 8, padding: 8, background: '#0d1b2a', borderRadius: 4 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        <div><label style={{ fontSize: 9, color: '#888' }}>Disease</label><input style={inputStyle} value={diseaseForm.disease} onChange={e => setDiseaseForm({ ...diseaseForm, disease: e.target.value })} placeholder="e.g. Ich" /></div>
                        <div><label style={{ fontSize: 9, color: '#888' }}>Date</label><input style={inputStyle} type="date" value={diseaseForm.date} onChange={e => setDiseaseForm({ ...diseaseForm, date: e.target.value })} /></div>
                        <div><label style={{ fontSize: 9, color: '#888' }}>Symptoms</label><input style={inputStyle} value={diseaseForm.symptoms} onChange={e => setDiseaseForm({ ...diseaseForm, symptoms: e.target.value })} /></div>
                        <div><label style={{ fontSize: 9, color: '#888' }}>Treatment</label><input style={inputStyle} value={diseaseForm.treatment} onChange={e => setDiseaseForm({ ...diseaseForm, treatment: e.target.value })} /></div>
                        <div><label style={{ fontSize: 9, color: '#888' }}>Outcome</label><input style={inputStyle} value={diseaseForm.outcome} onChange={e => setDiseaseForm({ ...diseaseForm, outcome: e.target.value })} placeholder="Recovered, Ongoing, Deceased" /></div>
                        <div><label style={{ fontSize: 9, color: '#888' }}>Notes</label><input style={inputStyle} value={diseaseForm.notes} onChange={e => setDiseaseForm({ ...diseaseForm, notes: e.target.value })} /></div>
                      </div>
                      <button onClick={addDiseaseLog} style={{ ...btnStyle, marginTop: 6, fontSize: 10 }}>Save Disease Log</button>
                    </div>
                  )}
                </div>
              ))}

              {/* Disease history for this tank */}
              {tankDiseases.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <h4 style={{ fontSize: 13, color: '#ff9800', marginBottom: 6 }}>Disease History</h4>
                  {tankDiseases.map(d => (
                    <div key={d.id} style={{ ...cardStyle, borderColor: '#e53935', padding: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#e53935' }}>{d.disease} <span style={{ fontSize: 10, color: '#888', fontWeight: 400 }}>{d.date}</span></div>
                      {d.symptoms && <div style={{ fontSize: 10, color: '#aaa' }}>Symptoms: {d.symptoms}</div>}
                      {d.treatment && <div style={{ fontSize: 10, color: '#4fc3f7' }}>Treatment: {d.treatment}</div>}
                      {d.outcome && <div style={{ fontSize: 10, color: d.outcome === 'Recovered' ? '#4adf80' : '#ff9800' }}>Outcome: {d.outcome}</div>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
