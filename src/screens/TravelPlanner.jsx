import { useState } from 'react'
import { colors, loadState, saveState } from '../App'

const SAMPLE_ITINERARIES = {
  beach: {
    destination: 'Maui, Hawaii',
    days: [
      { day: 1, title: 'Arrival & Beach Day', activities: ['Check in at resort', 'Ka\'anapali Beach sunset', 'Dinner at Mama\'s Fish House'] },
      { day: 2, title: 'Road to Hana', activities: ['Drive the Road to Hana', 'Bamboo Forest hike', 'Black Sand Beach', 'Waterfall swimming'] },
      { day: 3, title: 'Snorkeling & Culture', activities: ['Molokini Crater snorkeling', 'Lahaina Town exploration', 'Luau dinner show'] },
      { day: 4, title: 'Adventure Day', activities: ['Haleakala sunrise', 'Zip-lining', 'Spa afternoon', 'Farm-to-table dinner'] },
      { day: 5, title: 'Departure', activities: ['Morning beach walk', 'Souvenir shopping', 'Airport transfer'] },
    ],
    packing: ['Sunscreen SPF 50+', 'Swimwear', 'Hiking shoes', 'Snorkel gear', 'Light layers', 'Camera', 'Beach towel'],
    budget: '$4,500',
  },
  city: {
    destination: 'Tokyo, Japan',
    days: [
      { day: 1, title: 'Arrival & Shibuya', activities: ['Check in at Shinjuku hotel', 'Shibuya Crossing', 'Ramen dinner in Golden Gai'] },
      { day: 2, title: 'Traditional Tokyo', activities: ['Senso-ji Temple', 'Meiji Shrine', 'Harajuku street fashion', 'Sushi workshop'] },
      { day: 3, title: 'Tech & Pop Culture', activities: ['Akihabara electronics district', 'TeamLab Borderless', 'Robot Restaurant', 'Karaoke night'] },
      { day: 4, title: 'Day Trip: Mt. Fuji', activities: ['Bullet train to Hakone', 'Mt. Fuji viewpoint', 'Hot springs onsen', 'Return to Tokyo'] },
      { day: 5, title: 'Markets & Departure', activities: ['Tsukiji Outer Market', 'Last-minute shopping', 'Airport express'] },
    ],
    packing: ['Comfortable walking shoes', 'Power adapter', 'Pocket WiFi', 'Rail pass', 'Light jacket', 'Umbrella', 'Cash (yen)'],
    budget: '$5,200',
  },
  adventure: {
    destination: 'Costa Rica',
    days: [
      { day: 1, title: 'San José Arrival', activities: ['Airport pickup', 'Explore San José', 'Local dinner & craft beer'] },
      { day: 2, title: 'Arenal Volcano', activities: ['Drive to La Fortuna', 'Arenal Volcano hike', 'Hot springs evening', 'Wildlife spotting'] },
      { day: 3, title: 'Rainforest Adventure', activities: ['Zip-lining through canopy', 'White water rafting', 'Hanging bridges walk', 'Night jungle tour'] },
      { day: 4, title: 'Pacific Coast', activities: ['Drive to Manuel Antonio', 'Beach time', 'National Park hike', 'Surfing lesson'] },
      { day: 5, title: 'Departure', activities: ['Morning monkey watching', 'Souvenir market', 'Transfer to airport'] },
    ],
    packing: ['Bug spray', 'Rain jacket', 'Hiking boots', 'Swimwear', 'Binoculars', 'Dry bag', 'Sunscreen'],
    budget: '$3,800',
  },
}

export default function TravelPlanner({ user, addMemory, R }) {
  const [trips, setTrips] = useState(() => loadState('trips', []))
  const [planning, setPlanning] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [activeTrip, setActiveTrip] = useState(null)
  const [tripForm, setTripForm] = useState({
    destination: '', startDate: '', endDate: '', travelers: '2',
    style: 'mixed', interests: [], budget: 'moderate',
  })

  const save = (t) => { setTrips(t); saveState('trips', t) }

  const INTERESTS = ['Beach', 'Hiking', 'Food', 'Culture', 'Nightlife', 'Shopping', 'Adventure', 'Relaxation']

  const generateTrip = () => {
    setGenerating(true)
    setTimeout(() => {
      const styles = Object.keys(SAMPLE_ITINERARIES)
      const style = styles[Math.floor(Math.random() * styles.length)]
      const sample = SAMPLE_ITINERARIES[style]
      const trip = {
        id: Date.now(),
        ...tripForm,
        destination: tripForm.destination || sample.destination,
        itinerary: sample,
        createdAt: new Date().toISOString(),
        status: 'planned',
      }
      save([trip, ...trips])
      setActiveTrip(trip)
      setGenerating(false)
      setPlanning(false)
      addMemory(`Planned trip to ${trip.destination}`)
    }, 2000)
  }

  const toggleInterest = (interest) => {
    setTripForm(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }))
  }

  const inputStyle = {
    width: '100%', padding: `${R.sp(12)}px ${R.sp(14)}px`, background: colors.surfaceLight,
    border: `${R.borderWidth}px solid ${colors.border}`, borderRadius: R.sp(10), color: colors.text,
    fontSize: R.fs(14), fontFamily: 'inherit', marginBottom: R.sp(10), minHeight: R.minTouchTarget,
  }

  const modalOverlay = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: R.sp(20),
  }

  const modalContent = {
    background: colors.surface, borderRadius: R.sp(16), padding: R.sp(24), width: '100%', maxWidth: R.modalMaxWidth,
    border: `${R.borderWidth}px solid ${colors.border}`,
  }

  if (activeTrip) {
    const itin = activeTrip.itinerary
    return (
      <div style={{ padding: R.sp(16) }}>
        <button onClick={() => setActiveTrip(null)} style={{
          background: 'none', border: 'none', color: colors.primaryLight, fontSize: R.fs(13),
          cursor: 'pointer', marginBottom: R.sp(12), fontFamily: 'inherit', minHeight: R.minTouchTarget,
        }}>‹ Back to Trips</button>

        <h2 style={{ color: colors.text, fontSize: R.fs(22), fontWeight: 700, marginBottom: R.sp(4) }}>{itin.destination}</h2>
        <div style={{ display: 'flex', gap: R.sp(12), marginBottom: R.sp(20) }}>
          <span style={{ color: colors.textSecondary, fontSize: R.fs(12) }}>{itin.days.length} days</span>
          <span style={{ color: colors.success, fontSize: R.fs(12) }}>Est. {itin.budget}</span>
        </div>

        {/* Itinerary */}
        <h3 style={{ color: colors.text, fontSize: R.fs(14), fontWeight: 600, marginBottom: R.sp(12) }}>ITINERARY</h3>
        {itin.days.map(day => (
          <div key={day.day} style={{
            padding: R.sp(14), background: colors.surfaceLight, border: `${R.borderWidth}px solid ${colors.border}`,
            borderRadius: R.sp(10), marginBottom: R.sp(8), borderLeft: `3px solid ${colors.primary}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: R.sp(8) }}>
              <span style={{ color: colors.primaryLight, fontSize: R.fs(11), fontWeight: 600 }}>DAY {day.day}</span>
              <span style={{ color: colors.text, fontSize: R.fs(13), fontWeight: 500 }}>{day.title}</span>
            </div>
            {day.activities.map((act, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: R.sp(8), marginBottom: R.sp(4) }}>
                <span style={{ color: colors.textMuted, fontSize: R.fs(8) }}>●</span>
                <span style={{ color: colors.textSecondary, fontSize: R.fs(12) }}>{act}</span>
              </div>
            ))}
          </div>
        ))}

        {/* Packing List */}
        <h3 style={{ color: colors.text, fontSize: R.fs(14), fontWeight: 600, marginTop: R.sp(20), marginBottom: R.sp(12) }}>PACKING LIST</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: R.sp(6) }}>
          {itin.packing.map(item => (
            <span key={item} style={{
              padding: `${R.sp(6)}px ${R.sp(12)}px`, background: colors.surfaceLight, border: `${R.borderWidth}px solid ${colors.border}`,
              borderRadius: R.sp(16), color: colors.textSecondary, fontSize: R.fs(12),
            }}>{item}</span>
          ))}
        </div>

        {/* AI Suggestions */}
        <div style={{
          marginTop: R.sp(20), padding: R.sp(14), background: `${colors.primary}10`,
          border: `${R.borderWidth}px solid ${colors.primary}25`, borderRadius: R.sp(10),
        }}>
          <div style={{ display: 'flex', gap: R.sp(8), alignItems: 'center', marginBottom: R.sp(6) }}>
            <span style={{ color: colors.primary }}>◉</span>
            <span style={{ color: colors.primaryLight, fontSize: R.fs(11), fontWeight: 600 }}>AI TRAVEL TIPS</span>
          </div>
          <div style={{ color: colors.textSecondary, fontSize: R.fs(12), lineHeight: 1.5 }}>
            Best time to visit: Check weather 2 weeks before. I'll add calendar events for each day and set packing reminders 3 days before departure.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: R.sp(16) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: R.sp(4) }}>
        <h2 style={{ color: colors.text, fontSize: R.fs(20), fontWeight: 700 }}>Travel Planner</h2>
        <span style={{ fontSize: R.fs(9), color: colors.accent, background: `${colors.accent}22`, padding: `${R.sp(3)}px ${R.sp(8)}px`, borderRadius: R.sp(8), fontWeight: 600 }}>NEW</span>
      </div>
      <p style={{ color: colors.textSecondary, fontSize: R.fs(13), marginBottom: R.sp(16) }}>AI-powered trip planning with itineraries, packing lists, and budget estimates.</p>

      <button onClick={() => setPlanning(true)} style={{
        width: '100%', padding: R.sp(16), background: colors.gradient1, color: '#fff',
        border: 'none', borderRadius: R.sp(12), fontSize: R.fs(15), fontWeight: 600,
        cursor: 'pointer', marginBottom: R.sp(20), fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: R.sp(8),
        minHeight: R.minTouchTarget,
      }}>
        <span>◉</span> Plan a New Trip
      </button>

      {/* Saved Trips */}
      {trips.length > 0 && (
        <div>
          <h3 style={{ color: colors.text, fontSize: R.fs(14), fontWeight: 600, marginBottom: R.sp(10) }}>YOUR TRIPS</h3>
          {trips.map(trip => (
            <button key={trip.id} onClick={() => setActiveTrip(trip)} style={{
              width: '100%', padding: R.sp(16), background: colors.surfaceLight,
              border: `${R.borderWidth}px solid ${colors.border}`, borderRadius: R.sp(12), marginBottom: R.sp(8),
              cursor: 'pointer', textAlign: 'left', minHeight: R.minTouchTarget,
            }}>
              <div style={{ color: colors.text, fontSize: R.fs(15), fontWeight: 500 }}>{trip.itinerary.destination}</div>
              <div style={{ display: 'flex', gap: R.sp(12), marginTop: R.sp(4) }}>
                <span style={{ color: colors.textSecondary, fontSize: R.fs(12) }}>{trip.itinerary.days.length} days</span>
                <span style={{ color: colors.success, fontSize: R.fs(12) }}>{trip.itinerary.budget}</span>
                <span style={{ color: colors.primaryLight, fontSize: R.fs(12) }}>{trip.status}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Quick Inspiration */}
      {trips.length === 0 && (
        <div>
          <h3 style={{ color: colors.text, fontSize: R.fs(14), fontWeight: 600, marginBottom: R.sp(10) }}>INSPIRATION</h3>
          {[
            ['🏖️', 'Beach Getaway', 'Maui, Bali, Maldives', 'beach'],
            ['🏙️', 'City Explorer', 'Tokyo, Paris, NYC', 'city'],
            ['🏔️', 'Adventure Trip', 'Costa Rica, Nepal, Iceland', 'adventure'],
          ].map(([icon, title, places, style]) => (
            <button key={style} onClick={() => { setPlanning(true); setTripForm(prev => ({ ...prev, style })) }} style={{
              display: 'flex', alignItems: 'center', gap: R.sp(14), width: '100%', padding: R.sp(16),
              background: colors.surfaceLight, border: `${R.borderWidth}px solid ${colors.border}`,
              borderRadius: R.sp(12), marginBottom: R.sp(8), cursor: 'pointer', textAlign: 'left',
              minHeight: R.minTouchTarget,
            }}>
              <span style={{ fontSize: R.fs(28) }}>{icon}</span>
              <div>
                <div style={{ color: colors.text, fontSize: R.fs(14), fontWeight: 500 }}>{title}</div>
                <div style={{ color: colors.textSecondary, fontSize: R.fs(12) }}>{places}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Planning Modal */}
      {planning && (
        <div style={modalOverlay} onClick={() => setPlanning(false)}>
          <div style={{ ...modalContent, maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: colors.text, fontSize: R.fs(20), fontWeight: 600, marginBottom: R.sp(16) }}>Plan Your Trip</h3>

            <input value={tripForm.destination} onChange={e => setTripForm({ ...tripForm, destination: e.target.value })}
              placeholder="Where do you want to go?" style={inputStyle} autoFocus />

            <div style={{ display: 'flex', gap: R.sp(8) }}>
              <input type="date" value={tripForm.startDate} onChange={e => setTripForm({ ...tripForm, startDate: e.target.value })}
                style={{ ...inputStyle, flex: 1 }} placeholder="Start date" />
              <input type="date" value={tripForm.endDate} onChange={e => setTripForm({ ...tripForm, endDate: e.target.value })}
                style={{ ...inputStyle, flex: 1 }} placeholder="End date" />
            </div>

            <div style={{ display: 'flex', gap: R.sp(8) }}>
              <select value={tripForm.travelers} onChange={e => setTripForm({ ...tripForm, travelers: e.target.value })}
                style={{ ...inputStyle, flex: 1 }}>
                {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} traveler{n > 1 ? 's' : ''}</option>)}
              </select>
              <select value={tripForm.budget} onChange={e => setTripForm({ ...tripForm, budget: e.target.value })}
                style={{ ...inputStyle, flex: 1 }}>
                <option value="budget">Budget</option>
                <option value="moderate">Moderate</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>

            <div style={{ color: colors.textSecondary, fontSize: R.fs(12), marginBottom: R.sp(8) }}>Interests</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: R.sp(6), marginBottom: R.sp(16) }}>
              {INTERESTS.map(interest => (
                <button key={interest} onClick={() => toggleInterest(interest)} style={{
                  padding: `${R.sp(6)}px ${R.sp(14)}px`, borderRadius: R.sp(16),
                  background: tripForm.interests.includes(interest) ? `${colors.primary}30` : colors.surfaceLight,
                  border: `${R.borderWidth}px solid ${tripForm.interests.includes(interest) ? colors.primary : colors.border}`,
                  color: tripForm.interests.includes(interest) ? colors.primaryLight : colors.textSecondary,
                  fontSize: R.fs(12), cursor: 'pointer', fontFamily: 'inherit', minHeight: R.minTouchTarget,
                }}>{interest}</button>
              ))}
            </div>

            <button onClick={generateTrip} disabled={generating} style={{
              width: '100%', padding: R.sp(14), background: colors.gradient1, color: '#fff',
              border: 'none', borderRadius: R.sp(12), fontSize: R.fs(14), fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', minHeight: R.minTouchTarget,
            }}>
              {generating ? 'Generating itinerary...' : '◉ Generate Trip with AI'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
