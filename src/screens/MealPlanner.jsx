import { useState } from 'react'
import { colors, loadState, saveState } from '../App'

const MEAL_DB = {
  breakfast: [
    { name: 'Avocado Toast', time: '10 min', cal: 350, ingredients: ['Bread', 'Avocado', 'Eggs', 'Salt', 'Pepper', 'Lemon'] },
    { name: 'Greek Yogurt Bowl', time: '5 min', cal: 280, ingredients: ['Greek Yogurt', 'Granola', 'Mixed Berries', 'Honey'] },
    { name: 'Smoothie Bowl', time: '8 min', cal: 310, ingredients: ['Banana', 'Spinach', 'Almond Milk', 'Protein Powder', 'Chia Seeds'] },
    { name: 'Oatmeal & Fruit', time: '10 min', cal: 300, ingredients: ['Oats', 'Milk', 'Banana', 'Blueberries', 'Honey'] },
    { name: 'Eggs Benedict', time: '25 min', cal: 450, ingredients: ['English Muffin', 'Eggs', 'Ham', 'Butter', 'Lemon Juice'] },
  ],
  lunch: [
    { name: 'Chicken Caesar Salad', time: '15 min', cal: 420, ingredients: ['Romaine', 'Chicken Breast', 'Parmesan', 'Croutons', 'Caesar Dressing'] },
    { name: 'Turkey Wrap', time: '10 min', cal: 380, ingredients: ['Tortilla', 'Turkey', 'Lettuce', 'Tomato', 'Mustard'] },
    { name: 'Quinoa Buddha Bowl', time: '20 min', cal: 440, ingredients: ['Quinoa', 'Chickpeas', 'Sweet Potato', 'Kale', 'Tahini'] },
    { name: 'Grilled Cheese & Soup', time: '15 min', cal: 500, ingredients: ['Bread', 'Cheddar', 'Butter', 'Tomato Soup'] },
    { name: 'Poke Bowl', time: '15 min', cal: 460, ingredients: ['Sushi Rice', 'Tuna', 'Avocado', 'Edamame', 'Soy Sauce', 'Sesame'] },
  ],
  dinner: [
    { name: 'Grilled Salmon', time: '25 min', cal: 520, ingredients: ['Salmon Fillet', 'Asparagus', 'Lemon', 'Olive Oil', 'Garlic'] },
    { name: 'Pasta Primavera', time: '20 min', cal: 480, ingredients: ['Penne', 'Bell Peppers', 'Zucchini', 'Tomato Sauce', 'Parmesan'] },
    { name: 'Chicken Stir-Fry', time: '20 min', cal: 450, ingredients: ['Chicken', 'Broccoli', 'Soy Sauce', 'Rice', 'Ginger', 'Garlic'] },
    { name: 'Tacos', time: '25 min', cal: 550, ingredients: ['Ground Beef', 'Taco Shells', 'Lettuce', 'Tomato', 'Cheese', 'Salsa'] },
    { name: 'Veggie Curry', time: '30 min', cal: 400, ingredients: ['Chickpeas', 'Coconut Milk', 'Curry Paste', 'Rice', 'Spinach'] },
  ],
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function MealPlanner({ user, addMemory, R }) {
  const [mealPlan, setMealPlan] = useState(() => loadState('mealPlan', {}))
  const [groceryList, setGroceryList] = useState(() => loadState('groceryList', []))
  const [view, setView] = useState('plan')
  const [selectedDay, setSelectedDay] = useState('Mon')
  const [showPicker, setShowPicker] = useState(null)

  const savePlan = (p) => { setMealPlan(p); saveState('mealPlan', p) }
  const saveGrocery = (g) => { setGroceryList(g); saveState('groceryList', g) }

  const setMeal = (day, mealType, meal) => {
    savePlan({ ...mealPlan, [`${day}_${mealType}`]: meal })
    addMemory(`Planned ${mealType}: ${meal.name} for ${day}`)
    setShowPicker(null)
  }

  const generateWeek = () => {
    const plan = {}
    DAYS.forEach(day => {
      ['breakfast', 'lunch', 'dinner'].forEach(type => {
        plan[`${day}_${type}`] = MEAL_DB[type][Math.floor(Math.random() * MEAL_DB[type].length)]
      })
    })
    savePlan(plan)
    addMemory('Generated weekly meal plan')
  }

  const generateGroceryList = () => {
    const allIngredients = {}
    Object.values(mealPlan).forEach(meal => {
      meal?.ingredients?.forEach(ing => { allIngredients[ing] = (allIngredients[ing] || 0) + 1 })
    })
    saveGrocery(Object.entries(allIngredients).map(([name, count]) => ({ name, count, checked: false, id: Date.now() + Math.random() })))
    setView('grocery')
    addMemory('Generated grocery list from meal plan')
  }

  const toggleGrocery = (id) => { saveGrocery(groceryList.map(g => g.id === id ? { ...g, checked: !g.checked } : g)) }
  const getMeal = (day, type) => mealPlan[`${day}_${type}`]

  return (
    <div style={{ padding: R.sp(16) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: R.sp(16) }}>
        <h2 style={{ color: colors.text, fontSize: R.fs(20), fontWeight: 700 }}>Meal Planner</h2>
        <div style={{ display: 'flex', gap: R.sp(8) }}>
          {['plan', 'grocery'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: `${R.sp(6)}px ${R.sp(14)}px`, border: 'none', borderRadius: 8,
              fontSize: R.fs(12), cursor: 'pointer', fontFamily: 'inherit',
              background: view === v ? colors.primary : colors.surfaceLight,
              color: view === v ? '#fff' : colors.textSecondary,
              minHeight: R.minTouchTarget,
            }}>{v === 'plan' ? 'Plan' : 'Groceries'}</button>
          ))}
        </div>
      </div>

      {view === 'plan' && (
        <>
          <button onClick={generateWeek} style={{
            width: '100%', padding: R.sp(14), background: colors.gradient1, color: '#fff',
            border: 'none', borderRadius: 12, fontSize: R.fs(14), fontWeight: 600,
            cursor: 'pointer', marginBottom: R.sp(16), fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            minHeight: R.minTouchTarget,
          }}>
            <span>◉</span> Generate Weekly Plan with AI
          </button>

          <div style={{ display: 'flex', gap: R.sp(4), marginBottom: R.sp(16), overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {DAYS.map(d => (
              <button key={d} onClick={() => setSelectedDay(d)} style={{
                flex: 1, padding: `${R.sp(8)}px ${R.sp(4)}px`, minWidth: R.sp(40),
                background: selectedDay === d ? colors.primary : colors.surfaceLight,
                border: `${R.borderWidth}px solid ${selectedDay === d ? colors.primary : colors.border}`,
                borderRadius: 8, color: selectedDay === d ? '#fff' : colors.textSecondary,
                fontSize: R.fs(11), cursor: 'pointer', fontFamily: 'inherit',
                minHeight: R.minTouchTarget,
              }}>{d}</button>
            ))}
          </div>

          {['breakfast', 'lunch', 'dinner'].map(type => {
            const meal = getMeal(selectedDay, type)
            return (
              <div key={type} style={{
                padding: R.sp(14), background: colors.surfaceLight, border: `${R.borderWidth}px solid ${colors.border}`,
                borderRadius: 10, marginBottom: R.sp(10),
              }}>
                <div style={{ color: colors.textMuted, fontSize: R.fs(11), fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>{type}</div>
                {meal ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: colors.text, fontSize: R.fs(15), fontWeight: 500 }}>{meal.name}</span>
                      <button onClick={() => setShowPicker({ day: selectedDay, mealType: type })} style={{
                        background: 'none', border: 'none', color: colors.primaryLight, fontSize: R.fs(12), cursor: 'pointer',
                        minHeight: R.minTouchTarget, display: 'flex', alignItems: 'center',
                      }}>Change</button>
                    </div>
                    <div style={{ display: 'flex', gap: R.sp(12), marginTop: R.sp(6) }}>
                      <span style={{ color: colors.textSecondary, fontSize: R.fs(11) }}>{meal.time}</span>
                      <span style={{ color: colors.textSecondary, fontSize: R.fs(11) }}>{meal.cal} cal</span>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowPicker({ day: selectedDay, mealType: type })} style={{
                    background: 'none', border: `1px dashed ${colors.border}`, borderRadius: 8,
                    padding: `${R.sp(12)}px ${R.sp(16)}px`, color: colors.textMuted, fontSize: R.fs(13), cursor: 'pointer',
                    width: '100%', fontFamily: 'inherit', minHeight: R.minTouchTarget,
                  }}>+ Add {type}</button>
                )}
              </div>
            )
          })}

          {Object.keys(mealPlan).length > 0 && (
            <button onClick={generateGroceryList} style={{
              width: '100%', padding: R.sp(14), background: colors.gradient2, color: '#000',
              border: 'none', borderRadius: 12, fontSize: R.fs(14), fontWeight: 600,
              cursor: 'pointer', marginTop: R.sp(8), fontFamily: 'inherit', minHeight: R.minTouchTarget,
            }}>Generate Grocery List</button>
          )}
        </>
      )}

      {view === 'grocery' && (
        <>
          {groceryList.length === 0 ? (
            <div style={{ padding: R.sp(40), textAlign: 'center', color: colors.textMuted, fontSize: R.fs(13) }}>
              Plan your meals first, then generate a grocery list.
            </div>
          ) : (
            <>
              <div style={{ color: colors.textSecondary, fontSize: R.fs(12), marginBottom: R.sp(12) }}>
                {groceryList.filter(g => g.checked).length} of {groceryList.length} items checked
              </div>
              {groceryList.sort((a, b) => a.checked - b.checked).map(item => (
                <div key={item.id} onClick={() => toggleGrocery(item.id)} style={{
                  display: 'flex', alignItems: 'center', gap: R.sp(12), padding: `${R.sp(12)}px ${R.sp(14)}px`,
                  background: colors.surfaceLight, border: `${R.borderWidth}px solid ${colors.border}`,
                  borderRadius: 8, marginBottom: R.sp(6), cursor: 'pointer',
                  opacity: item.checked ? 0.5 : 1, minHeight: R.minTouchTarget,
                }}>
                  <span style={{
                    width: R.sp(20), height: R.sp(20), borderRadius: 4, flexShrink: 0,
                    border: `2px solid ${item.checked ? colors.success : colors.textMuted}`,
                    background: item.checked ? colors.success : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: R.fs(11),
                  }}>{item.checked && '✓'}</span>
                  <span style={{ color: colors.text, fontSize: R.fs(14), flex: 1, textDecoration: item.checked ? 'line-through' : 'none' }}>{item.name}</span>
                  {item.count > 1 && <span style={{ color: colors.textMuted, fontSize: R.fs(11) }}>×{item.count}</span>}
                </div>
              ))}
              <div style={{
                marginTop: R.sp(16), padding: R.sp(14), background: `${colors.success}10`,
                border: `1px solid ${colors.success}25`, borderRadius: 10,
                display: 'flex', gap: R.sp(10), alignItems: 'center',
              }}>
                <span style={{ fontSize: R.fs(20) }}>🛒</span>
                <div>
                  <div style={{ color: colors.success, fontSize: R.fs(12), fontWeight: 600 }}>DELIVERY READY</div>
                  <div style={{ color: colors.textSecondary, fontSize: R.fs(11) }}>Connect Instacart to order groceries for delivery.</div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {showPicker && (
        <div style={modalOverlay(R)} onClick={() => setShowPicker(null)}>
          <div style={modalBottom(R)} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: colors.text, fontSize: R.fs(18), fontWeight: 600, marginBottom: R.sp(16) }}>
              Choose {showPicker.mealType} for {showPicker.day}
            </h3>
            {MEAL_DB[showPicker.mealType].map((meal, i) => (
              <button key={i} onClick={() => setMeal(showPicker.day, showPicker.mealType, meal)} style={{
                width: '100%', padding: R.sp(14), background: colors.surfaceLight,
                border: `${R.borderWidth}px solid ${colors.border}`, borderRadius: 10, marginBottom: R.sp(8),
                cursor: 'pointer', textAlign: 'left', minHeight: R.minTouchTarget,
              }}>
                <div style={{ color: colors.text, fontSize: R.fs(14), fontWeight: 500 }}>{meal.name}</div>
                <div style={{ display: 'flex', gap: R.sp(12), marginTop: 4 }}>
                  <span style={{ color: colors.textSecondary, fontSize: R.fs(11) }}>{meal.time}</span>
                  <span style={{ color: colors.textSecondary, fontSize: R.fs(11) }}>{meal.cal} cal</span>
                  <span style={{ color: colors.textMuted, fontSize: R.fs(11) }}>{meal.ingredients.length} items</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const modalOverlay = (R) => ({
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200,
})
const modalBottom = (R) => ({
  background: colors.surface, borderRadius: '16px 16px 0 0', padding: R.sp(24), width: '100%',
  maxWidth: Math.min(480, R.w), border: `${R.borderWidth}px solid ${colors.border}`,
  maxHeight: '70vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
  paddingBottom: `max(${R.sp(24)}px, env(safe-area-inset-bottom, 0px))`,
})
