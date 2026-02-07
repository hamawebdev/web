// @ts-nocheck
/**
 * Responsive Design Testing Utilities
 * Utilities to help test and validate responsive design across different devices
 */

export const BREAKPOINTS = {
  mobile: {
    min: 0,
    max: 767,
    devices: [
      { name: 'iPhone SE', width: 375, height: 667 },
      { name: 'iPhone 12/13/14', width: 390, height: 844 },
      { name: 'iPhone 12/13/14 Plus', width: 428, height: 926 },
      { name: 'Samsung Galaxy S21', width: 360, height: 800 },
      { name: 'Samsung Galaxy A51', width: 412, height: 914 }
    ]
  },
  tablet: {
    min: 768,
    max: 1023,
    devices: [
      { name: 'iPad', width: 768, height: 1024 },
      { name: 'iPad Air', width: 820, height: 1180 },
      { name: 'iPad Pro 11"', width: 834, height: 1194 },
      { name: 'Samsung Galaxy Tab', width: 768, height: 1024 }
    ]
  },
  desktop: {
    min: 1024,
    max: Infinity,
    devices: [
      { name: 'Desktop Small', width: 1024, height: 768 },
      { name: 'Desktop Medium', width: 1280, height: 720 },
      { name: 'Desktop Large', width: 1440, height: 900 },
      { name: 'Desktop XL', width: 1920, height: 1080 }
    ]
  }
}

export const ZOOM_LEVELS = [100, 125, 150, 175, 200]

export function getCurrentBreakpoint(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop'
  
  const width = window.innerWidth
  
  if (width < BREAKPOINTS.tablet.min) return 'mobile'
  if (width < BREAKPOINTS.desktop.min) return 'tablet'
  return 'desktop'
}

export function getDeviceInfo() {
  if (typeof window === 'undefined') return null
  
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
    breakpoint: getCurrentBreakpoint(),
    userAgent: navigator.userAgent,
    isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }
}

export function checkTouchTargetSize(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect()
  const minSize = 44 // 44px minimum touch target
  
  return rect.width >= minSize && rect.height >= minSize
}

export function validateResponsiveImages(container: HTMLElement): Array<{
  element: HTMLImageElement
  issues: string[]
}> {
  const images = container.querySelectorAll('img')
  const results: Array<{ element: HTMLImageElement; issues: string[] }> = []
  
  images.forEach((img) => {
    const issues: string[] = []
    
    // Check if image has responsive attributes
    if (!img.srcset && !img.sizes) {
      issues.push('Missing srcset or sizes attributes for responsive images')
    }
    
    // Check if image has alt text
    if (!img.alt) {
      issues.push('Missing alt text for accessibility')
    }
    
    // Check if image has loading attribute
    if (!img.loading) {
      issues.push('Missing loading attribute (consider lazy loading)')
    }
    
    // Check if image overflows container
    const rect = img.getBoundingClientRect()
    const parentRect = img.parentElement?.getBoundingClientRect()
    
    if (parentRect && rect.width > parentRect.width) {
      issues.push('Image overflows parent container')
    }
    
    if (issues.length > 0) {
      results.push({ element: img, issues })
    }
  })
  
  return results
}

export function validateTouchTargets(container: HTMLElement): Array<{
  element: HTMLElement
  size: { width: number; height: number }
  isValid: boolean
}> {
  const interactiveElements = container.querySelectorAll(
    'button, a, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])'
  )
  
  const results: Array<{
    element: HTMLElement
    size: { width: number; height: number }
    isValid: boolean
  }> = []
  
  interactiveElements.forEach((element) => {
    const rect = element.getBoundingClientRect()
    const size = { width: rect.width, height: rect.height }
    const isValid = checkTouchTargetSize(element as HTMLElement)
    
    results.push({
      element: element as HTMLElement,
      size,
      isValid
    })
  })
  
  return results
}

export function checkHorizontalOverflow(container: HTMLElement = document.body): Array<{
  element: HTMLElement
  overflow: number
}> {
  const elements = container.querySelectorAll('*')
  const viewportWidth = window.innerWidth
  const results: Array<{ element: HTMLElement; overflow: number }> = []
  
  elements.forEach((element) => {
    const rect = element.getBoundingClientRect()
    const rightEdge = rect.left + rect.width
    
    if (rightEdge > viewportWidth) {
      results.push({
        element: element as HTMLElement,
        overflow: rightEdge - viewportWidth
      })
    }
  })
  
  return results
}

export function generateResponsiveTestReport(container: HTMLElement = document.body) {
  const deviceInfo = getDeviceInfo()
  const touchTargets = validateTouchTargets(container)
  const images = validateResponsiveImages(container)
  const overflowElements = checkHorizontalOverflow(container)
  
  const invalidTouchTargets = touchTargets.filter(t => !t.isValid)
  const imagesWithIssues = images.filter(i => i.issues.length > 0)
  
  return {
    deviceInfo,
    summary: {
      totalTouchTargets: touchTargets.length,
      invalidTouchTargets: invalidTouchTargets.length,
      totalImages: images.length,
      imagesWithIssues: imagesWithIssues.length,
      overflowElements: overflowElements.length
    },
    issues: {
      touchTargets: invalidTouchTargets,
      images: imagesWithIssues,
      overflow: overflowElements
    },
    score: calculateResponsiveScore({
      touchTargets: touchTargets.length,
      invalidTouchTargets: invalidTouchTargets.length,
      images: images.length,
      imagesWithIssues: imagesWithIssues.length,
      overflowElements: overflowElements.length
    })
  }
}

function calculateResponsiveScore(metrics: {
  touchTargets: number
  invalidTouchTargets: number
  images: number
  imagesWithIssues: number
  overflowElements: number
}): number {
  let score = 100
  
  // Deduct points for touch target issues
  if (metrics.touchTargets > 0) {
    const touchTargetScore = ((metrics.touchTargets - metrics.invalidTouchTargets) / metrics.touchTargets) * 30
    score = score - 30 + touchTargetScore
  }
  
  // Deduct points for image issues
  if (metrics.images > 0) {
    const imageScore = ((metrics.images - metrics.imagesWithIssues) / metrics.images) * 20
    score = score - 20 + imageScore
  }
  
  // Deduct points for overflow issues
  score -= Math.min(metrics.overflowElements * 10, 50)
  
  return Math.max(0, Math.round(score))
}

// Development helper to log responsive test results
export function logResponsiveTestResults(container?: HTMLElement) {
  if (process.env.NODE_ENV !== 'development') return
  
  const report = generateResponsiveTestReport(container)
  
  console.group('📱 Responsive Design Test Report')
  console.log('Device Info:', report.deviceInfo)
  console.log('Summary:', report.summary)
  console.log('Responsive Score:', `${report.score}/100`)
  
  if (report.issues.touchTargets.length > 0) {
    console.warn('Touch Target Issues:', report.issues.touchTargets)
  }
  
  if (report.issues.images.length > 0) {
    console.warn('Image Issues:', report.issues.images)
  }
  
  if (report.issues.overflow.length > 0) {
    console.warn('Overflow Issues:', report.issues.overflow)
  }
  
  console.groupEnd()
  
  return report
}
