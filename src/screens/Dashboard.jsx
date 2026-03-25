import { useState, useEffect } from 'react'
import { colors, loadState, saveState } from '../App'

const greetings = (name) => {
  const h = new Date().getHours()
  if (h < 12) return `Good morning, ${name}`
  if (h < 17) return `Good afternoon, ${name}`
  return `Good evening, ${name}`
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const WORLD_CLOCKS = [
  { label: 'New York', tz: 'America/New_York', flag: '🗽' },
  { label: 'London', tz: 'Europe/London', flag: '🇬🇧' },
  { label: 'Tokyo', tz: 'Asia/Tokyo', flag: '🇯🇵' },
  { label: 'Sydney', tz: 'Australia/Sydney', flag: '🇦🇺' },
  { label: 'Dubai', tz: 'Asia/Dubai', flag: '🇦🇪' },
  { label: 'LA', tz: 'America/Los_Angeles', flag: '🌴' },
]

const WEATHER_CITIES = ['New+York', 'London', 'Tokyo', 'Los+Angeles', 'Chicago']

function getTimeInTZ(tz) {
  return new Date().toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: true })
}

function getDateInTZ(tz) {
  return new Date().toLocaleDateString('en-US', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric' })
}

function getDayProgress() {
  const now = new Date()
  const start = new Date(now); start.setHours(0, 0, 0, 0)
  return Math.round(((now - start) / 86400000) * 100)
}

function getYearProgress() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const end = new Date(now.getFullYear() + 1, 0, 1)
  return Math.round(((now - start) / (end - start)) * 100)
}

function getDayOfYear() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  return Math.floor((now - start) / 86400000)
}

function getSunTimes() {
  const month = new Date().getMonth()
  const sunriseHours = [7.1, 6.7, 6.1, 5.3, 4.8, 4.6, 4.8, 5.3, 5.9, 6.4, 6.9, 7.2]
  const sunsetHours = [16.8, 17.4, 18.0, 18.7, 19.3, 19.6, 19.4, 18.8, 18.1, 17.3, 16.7, 16.5]
  const fmtTime = h => {
    const hr = Math.floor(h)
    const min = Math.round((h - hr) * 60)
    const ampm = hr >= 12 ? 'PM' : 'AM'
    return `${hr > 12 ? hr - 12 : hr}:${min.toString().padStart(2, '0')} ${ampm}`
  }
  return { sunrise: fmtTime(sunriseHours[month]), sunset: fmtTime(sunsetHours[month]) }
}

function getWeatherEmoji(code) {
  if (!code) return '🌤'
  const c = parseInt(code)
  if (c === 113) return '☀️'
  if (c === 116) return '⛅'
  if (c === 119 || c === 122) return '☁️'
  if (c >= 176 && c <= 263) return '🌦'
  if (c >= 266 && c <= 356) return '🌧'
  if (c >= 359 && c <= 395) return '⛈'
  if (c >= 227 && c <= 230) return '🌨'
  if (c >= 248 && c <= 260) return '🌫'
  return '🌤'
}

export default function Dashboard({ user, navigate, addMemory, R }) {
  const [briefing, setBriefing] = useState(null)
  const [events] = useState(() => loadState('events', []))
  const [tasks] = useState(() => loadState('tasks', []))
  const [reminders] = useState(() => loadState('reminders', []))
  const [trainData, setTrainData] = useState(null)
  const [trainSchedule] = useState(() => loadState('trainSchedule', []))
  const [clockTick, setClockTick] = useState(0)
  const [weather, setWeather] = useState(() => loadState('dashWeather', null))
  const [weatherAge, setWeatherAge] = useState(() => loadState('dashWeatherAge', 0))
  const [news, setNews] = useState(() => loadState('dashNews', null))
  const [newsAge, setNewsAge] = useState(() => loadState('dashNewsAge', 0))

  const isZFlip = R.device === 'zFlipCover'
  const isSmall = R.isSmall
  const isMedium = R.isMedium

  useEffect(() => {
    const id = setInterval(() => setClockTick(t => t + 1), 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const now = Date.now()
    if (weather && now - weatherAge < 30 * 60 * 1000) return
    Promise.all(
      WEATHER_CITIES.map(city =>
        fetch(`https://wttr.in/${city}?format=j1`)
          .then(r => r.json())
          .then(d => ({
            city: city.replace('+', ' '),
            temp_f: d.current_condition?.[0]?.temp_F,
            temp_c: d.current_condition?.[0]?.temp_C,
            desc: d.current_condition?.[0]?.weatherDesc?.[0]?.value,
            code: d.current_condition?.[0]?.weatherCode,
            humidity: d.current_condition?.[0]?.humidity,
            wind_mph: d.current_condition?.[0]?.windspeedMiles,
            feels_f: d.current_condition?.[0]?.FeelsLikeF,
          }))
          .catch(() => null)
      )
    ).then(results => {
      const data = results.filter(Boolean)
      if (data.length > 0) {
        setWeather(data)
        setWeatherAge(now)
        saveState('dashWeather', data)
        saveState('dashWeatherAge', now)
      }
    })
  }, [])

  useEffect(() => {
    const now = Date.now()
    if (news && now - newsAge < 15 * 60 * 1000) return
    fetch('https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fnews.google.com%2Frss%3Fhl%3Den-US%26gl%3DUS%26ceid%3DUS%3Aen')
      .then(r => r.json())
      .then(d => {
        if (d.items) {
          const items = d.items.slice(0, 8).map(item => ({
            title: item.title?.replace(/ - [^-]+$/, '') || item.title,
            source: item.title?.match(/ - ([^-]+)$/)?.[1] || '',
            link: item.link,
            pubDate: item.pubDate,
          }))
          setNews(items)
          setNewsAge(now)
          saveState('dashNews', items)
          saveState('dashNewsAge', now)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const todayDay = DAYS[new Date().getDay()]
    const todayTrains = trainSchedule.filter(s => s.days.includes(todayDay))
    if (todayTrains.length === 0) return
    const trainNums = [...new Set(todayTrains.map(s => s.train))]
    Promise.all(trainNums.map(n => fetch(`https://api-v3.amtraker.com/v3/trains/${n}`).then(r => r.json()).catch(() => null)))
      .then(results => {
        const data = {}
        trainNums.forEach((num, i) => { if (results[i]?.[num]) data[num] = results[i][num] })
        setTrainData({ todayTrains, data })
      })
  }, [trainSchedule])

  useEffect(() => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const todayEvents = events.filter(e => e.date === todayStr)
    const pendingTasks = tasks.filter(t => !t.completed)
    const upcomingReminders = reminders.filter(r => !r.dismissed)
    setBriefing({
      date: today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
      events: todayEvents.length,
      tasks: pendingTasks.length,
      reminders: upcomingReminders.length,
      todayEvents,
      pendingTasks: pendingTasks.slice(0, 3),
    })
  }, [events, tasks, reminders])

  if (!briefing) return null

  const sunTimes = getSunTimes()
  const dayProgress = getDayProgress()
  const yearProgress = getYearProgress()
  const dayOfYear = getDayOfYear()
  const now = new Date()
  const weekNum = Math.ceil(((now - new Date(now.getFullYear(), 0, 1)) / 86400000 + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7)

  // Responsive grid columns
  const clockCols = isZFlip ? 2 : isSmall ? 2 : isMedium ? 3 : R.isLandscape ? 6 : 3
  const quickActionCols = isZFlip ? 2 : isSmall ? 4 : R.gridCols >= 4 ? 4 : 4
  const featureCols = isZFlip ? 1 : isSmall ? 2 : R.gridCols >= 3 ? 4 : 2
  const weatherMinWidth = isZFlip ? 100 : isSmall ? 110 : 120

  return (
    <div style={{ padding: R.sp(16) }}>
      {/* Greeting */}
      <div style={{ marginBottom: R.sp(20) }}>
        <h1 style={{ color: colors.text, fontSize: R.fs(isZFlip ? 18 : 24), fontWeight: 700, marginBottom: R.sp(4) }}>
          {greetings(user.name)}
        </h1>
        <p style={{ color: colors.textSecondary, fontSize: R.fs(14) }}>{briefing.date}</p>
        {!isZFlip && (
          <p style={{ color: colors.textMuted, fontSize: R.fs(11), marginTop: R.sp(2) }}>
            Day {dayOfYear} · Week {weekNum} · 🌅 {sunTimes.sunrise} · 🌇 {sunTimes.sunset}
          </p>
        )}
      </div>

      {/* Day & Year Progress */}
      {!isZFlip && (
        <div style={{ display: 'flex', gap: R.sp(10), marginBottom: R.sp(16) }}>
          <div style={{ flex: 1, background: colors.surfaceLight, borderRadius: R.sp(12), padding: `${R.sp(10)}px ${R.sp(14)}px`, border: `${R.borderWidth}px solid ${colors.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: R.sp(6) }}>
              <span style={{ color: colors.textSecondary, fontSize: R.fs(10), fontWeight: 600 }}>DAY PROGRESS</span>
              <span style={{ color: colors.primaryLight, fontSize: R.fs(10) }}>{dayProgress}%</span>
            </div>
            <div style={{ height: R.sp(4), background: colors.border, borderRadius: R.sp(2), overflow: 'hidden' }}>
              <div style={{ width: `${dayProgress}%`, height: '100%', background: colors.gradient1, borderRadius: R.sp(2) }} />
            </div>
          </div>
          <div style={{ flex: 1, background: colors.surfaceLight, borderRadius: R.sp(12), padding: `${R.sp(10)}px ${R.sp(14)}px`, border: `${R.borderWidth}px solid ${colors.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: R.sp(6) }}>
              <span style={{ color: colors.textSecondary, fontSize: R.fs(10), fontWeight: 600 }}>YEAR PROGRESS</span>
              <span style={{ color: colors.secondary, fontSize: R.fs(10) }}>{yearProgress}%</span>
            </div>
            <div style={{ height: R.sp(4), background: colors.border, borderRadius: R.sp(2), overflow: 'hidden' }}>
              <div style={{ width: `${yearProgress}%`, height: '100%', background: colors.gradient2, borderRadius: R.sp(2) }} />
            </div>
          </div>
        </div>
      )}

      {/* World Clocks */}
      <div style={{ marginBottom: R.sp(16) }}>
        <h3 style={{ color: colors.text, fontSize: R.fs(14), fontWeight: 600, marginBottom: R.sp(10) }}>🌍 WORLD CLOCKS</h3>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${clockCols}, 1fr)`, gap: R.sp(8) }}>
          {(isZFlip ? WORLD_CLOCKS.slice(0, 4) : WORLD_CLOCKS).map(({ label, tz, flag }) => (
            <div key={tz} style={{
              background: colors.surfaceLight, borderRadius: R.sp(10), padding: `${R.sp(10)}px ${R.sp(8)}px`,
              border: `${R.borderWidth}px solid ${colors.border}`, textAlign: 'center',
            }}>
              <div style={{ fontSize: R.fs(14), marginBottom: R.sp(2) }}>{flag}</div>
              <div style={{ color: colors.text, fontSize: R.fs(isZFlip ? 11 : 13), fontWeight: 600 }}>{getTimeInTZ(tz)}</div>
              <div style={{ color: colors.textMuted, fontSize: R.fs(isZFlip ? 8 : 9) }}>{label}</div>
              {!isZFlip && <div style={{ color: colors.textMuted, fontSize: R.fs(8) }}>{getDateInTZ(tz)}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Weather */}
      {weather && weather.length > 0 && !isZFlip && (
        <div style={{ marginBottom: R.sp(16) }}>
          <h3 style={{ color: colors.text, fontSize: R.fs(14), fontWeight: 600, marginBottom: R.sp(10) }}>🌤 LIVE WEATHER</h3>
          <div style={{ overflowX: 'auto', display: 'flex', gap: R.sp(8), paddingBottom: R.sp(4), WebkitOverflowScrolling: 'touch' }}>
            {weather.map(w => (
              <div key={w.city} style={{
                minWidth: weatherMinWidth, background: colors.surfaceLight, borderRadius: R.sp(12), padding: R.sp(12),
                border: `${R.borderWidth}px solid ${colors.border}`, flexShrink: 0,
              }}>
                <div style={{ fontSize: R.fs(24), marginBottom: R.sp(4) }}>{getWeatherEmoji(w.code)}</div>
                <div style={{ color: colors.text, fontSize: R.fs(20), fontWeight: 700 }}>{w.temp_f}°F</div>
                <div style={{ color: colors.textMuted, fontSize: R.fs(10), marginBottom: R.sp(4) }}>{w.temp_c}°C</div>
                <div style={{ color: colors.textSecondary, fontSize: R.fs(11), fontWeight: 500, marginBottom: R.sp(2) }}>{w.city}</div>
                <div style={{ color: colors.textMuted, fontSize: R.fs(9) }}>{w.desc}</div>
                <div style={{ color: colors.textMuted, fontSize: R.fs(9), marginTop: R.sp(4) }}>
                  💧 {w.humidity}% · 💨 {w.wind_mph}mph
                </div>
                <div style={{ color: colors.textMuted, fontSize: R.fs(9) }}>Feels {w.feels_f}°F</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Morning Briefing Card */}
      <div style={{
        background: colors.gradient1, borderRadius: R.sp(16), padding: R.sp(20), marginBottom: R.sp(16),
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -20, right: -20, fontSize: R.fs(80), opacity: 0.1 }}>◉</div>
        <h3 style={{ color: '#fff', fontSize: R.fs(14), fontWeight: 600, marginBottom: R.sp(12), opacity: 0.9 }}>TODAY'S BRIEFING</h3>
        <div style={{ display: 'flex', gap: R.sp(16) }}>
          {[
            [briefing.events, 'Events', colors.warning],
            [briefing.tasks, 'Tasks', colors.secondary],
            [briefing.reminders, 'Reminders', colors.accent],
          ].map(([count, label]) => (
            <div key={label} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: R.fs(isZFlip ? 20 : 28), fontWeight: 700, color: '#fff' }}>{count}</div>
              <div style={{ fontSize: R.fs(11), color: 'rgba(255,255,255,0.7)' }}>{label}</div>
            </div>
          ))}
        </div>
        {briefing.events === 0 && briefing.tasks === 0 && (
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: R.fs(13), marginTop: R.sp(12) }}>
            Your day is clear! Time to relax or plan ahead.
          </p>
        )}
      </div>

      {/* News Headlines */}
      {news && news.length > 0 && !isZFlip && (
        <div style={{ marginBottom: R.sp(16) }}>
          <h3 style={{ color: colors.text, fontSize: R.fs(14), fontWeight: 600, marginBottom: R.sp(10) }}>📰 TOP HEADLINES</h3>
          <div style={{
            background: colors.surfaceLight, borderRadius: R.sp(12), border: `${R.borderWidth}px solid ${colors.border}`,
            overflow: 'hidden',
          }}>
            {news.map((item, i) => (
              <a
                key={i}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block', padding: `${R.sp(10)}px ${R.sp(14)}px`,
                  borderBottom: i < news.length - 1 ? `${R.borderWidth}px solid ${colors.border}` : 'none',
                  textDecoration: 'none', cursor: 'pointer',
                  minHeight: R.minTouchTarget,
                }}
              >
                <div style={{ color: colors.text, fontSize: R.fs(13), lineHeight: 1.4, marginBottom: R.sp(2) }}>
                  {item.title}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: colors.primaryLight, fontSize: R.fs(10) }}>{item.source}</span>
                  <span style={{ color: colors.textMuted, fontSize: R.fs(10) }}>
                    {item.pubDate ? new Date(item.pubDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Train Status Widget */}
      {trainData && trainData.todayTrains.length > 0 && (
        <button onClick={() => navigate('trains')} style={{
          width: '100%', padding: R.sp(14), background: colors.surfaceLight, border: `${R.borderWidth}px solid ${colors.border}`,
          borderRadius: R.sp(12), marginBottom: R.sp(16), cursor: 'pointer', textAlign: 'left',
          minHeight: R.minTouchTarget,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: R.sp(8), marginBottom: R.sp(8) }}>
            <span style={{ fontSize: R.fs(16) }}>🚂</span>
            <span style={{ color: colors.text, fontSize: R.fs(13), fontWeight: 600 }}>YOUR TRAINS TODAY</span>
          </div>
          {trainData.todayTrains.map(s => {
            const instances = trainData.data[s.train]
            let statusText = 'No data'
            let statusColor = colors.textMuted
            if (instances && instances.length > 0) {
              const inst = instances[0]
              const stationList = inst.stations ? (Array.isArray(inst.stations) ? inst.stations : Object.values(inst.stations)) : []
              const myStation = stationList.find(st => st.code === s.boardStation)
              if (myStation) {
                if (myStation.arr && myStation.schArr) {
                  const delay = Math.round((new Date(myStation.arr).getTime() - new Date(myStation.schArr).getTime()) / 60000)
                  if (delay <= 0) { statusText = 'On time'; statusColor = colors.success }
                  else if (delay < 60) { statusText = `${delay}m late`; statusColor = delay < 30 ? colors.warning : '#e67e22' }
                  else { statusText = `${Math.floor(delay/60)}h ${delay%60}m late`; statusColor = colors.danger }
                } else if (myStation.status) {
                  statusText = myStation.status
                  statusColor = myStation.status === 'Enroute' ? colors.warning : myStation.status === 'Departed' ? colors.textMuted : colors.success
                }
              }
              const current = stationList.find(st => st.status === 'Enroute') || stationList.find(st => st.status === 'Station')
              if (current) statusText += ` · Now: ${current.name}`
            }
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: R.sp(8), padding: `${R.sp(4)}px 0` }}>
                <span style={{ color: s.train === '5' ? colors.secondary : colors.accent, fontSize: R.fs(14), fontWeight: 700, width: R.sp(28) }}>#{s.train}</span>
                <span style={{ color: colors.textSecondary, fontSize: R.fs(12) }}>{s.boardStation}</span>
                <span style={{ color: statusColor, fontSize: R.fs(12), fontWeight: 500 }}>{statusText}</span>
              </div>
            )
          })}
          <div style={{ color: colors.primaryLight, fontSize: R.fs(11), marginTop: R.sp(6) }}>Tap for full details →</div>
        </button>
      )}

      {/* Quick Actions */}
      <div style={{ marginBottom: R.sp(20) }}>
        <h3 style={{ color: colors.text, fontSize: R.fs(14), fontWeight: 600, marginBottom: R.sp(12) }}>QUICK ACTIONS</h3>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${quickActionCols}, 1fr)`, gap: R.sp(8) }}>
          {[
            ['🚂', 'Trains', 'trains', colors.warning],
            ['◉', 'Chat', 'chat', colors.primary],
            ['◎', 'Voice', 'voice', colors.secondary],
            ['⊞', 'Scan', 'scanner', colors.accent],
          ].map(([icon, label, target, col]) => (
            <button
              key={target}
              onClick={() => navigate(target)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: R.sp(6),
                padding: `${R.sp(14)}px ${R.sp(8)}px`, background: colors.surfaceLight,
                border: `${R.borderWidth}px solid ${colors.border}`,
                borderRadius: R.sp(12), color: col, cursor: 'pointer', fontSize: R.fs(22),
                minHeight: R.minTouchTarget,
              }}
            >
              {icon}
              <span style={{ fontSize: R.fs(10), color: colors.textSecondary }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Today's Events */}
      {briefing.todayEvents.length > 0 && (
        <div style={{ marginBottom: R.sp(20) }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: R.sp(10) }}>
            <h3 style={{ color: colors.text, fontSize: R.fs(14), fontWeight: 600 }}>TODAY'S EVENTS</h3>
            <button onClick={() => navigate('calendar')} style={linkBtn}>View all</button>
          </div>
          {briefing.todayEvents.map((e, i) => (
            <div key={i} style={cardStyle(R)}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.text, fontSize: R.fs(14), fontWeight: 500 }}>{e.title}</span>
                <span style={{ color: colors.primaryLight, fontSize: R.fs(12) }}>{e.time}</span>
              </div>
              {e.location && <div style={{ color: colors.textSecondary, fontSize: R.fs(12), marginTop: R.sp(4) }}>{e.location}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Pending Tasks */}
      {briefing.pendingTasks.length > 0 && (
        <div style={{ marginBottom: R.sp(20) }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: R.sp(10) }}>
            <h3 style={{ color: colors.text, fontSize: R.fs(14), fontWeight: 600 }}>PENDING TASKS</h3>
            <button onClick={() => navigate('tasks')} style={linkBtn}>View all</button>
          </div>
          {briefing.pendingTasks.map((t, i) => (
            <div key={i} style={cardStyle(R)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: R.sp(8) }}>
                <span style={{ color: t.priority === 'high' ? colors.danger : colors.textSecondary }}>●</span>
                <span style={{ color: colors.text, fontSize: R.fs(14) }}>{t.title}</span>
              </div>
              {t.assignee && <div style={{ color: colors.textSecondary, fontSize: R.fs(11), marginTop: R.sp(4), marginLeft: R.sp(20) }}>Assigned to {t.assignee}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Features Grid */}
      {!isZFlip && (
        <div style={{ marginBottom: R.sp(20) }}>
          <h3 style={{ color: colors.text, fontSize: R.fs(14), fontWeight: 600, marginBottom: R.sp(12) }}>EXPLORE FEATURES</h3>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${featureCols}, 1fr)`, gap: R.sp(10) }}>
            {[
              ['◈', 'Meal Planner', 'Plan meals & groceries', 'meals', colors.success],
              ['⊶', 'Channels', 'SMS, Email, Slack', 'channels', colors.primary],
              ['⬡', 'App Builder', 'Create custom apps', 'builder', colors.accent],
              ['⏰', 'Reminders', 'Smart notifications', 'reminders', colors.warning],
            ].map(([icon, title, desc, target, col]) => (
              <button
                key={target}
                onClick={() => navigate(target)}
                style={{
                  padding: R.sp(16), background: colors.surfaceLight, border: `${R.borderWidth}px solid ${colors.border}`,
                  borderRadius: R.sp(12), textAlign: 'left', cursor: 'pointer',
                  minHeight: R.minTouchTarget,
                }}
              >
                <div style={{ fontSize: R.fs(24), marginBottom: R.sp(8), color: col }}>{icon}</div>
                <div style={{ color: colors.text, fontSize: R.fs(13), fontWeight: 600 }}>{title}</div>
                <div style={{ color: colors.textSecondary, fontSize: R.fs(11) }}>{desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const cardStyle = (R) => ({
  padding: R.sp(14), background: colors.surfaceLight, border: `${R.borderWidth}px solid ${colors.border}`,
  borderRadius: R.sp(10), marginBottom: R.sp(8),
})

const linkBtn = {
  background: 'none', border: 'none', color: colors.primaryLight,
  fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
}
// Note: linkBtn.fontSize stays static — it's used outside R scope. The value is small enough to not matter.
