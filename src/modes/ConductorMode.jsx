import { useState, useEffect, useCallback } from 'react'
import { logIssue } from '../ErrorBoundary'
import { HudIcon } from '../components/HudReactor'

const API_BASE = 'https://api-v3.amtraker.com/v3/trains'

const CZ_STATIONS = [
  { code: 'CHI', name: 'Chicago Union', mile: 0, elev: 597 },
  { code: 'NPV', name: 'Naperville', mile: 29, elev: 690 },
  { code: 'PRM', name: 'Princeton', mile: 99, elev: 699 },
  { code: 'GAL', name: 'Galesburg', mile: 162, elev: 773 },
  { code: 'BUR', name: 'Burlington', mile: 206, elev: 533 },
  { code: 'MTL', name: 'Mt. Pleasant', mile: 258, elev: 721 },
  { code: 'OTM', name: 'Ottumwa', mile: 282, elev: 646 },
  { code: 'OSC', name: 'Osceola', mile: 329, elev: 1049 },
  { code: 'CRX', name: 'Creston', mile: 354, elev: 1310 },
  { code: 'OMH', name: 'Omaha', mile: 459, elev: 978 },
  { code: 'LNK', name: 'Lincoln', mile: 517, elev: 1150 },
  { code: 'HAS', name: 'Hastings', mile: 592, elev: 1932 },
  { code: 'HOL', name: 'Holdrege', mile: 632, elev: 2326 },
  { code: 'MCK', name: 'McCook', mile: 706, elev: 2507 },
  { code: 'FMG', name: 'Fort Morgan', mile: 808, elev: 4328 },
  { code: 'DEN', name: 'Denver Union', mile: 883, elev: 5280 },
  { code: 'FRC', name: 'Fraser', mile: 953, elev: 8574 },
  { code: 'GWS', name: 'Granby', mile: 969, elev: 7935 },
  { code: 'GSC', name: 'Glenwood Springs', mile: 1080, elev: 5763 },
  { code: 'GJT', name: 'Grand Junction', mile: 1163, elev: 4586 },
  { code: 'GRR', name: 'Green River', mile: 1309, elev: 4078 },
  { code: 'HEL', name: 'Helper', mile: 1370, elev: 5817 },
  { code: 'PRC', name: 'Provo', mile: 1439, elev: 4551 },
  { code: 'SLC', name: 'Salt Lake City', mile: 1483, elev: 4226 },
  { code: 'EVS', name: 'Elko', mile: 1702, elev: 5066 },
  { code: 'WND', name: 'Winnemucca', mile: 1787, elev: 4301 },
  { code: 'RNO', name: 'Reno', mile: 1933, elev: 4505 },
  { code: 'TRU', name: 'Truckee', mile: 1966, elev: 5817 },
  { code: 'COL', name: 'Colfax', mile: 2009, elev: 2418 },
  { code: 'SAC', name: 'Sacramento', mile: 2063, elev: 30 },
  { code: 'DAV', name: 'Davis', mile: 2078, elev: 51 },
  { code: 'MTZ', name: 'Martinez', mile: 2122, elev: 10 },
  { code: 'RIC', name: 'Richmond', mile: 2146, elev: 20 },
  { code: 'EMY', name: 'Emeryville', mile: 2158, elev: 33 },
]

const TOTAL_MILES = 2158
const MAX_ELEV = 8574

function formatTime(isoStr) {
  if (!isoStr) return '--:--'
  try { return new Date(isoStr).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) } catch { return '--:--' }
}

export default function ConductorMode() {
  const [trains, setTrains] = useState({})
  const [selectedTrain, setSelectedTrain] = useState('5')
  const [clock, setClock] = useState(new Date())
  const [lastFetch, setLastFetch] = useState(null)

  const fetchTrains = useCallback(async () => {
    try {
      const [res5, res6] = await Promise.all([fetch(`${API_BASE}/5`), fetch(`${API_BASE}/6`)])
      const [data5, data6] = await Promise.all([res5.json(), res6.json()])
      const parsed = {}
      if (data5['5']) parsed['5'] = data5['5']
      if (data6['6']) parsed['6'] = data6['6']
      setTrains(parsed)
      setLastFetch(new Date())
    } catch (err) { logIssue({ type: 'api', severity: 'medium', message: `ConductorMode train fetch failed: ${err?.message}`, timestamp: new Date().toISOString() }) }
  }, [])

  useEffect(() => { fetchTrains(); const id = setInterval(fetchTrains, 30000); return () => clearInterval(id) }, [fetchTrains])
  useEffect(() => { const id = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(id) }, [])

  const inst = trains[selectedTrain]?.[0]
  const stationList = inst?.stations ? (Array.isArray(inst.stations) ? inst.stations : Object.values(inst.stations)) : []

  const enroute = stationList.find(s => s.status === 'Enroute')
  const atStation = stationList.find(s => s.status === 'Station')
  const current = enroute || atStation
  const currentIdx = current ? stationList.indexOf(current) : -1
  const nextStation = currentIdx >= 0 && currentIdx < stationList.length - 1 ? stationList[currentIdx + 1] : null
  const prevStation = currentIdx > 0 ? stationList[currentIdx - 1] : null

  const currentInfo = current ? CZ_STATIONS.find(s => s.code === current.code) : null
  const nextInfo = nextStation ? CZ_STATIONS.find(s => s.code === nextStation.code) : null

  // Compute distance to next station
  const distToNext = currentInfo && nextInfo ? Math.abs(nextInfo.mile - currentInfo.mile) : null

  // Compute ETA to next station based on velocity
  const velocity = inst?.velocity || 0
  const etaMins = velocity > 0 && distToNext ? Math.round((distToNext / velocity) * 60) : null

  // Overall delay
  const latestWithActual = [...stationList].reverse().find(s => s.arr || s.dep)
  const overallDelay = latestWithActual ? Math.round(
    (new Date(latestWithActual.arr || latestWithActual.dep).getTime() -
     new Date(latestWithActual.schArr || latestWithActual.schDep).getTime()) / 60000
  ) : null

  // Current milepost estimate
  const currentMile = currentInfo ? currentInfo.mile : 0
  const currentElev = currentInfo ? currentInfo.elev : 0

  // Upcoming stations for "next stops" display
  const upcomingStations = stationList.filter(s => s.status !== 'Departed').slice(0, 8)

  // Elevation profile data
  const elevProfile = CZ_STATIONS.map(s => ({ ...s, pct: (s.mile / TOTAL_MILES) * 100 }))

  const bigNum = (value, label, color, unit) => (
    <div style={{ textAlign: 'center', padding: '12px 0' }}>
      <div style={{ fontSize: 48, fontWeight: 700, color: color || '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {value}<span style={{ fontSize: 20, fontWeight: 400, color: '#8888aa' }}>{unit || ''}</span>
      </div>
      <div style={{ fontSize: 12, color: '#555577', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    </div>
  )

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#060612',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex', flexDirection: 'column', overflow: 'hidden', color: '#fff',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 24px', borderBottom: '2px solid #1a1a3a', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <HudIcon size={24} />
          <span style={{ fontSize: 16, fontWeight: 600, color: '#8888aa' }}>CONDUCTOR VIEW</span>
          {/* Train selector */}
          <div style={{ display: 'flex', gap: 6 }}>
            {['5', '6'].map(n => (
              <button key={n} onClick={() => setSelectedTrain(n)} style={{
                padding: '6px 16px', borderRadius: 6,
                background: selectedTrain === n ? (n === '5' ? '#00cec920' : '#fd79a820') : '#1a1a3a',
                border: `2px solid ${selectedTrain === n ? (n === '5' ? '#00cec9' : '#fd79a8') : '#2a2a4a'}`,
                color: selectedTrain === n ? (n === '5' ? '#00cec9' : '#fd79a8') : '#555577',
                fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}>#{n} {n === '5' ? '← W' : 'E →'}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontSize: 32, fontWeight: 300, fontVariantNumeric: 'tabular-nums' }}>
            {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          {lastFetch && <div style={{ fontSize: 11, color: '#555577' }}>Updated {lastFetch.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>}
        </div>
      </div>

      {!inst ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🚂</div>
            <div style={{ fontSize: 24, color: '#555577' }}>No active data for Train #{selectedTrain}</div>
            <div style={{ fontSize: 14, color: '#3a3a5a', marginTop: 8 }}>Waiting for train to become active...</div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto 1fr auto', gap: 0, overflow: 'hidden' }}>

          {/* Top-left: Current position */}
          <div style={{ padding: 24, borderBottom: '1px solid #1a1a3a', borderRight: '1px solid #1a1a3a' }}>
            <div style={{ fontSize: 11, color: '#555577', letterSpacing: 2, marginBottom: 12 }}>CURRENT POSITION</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: current ? (enroute ? '#fdcb6e' : '#00b894') : '#555577', marginBottom: 4 }}>
              {current ? (enroute ? `En route to ${current.name}` : `At ${current.name}`) : 'Unknown'}
            </div>
            {currentInfo && (
              <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
                {bigNum(Math.round(currentMile), 'Milepost', '#a29bfe', '')}
                {bigNum(currentElev.toLocaleString(), 'Elevation', '#00cec9', 'ft')}
                {bigNum(Math.round(velocity), 'Speed', '#fdcb6e', 'mph')}
                {inst.heading && bigNum(inst.heading, 'Heading', '#8888aa', '')}
              </div>
            )}
          </div>

          {/* Top-right: Next station & ETA */}
          <div style={{ padding: 24, borderBottom: '1px solid #1a1a3a' }}>
            <div style={{ fontSize: 11, color: '#555577', letterSpacing: 2, marginBottom: 12 }}>NEXT STATION</div>
            {nextStation ? (
              <>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{nextStation.name}</div>
                <div style={{ fontSize: 14, color: '#555577' }}>({nextStation.code})</div>
                <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
                  {bigNum(formatTime(nextStation.schArr), 'Scheduled Arr', '#8888aa', '')}
                  {nextStation.arr && bigNum(formatTime(nextStation.arr), 'Actual Arr', '#00b894', '')}
                  {distToNext !== null && bigNum(distToNext, 'Miles Away', '#a29bfe', 'mi')}
                  {etaMins !== null && bigNum(etaMins, 'ETA', '#fdcb6e', 'min')}
                </div>

                {/* Delay status */}
                <div style={{ marginTop: 16, padding: '12px 20px', borderRadius: 10, background: overallDelay !== null ? (overallDelay <= 0 ? '#00b89415' : overallDelay < 30 ? '#fdcb6e15' : '#e1705515') : '#1a1a3a' }}>
                  <div style={{
                    fontSize: 24, fontWeight: 700,
                    color: overallDelay !== null ? (overallDelay <= 0 ? '#00b894' : overallDelay < 30 ? '#fdcb6e' : overallDelay < 60 ? '#e67e22' : '#e17055') : '#555577',
                  }}>
                    {overallDelay !== null ? (overallDelay <= 0 ? 'ON TIME' : `${overallDelay} MINUTES LATE`) : 'NO DELAY DATA'}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 20, color: '#555577' }}>Final station reached or no data</div>
            )}
          </div>

          {/* Bottom-left: Elevation Profile */}
          <div style={{ padding: 24, borderRight: '1px solid #1a1a3a', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 11, color: '#555577', letterSpacing: 2, marginBottom: 12 }}>ELEVATION PROFILE</div>
            <div style={{ flex: 1, position: 'relative', minHeight: 180 }}>
              {/* SVG elevation chart */}
              <svg viewBox="0 0 1000 250" style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
                {/* Grid lines */}
                {[0, 2000, 4000, 6000, 8000].map(elev => {
                  const y = 240 - (elev / MAX_ELEV) * 220
                  return (
                    <g key={elev}>
                      <line x1="0" y1={y} x2="1000" y2={y} stroke="#1a1a3a" strokeWidth="1" />
                      <text x="5" y={y - 4} fill="#3a3a5a" fontSize="10">{elev}'</text>
                    </g>
                  )
                })}

                {/* Elevation area */}
                <polygon
                  points={[
                    ...elevProfile.map(s => `${s.pct * 10},${240 - (s.elev / MAX_ELEV) * 220}`),
                    '1000,240', '0,240'
                  ].join(' ')}
                  fill="url(#elevGrad)" opacity="0.4"
                />
                <defs>
                  <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6c5ce7" />
                    <stop offset="100%" stopColor="#6c5ce700" />
                  </linearGradient>
                </defs>

                {/* Elevation line */}
                <polyline
                  points={elevProfile.map(s => `${s.pct * 10},${240 - (s.elev / MAX_ELEV) * 220}`).join(' ')}
                  fill="none" stroke="#6c5ce7" strokeWidth="2.5"
                />

                {/* Current position marker */}
                {currentInfo && (
                  <>
                    <line
                      x1={(currentInfo.mile / TOTAL_MILES) * 1000}
                      y1={0}
                      x2={(currentInfo.mile / TOTAL_MILES) * 1000}
                      y2={240}
                      stroke="#fdcb6e" strokeWidth="2" strokeDasharray="4,4"
                    />
                    <circle
                      cx={(currentInfo.mile / TOTAL_MILES) * 1000}
                      cy={240 - (currentInfo.elev / MAX_ELEV) * 220}
                      r="6" fill="#fdcb6e" stroke="#000" strokeWidth="2"
                    />
                  </>
                )}

                {/* Key station labels */}
                {['CHI', 'DEN', 'FRC', 'SLC', 'RNO', 'EMY'].map(code => {
                  const st = CZ_STATIONS.find(s => s.code === code)
                  if (!st) return null
                  const x = (st.mile / TOTAL_MILES) * 1000
                  const y = 240 - (st.elev / MAX_ELEV) * 220
                  return (
                    <g key={code}>
                      <circle cx={x} cy={y} r="3" fill="#555577" />
                      <text x={x} y={y - 10} fill="#555577" fontSize="9" textAnchor="middle">{code}</text>
                    </g>
                  )
                })}
              </svg>
            </div>
          </div>

          {/* Bottom-right: Upcoming stations */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ fontSize: 11, color: '#555577', letterSpacing: 2, padding: '24px 24px 12px' }}>UPCOMING STATIONS</div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
              {upcomingStations.map((st, i) => {
                const stInfo = CZ_STATIONS.find(s => s.code === st.code)
                const delay = st.arr && st.schArr ? Math.round((new Date(st.arr).getTime() - new Date(st.schArr).getTime()) / 60000) : null
                const isNext = st === current || st === nextStation

                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                    borderBottom: '1px solid #111125',
                    background: isNext ? '#fdcb6e08' : 'transparent',
                  }}>
                    <div style={{
                      width: 12, height: 12, borderRadius: 6, flexShrink: 0,
                      background: st.status === 'Enroute' ? '#fdcb6e' : st.status === 'Station' ? '#00b894' : '#2a2a4a',
                      boxShadow: st.status === 'Enroute' ? '0 0 8px #fdcb6e' : 'none',
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: isNext ? 700 : 400, color: isNext ? '#fff' : '#bbb' }}>
                        {st.name} <span style={{ color: '#555577', fontSize: 12 }}>({st.code})</span>
                      </div>
                      {stInfo && (
                        <div style={{ fontSize: 11, color: '#3a3a5a' }}>
                          MP {stInfo.mile} · {stInfo.elev.toLocaleString()}ft
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, color: '#8888aa', fontVariantNumeric: 'tabular-nums' }}>{formatTime(st.schArr)}</div>
                      {st.arr && <div style={{ fontSize: 14, color: '#bbb', fontVariantNumeric: 'tabular-nums' }}>{formatTime(st.arr)}</div>}
                    </div>
                    {delay !== null && (
                      <div style={{
                        fontSize: 12, fontWeight: 700, minWidth: 60, textAlign: 'right',
                        color: delay <= 0 ? '#00b894' : delay < 30 ? '#fdcb6e' : '#e17055',
                      }}>{delay <= 0 ? 'OK' : `+${delay}m`}</div>
                    )}
                    <div style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 4,
                      background: st.status === 'Enroute' ? '#fdcb6e20' : st.status === 'Station' ? '#00b89420' : '#1a1a3a',
                      color: st.status === 'Enroute' ? '#fdcb6e' : st.status === 'Station' ? '#00b894' : '#555577',
                    }}>{st.status || 'Sched'}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Bottom bar spanning full width */}
          <div style={{
            gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 24px', borderTop: '1px solid #1a1a3a', background: '#050510',
          }}>
            <div style={{ fontSize: 11, color: '#3a3a5a' }}>
              Train #{selectedTrain} · {selectedTrain === '5' ? 'CHI → EMY (Westbound)' : 'EMY → CHI (Eastbound)'}
            </div>
            <div style={{ fontSize: 11, color: '#3a3a5a' }}>
              Amtraker API · Refresh every 30s · {lastFetch ? `Updated ${lastFetch.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Loading...'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
