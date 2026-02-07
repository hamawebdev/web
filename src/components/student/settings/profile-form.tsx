// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Mail, GraduationCap, University, Calendar } from 'lucide-react'
import { UserCircle } from '@solar-icons/react'
import { toast } from 'sonner'
import { SettingsService } from '@/lib/api-services'
import type { UserProfile } from '@/types/api'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  universityId: z.string().min(1, 'Please select a university'),
  specialtyId: z.string().min(1, 'Please select a specialty'),
  currentYear: z.string().min(1, 'Please select your current year'),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function ProfileForm() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [universities, setUniversities] = useState<any[]>([])
  const [specialties, setSpecialties] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      email: '',
      universityId: '',
      specialtyId: '',
      currentYear: '',
    },
  })

  // Load profile data and form options
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)

        const [profileResponse, universitiesResponse, specialtiesResponse] = await Promise.all([
          SettingsService.getUserProfile(),
          SettingsService.getUniversities(),
          SettingsService.getSpecialties(),
        ])

        if (profileResponse.success && profileResponse.data) {
          const profileData = profileResponse.data
          setProfile(profileData)

          // Set form values
          form.reset({
            fullName: profileData.fullName || '',
            email: profileData.email || '',
            universityId: profileData.university?.id?.toString() || '',
            specialtyId: profileData.specialty?.id?.toString() || '',
            currentYear: profileData.currentYear || '',
          })
        }

        if (universitiesResponse.success && universitiesResponse.data) {
          setUniversities(universitiesResponse.data.universities || [])
        }

        if (specialtiesResponse.success && specialtiesResponse.data) {
          setSpecialties(specialtiesResponse.data.specialties || [])
        }
      } catch (error) {
        console.error('Error loading profile data:', error)
        toast.error('Failed to load profile data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [form])

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsSubmitting(true)

      const updateData = {
        fullName: data.fullName,
        universityId: parseInt(data.universityId),
        specialtyId: parseInt(data.specialtyId),
        currentYear: data.currentYear,
      }

      const response = await SettingsService.updateUserProfile(updateData)

      if (response.success) {
        toast.success('Profile updated successfully')
        // Reload profile data
        const updatedProfile = await SettingsService.getUserProfile()
        if (updatedProfile.success && updatedProfile.data) {
          setProfile(updatedProfile.data)
        }
      } else {
        toast.error(response.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
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
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src="/avatar-placeholder.png" alt={profile?.fullName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {profile?.fullName ? getUserInitials(profile.fullName) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold">{profile?.fullName}</h3>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <div className="flex items-center gap-2">
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your personal details and academic information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Full Name */}
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4" />
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email (Read-only) */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input {...field} disabled className="bg-muted" />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed. Contact support if needed.
                    </p>
                  </FormItem>
                )}
              />

              <Separator />

              {/* Academic Information */}
              <h4 className="text-sm font-medium flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Academic Information
              </h4>

              {/* University */}
              <FormField
                control={form.control}
                name="universityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <University className="h-4 w-4" />
                      University
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your university" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {universities.map((university) => (
                          <SelectItem key={university.id} value={university.id.toString()}>
                            {university.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentYear"
                render={({ field }) => {
                  const hasActive = (profile?.subscriptions || []).some((s) => s.status === 'ACTIVE' && new Date(s.endDate).getTime() >= Date.now());
                  return (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Current Year
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={hasActive}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your current year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN'].map((y) => (
                            <SelectItem key={y} value={y}>Year {y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {hasActive && (
                        <p className="text-xs text-muted-foreground">Current year cannot be changed while a study pack is active.</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />

              {/* Specialty (uneditable) */}
              <FormField
                control={form.control}
                name="specialtyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specialty</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your specialty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {specialties.map((specialty) => (
                          <SelectItem key={specialty.id} value={specialty.id.toString()}>
                            {specialty.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />



              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
    // </div>
  )
}
