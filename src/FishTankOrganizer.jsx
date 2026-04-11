import { useState, useEffect } from 'react'

// ─── localStorage helpers ───
const load = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback }
  catch { return fallback }
}
const save = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)) } catch {} }

// ─── Tabs ───
import ShelfOrganizer from './tabs/ShelfOrganizer'
import TankInventory from './tabs/TankInventory'
import SuppliesInventory from './tabs/SuppliesInventory'
import AirPumpCalculator from './tabs/AirPumpCalculator'
import MaintenanceLog from './tabs/MaintenanceLog'

const TABS = [
  { id: 'shelves', label: 'Shelf Organizer' },
  { id: 'tanks', label: 'Tank Inventory' },
  { id: 'supplies', label: 'Supplies & Equipment' },
  { id: 'airpump', label: 'Air Pump Calculator' },
  { id: 'maintenance', label: 'Maintenance & Water' },
]

export default function FishTankOrganizer() {
  const [tab, setTab] = useState(() => load('ftm-tab', 'shelves'))

  // Shared tank registry — tanks placed on shelves get IDs here
  const [tankRegistry, setTankRegistry] = useState(() => load('ftm-tanks', []))
  const [livestock, setLivestock] = useState(() => load('ftm-livestock', []))
  const [supplies, setSupplies] = useState(() => load('ftm-supplies', []))
  const [equipment, setEquipment] = useState(() => load('ftm-equipment', []))
  const [maintenanceLogs, setMaintenanceLogs] = useState(() => load('ftm-maint', []))
  const [waterTests, setWaterTests] = useState(() => load('ftm-water', []))
  const [waterChanges, setWaterChanges] = useState(() => load('ftm-wc', []))
  const [diseaseLogs, setDiseaseLogs] = useState(() => load('ftm-disease', []))

  // Persist everything
  useEffect(() => { save('ftm-tab', tab) }, [tab])
  useEffect(() => { save('ftm-tanks', tankRegistry) }, [tankRegistry])
  useEffect(() => { save('ftm-livestock', livestock) }, [livestock])
  useEffect(() => { save('ftm-supplies', supplies) }, [supplies])
  useEffect(() => { save('ftm-equipment', equipment) }, [equipment])
  useEffect(() => { save('ftm-maint', maintenanceLogs) }, [maintenanceLogs])
  useEffect(() => { save('ftm-water', waterTests) }, [waterTests])
  useEffect(() => { save('ftm-wc', waterChanges) }, [waterChanges])
  useEffect(() => { save('ftm-disease', diseaseLogs) }, [diseaseLogs])

  const tabStyle = (id) => ({
    padding: '8px 16px',
    background: tab === id ? '#0f3460' : 'transparent',
    color: tab === id ? '#4fc3f7' : '#888',
    border: tab === id ? '1px solid #4fc3f7' : '1px solid transparent',
    borderBottom: tab === id ? '1px solid #16213e' : '1px solid #0f3460',
    borderRadius: '6px 6px 0 0',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: tab === id ? 700 : 400,
    whiteSpace: 'nowrap',
  })

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a2e', color: '#e0e0e0', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#16213e', padding: '12px 20px 0', borderBottom: '1px solid #0f3460' }}>
        <h1 style={{ fontSize: 20, margin: '0 0 10px', color: '#4fc3f7' }}>🐟 Fish Tank Manager</h1>
        <div style={{ display: 'flex', gap: 2, overflowX: 'auto', paddingBottom: 0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={tabStyle(t.id)}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ padding: 0 }}>
        {tab === 'shelves' && <ShelfOrganizer tankRegistry={tankRegistry} setTankRegistry={setTankRegistry} />}
        {tab === 'tanks' && <TankInventory tankRegistry={tankRegistry} livestock={livestock} setLivestock={setLivestock} diseaseLogs={diseaseLogs} setDiseaseLogs={setDiseaseLogs} />}
        {tab === 'supplies' && <SuppliesInventory supplies={supplies} setSupplies={setSupplies} equipment={equipment} setEquipment={setEquipment} />}
        {tab === 'airpump' && <AirPumpCalculator tankRegistry={tankRegistry} equipment={equipment} />}
        {tab === 'maintenance' && <MaintenanceLog tankRegistry={tankRegistry} maintenanceLogs={maintenanceLogs} setMaintenanceLogs={setMaintenanceLogs} waterTests={waterTests} setWaterTests={setWaterTests} waterChanges={waterChanges} setWaterChanges={setWaterChanges} />}
      </div>
    </div>
  )
}
