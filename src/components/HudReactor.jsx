import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * HudReactor — Iron Man J.A.R.V.I.S. HUD arc reactor
 *
 * Two modes:
 * 1. Inline mini icon (replaces ◉) — small spinning reactor
 * 2. Full-screen overlay — tapping the mini reactor opens this
 *    Takes over the entire screen like you're face-to-face with Jarvis
 */

const CX = 250, CY = 250 // SVG center

// Ring config: [radius, strokeWidth, dasharray, opacity, speed(deg/s), color, linecap]
const RING_CONFIGS = [
  // Outermost hairline dashed
  { r: 242, sw: 0.5, da: '2 6', op: 0.06, spd: 0.5 },
  // Tick ring (built separately)
  { r: 230, sw: 0, da: '', op: 0, spd: -1.2, ticks: true },
  // Thick segmented
  { r: 210, sw: 4, da: '50 12 25 12 70 12 35 12 45 12', op: 0.18, spd: 2.0, cap: 'round' },
  // Bright accent highlight on same radius
  { r: 210, sw: 4, da: '60 1300', op: 0.55, spd: 2.0, bright: true, cap: 'round', filter: true },
  // Double thin
  { r: 192, sw: 1, da: '', op: 0.1, spd: -3.0 },
  { r: 192, sw: 2.5, da: '90 1200', op: 0.6, spd: -3.0, bright: true, cap: 'round', filter: true },
  { r: 192, sw: 2, da: '45 1200', doff: 280, op: 0.45, spd: -3.0, gold: true, cap: 'round' },
  // Heavy notched
  { r: 170, sw: 7, da: '6 3', op: 0.12, spd: 1.5 },
  { r: 170, sw: 7, da: '30 250 20 250', op: 0.5, spd: 1.5, bright: true, cap: 'round', filter: true },
  // Dot marker ring (built separately)
  { r: 150, sw: 0, da: '', op: 0, spd: -2.5, dots: true },
  // Inner segmented
  { r: 130, sw: 2.5, da: '12 6 5 6', op: 0.1, spd: 4.0 },
  { r: 130, sw: 3, da: '35 800', op: 0.65, spd: 4.0, bright: true, cap: 'round', filter: true },
  { r: 130, sw: 2, da: '20 800', doff: 180, op: 0.4, spd: 4.0, bright: true, cap: 'round' },
  // Innermost fast
  { r: 110, sw: 1.5, da: '3 4', op: 0.08, spd: -6.0 },
  { r: 110, sw: 3, da: '25 700', op: 0.7, spd: -6.0, bright: true, cap: 'round', filter: true },
  { r: 110, sw: 2, da: '15 700', doff: 120, op: 0.35, spd: -6.0, gold: true, cap: 'round' },
]

// Group rings by speed to reduce SVG groups
function groupBySpeed(configs) {
  const map = new Map()
  configs.forEach((c, i) => {
    const key = c.spd
    if (!map.has(key)) map.set(key, [])
    map.get(key).push({ ...c, idx: i })
  })
  return Array.from(map.entries())
}

const GROUPED = groupBySpeed(RING_CONFIGS)

function buildTickMarks(r) {
  const lines = []
  for (let a = 0; a < 360; a += 2) {
    const major = a % 10 === 0
    const cardinal = a % 90 === 0
    lines.push(
      <line
        key={a}
        x1={CX} y1={CY - r}
        x2={CX} y2={CY - r + (cardinal ? 15 : major ? 10 : 5)}
        stroke={cardinal ? 'rgba(0,230,240,0.5)' : major ? 'rgba(0,210,220,0.25)' : 'rgba(0,210,220,0.08)'}
        strokeWidth={cardinal ? 1.5 : major ? 1 : 0.4}
        transform={`rotate(${a} ${CX} ${CY})`}
      />
    )
  }
  return lines
}

function buildDotMarkers(r) {
  const dots = []
  for (let d = 0; d < 360; d += 22.5) {
    const rad = (d - 90) * Math.PI / 180
    const big = d % 45 === 0
    dots.push(
      <circle
        key={d}
        cx={CX + r * Math.cos(rad)}
        cy={CY + r * Math.sin(rad)}
        r={big ? 3 : 1.5}
        fill={big ? 'rgba(0,240,250,0.6)' : 'rgba(0,220,230,0.3)'}
      />
    )
  }
  return dots
}

function getStroke(c) {
  if (c.gold) return `rgba(253,203,110,${c.op})`
  if (c.bright) return `rgba(0,240,250,${c.op})`
  return `rgba(0,210,220,${c.op})`
}

// Mini inline reactor icon
export function HudIcon({ size = 24, style = {}, onClick, glow = false }) {
  const svgRef = useRef(null)
  const animRef = useRef(null)
  const anglesRef = useRef([0, 0, 0])

  useEffect(() => {
    let last = performance.now()
    const speeds = [3, -5, 8] // 3 ring speeds for mini version
    function tick(now) {
      const dt = (now - last) / 1000
      last = now
      const rings = svgRef.current?.querySelectorAll('.mr')
      if (rings) {
        for (let i = 0; i < rings.length; i++) {
          anglesRef.current[i] = (anglesRef.current[i] + speeds[i] * dt) % 360
          rings[i].setAttribute('transform', `rotate(${anglesRef.current[i]} 50 50)`)
        }
      }
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      width={size}
      height={size}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', display: 'inline-block', verticalAlign: 'middle', ...style }}
    >
      <defs>
        <filter id="mg"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      {/* Ring 1: outer ticks */}
      <g className="mr">
        <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(0,210,220,0.15)" strokeWidth="1" strokeDasharray="3 5"/>
        {[0,30,60,90,120,150,180,210,240,270,300,330].map(a => (
          <line key={a} x1="50" y1="6" x2="50" y2={a % 90 === 0 ? '12' : '10'}
            stroke={a % 90 === 0 ? 'rgba(0,230,240,0.5)' : 'rgba(0,210,220,0.2)'}
            strokeWidth={a % 90 === 0 ? '1.2' : '0.6'}
            transform={`rotate(${a} 50 50)`}
          />
        ))}
      </g>
      {/* Ring 2: segmented arc */}
      <g className="mr" filter="url(#mg)">
        <circle cx="50" cy="50" r="36" fill="none" stroke="rgba(0,210,220,0.15)" strokeWidth="2.5" strokeDasharray="10 4 5 4 15 4"/>
        <circle cx="50" cy="50" r="36" fill="none" stroke="rgba(0,240,250,0.6)" strokeWidth="2.5" strokeDasharray="15 300" strokeLinecap="round"/>
      </g>
      {/* Ring 3: inner fast ring */}
      <g className="mr" filter="url(#mg)">
        <circle cx="50" cy="50" r="26" fill="none" stroke="rgba(0,210,220,0.1)" strokeWidth="2" strokeDasharray="4 3"/>
        <circle cx="50" cy="50" r="26" fill="none" stroke="rgba(0,250,255,0.7)" strokeWidth="2.5" strokeDasharray="10 200" strokeLinecap="round"/>
        <circle cx="50" cy="50" r="26" fill="none" stroke="rgba(253,203,110,0.35)" strokeWidth="1.5" strokeDasharray="8 200" strokeDashoffset="60" strokeLinecap="round"/>
      </g>
      {/* Core */}
      <circle cx="50" cy="50" r="16" fill="none" stroke="rgba(0,210,220,0.2)" strokeWidth="1" filter="url(#mg)"/>
      <circle cx="50" cy="50" r="8" fill={`rgba(0,210,220,${glow ? 0.15 : 0.08})`}/>
    </svg>
  )
}


// Full-screen HUD reactor overlay
export function HudOverlay({ open, onClose }) {
  const svgRef = useRef(null)
  const animRef = useRef(null)
  const anglesRef = useRef(GROUPED.map(() => 0))

  useEffect(() => {
    if (!open) return
    let last = performance.now()
    function tick(now) {
      const dt = (now - last) / 1000
      last = now
      const groups = svgRef.current?.querySelectorAll('.rg')
      if (groups) {
        GROUPED.forEach(([speed], i) => {
          anglesRef.current[i] = (anglesRef.current[i] + speed * dt) % 360
          if (groups[i]) groups[i].setAttribute('transform', `rotate(${anglesRef.current[i]} ${CX} ${CY})`)
        })
      }
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [open])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'radial-gradient(ellipse at center, #0a1020 0%, #060a12 50%, #020406 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'hudFadeIn 0.3s ease',
        cursor: 'pointer',
      }}
    >
      {/* Grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: 'linear-gradient(rgba(0,210,220,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,210,220,1) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
      }} />

      {/* Sonar rings */}
      {[110, 130, 155, 185].map((pct, i) => (
        <div key={i} style={{
          position: 'absolute', top: '50%', left: '50%', borderRadius: '50%',
          width: `${pct}%`, height: `${pct}%`,
          border: '1px solid rgba(0,210,220,0.1)',
          transform: 'translate(-50%, -50%) scale(0.4)',
          animation: `sonarExpand 4s ease-out ${i}s infinite`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Core glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 160, height: 160, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,210,220,0.3), rgba(0,210,220,0.08) 40%, transparent 65%)',
        filter: 'blur(15px)',
        animation: 'coreGlow 2.5s ease-in-out infinite',
      }} />

      {/* SVG Reactor */}
      <svg
        ref={svgRef}
        viewBox="0 0 500 500"
        style={{ width: 'min(95vw, 95vh)', height: 'min(95vw, 95vh)', maxWidth: 800, maxHeight: 800 }}
      >
        <defs>
          <filter id="fg1"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="fg2"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>

        {/* Static core rings */}
        <circle cx={CX} cy={CY} r={90} fill="none" stroke="rgba(0,210,220,0.2)" strokeWidth="1.5" filter="url(#fg1)"/>
        <circle cx={CX} cy={CY} r={86} fill="none" stroke="rgba(0,210,220,0.06)" strokeWidth="0.5"/>

        {/* Spinning ring groups */}
        {GROUPED.map(([speed, configs], gi) => (
          <g key={gi} className="rg">
            {configs.map(c => {
              if (c.ticks) return <g key={c.idx}>{buildTickMarks(c.r)}</g>
              if (c.dots) return <g key={c.idx}>{buildDotMarkers(c.r)}</g>
              if (c.sw === 0) return null
              return (
                <circle
                  key={c.idx}
                  cx={CX} cy={CY} r={c.r}
                  fill="none"
                  stroke={getStroke(c)}
                  strokeWidth={c.sw}
                  strokeDasharray={c.da || undefined}
                  strokeDashoffset={c.doff || undefined}
                  strokeLinecap={c.cap || undefined}
                  filter={c.filter ? 'url(#fg2)' : undefined}
                />
              )
            })}
          </g>
        ))}
      </svg>

      {/* Center text */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        textAlign: 'center', zIndex: 3,
      }}>
        <div style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: 22, fontWeight: 700, letterSpacing: 10,
          color: 'rgba(0,225,235,0.95)',
          textShadow: '0 0 25px rgba(0,210,220,0.6), 0 0 50px rgba(0,210,220,0.25)',
          animation: 'textGlow 2.5s ease-in-out infinite',
        }}>
          J.A.R.V.I.S
        </div>
        <div style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: 14, fontWeight: 400, letterSpacing: 4,
          color: 'rgba(0,200,210,0.5)', marginTop: 6,
          fontVariantNumeric: 'tabular-nums',
        }} id="hud-overlay-clock">
        </div>
      </div>

      {/* Tap to dismiss */}
      <div style={{
        position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
        color: 'rgba(0,200,210,0.25)', fontSize: 10, letterSpacing: 2,
        fontFamily: "'Orbitron', sans-serif",
      }}>
        TAP TO DISMISS
      </div>

      <style>{`
        @keyframes hudFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes sonarExpand { 0% { transform: translate(-50%,-50%) scale(0.4); opacity: 0; } 12% { opacity: 0.35; } 100% { transform: translate(-50%,-50%) scale(1); opacity: 0; } }
        @keyframes coreGlow { 0%,100% { opacity: 0.6; transform: translate(-50%,-50%) scale(1); } 50% { opacity: 1; transform: translate(-50%,-50%) scale(1.4); } }
        @keyframes textGlow { 0%,100% { text-shadow: 0 0 25px rgba(0,210,220,0.6), 0 0 50px rgba(0,210,220,0.25); } 50% { text-shadow: 0 0 40px rgba(0,210,220,0.9), 0 0 80px rgba(0,210,220,0.4); } }
      `}</style>
    </div>
  )
}

// Hook to manage overlay state
export function useHudOverlay() {
  const [open, setOpen] = useState(false)
  const show = useCallback(() => setOpen(true), [])
  const hide = useCallback(() => setOpen(false), [])
  return { open, show, hide }
}
