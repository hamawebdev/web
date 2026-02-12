// @ts-nocheck
import React from 'react'
import {
  Widget2,
  Pulse2,
  Notebook,
  FolderOpen,
  Tag,
  Card,
  Stethoscope,
  AddCircle,
  History,
  ChartSquare,
  DocumentText,
} from '@solar-icons/react'
import { type SidebarData } from '../types'

export interface SidebarSection {
  title?: string
  items: SidebarItem[]
}

export interface SidebarItem {
  title: string
  url?: string
  icon?: React.ComponentType<{ className?: string; size?: number }>
  items?: SidebarSubItem[]
  badge?: string
  /** Group identifier for subscription-based disabling (practice, exam, residency) */
  group?: 'practice' | 'exam' | 'residency'
}

export interface SidebarSubItem {
  title: string
  url: string
  icon?: React.ComponentType<{ className?: string; size?: number }>
  badge?: string
}

export const sidebarData: SidebarData = {
  teams: [],
  navGroups: [
    {
      title: '', // Remove group title
      items: [
        {
          title: 'Dashboard',
          url: '/student/dashboard',
          icon: Widget2,
        },
        {
          title: 'Serie',
          icon: Pulse2,
          group: 'practice',
          items: [
            {
              title: 'Create Serie',
              url: '/student/practice/create',
              icon: AddCircle,
            },
            {
              title: 'Old Series',
              url: '/student/practice',
              icon: History,
            },
          ],
        },
        {
          title: 'Exams',
          icon: Notebook,
          group: 'exam',
          items: [
            {
              title: 'Create Exam',
              url: '/student/exams/create',
              icon: AddCircle,
            },
            {
              title: 'Old Series',
              url: '/student/exams',
              icon: History,
            },
          ],
        },
        {
          title: 'Residency',
          icon: Stethoscope,
          group: 'residency',
          items: [
            {
              title: 'Create Residency',
              url: '/student/residency/create',
              icon: AddCircle,
            },
            {
              title: 'Old Series',
              url: '/student/residency',
              icon: History,
            },
          ],
        },
      ],
    },
    {
      title: '',
      items: [
        {
          title: 'Resources',
          url: '/student/course-resources',
          icon: FolderOpen,
        },
        {
          title: 'Labels',
          url: '/student/labels',
          icon: Tag,
        },
        {
          title: 'Notes',
          url: '/student/notes',
          icon: DocumentText,
        },
        {
          title: 'Subscriptions',
          url: '/student/subscriptions',
          icon: Card,
        },
      ],
    },
  ],
}
