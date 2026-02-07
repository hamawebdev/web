// @ts-nocheck
"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  alt?: string
  width?: number
  height?: number
}

export function Logo({ 
  className = "h-10 w-10 object-contain", 
  alt = "MedADN Logo",
  width,
  height
}: LogoProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before rendering theme-dependent content
  useEffect(() => {
    setMounted(true)
  }, [])

  // Show default logo during SSR and initial hydration
  if (!mounted) {
    return (
      <img
        src="/logo.png"
        alt={alt}
        className={className}
        width={width}
        height={height}
      />
    )
  }

  // Use logo.png for both light and dark themes
  const logoSrc = '/logo.png'

  return (
    <img
      src={logoSrc}
      alt={alt}
      className={cn("transition-opacity duration-200", className)}
      width={width}
      height={height}
    />
  )
}
