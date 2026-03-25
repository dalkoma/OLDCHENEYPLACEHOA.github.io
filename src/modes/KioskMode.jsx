import { useState, useEffect, useCallback } from 'react'
import { logIssue } from '../ErrorBoundary'

const API_BASE = 'https://api-v3.amtraker.com/v3/trains'

const CZ_STATIONS = [
  { code: 'CHI', name: 'Chicago Union', mile: 0 },
  { code: 'NPV', name: 'Naperville', mile: 29 },
  { code: 'PRM', name: 'Princeton', mile: 99 },
  { code: 'GAL', name: 'Galesburg', mile: 162 },
  { code: 'BUR', name: 'Burlington', mile: 206 },
  { code: 'MTL', name: 'Mt. Pleasant', mile: 258 },
  { code: 'OTM', name: 'Ottumwa', mile: 282 },
  { code: 'OSC', name: 'Osceola', mile: 329 },
  { code: 'CRX', name: 'Creston', mile: 354 },
  { code: 'OMH', name: 'Omaha', mile: 459 },
  { code: 'LNK', name: 'Lincoln', mile: 517 },
  { code: 'HAS', name: 'Hastings', mile: 592 },
  { code: 'HOL', name: 'Holdrege', mile: 632 },
  { code: 'MCK', name: 'McCook', mile: 706 },
  { code: 'FMG', name: 'Fort Morgan', mile: 808 },
  { code: 'DEN', name: 'Denver Union', mile: 883 },
  { code: 'FRC', name: 'Fraser', mile: 953 },
  { code: 'GWS', name: 'Granby', mile: 969 },
  { code: 'GSC', name: 'Glenwood Springs', mile: 1080 },
  { code: 'GJT', name: 'Grand Junction', mile: 1163 },
  { code: 'GRR', name: 'Green River', mile: 1309 },
  { code: 'HEL', name: 'Helper', mile: 1370 },
  { code: 'PRC', name: 'Provo', mile: 1439 },
  { code: 'SLC', name: 'Salt Lake City', mile: 1483 },
  { code: 'EVS', name: 'Elko', mile: 1702 },
  { code: 'WND', name: 'Winnemucca', mile: 1787 },
  { code: 'RNO', name: 'Reno', mile: 1933 },
  { code: 'TRU', name: 'Truckee', mile: 1966 },
  { code: 'COL', name: 'Colfax', mile: 2009 },
  { code: 'SAC', name: 'Sacramento', mile: 2063 },
  { code: 'DAV', name: 'Davis', mile: 2078 },
  { code: 'MTZ', name: 'Martinez', mile: 2122 },
  { code: 'RIC', name: 'Richmond', mile: 2146 },
  { code: 'EMY', name: 'Emeryville', mile: 2158 },
]

const TOTAL_MILES = 2158

function delayText(mins) {
  if (mins === null || mins === undefined) return ''
  if (mins <= 0) return 'ON TIME'
  if (mins < 60) return `${mins}m LATE`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m LATE` : `${h}h LATE`
}

function delayColor(mins) {
  if (mins === null || mins === undefined) return '#666'
  if (mins <= 0) return '#00b894'
  if (mins <= 15) return '#00b894'
  if (mins <= 30) return '#fdcb6e'
  if (mins <= 60) return '#e67e22'
  return '#e17055'
}

export default function KioskMode() {
  const [trains, setTrains] = useState({})
  const [lastFetch, setLastFetch] = useState(null)
  const [cycleView, setCycleView] = useState('map') // map, train5, train6
  const [clock, setClock] = useState(new Date())

  const fetchTrains = useCallback(async () => {
    try {
      const [res5, res6] = await Promise.all([
        fetch(`${API_BASE}/5`), fetch(`${API_BASE}/6`),
      ])
      const [data5, data6] = await Promise.all([res5.json(), res6.json()])
      const parsed = {}
      if (data5['5']) parsed['5'] = data5['5']
      if (data6['6']) parsed['6'] = data6['6']
      setTrains(parsed)
      setLastFetch(new Date())
    } catch (err) { logIssue({ type: 'api', severity: 'medium', message: `KioskMode train fetch failed: ${err?.message}`, timestamp: new Date().toISOString() }) }
  }, [])

  useEffect(() => { fetchTrains(); const id = setInterval(fetchTrains, 60000); return () => clearInterval(id) }, [fetchTrains])
  useEffect(() => { const id = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(id) }, [])

  // Auto-cycle views every 15 seconds
  useEffect(() => {
    const views = ['map', 'train5', 'train6']
    let idx = 0
    const id = setInterval(() => {
      idx = (idx + 1) % views.length
      setCycleView(views[idx])
    }, 15000)
    return () => clearInterval(id)
  }, [])

  const getTrainPosition = (trainInstances) => {
    if (!trainInstances?.[0]) return null
    const inst = trainInstances[0]
    const stationList = inst.stations ? (Array.isArray(inst.stations) ? inst.stations : Object.values(inst.stations)) : []
    const enroute = stationList.find(s => s.status === 'Enroute')
    const lastDeparted = [...stationList].reverse().find(s => s.status === 'Departed')
    const atStation = stationList.find(s => s.status === 'Station')

    let currentName = 'Unknown'
    let milePosition = 0
    let status = ''

    if (enroute) {
      currentName = enroute.name
      const stInfo = CZ_STATIONS.find(s => s.code === enroute.code)
      const prevIdx = stationList.indexOf(enroute) - 1
      const prevStation = prevIdx >= 0 ? stationList[prevIdx] : null
      const prevInfo = prevStation ? CZ_STATIONS.find(s => s.code === prevStation.code) : null
      if (stInfo && prevInfo) milePosition = (prevInfo.mile + stInfo.mile) / 2
      else if (stInfo) milePosition = stInfo.mile
      status = `En route to ${enroute.name}`
    } else if (atStation) {
      currentName = atStation.name
      const stInfo = CZ_STATIONS.find(s => s.code === atStation.code)
      if (stInfo) milePosition = stInfo.mile
      status = `At ${atStation.name}`
    } else if (lastDeparted) {
      currentName = lastDeparted.name
      const stInfo = CZ_STATIONS.find(s => s.code === lastDeparted.code)
      if (stInfo) milePosition = stInfo.mile
      status = `Departed ${lastDeparted.name}`
    }

    const latestWithActual = [...stationList].reverse().find(s => s.arr || s.dep)
    const delay = latestWithActual ? Math.round(
      (new Date(latestWithActual.arr || latestWithActual.dep).getTime() -
       new Date(latestWithActual.schArr || latestWithActual.schDep).getTime()) / 60000
    ) : null

    return { currentName, milePosition, status, delay, velocity: inst.velocity, heading: inst.heading, stationList, instance: inst }
  }

  const train5 = getTrainPosition(trains['5'])
  const train6 = getTrainPosition(trains['6'])

  const renderMap = () => {
    const mapStations = CZ_STATIONS.filter((_, i) => i % 2 === 0 || i === CZ_STATIONS.length - 1 || i === 0)

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 60px' }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 8 }}>California Zephyr — Live Route Map</div>
        <div style={{ fontSize: 16, color: '#8888aa', marginBottom: 40 }}>Chicago ← → Emeryville · {TOTAL_MILES} miles</div>

        {/* Route line */}
        <div style={{ position: 'relative', height: 200, margin: '0 40px' }}>
          {/* Track */}
          <div style={{ position: 'absolute', top: 90, left: 0, right: 0, height: 6, background: '#2a2a4a', borderRadius: 3 }} />

          {/* Station markers */}
          {mapStations.map(st => {
            const pct = (st.mile / TOTAL_MILES) * 100
            return (
              <div key={st.code} style={{
                position: 'absolute', left: `${pct}%`, top: 60, transform: 'translateX(-50%)',
                textAlign: 'center',
              }}>
                <div style={{ width: 12, height: 12, borderRadius: 6, background: '#4a4a6a', border: '2px solid #6a6a8a', margin: '0 auto 4px' }} />
                <div style={{ width: 2, height: 22, background: '#3a3a5a', margin: '0 auto' }} />
                <div style={{ fontSize: 11, color: '#8888aa', marginTop: 4, whiteSpace: 'nowrap' }}>{st.code}</div>
                <div style={{ fontSize: 9, color: '#555577', whiteSpace: 'nowrap' }}>{st.name}</div>
              </div>
            )
          })}

          {/* Train #5 position (westbound) */}
          {train5 && (
            <div style={{
              position: 'absolute', left: `${(train5.milePosition / TOTAL_MILES) * 100}%`, top: 30,
              transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10,
              transition: 'left 2s ease',
            }}>
              <div style={{
                background: '#00cec9', color: '#000', fontWeight: 700, fontSize: 14,
                padding: '4px 12px', borderRadius: 20, whiteSpace: 'nowrap',
                boxShadow: '0 0 20px rgba(0,206,201,0.5)',
              }}>← #5 {train5.velocity ? `${Math.round(train5.velocity)}mph` : ''}</div>
              <div style={{ width: 3, height: 14, background: '#00cec9', margin: '0 auto' }} />
              <div style={{ width: 16, height: 16, borderRadius: 8, background: '#00cec9', margin: '0 auto', boxShadow: '0 0 12px #00cec9' }} />
            </div>
          )}

          {/* Train #6 position (eastbound) */}
          {train6 && (
            <div style={{
              position: 'absolute', left: `${(train6.milePosition / TOTAL_MILES) * 100}%`, top: 120,
              transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10,
              transition: 'left 2s ease',
            }}>
              <div style={{ width: 16, height: 16, borderRadius: 8, background: '#fd79a8', margin: '0 auto', boxShadow: '0 0 12px #fd79a8' }} />
              <div style={{ width: 3, height: 14, background: '#fd79a8', margin: '0 auto' }} />
              <div style={{
                background: '#fd79a8', color: '#000', fontWeight: 700, fontSize: 14,
                padding: '4px 12px', borderRadius: 20, whiteSpace: 'nowrap',
                boxShadow: '0 0 20px rgba(253,121,168,0.5)',
              }}>#6 → {train6.velocity ? `${Math.round(train6.velocity)}mph` : ''}</div>
            </div>
          )}
        </div>

        {/* Train status cards */}
        <div style={{ display: 'flex', gap: 30, marginTop: 60 }}>
          {[['5', '← Westbound', '#00cec9', train5], ['6', 'Eastbound →', '#fd79a8', train6]].map(([num, dir, color, data]) => (
            <div key={num} style={{
              flex: 1, background: '#12122a', borderRadius: 16, padding: 30,
              border: `2px solid ${color}30`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color }}> #{num}</span>
                <span style={{ fontSize: 20, color: '#fff', fontWeight: 500 }}>{dir}</span>
              </div>
              {data ? (
                <>
                  <div style={{ fontSize: 22, color: '#fff', fontWeight: 600, marginBottom: 8 }}>{data.status}</div>
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    {data.velocity > 0 && <div style={{ fontSize: 16, color: '#8888aa' }}>{Math.round(data.velocity)} mph</div>}
                    {data.delay !== null && (
                      <div style={{ fontSize: 18, fontWeight: 700, color: delayColor(data.delay) }}>{delayText(data.delay)}</div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 18, color: '#555577' }}>No active data</div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderTrainDetail = (num, color, data) => {
    if (!data) return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 32, color: '#555577' }}>No active data for Train #{num}</div>
      </div>
    )

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '30px 50px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 36, fontWeight: 700, color }}>California Zephyr #{num}</div>
            <div style={{ fontSize: 20, color: '#8888aa' }}>{num === '5' ? 'Westbound: Chicago → Emeryville' : 'Eastbound: Emeryville → Chicago'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {data.delay !== null && (
              <div style={{ fontSize: 28, fontWeight: 700, color: delayColor(data.delay) }}>{delayText(data.delay)}</div>
            )}
            {data.velocity > 0 && <div style={{ fontSize: 18, color: '#8888aa' }}>{Math.round(data.velocity)} mph · {data.heading}</div>}
          </div>
        </div>

        {/* Station list */}
        <div style={{ flex: 1, overflowY: 'auto', borderRadius: 12, background: '#12122a', border: '1px solid #2a2a4a' }}>
          {data.stationList.map((station, i) => {
            const isDeparted = station.status === 'Departed'
            const isEnroute = station.status === 'Enroute'
            const isAtStation = station.status === 'Station'
            const delay = station.arr && station.schArr ?
              Math.round((new Date(station.arr).getTime() - new Date(station.schArr).getTime()) / 60000) : null

            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '12px 24px',
                borderBottom: '1px solid #1a1a3a',
                opacity: isDeparted ? 0.4 : 1,
                background: isEnroute ? 'rgba(253,203,110,0.08)' : isAtStation ? 'rgba(0,184,148,0.08)' : 'transparent',
              }}>
                <div style={{
                  width: 14, height: 14, borderRadius: 7, flexShrink: 0,
                  background: isEnroute ? '#fdcb6e' : isAtStation ? '#00b894' : isDeparted ? '#3a3a5a' : '#2a2a4a',
                  boxShadow: isEnroute ? '0 0 10px #fdcb6e' : isAtStation ? '0 0 10px #00b894' : 'none',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 18, color: '#fff', fontWeight: isEnroute || isAtStation ? 600 : 400 }}>
                    {station.name} <span style={{ color: '#555577', fontSize: 14 }}>({station.code})</span>
                  </div>
                </div>
                <div style={{ fontSize: 16, color: '#8888aa', minWidth: 80, textAlign: 'right' }}>
                  {station.schArr ? new Date(station.schArr).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}
                </div>
                <div style={{ fontSize: 16, color: '#bbb', minWidth: 80, textAlign: 'right' }}>
                  {station.arr ? new Date(station.arr).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}
                </div>
                {delay !== null && (
                  <div style={{ fontSize: 14, fontWeight: 700, color: delayColor(delay), minWidth: 80, textAlign: 'right' }}>
                    {delayText(delay)}
                  </div>
                )}
                <div style={{
                  fontSize: 12, padding: '3px 10px', borderRadius: 6, minWidth: 70, textAlign: 'center',
                  background: isEnroute ? '#fdcb6e20' : isAtStation ? '#00b89420' : isDeparted ? '#3a3a5a20' : '#2a2a4a20',
                  color: isEnroute ? '#fdcb6e' : isAtStation ? '#00b894' : '#555577',
                }}>{station.status || 'Scheduled'}</div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#0a0a1a', color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 30px', borderBottom: '1px solid #2a2a4a', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24, color: '#6c5ce7' }}>◉</span>
          <span style={{ fontSize: 18, fontWeight: 600 }}>Jarvis Rail Monitor</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
          {/* View indicator dots */}
          <div style={{ display: 'flex', gap: 8 }}>
            {['map', 'train5', 'train6'].map(v => (
              <div key={v} style={{
                width: 10, height: 10, borderRadius: 5,
                background: cycleView === v ? '#6c5ce7' : '#2a2a4a',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
          <div style={{ fontSize: 28, fontWeight: 300, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
            {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          {lastFetch && (
            <div style={{ fontSize: 12, color: '#555577' }}>
              Updated {lastFetch.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {cycleView === 'map' && renderMap()}
        {cycleView === 'train5' && renderTrainDetail('5', '#00cec9', train5)}
        {cycleView === 'train6' && renderTrainDetail('6', '#fd79a8', train6)}
      </div>
    </div>
  )
}
