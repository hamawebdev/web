// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { 
  Palette, 
  Monitor, 
  Sun, 
  Moon, 
  Laptop, 
  Eye,
  Type,
  Layout,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'

export function AppearanceForm() {
  const { theme, setTheme, themes } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [fontSize, setFontSize] = useState('medium')
  const [compactMode, setCompactMode] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [highContrast, setHighContrast] = useState(false)

  // Ensure component is mounted before rendering theme-dependent content
  useEffect(() => {
    setMounted(true)
    
    // Load saved preferences from localStorage
    const savedFontSize = localStorage.getItem('fontSize') || 'medium'
    const savedCompactMode = localStorage.getItem('compactMode') === 'true'
    const savedReducedMotion = localStorage.getItem('reducedMotion') === 'true'
    const savedHighContrast = localStorage.getItem('highContrast') === 'true'
    
    setFontSize(savedFontSize)
    setCompactMode(savedCompactMode)
    setReducedMotion(savedReducedMotion)
    setHighContrast(savedHighContrast)
  }, [])

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    toast.success(`Theme changed to ${newTheme}`)
  }

  const handleFontSizeChange = (newSize: string) => {
    setFontSize(newSize)
    localStorage.setItem('fontSize', newSize)
    
    // Apply font size to document root
    const root = document.documentElement
    root.classList.remove('text-sm', 'text-base', 'text-lg')
    
    switch (newSize) {
      case 'small':
        root.classList.add('text-sm')
        break
      case 'large':
        root.classList.add('text-lg')
        break
      default:
        root.classList.add('text-base')
    }
    
    toast.success('Font size updated')
  }

  const handleCompactModeChange = (enabled: boolean) => {
    setCompactMode(enabled)
    localStorage.setItem('compactMode', enabled.toString())
    
    // Apply compact mode styles
    const root = document.documentElement
    if (enabled) {
      root.classList.add('compact-mode')
    } else {
      root.classList.remove('compact-mode')
    }
    
    toast.success(`Compact mode ${enabled ? 'enabled' : 'disabled'}`)
  }

  const handleReducedMotionChange = (enabled: boolean) => {
    setReducedMotion(enabled)
    localStorage.setItem('reducedMotion', enabled.toString())
    
    // Apply reduced motion preference
    const root = document.documentElement
    if (enabled) {
      root.classList.add('reduce-motion')
    } else {
      root.classList.remove('reduce-motion')
    }
    
    toast.success(`Reduced motion ${enabled ? 'enabled' : 'disabled'}`)
  }

  const handleHighContrastChange = (enabled: boolean) => {
    setHighContrast(enabled)
    localStorage.setItem('highContrast', enabled.toString())
    
    // Apply high contrast mode
    const root = document.documentElement
    if (enabled) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }
    
    toast.success(`High contrast ${enabled ? 'enabled' : 'disabled'}`)
  }

  const resetToDefaults = () => {
    setTheme('system')
    handleFontSizeChange('medium')
    handleCompactModeChange(false)
    handleReducedMotionChange(false)
    handleHighContrastChange(false)
    toast.success('Appearance settings reset to defaults')
  }

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme
          </CardTitle>
          <CardDescription>
            Choose your preferred color theme for the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={theme} onValueChange={handleThemeChange} className="grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer">
                <Sun className="h-4 w-4" />
                Light
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer">
                <Moon className="h-4 w-4" />
                Dark
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system" className="flex items-center gap-2 cursor-pointer">
                <Monitor className="h-4 w-4" />
                System
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Typography
          </CardTitle>
          <CardDescription>
            Customize text size and readability options.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="font-size">Font Size</Label>
            <Select value={fontSize} onValueChange={handleFontSizeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select font size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium (Default)</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Layout Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Layout
          </CardTitle>
          <CardDescription>
            Adjust the layout and spacing of interface elements.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="compact-mode">Compact Mode</Label>
              <p className="text-sm text-muted-foreground">
                Reduce spacing between elements for a more compact interface.
              </p>
            </div>
            <Switch
              id="compact-mode"
              checked={compactMode}
              onCheckedChange={handleCompactModeChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reset Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={resetToDefaults}>
          Reset to Defaults
        </Button>
      </div>
    </div>
  )
}
