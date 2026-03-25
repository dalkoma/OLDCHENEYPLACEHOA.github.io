import { useState, useEffect } from 'react'

// Breakpoints matching device widths
const BREAKPOINTS = {
  zFlipCover: 300,   // Z Flip cover screen
  smallPhone: 375,   // iPhone SE, small Android
  phone: 430,        // iPhone, Pixel, Galaxy S
  zFoldClosed: 360,  // Z Fold closed
  zFoldOpen: 720,    // Z Fold open
  tabletMini: 744,   // iPad mini
  tablet: 820,       // iPad Air
  tabletPro: 1024,   // iPad Pro portrait
  laptop: 1366,      // iPad Pro landscape / laptop
  desktop: 1440,     // Standard desktop
  wide: 1920,        // Full HD
  ultraWide: 2000,   // Ultra-wide / TV
}

export function useResponsive() {
  const [state, setState] = useState(() => compute())

  useEffect(() => {
    const onResize = () => setState(compute())
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [])

  return state
}

function compute() {
  const w = window.innerWidth
  const h = window.innerHeight
  const isLandscape = w > h
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const dpr = window.devicePixelRatio || 1
  const isRetina = dpr >= 2

  // Device category
  let device = 'desktop'
  if (w <= BREAKPOINTS.zFlipCover) device = 'zFlipCover'
  else if (w <= BREAKPOINTS.smallPhone) device = 'smallPhone'
  else if (w <= BREAKPOINTS.phone) device = 'phone'
  else if (w <= BREAKPOINTS.zFoldOpen) device = 'phablet'
  else if (w <= BREAKPOINTS.tabletMini) device = 'tabletMini'
  else if (w <= BREAKPOINTS.tabletPro) device = 'tablet'
  else if (w <= BREAKPOINTS.laptop) device = 'laptop'
  else if (w <= BREAKPOINTS.wide) device = 'desktop'
  else device = 'ultraWide'

  const isSmall = w <= BREAKPOINTS.phone
  const isMedium = w > BREAKPOINTS.phone && w <= BREAKPOINTS.tabletPro
  const isLarge = w > BREAKPOINTS.tabletPro

  // Grid columns based on width + orientation
  let gridCols = 1
  if (w <= BREAKPOINTS.zFlipCover) gridCols = 1
  else if (w <= BREAKPOINTS.phone) gridCols = isLandscape ? 2 : 1
  else if (w <= BREAKPOINTS.zFoldOpen) gridCols = isLandscape ? 3 : 2
  else if (w <= BREAKPOINTS.tabletPro) gridCols = isLandscape ? 3 : 2
  else if (w <= BREAKPOINTS.laptop) gridCols = isLandscape ? 4 : 3
  else if (w <= BREAKPOINTS.wide) gridCols = 4
  else gridCols = 5

  // Font scale
  let fontScale = 1
  if (w <= BREAKPOINTS.zFlipCover) fontScale = 0.8
  else if (w <= BREAKPOINTS.smallPhone) fontScale = 0.9
  else if (w >= BREAKPOINTS.ultraWide) fontScale = 1.2
  else if (w >= BREAKPOINTS.wide) fontScale = 1.1

  // Spacing scale
  let spacingScale = 1
  if (w <= BREAKPOINTS.zFlipCover) spacingScale = 0.6
  else if (w <= BREAKPOINTS.smallPhone) spacingScale = 0.85
  else if (w >= BREAKPOINTS.ultraWide) spacingScale = 1.3
  else if (w >= BREAKPOINTS.wide) spacingScale = 1.15

  // Touch target minimum (Apple guidelines: 44px, we use 40 as base)
  const minTouchTarget = isTouch ? 40 : 28

  // Border width (thinner on retina)
  const borderWidth = isRetina ? 0.5 : 1

  return {
    w, h, isLandscape, isTouch, dpr, isRetina, device,
    isSmall, isMedium, isLarge,
    gridCols,
    fontScale,
    spacingScale,
    minTouchTarget,
    borderWidth,

    // Helper: scale a pixel value
    sp: (px) => Math.round(px * spacingScale),
    fs: (px) => Math.round(px * fontScale),

    // Helper: grid template for N items, adapting to screen
    gridTemplate: (desiredCols) => {
      const cols = Math.min(desiredCols, gridCols)
      return `repeat(${cols}, 1fr)`
    },

    // Helper: modal max width
    modalMaxWidth: Math.min(440, w - 32),

    // Helper: sidebar width
    sidebarWidth: Math.min(280, w * 0.8),
  }
}

export { BREAKPOINTS }
