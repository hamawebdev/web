// @ts-nocheck
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  TrendingUp,
  GraduationCap,
  MapPin
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface WelcomeHeaderProps {
  user: {
    name: string
    avatar?: string | null
    university?: string | null
    year?: number | null
  }
}

export function WelcomeHeader({ user }: WelcomeHeaderProps) {
  const router = useRouter()
  const { name, avatar, university, year } = user
  const fallback = name ? name.charAt(0).toUpperCase() : 'U'

  // Get current time for personalized greeting
  const currentHour = new Date().getHours()
  const getGreeting = () => {
    if (currentHour < 12) return 'Good morning'
    if (currentHour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const getYearDisplay = (yearNum: number) => {
    const yearMap: { [key: number]: string } = {
      1: '1st Year',
      2: '2nd Year',
      3: '3rd Year',
      4: '4th Year',
      5: '5th Year',
      6: '6th Year',
      7: '7th Year'
    }
    return yearMap[yearNum] || `Year ${yearNum}`
  }

  return (
    <Card className="relative overflow-hidden bg-primary dark:bg-[hsl(178.8000_58.1395%_83.1373%)] border-0 shadow-lg">
      {/* Enhanced background decoration for better visual hierarchy */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/20 to-primary/25 dark:from-[hsl(178.8000_58.1395%_83.1373%)]/20 dark:to-[hsl(178.8000_58.1395%_83.1373%)]/25 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-primary/18 to-primary/22 dark:from-[hsl(178.8000_58.1395%_83.1373%)]/18 dark:to-[hsl(178.8000_58.1395%_83.1373%)]/22 rounded-full blur-2xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-primary/12 to-primary/16 dark:from-[hsl(178.8000_58.1395%_83.1373%)]/12 dark:to-[hsl(178.8000_58.1395%_83.1373%)]/16 rounded-full blur-3xl"></div>

      <CardContent className="relative p-[calc(var(--spacing)*6)] sm:p-[calc(var(--spacing)*8)] md:p-[calc(var(--spacing)*10)] backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-[calc(var(--spacing)*4)]">
          {/* User Info Section */}
          <div className="flex items-center gap-[calc(var(--spacing)*3)] lg:gap-[calc(var(--spacing)*4)]">
            <Avatar className="h-10 w-10 lg:h-12 lg:w-12 border-2 border-gray-200 dark:border-gray-700 flex-shrink-0">
              <AvatarImage src={avatar || undefined} alt={name} />
              <AvatarFallback 
                className="text-white font-semibold"
                style={{
                  background: `linear-gradient(to right, var(--gradient-left), var(--gradient-center), var(--gradient-right))`
                }}
              >
                {fallback}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-[calc(var(--spacing)*1)] min-w-0 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-[calc(var(--spacing)*1)] sm:gap-[calc(var(--spacing)*2)]">
                <h2 className="text-foreground dark:text-[hsl(0_0%_9.0196%)] tracking-tight text-lg sm:text-xl md:text-2xl font-bold">
                  {getGreeting()}, {name}!
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-[calc(var(--spacing)*2)] sm:gap-[calc(var(--spacing)*4)] md:gap-[calc(var(--spacing)*5)] text-sm md:text-base text-muted-foreground dark:text-[hsl(0_0%_12.5490%)] leading-relaxed">
                {university && (
                  <div className="flex items-center gap-[calc(var(--spacing)*1)]">
                    <MapPin className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                    <span className="font-medium truncate">{university}</span>
                  </div>
                )}

                {year && (
                  <div className="flex items-center gap-[calc(var(--spacing)*1)]">
                    <GraduationCap className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                    <span className="font-medium">{getYearDisplay(year)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Date and Quick Action */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-[calc(var(--spacing)*3)] sm:gap-[calc(var(--spacing)*4)] md:gap-[calc(var(--spacing)*5)] w-full sm:w-auto">
            <div className="text-left sm:text-right order-2 sm:order-1">
              <div className="flex items-center gap-[calc(var(--spacing)*2)] text-sm md:text-base font-medium text-muted-foreground dark:text-[hsl(0_0%_12.5490%)] mb-[calc(var(--spacing)*1)] leading-relaxed">
                <Calendar className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                <span className="hidden sm:inline">{new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}</span>
                <span className="sm:hidden">{new Date().toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}</span>
              </div>
              <div className="text-xs md:text-sm text-muted-foreground dark:text-[hsl(0_0%_12.5490%)] leading-relaxed hidden sm:block">
                Your trusted medical education companion
              </div>
            </div>

            <Button onClick={() => router.push('/student/practice')} className="gap-[calc(var(--spacing)*2)] hover:opacity-90 text-white shadow-lg font-semibold tracking-tight order-1 sm:order-2 w-full sm:w-auto" style={{ background: 'linear-gradient(to right, var(--gradient-left), var(--gradient-center), var(--gradient-right))' }}>
              <TrendingUp className="h-4 w-4" />
              <span className="sm:hidden">Continue</span>
              <span className="hidden sm:inline">Continue Learning</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
