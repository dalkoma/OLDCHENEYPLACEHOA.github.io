import { useState, useRef } from 'react'

const TANK_TYPES = [
  { id: '2.5g',        label: '2.5 Gallon',              gallons: 2.5,  w: 12, d: 6,  h: 8,  weight: 30,   equipClearance: 4,  color: '#4fc3f7' },
  { id: '5g',          label: '5 Gallon',                gallons: 5,    w: 16, d: 8,  h: 10, weight: 62,   equipClearance: 6,  color: '#29b6f6' },
  { id: '10g',         label: '10 Gallon',               gallons: 10,   w: 20, d: 10, h: 12, weight: 111,  equipClearance: 8,  color: '#039be5' },
  { id: '20g',         label: '20 Gallon High',          gallons: 20,   w: 24, d: 12, h: 16, weight: 225,  equipClearance: 8,  color: '#0277bd' },
  { id: '20g-breeder', label: '20 Gallon Breeder',       gallons: 20,   w: 24, d: 12, h: 12, weight: 225,  equipClearance: 8,  color: '#00838f' },
  { id: '29g',         label: '29 Gallon',               gallons: 29,   w: 30, d: 12, h: 18, weight: 330,  equipClearance: 8,  color: '#00695c' },
  { id: '33g',         label: '33 Gallon Long',          gallons: 33,   w: 36, d: 12, h: 12, weight: 382,  equipClearance: 8,  color: '#558b2f' },
  { id: '36g-bow',     label: '36g PetSmart Bow Front',  gallons: 36,   w: 30, d: 13, h: 22, weight: 415,  equipClearance: 8,  color: '#9e9d24' },
  { id: '40g',         label: '40 Gallon Long',          gallons: 40,   w: 48, d: 13, h: 16, weight: 458,  equipClearance: 8,  color: '#f9a825' },
  { id: '40g-breeder', label: '40 Gallon Breeder',       gallons: 40,   w: 36, d: 18, h: 16, weight: 458,  equipClearance: 8,  color: '#ff8f00' },
  { id: '55g',         label: '55 Gallon',               gallons: 55,   w: 48, d: 13, h: 21, weight: 625,  equipClearance: 10, color: '#e65100' },
  { id: '60g-breeder', label: '60 Gallon Breeder',       gallons: 60,   w: 48, d: 13, h: 16, weight: 680,  equipClearance: 10, color: '#bf360c' },
  { id: '125g',        label: '125 Gallon',              gallons: 125,  w: 72, d: 18, h: 21, weight: 1400, equipClearance: 10, color: '#b71c1c' },
]

const SHELF_TYPES = [
  {
    id: '48-zbeam',
    label: 'Gorilla Rack Z-Beam 5-Shelf (48″×24″×72″)',
    width: 48, depth: 24, height: 72, shelves: 5,
    weightPerShelf: 500, totalWeight: 2500,
    bottomClearance: 0, shelfThickness: 1.5, boardThickness: 0, boardWeight: 0,
  },
  {
    id: '77-industrial',
    label: 'Gorilla Rack Industrial (77″×24″×72″)',
    width: 77, depth: 24, height: 72, shelves: 5,
    weightPerShelf: 500, totalWeight: 2500,
    bottomClearance: 6, shelfThickness: 1.5, boardThickness: 0.75, boardWeight: 35,
  },
]

let nextId = Date.now()

export { TANK_TYPES }

export default function ShelfOrganizer({ tankRegistry, setTankRegistry }) {
  const [shelfUnits, setShelfUnits] = useState(() => {
    try { const v = localStorage.getItem('ftm-shelves'); return v ? JSON.parse(v) : [] } catch { return [] }
  })
  const [dragItem, setDragItem] = useState(null)
  const [dragOverTarget, setDragOverTarget] = useState(null)
  const [showEquipClearance, setShowEquipClearance] = useState(true)
  const dragCounter = useRef({})

  const persistShelves = (units) => {
    setShelfUnits(units)
    localStorage.setItem('ftm-shelves', JSON.stringify(units))
    // Sync tank registry
    const allTanks = []
    units.forEach(unit => {
      unit.tiers.forEach(tier => {
        tier.tanks.forEach(tank => {
          allTanks.push({
            placedId: tank.placedId,
            tankType: tank.id,
            label: tank.label,
            gallons: tank.gallons,
            shelfUnit: unit.label,
            shelfTier: tier.id + 1,
            nickname: tank.nickname || '',
          })
        })
      })
    })
    setTankRegistry(allTanks)
  }

  const addShelfUnit = (shelfType) => {
    const totalThickness = shelfType.shelfThickness + shelfType.boardThickness
    const usableHeight = shelfType.height - shelfType.bottomClearance
    const spacing = usableHeight / shelfType.shelves
    const unit = {
      ...shelfType, uid: nextId++,
      tiers: Array.from({ length: shelfType.shelves }, (_, i) => ({
        id: i, tanks: [], enabled: true,
        clearance: Math.round((spacing - totalThickness) * 10) / 10,
      })),
    }
    persistShelves([...shelfUnits, unit])
  }

  const removeShelfUnit = (uid) => persistShelves(shelfUnits.filter(u => u.uid !== uid))

  const toggleTier = (uid, tierId) => {
    persistShelves(shelfUnits.map(u => {
      if (u.uid !== uid) return u
      return { ...u, tiers: u.tiers.map(t => t.id !== tierId ? t : { ...t, enabled: !t.enabled, tanks: t.enabled ? [] : t.tanks }) }
    }))
  }

  const handleDragStart = (e, tankType, source) => {
    setDragItem({ tankType, source })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', tankType.id)
  }
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }
  const handleDragEnterTier = (e, unitUid, tierId) => {
    e.preventDefault()
    const key = `${unitUid}-${tierId}`
    dragCounter.current[key] = (dragCounter.current[key] || 0) + 1
    setDragOverTarget({ unitUid, tierId })
  }
  const handleDragLeaveTier = (e, unitUid, tierId) => {
    const key = `${unitUid}-${tierId}`
    dragCounter.current[key] = (dragCounter.current[key] || 0) - 1
    if (dragCounter.current[key] <= 0) {
      dragCounter.current[key] = 0
      if (dragOverTarget?.unitUid === unitUid && dragOverTarget?.tierId === tierId) setDragOverTarget(null)
    }
  }

  const handleDropOnTier = (e, unitUid, tierId) => {
    e.preventDefault(); dragCounter.current = {}; setDragOverTarget(null)
    if (!dragItem) return
    const { tankType, source } = dragItem
    let units = shelfUnits.map(u => ({ ...u, tiers: u.tiers.map(t => ({ ...t, tanks: [...t.tanks] })) }))
    if (source) {
      const srcUnit = units.find(u => u.uid === source.unitUid)
      if (srcUnit) { const srcTier = srcUnit.tiers.find(t => t.id === source.tierId); if (srcTier) srcTier.tanks = srcTier.tanks.filter(t => t.placedId !== source.placedId) }
    }
    const tgtUnit = units.find(u => u.uid === unitUid)
    if (tgtUnit) { const tgtTier = tgtUnit.tiers.find(t => t.id === tierId); if (tgtTier) tgtTier.tanks.push({ ...tankType, placedId: nextId++ }) }
    persistShelves(units)
    setDragItem(null)
  }

  const handleDropOnTrash = (e) => {
    e.preventDefault(); dragCounter.current = {}; setDragOverTarget(null)
    if (!dragItem?.source) { setDragItem(null); return }
    const { source } = dragItem
    persistShelves(shelfUnits.map(u => {
      if (u.uid !== source.unitUid) return u
      return { ...u, tiers: u.tiers.map(t => t.id !== source.tierId ? t : { ...t, tanks: t.tanks.filter(tk => tk.placedId !== source.placedId) }) }
    }))
    setDragItem(null)
  }

  const getTierWeight = (tanks) => tanks.reduce((s, t) => s + t.weight, 0)
  const getTierWidth = (tanks) => tanks.reduce((s, t) => s + t.w, 0)
  const getTierMaxHeight = (tanks, withEquip) => !tanks.length ? 0 : Math.max(...tanks.map(t => t.h + (withEquip ? t.equipClearance : 0)))
  const getUnitTankWeight = (unit) => unit.tiers.filter(t => t.enabled).reduce((s, t) => s + getTierWeight(t.tanks), 0)
  const getUnitBoardWeight = (unit) => unit.tiers.filter(t => t.enabled).length * unit.boardWeight
  const getUnitTotalWeight = (unit) => getUnitTankWeight(unit) + getUnitBoardWeight(unit)
  const getEffectiveShelfCapacity = (unit) => unit.weightPerShelf - unit.boardWeight
  const PPI = 3.2

  return (
    <div style={{ display: 'flex', gap: 0, minHeight: 'calc(100vh - 90px)' }}>
      {/* Tank Palette */}
      <div style={{ width: 220, minWidth: 220, background: '#16213e', borderRight: '2px solid #0f3460', padding: 12, overflowY: 'auto' }}>
        <h3 style={{ fontSize: 13, marginBottom: 8, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1 }}>Tank Palette</h3>
        <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
          {SHELF_TYPES.map(st => (
            <button key={st.id} onClick={() => addShelfUnit(st)} style={{ padding: '6px 10px', background: '#0f3460', color: '#4fc3f7', border: '1px solid #4fc3f7', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
              + {st.width}″ Shelf
            </button>
          ))}
        </div>
        <label style={{ fontSize: 11, color: '#666', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', marginBottom: 8 }}>
          <input type="checkbox" checked={showEquipClearance} onChange={() => setShowEquipClearance(v => !v)} />
          Equipment clearance
        </label>
        {TANK_TYPES.map(tank => (
          <div key={tank.id} draggable onDragStart={(e) => handleDragStart(e, tank, null)}
            style={{ background: '#1a1a2e', border: `2px solid ${tank.color}`, borderRadius: 6, padding: '6px 8px', marginBottom: 4, cursor: 'grab', userSelect: 'none' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: tank.color }}>{tank.label}</div>
            <div style={{ fontSize: 10, color: '#888' }}>{tank.w}″×{tank.d}″×{tank.h}″ · {tank.weight}lb · +{tank.equipClearance}″ equip</div>
          </div>
        ))}
        <div onDragOver={handleDragOver} onDrop={handleDropOnTrash}
          style={{ marginTop: 12, padding: 12, border: '2px dashed #e53935', borderRadius: 8, textAlign: 'center', color: '#e53935', fontSize: 12, fontWeight: 600, opacity: dragItem?.source ? 1 : 0.3 }}>
          Drop to remove
        </div>
      </div>

      {/* Main Area */}
      <div style={{ flex: 1, padding: 16, overflowX: 'auto', overflowY: 'auto' }}>
        {shelfUnits.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 80, color: '#555' }}>
            <p style={{ fontSize: 16, marginBottom: 8 }}>No shelves added yet</p>
            <p style={{ fontSize: 13 }}>Add a shelf from the left panel to get started</p>
          </div>
        )}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {shelfUnits.map(unit => {
            const unitTotalWeight = getUnitTotalWeight(unit)
            const unitOverweight = unitTotalWeight > unit.totalWeight
            const effectiveCap = getEffectiveShelfCapacity(unit)
            return (
              <div key={unit.uid} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6, gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#4fc3f7' }}>{unit.label}</div>
                    <div style={{ fontSize: 11, color: unitOverweight ? '#e53935' : '#888' }}>
                      {unitTotalWeight} / {unit.totalWeight} lbs {unitOverweight && '⚠️'}
                      {unit.boardWeight > 0 && <> · Board: {getUnitBoardWeight(unit)}lb</>}
                    </div>
                    <div style={{ fontSize: 10, color: '#666' }}>
                      {unit.shelfThickness + unit.boardThickness}″ thick · {unit.depth}″ deep · ~{unit.tiers[0]?.clearance}″ clear
                    </div>
                  </div>
                  <button onClick={() => removeShelfUnit(unit.uid)} style={{ background: '#e53935', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontSize: 11 }}>Remove</button>
                </div>
                <div style={{ position: 'relative', width: unit.width * PPI + 16, background: '#0d1b2a', border: '3px solid #555', borderRadius: 4, padding: '4px 8px' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, background: '#666', borderRadius: '4px 0 0 4px' }} />
                  <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 6, background: '#666', borderRadius: '0 4px 4px 0' }} />
                  {unit.tiers.map((tier, idx) => {
                    const tierWeight = getTierWeight(tier.tanks)
                    const tierWidth = getTierWidth(tier.tanks)
                    const overWeight = tierWeight > effectiveCap
                    const overWidth = tierWidth > unit.width
                    const tierMaxH = getTierMaxHeight(tier.tanks, false)
                    const tierMaxHE = getTierMaxHeight(tier.tanks, true)
                    const hExceed = tierMaxH > tier.clearance
                    const hExceedE = tierMaxHE > tier.clearance && showEquipClearance
                    const isTarget = tier.enabled && dragOverTarget?.unitUid === unit.uid && dragOverTarget?.tierId === tier.id
                    const tierDisplayH = tier.enabled ? Math.max(tierMaxH * PPI, 45) : 8
                    return (
                      <div key={tier.id}>
                        <div
                          onDragOver={tier.enabled ? handleDragOver : undefined}
                          onDragEnter={tier.enabled ? (e) => handleDragEnterTier(e, unit.uid, tier.id) : undefined}
                          onDragLeave={tier.enabled ? (e) => handleDragLeaveTier(e, unit.uid, tier.id) : undefined}
                          onDrop={tier.enabled ? (e) => handleDropOnTier(e, unit.uid, tier.id) : undefined}
                          style={{ minHeight: tierDisplayH, display: 'flex', alignItems: tier.enabled ? 'flex-end' : 'center', gap: 2, padding: '4px 2px 4px 6px', background: !tier.enabled ? 'rgba(255,255,255,0.02)' : isTarget ? 'rgba(79,195,247,0.1)' : 'transparent', flexWrap: 'wrap', position: 'relative', opacity: tier.enabled ? 1 : 0.5 }}>
                          <div style={{ position: 'absolute', top: 2, right: 8, fontSize: 9, color: '#555', display: 'flex', alignItems: 'center', gap: 4, zIndex: 1 }}>
                            {tier.enabled && <span style={{ color: hExceed ? '#e53935' : hExceedE ? '#ff9800' : '#555' }}>{tier.clearance}″</span>}
                            <span>S{idx + 1}</span>
                            <button onClick={() => toggleTier(unit.uid, tier.id)} style={{ background: tier.enabled ? '#333' : '#0f3460', color: tier.enabled ? '#e53935' : '#4fc3f7', border: `1px solid ${tier.enabled ? '#e53935' : '#4fc3f7'}`, borderRadius: 3, padding: '0 5px', cursor: 'pointer', fontSize: 8, fontWeight: 600, lineHeight: '13px' }}>
                              {tier.enabled ? '−' : '+'}
                            </button>
                          </div>
                          {tier.enabled && tier.tanks.length === 0 && !isTarget && <div style={{ width: '100%', textAlign: 'center', color: '#444', fontSize: 11, padding: 6 }}>Drop tanks here</div>}
                          {!tier.enabled && <div style={{ width: '100%', textAlign: 'center', color: '#444', fontSize: 10, fontStyle: 'italic' }}>removed</div>}
                          {tier.enabled && tier.tanks.map(tank => {
                            const dOver = tank.d > unit.depth
                            return (
                              <div key={tank.placedId} draggable onDragStart={(e) => handleDragStart(e, tank, { unitUid: unit.uid, tierId: tier.id, placedId: tank.placedId })}
                                style={{ width: tank.w * PPI, height: tank.h * PPI, background: `${tank.color}33`, border: `2px solid ${dOver ? '#e53935' : tank.color}`, borderRadius: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'grab', userSelect: 'none', fontSize: Math.min(10, Math.max(7, tank.w * PPI / 9)), lineHeight: 1.2, color: tank.color, fontWeight: 600, overflow: 'hidden', flexShrink: 0, position: 'relative' }}
                                title={`${tank.label}\n${tank.w}″×${tank.d}″×${tank.h}″\n${tank.weight}lb filled`}>
                                <span>{tank.label}</span>
                                <span style={{ fontSize: Math.min(8, Math.max(6, tank.w * PPI / 11)), opacity: 0.7 }}>{tank.weight}lb</span>
                                {dOver && <span style={{ fontSize: 7, color: '#e53935' }}>depth!</span>}
                                {showEquipClearance && <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, height: tank.equipClearance * PPI, background: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,165,0,0.15) 3px, rgba(255,165,0,0.15) 6px)', borderTop: '1px dashed rgba(255,165,0,0.3)', pointerEvents: 'none' }} />}
                              </div>
                            )
                          })}
                        </div>
                        {tier.enabled && unit.boardThickness > 0 && <div style={{ height: Math.max(unit.boardThickness * PPI, 3), background: overWeight || overWidth ? '#c62828' : '#a67c52', borderRadius: 1 }} />}
                        {tier.enabled && <div style={{ height: Math.max(unit.shelfThickness * PPI, 4), background: overWeight || overWidth ? '#e53935' : '#888', borderRadius: 1, position: 'relative' }}>
                          {tier.tanks.length > 0 && <div style={{ position: 'absolute', bottom: -14, left: 6, fontSize: 9, color: overWeight || overWidth || hExceed ? '#e53935' : hExceedE ? '#ff9800' : '#666', whiteSpace: 'nowrap' }}>
                            {tierWeight}/{effectiveCap}lb · {tierWidth}/{unit.width}″W
                            {overWeight && ' ⚠️'}{overWidth && ' ⚠️WIDE'}
                            {hExceed && ` ⚠️TALL`}{!hExceed && hExceedE && ` ⚠️equip`}
                          </div>}
                        </div>}
                        {tier.enabled && tier.tanks.length > 0 && <div style={{ height: 16 }} />}
                      </div>
                    )
                  })}
                  {unit.bottomClearance > 0 && (
                    <div style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 2px' }}>
                        {[0,1,2,3].map(l => <div key={l} style={{ width: 8, height: unit.bottomClearance * PPI, background: '#666', borderRadius: '0 0 2px 2px' }} />)}
                      </div>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 9, color: '#555', whiteSpace: 'nowrap' }}>{unit.bottomClearance}″ off ground</div>
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 6, fontSize: 10, color: '#888' }}>
                  Floor: {unitTotalWeight}lb · {unitTotalWeight > 0 ? Math.round(unitTotalWeight / ((unit.width * unit.depth) / 144)) : 0} lb/ft²
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
