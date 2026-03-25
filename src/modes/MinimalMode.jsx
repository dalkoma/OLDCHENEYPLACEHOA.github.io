import { useState, useEffect, useCallback } from 'react'
import { useResponsive } from '../useResponsive'

const API_BASE = 'https://api-v3.amtraker.com/v3/trains'

const CZ_STATIONS = [
  { code: 'CHI', name: 'Chicago Union' }, { code: 'NPV', name: 'Naperville' },
  { code: 'PRM', name: 'Princeton' }, { code: 'GAL', name: 'Galesburg' },
  { code: 'BUR', name: 'Burlington' }, { code: 'MTL', name: 'Mt. Pleasant' },
  { code: 'OTM', name: 'Ottumwa' }, { code: 'OSC', name: 'Osceola' },
  { code: 'CRX', name: 'Creston' }, { code: 'OMH', name: 'Omaha' },
  { code: 'LNK', name: 'Lincoln' }, { code: 'HAS', name: 'Hastings' },
  { code: 'HOL', name: 'Holdrege' }, { code: 'MCK', name: 'McCook' },
  { code: 'FMG', name: 'Fort Morgan' }, { code: 'DEN', name: 'Denver Union' },
  { code: 'FRC', name: 'Fraser' }, { code: 'GWS', name: 'Granby' },
  { code: 'GSC', name: 'Glenwood Springs' }, { code: 'GJT', name: 'Grand Junction' },
  { code: 'GRR', name: 'Green River' }, { code: 'HEL', name: 'Helper' },
  { code: 'PRC', name: 'Provo' }, { code: 'SLC', name: 'Salt Lake City' },
  { code: 'EVS', name: 'Elko' }, { code: 'WND', name: 'Winnemucca' },
  { code: 'RNO', name: 'Reno' }, { code: 'TRU', name: 'Truckee' },
  { code: 'COL', name: 'Colfax' }, { code: 'SAC', name: 'Sacramento' },
  { code: 'DAV', name: 'Davis' }, { code: 'MTZ', name: 'Martinez' },
  { code: 'RIC', name: 'Richmond' }, { code: 'EMY', name: 'Emeryville' },
]

function formatTime(isoStr) {
  if (!isoStr) return '--:--'
  try { return new Date(isoStr).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) } catch { return '--:--' }
}

function loadState(key, fallback) {
  try {
    const v = localStorage.getItem('jarvis_' + key)
    return v ? JSON.parse(v) : fallback
  } catch { return fallback }
}

export default function MinimalMode() {
  const R = useResponsive()
  const [trains, setTrains] = useState({})
  const [loading, setLoading] = useState(true)
  const [lastFetch, setLastFetch] = useState(null)
  const [schedule] = useState(() => loadState('trainSchedule', []))

  const fetchTrains = useCallback(async () => {
    setLoading(true)
    try {
      const [res5, res6] = await Promise.all([fetch(`${API_BASE}/5`), fetch(`${API_BASE}/6`)])
      const [data5, data6] = await Promise.all([res5.json(), res6.json()])
      const parsed = {}
      if (data5['5']) parsed['5'] = data5['5']
      if (data6['6']) parsed['6'] = data6['6']
      setTrains(parsed)
      setLastFetch(new Date())
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { fetchTrains(); const id = setInterval(fetchTrains, 60000); return () => clearInterval(id) }, [fetchTrains])

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const todayDay = DAYS[new Date().getDay()]
  const todaySchedule = schedule.filter(s => s.days?.includes(todayDay))

  const trainCards = todaySchedule.length > 0 ? todaySchedule : [
    { train: '5', direction: 'westbound', boardStation: '' },
    { train: '6', direction: 'eastbound', boardStation: '' },
  ]

  const getTrainInfo = (trainNum, boardStation) => {
    const instances = trains[trainNum]
    if (!instances?.length) return null
    const inst = instances[0]
    const stationList = inst.stations ? (Array.isArray(inst.stations) ? inst.stations : Object.values(inst.stations)) : []

    const enroute = stationList.find(s => s.status === 'Enroute')
    const atStation = stationList.find(s => s.status === 'Station')
    const current = enroute || atStation

    const myStation = boardStation ? stationList.find(s => s.code === boardStation) : null
    const myDelay = myStation && myStation.schArr && myStation.arr ?
      Math.round((new Date(myStation.arr).getTime() - new Date(myStation.schArr).getTime()) / 60000) : null

    const latestWithActual = [...stationList].reverse().find(s => s.arr || s.dep)
    const overallDelay = latestWithActual ? Math.round(
      (new Date(latestWithActual.arr || latestWithActual.dep).getTime() -
       new Date(latestWithActual.schArr || latestWithActual.schDep).getTime()) / 60000
    ) : null

    const delay = myDelay !== null ? myDelay : overallDelay

    return {
      current: current ? (enroute ? `En route to ${current.name}` : `At ${current.name}`) : 'No current position',
      delay,
      velocity: inst.velocity,
      myStation,
      myStationName: myStation ? CZ_STATIONS.find(s => s.code === boardStation)?.name : null,
      schArr: myStation ? formatTime(myStation.schArr) : null,
      actArr: myStation ? formatTime(myStation.arr) : null,
      myStationStatus: myStation?.status,
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#0a0a1a',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: R.sp(20),
    }}>
      <div style={{ width: '100%', maxWidth: R.modalMaxWidth }}>
        {/* Small header */}
        <div style={{ textAlign: 'center', marginBottom: R.sp(24) }}>
          <span style={{ fontSize: R.fs(20), color: '#6c5ce7' }}>◉</span>
          <div style={{ fontSize: R.fs(12), color: '#555577', marginTop: R.sp(4), letterSpacing: 2 }}>CALIFORNIA ZEPHYR</div>
        </div>

        {loading && !lastFetch ? (
          <div style={{ textAlign: 'center', padding: R.sp(40) }}>
            <div style={{ fontSize: R.fs(32), marginBottom: R.sp(12) }}>🚂</div>
            <div style={{ color: '#555577', fontSize: R.fs(14) }}>Loading train data...</div>
          </div>
        ) : (
          trainCards.map((sched, i) => {
            const info = getTrainInfo(sched.train, sched.boardStation)
            const color = sched.train === '5' ? '#00cec9' : '#fd79a8'

            return (
              <div key={i} style={{
                background: '#12122a', borderRadius: R.sp(20), padding: R.sp(24),
                border: `${R.borderWidth}px solid #2a2a4a`, marginBottom: R.sp(16),
              }}>
                {/* Train number & direction */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: R.sp(16) }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: R.sp(10) }}>
                    <div style={{
                      width: R.sp(44), height: R.sp(44), borderRadius: R.sp(12), background: `${color}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ color, fontSize: R.fs(18), fontWeight: 700 }}>#{sched.train}</span>
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontSize: R.fs(16), fontWeight: 600 }}>
                        {sched.direction === 'westbound' ? '← Westbound' : 'Eastbound →'}
                      </div>
                      {sched.boardStation && (
                        <div style={{ color: '#8888aa', fontSize: R.fs(12) }}>
                          Board at {sched.boardStation}{sched.exitStation ? ` → ${sched.exitStation}` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {info ? (
                  <>
                    {/* Current position */}
                    <div style={{ fontSize: R.fs(18), color: '#f0f0ff', fontWeight: 500, marginBottom: R.sp(8) }}>
                      {info.current}
                    </div>

                    {/* Speed */}
                    {info.velocity > 0 && (
                      <div style={{ fontSize: R.fs(13), color: '#8888aa', marginBottom: R.sp(12) }}>
                        {Math.round(info.velocity)} mph
                      </div>
                    )}

                    {/* Delay - the hero stat */}
                    <div style={{
                      padding: `${R.sp(16)}px ${R.sp(20)}px`, borderRadius: R.sp(14), textAlign: 'center',
                      background: info.delay !== null ? (
                        info.delay <= 0 ? '#00b89412' : info.delay < 30 ? '#fdcb6e12' : '#e1705512'
                      ) : '#1a1a3a',
                      border: `${R.borderWidth}px solid ${info.delay !== null ? (
                        info.delay <= 0 ? '#00b89430' : info.delay < 30 ? '#fdcb6e30' : '#e1705530'
                      ) : '#2a2a4a'}`,
                    }}>
                      <div style={{
                        fontSize: R.fs(32), fontWeight: 700,
                        color: info.delay !== null ? (
                          info.delay <= 0 ? '#00b894' : info.delay < 30 ? '#fdcb6e' : info.delay < 60 ? '#e67e22' : '#e17055'
                        ) : '#555577',
                      }}>
                        {info.delay !== null ? (
                          info.delay <= 0 ? 'ON TIME' : `${info.delay}m late`
                        ) : 'No delay data'}
                      </div>
                      {info.myStationName && (
                        <div style={{ fontSize: R.fs(12), color: '#555577', marginTop: R.sp(4) }}>
                          at {info.myStationName}
                        </div>
                      )}
                    </div>

                    {/* Arrival times for user's station */}
                    {info.schArr && (
                      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: R.sp(14) }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: R.fs(11), color: '#555577', marginBottom: R.sp(2) }}>SCHEDULED</div>
                          <div style={{ fontSize: R.fs(18), color: '#8888aa', fontVariantNumeric: 'tabular-nums' }}>{info.schArr}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: R.fs(11), color: '#555577', marginBottom: R.sp(2) }}>ACTUAL</div>
                          <div style={{ fontSize: R.fs(18), color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{info.actArr}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: R.fs(11), color: '#555577', marginBottom: R.sp(2) }}>STATUS</div>
                          <div style={{
                            fontSize: R.fs(14), fontWeight: 600,
                            color: info.myStationStatus === 'Departed' ? '#555577' :
                                   info.myStationStatus === 'Enroute' ? '#fdcb6e' :
                                   info.myStationStatus === 'Station' ? '#00b894' : '#8888aa',
                          }}>{info.myStationStatus || 'Scheduled'}</div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: R.sp(20) }}>
                    <div style={{ color: '#555577', fontSize: R.fs(16) }}>No active data</div>
                    <div style={{ color: '#3a3a5a', fontSize: R.fs(12), marginTop: R.sp(4) }}>Train may not be running</div>
                  </div>
                )}
              </div>
            )
          })
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: R.sp(8) }}>
          {lastFetch && (
            <div style={{ fontSize: R.fs(11), color: '#3a3a5a' }}>
              Updated {lastFetch.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · Auto-refresh 60s
            </div>
          )}
          <button onClick={() => { window.location.search = '' }} style={{
            marginTop: R.sp(12), padding: `${R.sp(8)}px ${R.sp(20)}px`, background: '#1a1a3a',
            border: `${R.borderWidth}px solid #2a2a4a`, borderRadius: R.sp(20), color: '#555577',
            fontSize: R.fs(12), cursor: 'pointer', fontFamily: 'inherit',
            minHeight: R.minTouchTarget,
          }}>Exit Minimal Mode</button>
        </div>
      </div>
    </div>
  )
}
