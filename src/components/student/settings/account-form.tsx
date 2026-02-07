// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Shield,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Key,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { SettingsService } from '@/lib/api-services'
import type { UserProfile } from '@/types/api'
import { ChangePasswordDialog } from '@/components/student/settings/change-password-dialog'

export function AccountForm() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true)
        const response = await SettingsService.getUserProfile()

        if (response.success && response.data) {
          setProfile(response.data)
        } else {
          console.error('Failed to load profile:', response.error)
          toast.error('Failed to load account information')
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        toast.error('Failed to load account information')
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not available'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }



  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }



  return (
    <div className="space-y-6">


      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Basic information about your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email Address</Label>
              <p className="text-sm text-muted-foreground">
                {profile?.email || 'Not available'}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Account Created</Label>
              <p className="text-sm text-muted-foreground">
                {formatDate(profile?.createdAt)}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Last Login</Label>
              <p className="text-sm text-muted-foreground">
                {formatDate(profile?.lastLogin)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Manage your account security and authentication methods.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Key className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Password</p>
                  <p className="text-xs text-muted-foreground">
                    You can change your password.
                  </p>
                </div>
              </div>
              <Button variant="default" size="sm" onClick={() => setChangePasswordOpen(true)}>
                Change Password
              </Button>
            </div>


          </div>


        </CardContent>
      </Card>



      <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>
}
