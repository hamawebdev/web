// @ts-nocheck
'use client'

import { useEffect, useState, useCallback } from 'react'
import { 
  getCurrentBreakpoint, 
  getDeviceInfo, 
  generateResponsiveTestReport,
  logResponsiveTestResults 
} from '@/utils/responsive-test-utils'

export function useResponsiveTest(options: {
  enableInDevelopment?: boolean
  logOnMount?: boolean
  logOnResize?: boolean
} = {}) {
  const {
    enableInDevelopment = true,
    logOnMount = true,
    logOnResize = false
  } = options

  const [deviceInfo, setDeviceInfo] = useState(() => getDeviceInfo())
  const [breakpoint, setBreakpoint] = useState(() => getCurrentBreakpoint())

  const updateDeviceInfo = useCallback(() => {
    const newDeviceInfo = getDeviceInfo()
    const newBreakpoint = getCurrentBreakpoint()
    
    setDeviceInfo(newDeviceInfo)
    setBreakpoint(newBreakpoint)
    
    if (enableInDevelopment && process.env.NODE_ENV === 'development' && logOnResize) {
      console.log('📱 Breakpoint changed:', newBreakpoint, newDeviceInfo)
    }
  }, [enableInDevelopment, logOnResize])

  const runResponsiveTest = useCallback((container?: HTMLElement) => {
    if (!enableInDevelopment || process.env.NODE_ENV !== 'development') {
      return null
    }
    
    return logResponsiveTestResults(container)
  }, [enableInDevelopment])

  const checkCurrentPage = useCallback(() => {
    if (!enableInDevelopment || process.env.NODE_ENV !== 'development') {
      return null
    }
    
    return generateResponsiveTestReport()
  }, [enableInDevelopment])

  useEffect(() => {
    if (enableInDevelopment && process.env.NODE_ENV === 'development' && logOnMount) {
      console.log('📱 Component mounted - Device Info:', deviceInfo)
      if (logOnMount) {
        setTimeout(() => runResponsiveTest(), 1000) // Delay to allow DOM to settle
      }
    }
  }, [enableInDevelopment, logOnMount, deviceInfo, runResponsiveTest])

  useEffect(() => {
    const handleResize = () => {
      updateDeviceInfo()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [updateDeviceInfo])

  return {
    deviceInfo,
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    runResponsiveTest,
    checkCurrentPage
  }
}

// Hook specifically for mobile optimization testing
export function useMobileOptimization() {
  const { deviceInfo, breakpoint, isMobile } = useResponsiveTest()
  
  const [touchTargetIssues, setTouchTargetIssues] = useState<number>(0)
  const [overflowIssues, setOverflowIssues] = useState<number>(0)

  const checkMobileOptimization = useCallback(() => {
    if (!isMobile || process.env.NODE_ENV !== 'development') return

    const report = generateResponsiveTestReport()
    setTouchTargetIssues(report.summary.invalidTouchTargets)
    setOverflowIssues(report.summary.overflowElements)

    if (report.summary.invalidTouchTargets > 0) {
      console.warn(`⚠️ ${report.summary.invalidTouchTargets} touch targets are too small`)
    }

    if (report.summary.overflowElements > 0) {
      console.warn(`⚠️ ${report.summary.overflowElements} elements are overflowing`)
    }

    return report
  }, [isMobile])

  useEffect(() => {
    if (isMobile && process.env.NODE_ENV === 'development') {
      const timer = setTimeout(checkMobileOptimization, 2000)
      return () => clearTimeout(timer)
    }
  }, [isMobile, checkMobileOptimization])

  return {
    isMobile,
    touchTargetIssues,
    overflowIssues,
    checkMobileOptimization,
    isOptimized: touchTargetIssues === 0 && overflowIssues === 0
  }
}

// Development component to display responsive info
export function ResponsiveDebugInfo() {
  const { deviceInfo, breakpoint, runResponsiveTest } = useResponsiveTest()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/80 text-white p-3 rounded-lg text-xs font-mono">
      <div className="space-y-1">
        <div>📱 {breakpoint.toUpperCase()}</div>
        <div>{deviceInfo?.width} × {deviceInfo?.height}</div>
        <div>DPR: {deviceInfo?.devicePixelRatio}</div>
        <div>{deviceInfo?.orientation}</div>
        <button 
          onClick={() => runResponsiveTest()}
          className="mt-2 px-2 py-1 bg-blue-600 rounded text-xs hover:bg-blue-700"
        >
          Test Page
        </button>
      </div>
    </div>
  )
}

// Hook for testing specific components
export function useComponentTest(componentName: string) {
  const { runResponsiveTest } = useResponsiveTest({ logOnMount: false })

  const testComponent = useCallback((ref: React.RefObject<HTMLElement>) => {
    if (!ref.current || process.env.NODE_ENV !== 'development') return

    console.group(`🧪 Testing Component: ${componentName}`)
    const report = generateResponsiveTestReport(ref.current)
    
    console.log('Component Test Results:', {
      touchTargets: report.summary.totalTouchTargets,
      invalidTouchTargets: report.summary.invalidTouchTargets,
      images: report.summary.totalImages,
      imagesWithIssues: report.summary.imagesWithIssues,
      overflowElements: report.summary.overflowElements,
      score: report.score
    })

    if (report.score < 80) {
      console.warn(`⚠️ Component score is low: ${report.score}/100`)
    }

    console.groupEnd()
    return report
  }, [componentName])

  return { testComponent }
}
