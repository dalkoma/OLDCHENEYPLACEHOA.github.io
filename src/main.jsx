import { createRoot } from 'react-dom/client'
import { useState } from 'react'
import TrapCounter from './TrapCounter'
import FishTankOrganizer from './FishTankOrganizer'

function App() {
  const [page, setPage] = useState(() => {
    return window.location.hash === '#traps' ? 'traps' : 'fish-tanks'
  })

  const navigate = (p) => {
    setPage(p)
    window.location.hash = p === 'traps' ? '' : p
  }

  if (page === 'fish-tanks') {
    return (
      <div>
        <div style={{ position: 'fixed', top: 8, right: 8, zIndex: 9999 }}>
          <button
            onClick={() => navigate('traps')}
            style={{ padding: '6px 12px', background: '#333', color: '#aaa', border: '1px solid #555', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
          >
            ← Trap Counter
          </button>
        </div>
        <FishTankOrganizer />
      </div>
    )
  }

  return (
    <div>
      <div style={{ position: 'fixed', top: 8, right: 8, zIndex: 9999 }}>
        <button
          onClick={() => navigate('fish-tanks')}
          style={{ padding: '6px 12px', background: '#333', color: '#aaa', border: '1px solid #555', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
        >
          🐟 Fish Tanks
        </button>
      </div>
      <TrapCounter />
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
