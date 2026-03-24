import { useState, useEffect, useCallback } from 'react'

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

function delayMins(schTime, actTime) {
  if (!schTime || !actTime) return null
  return Math.round((new Date(actTime).getTime() - new Date(schTime).getTime()) / 60000)
}

export default function DisplayMode() {
  const [trains, setTrains] = useState({})
  const [clock, setClock] = useState(new Date())
  const [lastFetch, setLastFetch] = useState(null)
  const [flipState, setFlipState] = useState({}) // for Solari flip animation

  const fetchTrains = useCallback(async () => {
    try {
      const [res5, res6] = await Promise.all([fetch(`${API_BASE}/5`), fetch(`${API_BASE}/6`)])
      const [data5, data6] = await Promise.all([res5.json(), res6.json()])
      const parsed = {}
      if (data5['5']) parsed['5'] = data5['5']
      if (data6['6']) parsed['6'] = data6['6']
      setTrains(parsed)
      setLastFetch(new Date())
      // Trigger flip animation
      setFlipState(prev => {
        const next = {}
        Object.keys(parsed).forEach(k => { next[k] = (prev[k] || 0) + 1 })
        return next
      })
    } catch {}
  }, [])

  useEffect(() => { fetchTrains(); const id = setInterval(fetchTrains, 60000); return () => clearInterval(id) }, [fetchTrains])
  useEffect(() => { const id = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(id) }, [])

  const buildRows = () => {
    const rows = []

    ;['5', '6'].forEach(num => {
      const instances = trains[num]
      if (!instances?.length) {
        rows.push({
          train: num, direction: num === '5' ? 'WESTBOUND' : 'EASTBOUND',
          origin: num === '5' ? 'CHI' : 'EMY', destination: num === '5' ? 'EMY' : 'CHI',
          status: 'NO DATA', statusColor: '#555577',
          schTime: '--:--', actTime: '--:--', delay: null, remarks: '',
        })
        return
      }

      instances.forEach(inst => {
        const stationList = inst.stations ? (Array.isArray(inst.stations) ? inst.stations : Object.values(inst.stations)) : []
        const enroute = stationList.find(s => s.status === 'Enroute')
        const atStation = stationList.find(s => s.status === 'Station')
        const current = enroute || atStation

        // Next major stations that haven't been departed
        const upcoming = stationList.filter(s => s.status !== 'Departed')
        const latestWithActual = [...stationList].reverse().find(s => s.arr || s.dep)
        const delay = latestWithActual ? delayMins(latestWithActual.schArr || latestWithActual.schDep, latestWithActual.arr || latestWithActual.dep) : null

        let status = 'SCHEDULED'
        let statusColor = '#8888aa'
        if (enroute) { status = 'EN ROUTE'; statusColor = '#fdcb6e' }
        else if (atStation) { status = 'AT STATION'; statusColor = '#00b894' }
        if (delay !== null && delay > 30) { statusColor = delay > 60 ? '#e17055' : '#e67e22' }

        rows.push({
          train: num,
          direction: num === '5' ? 'WESTBOUND' : 'EASTBOUND',
          origin: inst.origCode || (num === '5' ? 'CHI' : 'EMY'),
          destination: inst.destCode || (num === '5' ? 'EMY' : 'CHI'),
          status,
          statusColor,
          currentStation: current ? current.name : '--',
          schTime: current ? formatTime(current.schArr) : '--:--',
          actTime: current ? formatTime(current.arr) : '--:--',
          delay,
          velocity: inst.velocity,
          remarks: current ? `${enroute ? 'Next' : 'At'}: ${current.name}` : '',
        })

        // Show next 4 upcoming station arrivals as sub-rows
        upcoming.slice(0, 6).forEach(st => {
          const stDelay = delayMins(st.schArr, st.arr)
          rows.push({
            isSub: true, train: '', direction: '',
            station: st.name, code: st.code,
            schTime: formatTime(st.schArr), actTime: formatTime(st.arr),
            status: st.status || 'Scheduled',
            statusColor: st.status === 'Enroute' ? '#fdcb6e' : st.status === 'Station' ? '#00b894' : '#555577',
            delay: stDelay,
            remarks: st.arrCmnt || st.depCmnt || '',
          })
        })
      })
    })

    return rows
  }

  const rows = buildRows()

  // Solari-style cell
  const Cell = ({ children, width, color, align, mono, size }) => (
    <div style={{
      width, minWidth: width, padding: '0 12px',
      fontSize: size || 22, fontWeight: mono ? 400 : 600,
      color: color || '#f0f0ff', textAlign: align || 'left',
      fontFamily: mono ? '"Courier New", monospace' : 'inherit',
      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    }}>{children}</div>
  )

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#050510',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 40px', borderBottom: '2px solid #1a1a3a',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 32, color: '#6c5ce7' }}>◉</span>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: 2 }}>CALIFORNIA ZEPHYR</div>
            <div style={{ fontSize: 14, color: '#555577', letterSpacing: 4, textTransform: 'uppercase' }}>Live Departure & Arrival Board</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 48, fontWeight: 300, color: '#fff', fontVariantNumeric: 'tabular-nums', letterSpacing: 2 }}>
            {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div style={{ fontSize: 14, color: '#555577' }}>
            {clock.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '12px 40px',
        background: '#0a0a20', borderBottom: '1px solid #2a2a4a',
      }}>
        <Cell width={80} color="#555577" size={13}>TRAIN</Cell>
        <Cell width={120} color="#555577" size={13}>DIRECTION</Cell>
        <Cell width={80} color="#555577" size={13}>FROM</Cell>
        <Cell width={80} color="#555577" size={13}>TO</Cell>
        <Cell width={200} color="#555577" size={13}>STATION</Cell>
        <Cell width={100} color="#555577" size={13} align="right">SCHED</Cell>
        <Cell width={100} color="#555577" size={13} align="right">ACTUAL</Cell>
        <Cell width={120} color="#555577" size={13} align="center">STATUS</Cell>
        <Cell width={120} color="#555577" size={13} align="right">DELAY</Cell>
        <Cell width={200} color="#555577" size={13}>REMARKS</Cell>
      </div>

      {/* Rows */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {rows.map((row, i) => {
          if (row.isSub) {
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', padding: '8px 40px',
                borderBottom: '1px solid #111125',
                background: i % 2 === 0 ? '#0a0a18' : '#080815',
              }}>
                <Cell width={80} />
                <Cell width={120} />
                <Cell width={80} color="#555577" size={16} mono>{row.code}</Cell>
                <Cell width={80} />
                <Cell width={200} color="#8888aa" size={18}>{row.station}</Cell>
                <Cell width={100} color="#8888aa" size={18} align="right" mono>{row.schTime}</Cell>
                <Cell width={100} color="#bbb" size={18} align="right" mono>{row.actTime}</Cell>
                <Cell width={120} color={row.statusColor} size={14} align="center">{row.status}</Cell>
                <Cell width={120} align="right" size={16} color={row.delay !== null ? (row.delay <= 0 ? '#00b894' : row.delay < 30 ? '#fdcb6e' : row.delay < 60 ? '#e67e22' : '#e17055') : '#555577'}>
                  {row.delay !== null ? (row.delay <= 0 ? 'ON TIME' : `+${row.delay}m`) : ''}
                </Cell>
                <Cell width={200} color="#555577" size={14}>{row.remarks}</Cell>
              </div>
            )
          }

          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', padding: '14px 40px',
              borderBottom: '2px solid #1a1a3a',
              background: '#0d0d22',
            }}>
              <Cell width={80} color={row.train === '5' ? '#00cec9' : '#fd79a8'} size={26}>#{row.train}</Cell>
              <Cell width={120} size={18}>{row.direction}</Cell>
              <Cell width={80} mono size={18}>{row.origin}</Cell>
              <Cell width={80} mono size={18}>{row.destination}</Cell>
              <Cell width={200} size={20}>{row.currentStation || ''}</Cell>
              <Cell width={100} color="#8888aa" align="right" mono size={20}>{row.schTime}</Cell>
              <Cell width={100} align="right" mono size={20}>{row.actTime}</Cell>
              <Cell width={120} color={row.statusColor} align="center" size={16}>{row.status}</Cell>
              <Cell width={120} align="right" size={20} color={row.delay !== null ? (row.delay <= 0 ? '#00b894' : row.delay < 30 ? '#fdcb6e' : row.delay < 60 ? '#e67e22' : '#e17055') : '#555577'}>
                {row.delay !== null ? (row.delay <= 0 ? 'ON TIME' : `+${row.delay}m`) : ''}
              </Cell>
              <Cell width={200} color="#8888aa" size={16}>{row.remarks}</Cell>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', padding: '10px 40px',
        borderTop: '1px solid #2a2a4a', background: '#050510',
      }}>
        <div style={{ fontSize: 12, color: '#555577' }}>Data: Amtraker API · Auto-refresh 60s</div>
        {lastFetch && <div style={{ fontSize: 12, color: '#555577' }}>Last update: {lastFetch.toLocaleTimeString()}</div>}
      </div>
    </div>
  )
}
