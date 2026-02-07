// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Volume2, 
  Clock,
  GraduationCap,
  TrendingUp,
  Calendar,
  AlertTriangle,
  Info
} from 'lucide-react'
import { toast } from 'sonner'

interface NotificationSettings {
  email: {
    enabled: boolean
    studyReminders: boolean
    examAlerts: boolean
    progressUpdates: boolean
    newContent: boolean
    subscriptionUpdates: boolean
  }
  push: {
    enabled: boolean
    studyReminders: boolean
    examAlerts: boolean
    progressUpdates: boolean
    newContent: boolean
  }
  inApp: {
    enabled: boolean
    sound: boolean
    desktop: boolean
  }
  schedule: {
    quietHours: boolean
    startTime: string
    endTime: string
    timezone: string
  }
}

export function NotificationsForm() {
  const [settings, setSettings] = useState<NotificationSettings>({
    email: {
      enabled: true,
      studyReminders: true,
      examAlerts: true,
      progressUpdates: false,
      newContent: true,
      subscriptionUpdates: true,
    },
    push: {
      enabled: false,
      studyReminders: false,
      examAlerts: true,
      progressUpdates: false,
      newContent: false,
    },
    inApp: {
      enabled: true,
      sound: true,
      desktop: false,
    },
    schedule: {
      quietHours: false,
      startTime: '22:00',
      endTime: '08:00',
      timezone: 'UTC',
    },
  })

  const [isLoading, setIsLoading] = useState(false)
  const [pushSupported, setPushSupported] = useState(false)

  useEffect(() => {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('notificationSettings')
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (error) {
        console.error('Error loading notification settings:', error)
      }
    }

    // Check if push notifications are supported
    setPushSupported('Notification' in window && 'serviceWorker' in navigator)
  }, [])

  const saveSettings = async (newSettings: NotificationSettings) => {
    setIsLoading(true)
    try {
      // Save to localStorage (in a real app, this would be saved to the backend)
      localStorage.setItem('notificationSettings', JSON.stringify(newSettings))
      setSettings(newSettings)
      toast.success('Notification settings saved')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  const updateEmailSettings = (key: keyof NotificationSettings['email'], value: boolean) => {
    const newSettings = {
      ...settings,
      email: { ...settings.email, [key]: value }
    }
    saveSettings(newSettings)
  }

  const updatePushSettings = (key: keyof NotificationSettings['push'], value: boolean) => {
    const newSettings = {
      ...settings,
      push: { ...settings.push, [key]: value }
    }
    saveSettings(newSettings)
  }

  const updateInAppSettings = (key: keyof NotificationSettings['inApp'], value: boolean) => {
    const newSettings = {
      ...settings,
      inApp: { ...settings.inApp, [key]: value }
    }
    saveSettings(newSettings)
  }

  const updateScheduleSettings = (key: keyof NotificationSettings['schedule'], value: string | boolean) => {
    const newSettings = {
      ...settings,
      schedule: { ...settings.schedule, [key]: value }
    }
    saveSettings(newSettings)
  }

  const requestPushPermission = async () => {
    if (!pushSupported) {
      toast.error('Push notifications are not supported in this browser')
      return
    }

    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        updatePushSettings('enabled', true)
        toast.success('Push notifications enabled')
      } else {
        toast.error('Push notification permission denied')
      }
    } catch (error) {
      console.error('Error requesting push permission:', error)
      toast.error('Failed to enable push notifications')
    }
  }

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Receive notifications via email about your studies and account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-enabled">Enable Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Master switch for all email notifications.
              </p>
            </div>
            <Switch
              id="email-enabled"
              checked={settings.email.enabled}
              onCheckedChange={(value) => updateEmailSettings('enabled', value)}
            />
          </div>

          {settings.email.enabled && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="study-reminders">Study Reminders</Label>
                  </div>
                  <Switch
                    id="study-reminders"
                    checked={settings.email.studyReminders}
                    onCheckedChange={(value) => updateEmailSettings('studyReminders', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="exam-alerts">Exam Alerts</Label>
                  </div>
                  <Switch
                    id="exam-alerts"
                    checked={settings.email.examAlerts}
                    onCheckedChange={(value) => updateEmailSettings('examAlerts', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="progress-updates">Progress Updates</Label>
                  </div>
                  <Switch
                    id="progress-updates"
                    checked={settings.email.progressUpdates}
                    onCheckedChange={(value) => updateEmailSettings('progressUpdates', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="new-content">New Content</Label>
                  </div>
                  <Switch
                    id="new-content"
                    checked={settings.email.newContent}
                    onCheckedChange={(value) => updateEmailSettings('newContent', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="subscription-updates">Subscription Updates</Label>
                  </div>
                  <Switch
                    id="subscription-updates"
                    checked={settings.email.subscriptionUpdates}
                    onCheckedChange={(value) => updateEmailSettings('subscriptionUpdates', value)}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Receive instant notifications on your device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!pushSupported && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Push notifications are not supported in this browser.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-enabled">Enable Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                {pushSupported ? 'Receive notifications even when the app is closed.' : 'Not supported in this browser.'}
              </p>
            </div>
            {pushSupported ? (
              <Switch
                id="push-enabled"
                checked={settings.push.enabled}
                onCheckedChange={(value) => {
                  if (value) {
                    requestPushPermission()
                  } else {
                    updatePushSettings('enabled', false)
                  }
                }}
              />
            ) : (
              <Switch disabled />
            )}
          </div>

          {settings.push.enabled && pushSupported && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-study-reminders">Study Reminders</Label>
                  <Switch
                    id="push-study-reminders"
                    checked={settings.push.studyReminders}
                    onCheckedChange={(value) => updatePushSettings('studyReminders', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="push-exam-alerts">Exam Alerts</Label>
                  <Switch
                    id="push-exam-alerts"
                    checked={settings.push.examAlerts}
                    onCheckedChange={(value) => updatePushSettings('examAlerts', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="push-progress-updates">Progress Updates</Label>
                  <Switch
                    id="push-progress-updates"
                    checked={settings.push.progressUpdates}
                    onCheckedChange={(value) => updatePushSettings('progressUpdates', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="push-new-content">New Content</Label>
                  <Switch
                    id="push-new-content"
                    checked={settings.push.newContent}
                    onCheckedChange={(value) => updatePushSettings('newContent', value)}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* In-App Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            In-App Notifications
          </CardTitle>
          <CardDescription>
            Control how notifications appear within the application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="in-app-enabled">Show In-App Notifications</Label>
            </div>
            <Switch
              id="in-app-enabled"
              checked={settings.inApp.enabled}
              onCheckedChange={(value) => updateInAppSettings('enabled', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="notification-sound">Notification Sound</Label>
            </div>
            <Switch
              id="notification-sound"
              checked={settings.inApp.sound}
              onCheckedChange={(value) => updateInAppSettings('sound', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="desktop-notifications">Desktop Notifications</Label>
            </div>
            <Switch
              id="desktop-notifications"
              checked={settings.inApp.desktop}
              onCheckedChange={(value) => updateInAppSettings('desktop', value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Quiet Hours
          </CardTitle>
          <CardDescription>
            Set times when you don't want to receive notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="quiet-hours">Enable Quiet Hours</Label>
              <p className="text-sm text-muted-foreground">
                Pause notifications during specified hours.
              </p>
            </div>
            <Switch
              id="quiet-hours"
              checked={settings.schedule.quietHours}
              onCheckedChange={(value) => updateScheduleSettings('quietHours', value)}
            />
          </div>

          {settings.schedule.quietHours && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <Select 
                    value={settings.schedule.startTime} 
                    onValueChange={(value) => updateScheduleSettings('startTime', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, '0')
                        return (
                          <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                            {hour}:00
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <Select 
                    value={settings.schedule.endTime} 
                    onValueChange={(value) => updateScheduleSettings('endTime', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, '0')
                        return (
                          <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                            {hour}:00
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Notification preferences are saved locally. Advanced notification features will be available in a future update.
        </AlertDescription>
      </Alert>
    </div>
  )
}
