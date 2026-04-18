import { useState } from 'react'
import { colors, loadState, saveState } from '../App'
import { logIssue } from '../ErrorBoundary'

const CATEGORIES = [
  { key: 'bug', label: 'Bug', icon: '🐛', color: colors.danger },
  { key: 'ui', label: 'UI Issue', icon: '🎨', color: colors.warning },
  { key: 'feature', label: 'Feature Request', icon: '💡', color: colors.secondary },
  { key: 'performance', label: 'Slow/Laggy', icon: '🐢', color: '#e67e22' },
  { key: 'data', label: 'Data Problem', icon: '💾', color: colors.accent },
  { key: 'other', label: 'Other', icon: '📝', color: colors.textSecondary },
]

const SEVERITY_LABELS = {
  critical: { label: 'Critical', color: colors.danger },
  high: { label: 'High', color: '#e67e22' },
  medium: { label: 'Medium', color: colors.warning },
  low: { label: 'Low', color: colors.textSecondary },
}

function analyzeIssues(issues) {
  if (issues.length === 0) return []
  const insights = []

  // Count crashes
  const crashes = issues.filter(i => i.type === 'crash')
  if (crashes.length > 0) {
    insights.push({ icon: '🚨', text: `${crashes.length} app crash${crashes.length > 1 ? 'es' : ''} logged. Most recent: ${crashes[0].message?.slice(0, 60) || 'Unknown'}` })
  }

  // Count by category
  const catCounts = {}
  issues.forEach(i => { catCounts[i.category || i.type] = (catCounts[i.category || i.type] || 0) + 1 })
  const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]
  if (topCat && topCat[1] > 1) {
    const catInfo = CATEGORIES.find(c => c.key === topCat[0])
    insights.push({ icon: '📊', text: `Most common issue type: ${catInfo?.label || topCat[0]} (${topCat[1]} reports)` })
  }

  // Repeated errors
  const msgCounts = {}
  issues.forEach(i => { if (i.message) msgCounts[i.message] = (msgCounts[i.message] || 0) + 1 })
  const repeated = Object.entries(msgCounts).filter(([_, c]) => c > 1).sort((a, b) => b[1] - a[1])
  if (repeated.length > 0) {
    insights.push({ icon: '🔁', text: `Recurring issue (${repeated[0][1]}x): "${repeated[0][0].slice(0, 50)}"` })
  }

  // Recent activity
  const last24h = issues.filter(i => {
    const t = new Date(i.timestamp).getTime()
    return Date.now() - t < 86400000
  })
  if (last24h.length > 3) {
    insights.push({ icon: '⚡', text: `${last24h.length} issues in the last 24 hours — may indicate a systemic problem` })
  }

  // Screen size correlation
  const smallScreenIssues = issues.filter(i => {
    if (!i.screen) return false
    const w = parseInt(i.screen.split('x')[0])
    return w > 0 && w < 400
  })
  if (smallScreenIssues.length > 2) {
    insights.push({ icon: '📱', text: `${smallScreenIssues.length} issues on small screens — possible responsive layout problem` })
  }

  if (insights.length === 0) {
    insights.push({ icon: '✅', text: 'No patterns detected. Issues look isolated.' })
  }

  return insights
}

export default function IssueTracker({ user, addMemory, R }) {
  const [issues, setIssues] = useState(() => {
    const logged = loadState('issueLog', [])
    const reported = loadState('userIssues', [])
    return [...logged, ...reported].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  })
  const [view, setView] = useState('list') // list, report, insights
  const [report, setReport] = useState({ category: 'bug', severity: 'medium', title: '', description: '', screen: '' })
  const [filter, setFilter] = useState('all')
  const [submitted, setSubmitted] = useState(false)

  const refreshIssues = () => {
    const logged = loadState('issueLog', [])
    const reported = loadState('userIssues', [])
    setIssues([...logged, ...reported].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)))
  }

  const submitReport = () => {
    if (!report.title.trim()) return
    const issue = {
      ...report,
      type: 'user-report',
      id: Date.now(),
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      screen: `${window.innerWidth}x${window.innerHeight}`,
      reporter: user?.name || 'Anonymous',
    }
    const userIssues = loadState('userIssues', [])
    userIssues.unshift(issue)
    saveState('userIssues', userIssues.slice(0, 100))
    logIssue(issue)
    addMemory(`Reported issue: ${report.title}`)
    setReport({ category: 'bug', severity: 'medium', title: '', description: '', screen: '' })
    setSubmitted(true)
    setTimeout(() => { setSubmitted(false); setView('list'); refreshIssues() }, 2000)
  }

  const deleteIssue = (timestamp) => {
    const logged = loadState('issueLog', []).filter(i => i.timestamp !== timestamp)
    const reported = loadState('userIssues', []).filter(i => i.timestamp !== timestamp)
    saveState('issueLog', logged)
    saveState('userIssues', reported)
    refreshIssues()
  }

  const clearAll = () => {
    saveState('issueLog', [])
    saveState('userIssues', [])
    refreshIssues()
  }

  const filtered = filter === 'all' ? issues :
    filter === 'crashes' ? issues.filter(i => i.type === 'crash') :
    filter === 'reports' ? issues.filter(i => i.type === 'user-report') :
    issues.filter(i => i.category === filter)

  const insights = analyzeIssues(issues)

  const crashCount = issues.filter(i => i.type === 'crash').length
  const reportCount = issues.filter(i => i.type === 'user-report').length

  return (
    <div style={{ padding: R.sp(16) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: R.sp(4) }}>
        <h2 style={{ color: colors.text, fontSize: R.fs(20), fontWeight: 700 }}>Issue Tracker</h2>
        <button onClick={refreshIssues} style={{
          padding: `${R.sp(6)}px ${R.sp(14)}px`, background: colors.surfaceLight,
          border: `${R.borderWidth}px solid ${colors.border}`, borderRadius: R.sp(8),
          color: colors.textSecondary, fontSize: R.fs(12), cursor: 'pointer', fontFamily: 'inherit',
          minHeight: R.minTouchTarget,
        }}>Refresh</button>
      </div>
      <p style={{ color: colors.textSecondary, fontSize: R.fs(12), marginBottom: R.sp(16) }}>
        Report issues and track auto-detected errors. Jarvis analyzes patterns to help find root causes.
      </p>

      {/* Stats */}
      <div style={{ display: 'flex', gap: R.sp(8), marginBottom: R.sp(16) }}>
        {[
          [issues.length, 'Total', colors.primary],
          [crashCount, 'Crashes', colors.danger],
          [reportCount, 'Reported', colors.secondary],
        ].map(([n, l, c]) => (
          <div key={l} style={{
            flex: 1, padding: `${R.sp(12)}px ${R.sp(8)}px`, background: `${c}15`,
            border: `${R.borderWidth}px solid ${c}30`, borderRadius: R.sp(10), textAlign: 'center',
          }}>
            <div style={{ color: c, fontSize: R.fs(20), fontWeight: 700 }}>{n}</div>
            <div style={{ color: colors.textSecondary, fontSize: R.fs(10) }}>{l}</div>
          </div>
        ))}
      </div>

      {/* View Toggle */}
      <div style={{ display: 'flex', gap: R.sp(8), marginBottom: R.sp(16) }}>
        {[['list', 'Issues'], ['report', 'Report'], ['insights', 'Bot Analysis']].map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} style={{
            flex: 1, padding: `${R.sp(10)}px ${R.sp(8)}px`,
            background: view === v ? colors.primary : colors.surfaceLight,
            border: `${R.borderWidth}px solid ${view === v ? colors.primary : colors.border}`,
            borderRadius: R.sp(10), color: view === v ? '#fff' : colors.textSecondary,
            fontSize: R.fs(13), fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            minHeight: R.minTouchTarget,
          }}>{label}</button>
        ))}
      </div>

      {/* === REPORT VIEW === */}
      {view === 'report' && (
        submitted ? (
          <div style={{ padding: R.sp(40), textAlign: 'center' }}>
            <div style={{ fontSize: R.fs(48), marginBottom: R.sp(12) }}>✅</div>
            <div style={{ color: colors.success, fontSize: R.fs(18), fontWeight: 600 }}>Issue Reported!</div>
            <div style={{ color: colors.textSecondary, fontSize: R.fs(13), marginTop: R.sp(4) }}>Thanks for helping improve Jarvis.</div>
          </div>
        ) : (
          <div>
            <label style={labelStyle(R)}>Category</label>
            <div style={{ display: 'flex', gap: R.sp(6), marginBottom: R.sp(12), flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => (
                <button key={cat.key} onClick={() => setReport({ ...report, category: cat.key })} style={{
                  padding: `${R.sp(8)}px ${R.sp(12)}px`, borderRadius: R.sp(8),
                  background: report.category === cat.key ? `${cat.color}20` : colors.surfaceLight,
                  border: `${R.borderWidth}px solid ${report.category === cat.key ? cat.color : colors.border}`,
                  color: report.category === cat.key ? cat.color : colors.textSecondary,
                  fontSize: R.fs(12), cursor: 'pointer', fontFamily: 'inherit', minHeight: R.minTouchTarget,
                }}>{cat.icon} {cat.label}</button>
              ))}
            </div>

            <label style={labelStyle(R)}>Severity</label>
            <div style={{ display: 'flex', gap: R.sp(6), marginBottom: R.sp(12) }}>
              {Object.entries(SEVERITY_LABELS).map(([key, { label, color }]) => (
                <button key={key} onClick={() => setReport({ ...report, severity: key })} style={{
                  flex: 1, padding: `${R.sp(8)}px ${R.sp(6)}px`, borderRadius: R.sp(8),
                  background: report.severity === key ? `${color}20` : colors.surfaceLight,
                  border: `${R.borderWidth}px solid ${report.severity === key ? color : colors.border}`,
                  color: report.severity === key ? color : colors.textSecondary,
                  fontSize: R.fs(11), cursor: 'pointer', fontFamily: 'inherit', minHeight: R.minTouchTarget,
                }}>{label}</button>
              ))}
            </div>

            <label style={labelStyle(R)}>What happened?</label>
            <input value={report.title} onChange={e => setReport({ ...report, title: e.target.value })}
              placeholder="Brief description of the issue" style={inputStyle(R)} />

            <label style={labelStyle(R)}>Details (optional)</label>
            <textarea value={report.description} onChange={e => setReport({ ...report, description: e.target.value })}
              placeholder="Steps to reproduce, what you expected, what happened instead..."
              rows={4} style={{ ...inputStyle(R), resize: 'vertical' }} />

            <label style={labelStyle(R)}>Which screen? (optional)</label>
            <select value={report.screen} onChange={e => setReport({ ...report, screen: e.target.value })} style={inputStyle(R)}>
              <option value="">-- Select screen --</option>
              {['Dashboard', 'Trains', 'Chat', 'Calendar', 'Tasks', 'Meals', 'Scanner',
                'Channels', 'Voice', 'Travel', 'Builder', 'Reminders', 'Settings'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <button onClick={submitReport} disabled={!report.title.trim()} style={{
              width: '100%', padding: R.sp(14), background: report.title.trim() ? colors.gradient1 : colors.surfaceLight,
              color: report.title.trim() ? '#fff' : colors.textMuted, border: 'none', borderRadius: R.sp(10),
              fontSize: R.fs(14), fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              minHeight: R.minTouchTarget, marginTop: R.sp(4),
            }}>Submit Issue Report</button>
          </div>
        )
      )}

      {/* === INSIGHTS / BOT ANALYSIS VIEW === */}
      {view === 'insights' && (
        <div>
          <div style={{
            padding: R.sp(16), background: `${colors.primary}12`, border: `${R.borderWidth}px solid ${colors.primary}30`,
            borderRadius: R.sp(12), marginBottom: R.sp(16),
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: R.sp(10), marginBottom: R.sp(12) }}>
              <span style={{ fontSize: R.fs(20) }}>🤖</span>
              <div>
                <div style={{ color: colors.primaryLight, fontSize: R.fs(14), fontWeight: 600 }}>Jarvis Issue Bot</div>
                <div style={{ color: colors.textSecondary, fontSize: R.fs(11) }}>Analyzing {issues.length} logged issue{issues.length !== 1 ? 's' : ''}...</div>
              </div>
            </div>

            {insights.map((insight, i) => (
              <div key={i} style={{
                display: 'flex', gap: R.sp(10), padding: `${R.sp(10)}px 0`,
                borderTop: i > 0 ? `${R.borderWidth}px solid ${colors.primary}20` : 'none',
              }}>
                <span style={{ fontSize: R.fs(16), flexShrink: 0 }}>{insight.icon}</span>
                <div style={{ color: colors.text, fontSize: R.fs(13), lineHeight: 1.5 }}>{insight.text}</div>
              </div>
            ))}
          </div>

          {/* Auto-capture status */}
          <div style={{
            padding: R.sp(14), background: `${colors.success}10`, border: `${R.borderWidth}px solid ${colors.success}25`,
            borderRadius: R.sp(10), marginBottom: R.sp(12),
          }}>
            <div style={{ color: colors.success, fontSize: R.fs(11), fontWeight: 600, marginBottom: R.sp(4) }}>AUTO-CAPTURE ACTIVE</div>
            <div style={{ color: colors.textSecondary, fontSize: R.fs(12), lineHeight: 1.5 }}>
              Jarvis automatically logs app crashes, API failures, and unhandled errors.
              User reports are saved locally. All data stays on your device.
            </div>
          </div>

          {issues.length > 0 && (
            <button onClick={clearAll} style={{
              width: '100%', padding: R.sp(12), background: 'transparent',
              border: `${R.borderWidth}px solid ${colors.danger}40`, borderRadius: R.sp(8),
              color: colors.danger, fontSize: R.fs(13), cursor: 'pointer', fontFamily: 'inherit',
              minHeight: R.minTouchTarget,
            }}>Clear All Issues</button>
          )}
        </div>
      )}

      {/* === LIST VIEW === */}
      {view === 'list' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: R.sp(6), marginBottom: R.sp(12), overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {[['all', 'All'], ['crashes', 'Crashes'], ['reports', 'Reported'], ['bug', 'Bugs'], ['ui', 'UI']].map(([f, label]) => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: `${R.sp(6)}px ${R.sp(12)}px`,
                background: filter === f ? colors.primary : colors.surfaceLight,
                border: `${R.borderWidth}px solid ${filter === f ? colors.primary : colors.border}`,
                borderRadius: R.sp(20), color: filter === f ? '#fff' : colors.textSecondary,
                fontSize: R.fs(11), cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
                minHeight: R.minTouchTarget,
              }}>{label}</button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: R.sp(40), textAlign: 'center' }}>
              <div style={{ fontSize: R.fs(32), marginBottom: R.sp(8) }}>🎉</div>
              <div style={{ color: colors.textMuted, fontSize: R.fs(14) }}>No issues found!</div>
              <div style={{ color: colors.textMuted, fontSize: R.fs(12), marginTop: R.sp(4) }}>
                Tap "Report" to log an issue, or crashes will appear here automatically.
              </div>
            </div>
          ) : (
            filtered.map((issue, i) => {
              const cat = CATEGORIES.find(c => c.key === (issue.category || issue.type))
              const sev = SEVERITY_LABELS[issue.severity] || SEVERITY_LABELS.medium
              const isCrash = issue.type === 'crash'
              const timeAgo = getTimeAgo(issue.timestamp)

              return (
                <div key={issue.timestamp + i} style={{
                  padding: R.sp(14), background: colors.surfaceLight,
                  border: `${R.borderWidth}px solid ${colors.border}`,
                  borderRadius: R.sp(10), marginBottom: R.sp(8),
                  borderLeft: `3px solid ${isCrash ? colors.danger : sev.color}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: R.sp(6), marginBottom: R.sp(4), flexWrap: 'wrap' }}>
                        {isCrash && <span style={tagStyle(R, colors.danger)}>CRASH</span>}
                        {issue.category && <span style={tagStyle(R, cat?.color || colors.textMuted)}>{cat?.icon} {cat?.label || issue.category}</span>}
                        <span style={tagStyle(R, sev.color)}>{sev.label}</span>
                      </div>
                      <div style={{ color: colors.text, fontSize: R.fs(13), fontWeight: 500, marginBottom: R.sp(2) }}>
                        {issue.title || issue.message || 'Untitled'}
                      </div>
                      {issue.description && (
                        <div style={{ color: colors.textSecondary, fontSize: R.fs(11), marginBottom: R.sp(4) }}>
                          {issue.description.slice(0, 120)}{issue.description.length > 120 ? '...' : ''}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: R.sp(8), flexWrap: 'wrap' }}>
                        <span style={{ color: colors.textMuted, fontSize: R.fs(10) }}>{timeAgo}</span>
                        {issue.screen && <span style={{ color: colors.textMuted, fontSize: R.fs(10) }}>Screen: {issue.screen}</span>}
                        {issue.reporter && <span style={{ color: colors.textMuted, fontSize: R.fs(10) }}>By: {issue.reporter}</span>}
                      </div>
                    </div>
                    <button onClick={() => deleteIssue(issue.timestamp)} style={{
                      background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer',
                      fontSize: R.fs(14), minWidth: R.minTouchTarget, minHeight: R.minTouchTarget,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>✕</button>
                  </div>
                  {isCrash && issue.stack && (
                    <div style={{
                      marginTop: R.sp(8), padding: R.sp(8), background: `${colors.danger}10`,
                      borderRadius: R.sp(6), fontSize: R.fs(10), color: colors.textMuted,
                      fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                    }}>{issue.stack}</div>
                  )}
                </div>
              )
            })
          )}
        </>
      )}
    </div>
  )
}

function getTimeAgo(timestamp) {
  if (!timestamp) return ''
  const diff = Date.now() - new Date(timestamp).getTime()
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  return new Date(timestamp).toLocaleDateString()
}

const labelStyle = (R) => ({
  color: colors.textSecondary, fontSize: R.fs(11), fontWeight: 600, marginBottom: R.sp(4), display: 'block',
})

const inputStyle = (R) => ({
  width: '100%', padding: `${R.sp(10)}px ${R.sp(12)}px`, background: colors.surfaceLight,
  border: `${R.borderWidth}px solid ${colors.border}`, borderRadius: R.sp(8), color: colors.text,
  fontSize: R.fs(13), fontFamily: 'inherit', marginBottom: R.sp(12),
})

const tagStyle = (R, color) => ({
  fontSize: R.fs(9), padding: `${R.sp(2)}px ${R.sp(6)}px`, borderRadius: R.sp(4),
  background: `${color}20`, color: color,
})
