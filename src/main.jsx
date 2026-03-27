import { createRoot } from 'react-dom/client'
import { useState, lazy, Suspense } from 'react'
import FishTankOrganizer from './FishTankOrganizer'

const TrapCounter = lazy(() => import('./TrapCounter'))

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
            Trap Counter
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
          Fish Tanks
        </button>
      </div>
      <Suspense fallback={<div style={{ color: '#888', padding: 40 }}>Loading...</div>}>
        <TrapCounter />
      </Suspense>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
