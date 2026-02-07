// @ts-nocheck
import { Database, Users, FileQuestion, Settings, HelpCircle, Key, FolderOpen, Tags, Stethoscope, GraduationCap } from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'Admin User',
    email: 'admin@medcortex.com',
    avatar: '/images/avatars/default.jpg',
  },
  teams: [
    {
      name: 'MedCortex Admin',
      logo: Settings,
      plan: 'Administration',
    },
  ],
  navGroups: [
    {
      title: 'User Management',
      items: [
        {
          title: 'All Users',
          url: '/admin/users',
          icon: Users,
        },
        {
          title: 'Activation Codes',
          url: '/admin/activation-codes',
          icon: Key,
        },
      ],
    },
    {
      title: 'Content Management',
      items: [
        {
          title: 'Questions',
          url: '/admin/questions',
          icon: HelpCircle,
        },
        {
          title: 'Residency Questions',
          url: '/admin/residency',
          icon: GraduationCap,
        },
        {
          title: 'Question Sources',
          url: '/admin/question-sources',
          icon: Tags,
        },
        {
          title: 'Question Import',
          url: '/admin/content',
          icon: Database,
        },
        {
          title: 'Course Resources',
          url: '/admin/course-resources',
          icon: FolderOpen,
        },
        {
          title: 'Question Reports',
          url: '/admin/reports',
          icon: FileQuestion,
        },
      ],
    },
    {
      title: 'System Management',
      items: [
        {
          title: 'Specialties',
          url: '/admin/specialties',
          icon: Stethoscope,
        },
      ],
    },
  ],
}
