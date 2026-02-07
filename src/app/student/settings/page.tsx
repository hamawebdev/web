// @ts-nocheck
'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Shield, Palette } from 'lucide-react'
import { UserCircle } from '@solar-icons/react'
import { AccountForm } from '@/components/student/settings/account-form'
import { AppearanceForm } from '@/components/student/settings/appearance-form'


export default function StudentSettingsPage() {
  const [activeTab, setActiveTab] = useState('account')

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4 mb-6">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <UserCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Settings
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Manage your account settings and preferences
              </p>
            </div>
          </div>
        </div>

      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-1/5">
          <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="w-full">
              <TabsList className="grid w-full grid-cols-1 lg:grid-cols-1 h-auto bg-transparent p-0">
                <TabsTrigger 
                  value="account" 
                  className="w-full justify-start gap-2 data-[state=active]:bg-muted px-3 py-2"
                >
                  <Shield className="h-4 w-4" />
                  Account
                </TabsTrigger>
                <TabsTrigger 
                  value="appearance" 
                  className="w-full justify-start gap-2 data-[state=active]:bg-muted px-3 py-2"
                >
                  <Palette className="h-4 w-4" />
                  Appearance
                </TabsTrigger>

              </TabsList>
            </Tabs>
          </nav>
        </aside>
        
        <div className="flex-1 lg:max-w-2xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="account" className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Account</h3>
                <p className="text-sm text-muted-foreground">
                  View your account information and security status.
                </p>
              </div>
              <Separator />
              <AccountForm />
            </TabsContent>

            <TabsContent value="appearance" className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Appearance</h3>
                <p className="text-sm text-muted-foreground">
                  Customize the appearance of the application.
                </p>
              </div>
              <Separator />
              <AppearanceForm />
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>
    </div>
  )
}
