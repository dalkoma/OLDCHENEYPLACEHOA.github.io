import { useState, useRef } from 'react'

// Standard aquarium dimensions and filled weights (water + tank + substrate + equipment estimate)
// Heights include the tank itself; equipmentClearance is extra space needed above for HOB filter, lid, light
const TANK_TYPES = [
  { id: '2.5g',        label: '2.5 Gallon',              w: 12, d: 6,  h: 8,  weight: 30,   equipClearance: 4,  color: '#4fc3f7' },
  { id: '5g',          label: '5 Gallon',                w: 16, d: 8,  h: 10, weight: 62,   equipClearance: 6,  color: '#29b6f6' },
  { id: '10g',         label: '10 Gallon',               w: 20, d: 10, h: 12, weight: 111,  equipClearance: 8,  color: '#039be5' },
  { id: '20g',         label: '20 Gallon High',          w: 24, d: 12, h: 16, weight: 225,  equipClearance: 8,  color: '#0277bd' },
  { id: '20g-breeder', label: '20 Gallon Breeder',       w: 24, d: 12, h: 12, weight: 225,  equipClearance: 8,  color: '#00838f' },
  { id: '29g',         label: '29 Gallon',               w: 30, d: 12, h: 18, weight: 330,  equipClearance: 8,  color: '#00695c' },
  { id: '33g',         label: '33 Gallon Long',          w: 36, d: 12, h: 12, weight: 382,  equipClearance: 8,  color: '#558b2f' },
  { id: '36g-bow',     label: '36g PetSmart Bow Front',  w: 30, d: 13, h: 22, weight: 415,  equipClearance: 8,  color: '#9e9d24' },
  { id: '40g',         label: '40 Gallon Long',          w: 48, d: 13, h: 16, weight: 458,  equipClearance: 8,  color: '#f9a825' },
  { id: '40g-breeder', label: '40 Gallon Breeder',       w: 36, d: 18, h: 16, weight: 458,  equipClearance: 8,  color: '#ff8f00' },
  { id: '55g',         label: '55 Gallon',               w: 48, d: 13, h: 21, weight: 625,  equipClearance: 10, color: '#e65100' },
  { id: '60g-breeder', label: '60 Gallon Breeder',       w: 48, d: 13, h: 16, weight: 680,  equipClearance: 10, color: '#bf360c' },
  { id: '125g',        label: '125 Gallon',              w: 72, d: 18, h: 21, weight: 1400, equipClearance: 10, color: '#b71c1c' },
]

const SHELF_TYPES = [
  {
    id: '48-zbeam',
    label: 'Gorilla Rack Z-Beam 5-Shelf (48″×24″×72″)',
    width: 48,
    depth: 24,
    height: 72,
    shelves: 5,
    weightPerShelf: 500,
    totalWeight: 2500,
    bottomClearance: 0,    // bottom shelf sits on floor
    shelfThickness: 1.5,   // steel shelf deck ~1.5″
    boardThickness: 0,     // no added board needed (solid shelves)
    boardWeight: 0,
  },
  {
    id: '77-industrial',
    label: 'Gorilla Rack Industrial (77″×24″×72″)',
    width: 77,
    depth: 24,
    height: 72,
    shelves: 5,
    weightPerShelf: 500,
    totalWeight: 2500,
    bottomClearance: 6,    // bottom shelf raised ~6″ off ground on legs
    shelfThickness: 1.5,   // wire shelf frame ~1.5″
    boardThickness: 0.75,  // 3/4″ TigerPly birch plywood on each shelf
    boardWeight: 35,       // ~35 lbs per 3/4″ birch ply sheet cut to 77×24
  },
]

let nextId = 1

export default function FishTankOrganizer() {
  const [shelfUnits, setShelfUnits] = useState([])
  const [dragItem, setDragItem] = useState(null)
  const [dragOverTarget, setDragOverTarget] = useState(null)
  const [showEquipClearance, setShowEquipClearance] = useState(true)
  const dragCounter = useRef({})

  const addShelfUnit = (shelfType) => {
    const totalThickness = shelfType.shelfThickness + shelfType.boardThickness
    // Evenly space shelves within the usable height
    const usableHeight = shelfType.height - shelfType.bottomClearance
    const spacing = usableHeight / shelfType.shelves

    const unit = {
      ...shelfType,
      uid: nextId++,
      tiers: Array.from({ length: shelfType.shelves }, (_, i) => ({
        id: i,
        tanks: [],
        enabled: true,
        // clearance = space between top of this shelf's board/frame and bottom of shelf above
        // For the top shelf, clearance is space to the top of the unit
        clearance: Math.round((spacing - totalThickness) * 10) / 10,
      })),
    }
    setShelfUnits(prev => [...prev, unit])
  }

  const removeShelfUnit = (uid) => {
    setShelfUnits(prev => prev.filter(u => u.uid !== uid))
  }

  const toggleTier = (uid, tierId) => {
    setShelfUnits(prev => prev.map(u => {
      if (u.uid !== uid) return u
      return {
        ...u,
        tiers: u.tiers.map(t => {
          if (t.id !== tierId) return t
          return { ...t, enabled: !t.enabled, tanks: t.enabled ? [] : t.tanks }
        })
      }
    }))
  }

  const handleDragStart = (e, tankType, source) => {
    setDragItem({ tankType, source })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', tankType.id)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

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
      if (dragOverTarget?.unitUid === unitUid && dragOverTarget?.tierId === tierId) {
        setDragOverTarget(null)
      }
    }
  }

  const handleDropOnTier = (e, unitUid, tierId) => {
    e.preventDefault()
    dragCounter.current = {}
    setDragOverTarget(null)
    if (!dragItem) return

    const { tankType, source } = dragItem

    setShelfUnits(prev => {
      let units = prev.map(u => ({ ...u, tiers: u.tiers.map(t => ({ ...t, tanks: [...t.tanks] })) }))

      if (source) {
        const srcUnit = units.find(u => u.uid === source.unitUid)
        if (srcUnit) {
          const srcTier = srcUnit.tiers.find(t => t.id === source.tierId)
          if (srcTier) {
            srcTier.tanks = srcTier.tanks.filter(t => t.placedId !== source.placedId)
          }
        }
      }

      const tgtUnit = units.find(u => u.uid === unitUid)
      if (tgtUnit) {
        const tgtTier = tgtUnit.tiers.find(t => t.id === tierId)
        if (tgtTier) {
          tgtTier.tanks.push({ ...tankType, placedId: nextId++ })
        }
      }
      return units
    })
    setDragItem(null)
  }

  const handleDropOnTrash = (e) => {
    e.preventDefault()
    dragCounter.current = {}
    setDragOverTarget(null)
    if (!dragItem?.source) { setDragItem(null); return }
    const { source } = dragItem
    setShelfUnits(prev => {
      return prev.map(u => {
        if (u.uid !== source.unitUid) return u
        return {
          ...u,
          tiers: u.tiers.map(t => {
            if (t.id !== source.tierId) return t
            return { ...t, tanks: t.tanks.filter(tk => tk.placedId !== source.placedId) }
          })
        }
      })
    })
    setDragItem(null)
  }

  const getTierWeight = (tanks) => tanks.reduce((s, t) => s + t.weight, 0)
  const getTierWidth = (tanks) => tanks.reduce((s, t) => s + t.w, 0)
  const getTierMaxDepth = (tanks) => tanks.length ? Math.max(...tanks.map(t => t.d)) : 0
  const getTierMaxHeight = (tanks, withEquip) => {
    if (!tanks.length) return 0
    return Math.max(...tanks.map(t => t.h + (withEquip ? t.equipClearance : 0)))
  }
  const getUnitTankWeight = (unit) => unit.tiers.filter(t => t.enabled).reduce((s, t) => s + getTierWeight(t.tanks), 0)
  const getUnitBoardWeight = (unit) => unit.tiers.filter(t => t.enabled).length * unit.boardWeight
  const getUnitTotalWeight = (unit) => getUnitTankWeight(unit) + getUnitBoardWeight(unit)

  // Effective weight capacity per shelf after subtracting board weight
  const getEffectiveShelfCapacity = (unit) => unit.weightPerShelf - unit.boardWeight

  const PPI = 3.2

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a2e', color: '#e0e0e0', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#16213e', padding: '16px 20px', borderBottom: '2px solid #0f3460', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ fontSize: 22, margin: 0, color: '#4fc3f7' }}>🐟 Fish Tank Shelf Organizer</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
            <input type="checkbox" checked={showEquipClearance} onChange={() => setShowEquipClearance(v => !v)} />
            Show equipment clearance
          </label>
          {SHELF_TYPES.map(st => (
            <button
              key={st.id}
              onClick={() => addShelfUnit(st)}
              style={{ padding: '8px 14px', background: '#0f3460', color: '#4fc3f7', border: '1px solid #4fc3f7', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >
              + Add {st.width}″ Shelf
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 0, minHeight: 'calc(100vh - 60px)' }}>
        {/* Tank Palette */}
        <div style={{ width: 230, minWidth: 230, background: '#16213e', borderRight: '2px solid #0f3460', padding: 12, overflowY: 'auto' }}>
          <h3 style={{ fontSize: 14, marginBottom: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1 }}>Tank Palette</h3>
          <p style={{ fontSize: 11, color: '#666', marginBottom: 12 }}>Drag tanks onto shelves</p>
          {TANK_TYPES.map(tank => (
            <div
              key={tank.id}
              draggable
              onDragStart={(e) => handleDragStart(e, tank, null)}
              style={{
                background: '#1a1a2e',
                border: `2px solid ${tank.color}`,
                borderRadius: 6,
                padding: '8px 10px',
                marginBottom: 6,
                cursor: 'grab',
                userSelect: 'none',
                transition: 'transform 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: tank.color }}>{tank.label}</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                {tank.w}″×{tank.d}″×{tank.h}″ &nbsp;·&nbsp; {tank.weight} lbs
              </div>
              <div style={{ fontSize: 10, color: '#666', marginTop: 1 }}>
                +{tank.equipClearance}″ above for lid/filter/light
              </div>
            </div>
          ))}

          {/* Trash zone */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDropOnTrash}
            style={{
              marginTop: 20,
              padding: 16,
              border: '2px dashed #e53935',
              borderRadius: 8,
              textAlign: 'center',
              color: '#e53935',
              fontSize: 13,
              fontWeight: 600,
              opacity: dragItem?.source ? 1 : 0.3,
              transition: 'opacity 0.2s',
            }}
          >
            🗑️ Drop here to remove
          </div>
        </div>

        {/* Main Area */}
        <div style={{ flex: 1, padding: 20, overflowX: 'auto', overflowY: 'auto' }}>
          {shelfUnits.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: 100, color: '#555' }}>
              <p style={{ fontSize: 18, marginBottom: 8 }}>No shelves added yet</p>
              <p style={{ fontSize: 14 }}>Click "Add Shelf" above to get started</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {shelfUnits.map(unit => {
              const unitTankWeight = getUnitTankWeight(unit)
              const unitBoardWeight = getUnitBoardWeight(unit)
              const unitTotalWeight = getUnitTotalWeight(unit)
              const unitOverweight = unitTotalWeight > unit.totalWeight
              const enabledTiers = unit.tiers.filter(t => t.enabled).length
              const effectiveCap = getEffectiveShelfCapacity(unit)

              return (
                <div key={unit.uid} style={{ marginBottom: 24 }}>
                  {/* Unit header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#4fc3f7' }}>{unit.label}</div>
                      <div style={{ fontSize: 12, color: unitOverweight ? '#e53935' : '#888' }}>
                        Tank weight: {unitTankWeight} lbs
                        {unitBoardWeight > 0 && <> &nbsp;·&nbsp; Board weight: {unitBoardWeight} lbs ({enabledTiers} × {unit.boardWeight} lbs)</>}
                      </div>
                      <div style={{ fontSize: 12, color: unitOverweight ? '#e53935' : '#888', fontWeight: unitOverweight ? 700 : 400 }}>
                        Total on unit: {unitTotalWeight} / {unit.totalWeight} lbs
                        {unitOverweight && ' ⚠️ OVER WEIGHT!'}
                      </div>
                      <div style={{ fontSize: 11, color: '#666' }}>
                        Shelf: {unit.shelfThickness}″ frame
                        {unit.boardThickness > 0 && <> + {unit.boardThickness}″ plywood = {unit.shelfThickness + unit.boardThickness}″ thick</>}
                        {unit.boardWeight > 0 && <> &nbsp;·&nbsp; Usable capacity/shelf: {effectiveCap} lbs</>}
                      </div>
                      <div style={{ fontSize: 11, color: '#666' }}>
                        Shelf depth: {unit.depth}″ &nbsp;·&nbsp; Clearance between tiers: ~{unit.tiers[0]?.clearance}″
                      </div>
                    </div>
                    <button
                      onClick={() => removeShelfUnit(unit.uid)}
                      style={{ background: '#e53935', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }}
                    >
                      Remove Unit
                    </button>
                  </div>

                  {/* Shelf visual */}
                  <div style={{
                    position: 'relative',
                    width: unit.width * PPI + 16,
                    background: '#0d1b2a',
                    border: '3px solid #555',
                    borderRadius: 4,
                    padding: '4px 8px',
                  }}>
                    {/* Vertical posts */}
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, background: '#666', borderRadius: '4px 0 0 4px' }} />
                    <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 6, background: '#666', borderRadius: '0 4px 4px 0' }} />

                    {unit.tiers.map((tier, idx) => {
                      const tierWeight = getTierWeight(tier.tanks)
                      const tierTotalWeight = tierWeight + (tier.enabled ? unit.boardWeight : 0)
                      const tierWidth = getTierWidth(tier.tanks)
                      const overWeight = tierWeight > effectiveCap
                      const overWidth = tierWidth > unit.width
                      const tierMaxH = getTierMaxHeight(tier.tanks, false)
                      const tierMaxHWithEquip = getTierMaxHeight(tier.tanks, true)
                      const heightExceedsClearance = tierMaxHWithEquip > tier.clearance && showEquipClearance
                      const heightExceedsWithoutEquip = tierMaxH > tier.clearance
                      const depthIssue = tier.tanks.some(t => t.d > unit.depth)
                      const isTarget = tier.enabled && dragOverTarget?.unitUid === unit.uid && dragOverTarget?.tierId === tier.id
                      const minTierPx = 50
                      const tierDisplayH = tier.enabled ? Math.max(tierMaxH * PPI, minTierPx) : 8

                      return (
                        <div key={tier.id}>
                          {/* Drop zone / tier */}
                          <div
                            onDragOver={tier.enabled ? handleDragOver : undefined}
                            onDragEnter={tier.enabled ? (e) => handleDragEnterTier(e, unit.uid, tier.id) : undefined}
                            onDragLeave={tier.enabled ? (e) => handleDragLeaveTier(e, unit.uid, tier.id) : undefined}
                            onDrop={tier.enabled ? (e) => handleDropOnTier(e, unit.uid, tier.id) : undefined}
                            style={{
                              minHeight: tierDisplayH,
                              display: 'flex',
                              alignItems: tier.enabled ? 'flex-end' : 'center',
                              gap: 2,
                              padding: '4px 2px',
                              paddingLeft: 6,
                              background: !tier.enabled ? 'rgba(255,255,255,0.02)' : isTarget ? 'rgba(79, 195, 247, 0.1)' : 'transparent',
                              transition: 'background 0.15s',
                              flexWrap: 'wrap',
                              position: 'relative',
                              opacity: tier.enabled ? 1 : 0.5,
                            }}
                          >
                            {/* Tier label + toggle + clearance */}
                            <div style={{
                              position: 'absolute', top: 2, right: 8, fontSize: 10, color: '#555',
                              display: 'flex', alignItems: 'center', gap: 6, zIndex: 1,
                            }}>
                              {tier.enabled && (
                                <span style={{ color: heightExceedsWithoutEquip ? '#e53935' : heightExceedsClearance ? '#ff9800' : '#555' }}>
                                  {tier.clearance}″ clear
                                </span>
                              )}
                              <span>Shelf {idx + 1}</span>
                              <button
                                onClick={() => toggleTier(unit.uid, tier.id)}
                                style={{
                                  background: tier.enabled ? '#333' : '#0f3460',
                                  color: tier.enabled ? '#e53935' : '#4fc3f7',
                                  border: `1px solid ${tier.enabled ? '#e53935' : '#4fc3f7'}`,
                                  borderRadius: 3,
                                  padding: '1px 6px',
                                  cursor: 'pointer',
                                  fontSize: 9,
                                  fontWeight: 600,
                                  lineHeight: '14px',
                                }}
                              >
                                {tier.enabled ? 'Remove' : 'Add'}
                              </button>
                            </div>

                            {tier.enabled && tier.tanks.length === 0 && !isTarget && (
                              <div style={{ width: '100%', textAlign: 'center', color: '#444', fontSize: 12, padding: 8 }}>
                                Drop tanks here
                              </div>
                            )}

                            {!tier.enabled && (
                              <div style={{ width: '100%', textAlign: 'center', color: '#444', fontSize: 11, fontStyle: 'italic' }}>
                                shelf removed
                              </div>
                            )}

                            {tier.enabled && tier.tanks.map(tank => {
                              const tankDepthOver = tank.d > unit.depth
                              return (
                                <div
                                  key={tank.placedId}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, tank, { unitUid: unit.uid, tierId: tier.id, placedId: tank.placedId })}
                                  style={{
                                    width: tank.w * PPI,
                                    height: tank.h * PPI,
                                    background: `${tank.color}33`,
                                    border: `2px solid ${tankDepthOver ? '#e53935' : tank.color}`,
                                    borderRadius: 3,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'grab',
                                    userSelect: 'none',
                                    fontSize: Math.min(11, Math.max(8, tank.w * PPI / 8)),
                                    lineHeight: 1.2,
                                    color: tank.color,
                                    fontWeight: 600,
                                    overflow: 'hidden',
                                    flexShrink: 0,
                                    position: 'relative',
                                  }}
                                  title={`${tank.label}\n${tank.w}″W × ${tank.d}″D × ${tank.h}″H\n${tank.weight} lbs filled\n+${tank.equipClearance}″ equipment clearance\nTotal height needed: ${tank.h + tank.equipClearance}″${tankDepthOver ? `\n⚠️ ${tank.d}″ deep — exceeds ${unit.depth}″ shelf depth!` : ''}`}
                                >
                                  <span>{tank.label}</span>
                                  <span style={{ fontSize: Math.min(9, Math.max(7, tank.w * PPI / 10)), opacity: 0.7 }}>{tank.weight}lb</span>
                                  {tankDepthOver && <span style={{ fontSize: 8, color: '#e53935' }}>depth!</span>}
                                  {/* Equipment clearance zone */}
                                  {showEquipClearance && (
                                    <div style={{
                                      position: 'absolute',
                                      bottom: '100%',
                                      left: 0,
                                      right: 0,
                                      height: tank.equipClearance * PPI,
                                      background: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,165,0,0.15) 3px, rgba(255,165,0,0.15) 6px)',
                                      borderTop: '1px dashed rgba(255,165,0,0.4)',
                                      pointerEvents: 'none',
                                    }} />
                                  )}
                                </div>
                              )
                            })}
                          </div>

                          {/* Plywood board (if present and shelf enabled) */}
                          {tier.enabled && unit.boardThickness > 0 && (
                            <div style={{
                              height: Math.max(unit.boardThickness * PPI, 3),
                              background: overWeight || overWidth ? '#c62828' : '#a67c52',
                              borderRadius: 1,
                            }} />
                          )}

                          {/* Shelf frame */}
                          {tier.enabled && (
                            <div style={{
                              height: Math.max(unit.shelfThickness * PPI, 4),
                              background: overWeight || overWidth ? '#e53935' : '#888',
                              borderRadius: 1,
                              position: 'relative',
                            }}>
                              {tier.tanks.length > 0 && (
                                <div style={{
                                  position: 'absolute',
                                  bottom: -16,
                                  left: 8,
                                  fontSize: 10,
                                  color: overWeight || overWidth || depthIssue || heightExceedsWithoutEquip ? '#e53935' : heightExceedsClearance ? '#ff9800' : '#666',
                                  whiteSpace: 'nowrap',
                                }}>
                                  {tierWeight}lb / {effectiveCap}lb
                                  &nbsp;·&nbsp;
                                  {tierWidth}″ / {unit.width}″W
                                  &nbsp;·&nbsp;
                                  {tierMaxH}″H{showEquipClearance && <> ({tierMaxHWithEquip}″ w/equip)</>}
                                  {overWeight && ' ⚠️ WEIGHT'}
                                  {overWidth && ' ⚠️ TOO WIDE'}
                                  {heightExceedsWithoutEquip && ` ⚠️ TOO TALL (${tier.clearance}″ avail)`}
                                  {!heightExceedsWithoutEquip && heightExceedsClearance && ` ⚠️ equip won't fit`}
                                </div>
                              )}
                            </div>
                          )}
                          {tier.enabled && tier.tanks.length > 0 && <div style={{ height: 18 }} />}
                        </div>
                      )
                    })}

                    {/* Legs for raised shelves (industrial style) */}
                    {unit.bottomClearance > 0 && (
                      <div style={{ position: 'relative' }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '0 2px',
                        }}>
                          {[0, 1, 2, 3].map(leg => (
                            <div key={leg} style={{
                              width: 8,
                              height: unit.bottomClearance * PPI,
                              background: '#666',
                              borderRadius: '0 0 2px 2px',
                            }} />
                          ))}
                        </div>
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          fontSize: 10,
                          color: '#555',
                          whiteSpace: 'nowrap',
                        }}>
                          {unit.bottomClearance}″ off ground
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Warnings summary */}
                  <div style={{ marginTop: 8, maxWidth: unit.width * PPI + 16 }}>
                    {unit.tiers.some(t => t.enabled && t.tanks.some(tk => tk.d > unit.depth)) && (
                      <div style={{ fontSize: 12, color: '#e53935', fontWeight: 600 }}>
                        ⚠️ Some tanks exceed shelf depth ({unit.depth}″) — will overhang!
                      </div>
                    )}

                    {/* Floor load */}
                    <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                      Total floor load: {unitTotalWeight} lbs
                      {unitTotalWeight > 0 && (
                        <> &nbsp;·&nbsp; {Math.round(unitTotalWeight / ((unit.width * unit.depth) / 144))} lbs/sq ft</>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Reference table */}
          {shelfUnits.length > 0 && (
            <div style={{ marginTop: 40, maxWidth: 800 }}>
              <h3 style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>Tank Reference</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333' }}>
                    <th style={{ textAlign: 'left', padding: '4px 8px', color: '#888' }}>Tank</th>
                    <th style={{ textAlign: 'left', padding: '4px 8px', color: '#888' }}>W × D × H</th>
                    <th style={{ textAlign: 'right', padding: '4px 8px', color: '#888' }}>Filled Weight</th>
                    <th style={{ textAlign: 'right', padding: '4px 8px', color: '#888' }}>Equip Clearance</th>
                    <th style={{ textAlign: 'right', padding: '4px 8px', color: '#888' }}>Total Height</th>
                  </tr>
                </thead>
                <tbody>
                  {TANK_TYPES.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #222' }}>
                      <td style={{ padding: '4px 8px', color: t.color, fontWeight: 600 }}>{t.label}</td>
                      <td style={{ padding: '4px 8px' }}>{t.w}″ × {t.d}″ × {t.h}″</td>
                      <td style={{ padding: '4px 8px', textAlign: 'right' }}>{t.weight} lbs</td>
                      <td style={{ padding: '4px 8px', textAlign: 'right' }}>+{t.equipClearance}″</td>
                      <td style={{ padding: '4px 8px', textAlign: 'right' }}>{t.h + t.equipClearance}″</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
