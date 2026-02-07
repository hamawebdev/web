// @ts-nocheck
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  Flag,
  MoreHorizontal,
  Edit3,
  Trash2,
  Star,
  Circle,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Target,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  List,
  CalendarDays
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/loading-states'
import { useStudentAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

import { StudentService } from '@/lib/api-services'
import type { Todo as ApiTodo, CreateTodoRequest, UpdateTodoRequest } from '@/types/api'
import { ReadingTodoForm } from '@/components/student/todos/reading-todo-form'

// Enhanced color system using globals.css design tokens
const PRIORITY_CHIP_COLORS: Record<string, string> = {
  LOW: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  MEDIUM: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  HIGH: 'bg-destructive/10 text-destructive border-destructive/20',
}

const STATUS_CHIP_COLORS: Record<string, string> = {
  PENDING: 'bg-muted text-muted-foreground border-border',
  IN_PROGRESS: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  COMPLETED: 'bg-chart-1/10 text-chart-1 border-chart-1/20',
  OVERDUE: 'bg-destructive/10 text-destructive border-destructive/20',
}

const TYPE_ICONS: Record<string, any> = {
  READING: BookOpen,
  SESSION: Target,
  EXAM: GraduationCap,
  OTHER: Circle,
}

// Local storage helpers for Reading Todo course selection persistence
const readingTodoKey = (todoId: number) => `readingTodo:${todoId}:courseIds`

function getReadingTodoCourseIds(todoId: number): number[] {
  try {
    const raw = localStorage.getItem(readingTodoKey(todoId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x: any) => Number.isInteger(x)) : []
  } catch (err) {
    console.error('Failed to read Reading Todo courseIds from localStorage', { todoId, err })
    return []
  }
}

function setReadingTodoCourseIds(todoId: number, courseIds: number[]) {
  try {
    localStorage.setItem(readingTodoKey(todoId), JSON.stringify(courseIds))
  } catch (err) {
    console.error('Failed to persist Reading Todo courseIds to localStorage', { todoId, err })
  }
}

function removeReadingTodoCourseIds(todoId: number) {
  try {
    localStorage.removeItem(readingTodoKey(todoId))
  } catch (err) {
    console.error('Failed to remove Reading Todo courseIds from localStorage', { todoId, err })
  }
}

export default function TodosPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useStudentAuth()

  const [todos, setTodos] = useState<ApiTodo[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [hasEverHadTodos, setHasEverHadTodos] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL') // type
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [showCompleted, setShowCompleted] = useState(false)
  const [showTodayOnly, setShowTodayOnly] = useState(false)
  const [viewMode, setViewMode] = useState<'list'>('list')
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'created'>('created')
  const [page, setPage] = useState(1)
  const [limit] = useState(12)
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(new Set())

  // Enhanced chip components using design system colors
  const PriorityChip = ({ priority }: { priority: string }) => (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium", PRIORITY_CHIP_COLORS[priority])}
    >
      <Flag className="h-3 w-3 mr-1" />
      {priority}
    </Badge>
  )

  const StatusChip = ({ status }: { status: string }) => (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium", STATUS_CHIP_COLORS[status])}
    >
      {status === 'COMPLETED' && <CheckCircle2 className="h-3 w-3 mr-1" />}
      {status === 'IN_PROGRESS' && <Clock className="h-3 w-3 mr-1" />}
      {status === 'OVERDUE' && <AlertCircle className="h-3 w-3 mr-1" />}
      {status === 'PENDING' && <Circle className="h-3 w-3 mr-1" />}
      {status.replace('_', ' ')}
    </Badge>
  )

  const DueDateChip = ({ dueDate }: { dueDate: string }) => {
    const date = new Date(dueDate)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    let colorClass = 'bg-muted text-muted-foreground border-border'
    if (diffDays < 0) colorClass = 'bg-destructive/10 text-destructive border-destructive/20'
    else if (diffDays === 0) colorClass = 'bg-chart-4/10 text-chart-4 border-chart-4/20'

    return (
      <Badge variant="outline" className={cn("text-xs font-medium", colorClass)}>
        <CalendarDays className="h-3 w-3 mr-1" />
        {formatDueDate(dueDate)}
      </Badge>
    )
  }

  const [error, setError] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showReadingForm, setShowReadingForm] = useState(false)
  const [editingTodo, setEditingTodo] = useState<ApiTodo | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [newTodo, setNewTodo] = useState<CreateTodoRequest>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    type: 'OTHER',
    dueDate: undefined,
    courseIds: [],
    quizId: undefined,
    estimatedTime: undefined,
    tags: []
  })

  const [pagination, setPagination] = useState<any>(null)

  const [todoErrors, setTodoErrors] = useState<Record<number, string>>({})


  // Normalize a Todo from various API response shapes to avoid transient invalid objects
  const normalizeTodoFromResponse = (resp: any): ApiTodo | null => {
    console.log('Normalizing response:', resp)

    const cands = [
      resp?.data?.data?.todo,
      resp?.data?.todo,
      resp?.data?.data,
      resp?.data,
      resp?.todo,
      resp,
    ]

    for (const c of cands) {
      console.log('Checking candidate:', c)
      if (c && typeof c === 'object' && 'id' in c && 'title' in c) {
        // More flexible validation - only require id and title
        const normalized = {
          id: c.id,
          title: c.title,
          description: c.description || '',
          status: c.status || 'PENDING',
          priority: c.priority || 'MEDIUM',
          type: c.type || 'OTHER',
          dueDate: c.dueDate,
          courseIds: c.courseIds || [],
          courses: c.courses || [],
          estimatedTime: c.estimatedTime,
          tags: c.tags || [],
          createdAt: c.createdAt || new Date().toISOString(),
          updatedAt: c.updatedAt || new Date().toISOString(),
        }
        console.log('Normalized todo:', normalized)
        return normalized as ApiTodo
      }
    }

    console.log('Failed to normalize, no valid candidate found')
    return null
  }

  // Debug search query changes
  useEffect(() => {
    console.log('Search query changed to:', searchQuery)
  }, [searchQuery])

  // Load todos from API with server-side filtering (debounced)
  useEffect(() => {
    let handle: any;

    const loadTodos = async () => {
      try {
        if (!initialLoadDone) setLoading(true); else setFetching(true)
        setError(null)

        // Determine API parameters based on status filter
        let apiParams: any = {
          page,
          limit,
          type: selectedCategory !== 'ALL' ? selectedCategory : undefined,
          priority: selectedPriority !== 'ALL' ? selectedPriority : undefined,
          search: searchQuery || undefined,
          sortBy: sortBy === 'created' ? 'createdAt' : sortBy === 'dueDate' ? 'dueDate' : sortBy,
          sortOrder: sortBy === 'created' ? 'desc' : sortBy === 'dueDate' ? 'asc' : 'desc', // Newest first for created, earliest first for due date, highest first for priority
        }

        // Handle status filtering according to new API behavior
        if (selectedStatus === 'ALL') {
          // Show all todos including completed
          apiParams.includeCompleted = true
        } else if (selectedStatus === 'COMPLETED') {
          // Show only completed todos
          apiParams.includeCompleted = true
          apiParams.status = 'COMPLETED'
        } else {
          // Show specific status (PENDING, IN_PROGRESS, OVERDUE)
          // For OVERDUE, we might need completed todos to determine overdue status
          apiParams.status = selectedStatus
          apiParams.includeCompleted = selectedStatus === 'OVERDUE'
        }

        const response = await StudentService.getTodos(apiParams)

        if (response.success) {
          // Accept shapes: {data:{data:{todos:[]}}}, {data:{todos:[]}}, {data:[]}
          const list = Array.isArray(response.data?.data?.todos)
            ? response.data!.data!.todos
            : Array.isArray(response.data?.todos)
              ? response.data!.todos
              : Array.isArray(response.data?.data)
                ? response.data!.data as any[]
                : Array.isArray(response.data)
                  ? (response.data as any[])
                  : []

          console.log('📋 Raw todos list from API:', list)

          // Normalize todos and ensure courses have proper structure
          const todoList = Array.isArray(list) ? (list as ApiTodo[]).map(todo => {
            console.log('🔍 Processing todo:', todo.id, todo.title, 'courses:', todo.courses)

            // Ensure courses have the expected structure for display
            const normalizedCourses = (todo.courses || []).map((course: any) => {
              console.log('🔍 Processing course:', course)
              return {
                id: course.id,
                name: course.name,
                description: course.description || '',
                moduleName: course.moduleName || course.module?.name || '',
                uniteName: course.uniteName || '',
                completed: course.completed || false
              }
            })

            console.log('✅ Normalized courses for todo', todo.id, ':', normalizedCourses)

            return {
              ...todo,
              courses: normalizedCourses
            }
          }) : []

          console.log('📋 Final normalized todo list:', todoList)
          // Apply localStorage overrides for Reading Todo course selections
          const todosWithLocal = (todoList || []).map((todo: any) => {
            try {
              if (todo && todo.type === 'READING' && Array.isArray(todo.courses) && todo.id != null) {
                const saved = getReadingTodoCourseIds(todo.id)
                if (saved && saved.length > 0) {
                  return {
                    ...todo,
                    courses: todo.courses.map((c: any) => ({ ...c, completed: saved.includes(c.id) }))
                  }
                }
              }
            } catch (e) {
              // If localStorage read fails, silently fallback to backend state
            }
            return todo
          })
          setTodos(todosWithLocal)

          // Normalize pagination info for consistent student UI
          const p: any = response.data?.data?.pagination
            || response.data?.data?.data?.pagination
            || response.data?.pagination
            || null
          if (p) {
            const current = p.currentPage ?? p.page ?? page ?? 1
            const lim = p.limit ?? limit ?? 12
            const totalItems = p.total ?? p.totalItems ?? 0
            const totalPages = p.totalPages ?? (lim ? Math.ceil(totalItems / lim) : 1)
            setPagination({
              page: current,
              totalPages,
              total: totalItems,
              limit: lim,
              hasPrev: current > 1,
              hasNext: current < totalPages,
            })
          } else {
            // Fallback: unknown total, only know current page
            setPagination({ page, totalPages: page, total: todoList.length, limit, hasPrev: page > 1, hasNext: false })
          }

          // Track if user has ever had todos (including completed ones)
          if (todoList.length > 0) {
            setHasEverHadTodos(true)
          }
        } else {
          setError(typeof response.error === 'string' ? response.error : 'Failed to load todos')
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to load todos'
        setError(msg)
        toast.error(msg)
      } finally {
        if (!initialLoadDone) setInitialLoadDone(true)
        setLoading(false)
        setFetching(false)
      }
    }

    if (isAuthenticated) {
      handle = setTimeout(loadTodos, 400)
    }

    return () => handle && clearTimeout(handle)
  }, [isAuthenticated, selectedCategory, selectedPriority, selectedStatus, searchQuery, page, limit, initialLoadDone, refreshTrigger, sortBy])

  // Enhanced filter and sort todos
  const filteredTodos = todos
    .filter(todo => {
      if (!todo) return false

      // Today's tasks filter
      if (showTodayOnly) {
        if (!todo.dueDate) return false
        const today = new Date()
        const dueDate = new Date(todo.dueDate)
        if (dueDate.toDateString() !== today.toDateString()) return false
      }

      // Client-side completed visibility (only applies when status filter is 'ALL')
      if (selectedStatus === 'ALL' && !showCompleted && todo.status === 'COMPLETED') return false

      // Search by title/description (defensive)
      const t = (todo.title ?? '').toLowerCase()
      const d = (todo.description ?? '').toLowerCase()
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!t.includes(q) && !d.includes(q)) return false
      }

      // Type filter (client-side for additional filtering)
      if (selectedCategory !== 'ALL' && todo.type !== selectedCategory) return false
      // Priority filter (client-side for additional filtering)
      if (selectedPriority !== 'ALL' && todo.priority !== selectedPriority) return false

      return true
    })
    .sort((a, b) => {
      // Since we're now using server-side sorting, this client-side sort is mainly for
      // additional filtering and ensuring consistent ordering
      switch (sortBy) {
        case 'priority':
          const priorityOrder: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 }
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
        case 'created':
          // Default: newest first (descending order)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default: // 'dueDate'
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
    })


  const handleSubmitTodo = async () => {
    if (!newTodo.title.trim()) {
      toast.error('Todo title is required')
      return
    }

    console.log('Before submit - searchQuery:', searchQuery)
    console.log('Before submit - newTodo.title:', newTodo.title)

    try {
      if (editingTodo) {
        const response = await StudentService.updateTodo(editingTodo.id, { ...newTodo, status: editingTodo.status } as UpdateTodoRequest)
        if (response.success && response.data) {
          const normalizedTodo = normalizeTodoFromResponse(response)
          if (normalizedTodo) {
            toast.success('Todo updated successfully')
            setShowCreateDialog(false)
            setTodos((prev) => prev.map((t) => (t.id === editingTodo.id ? normalizedTodo : t)))
            setEditingTodo(null)
          } else {
            // Fallback: try to use response.data directly
            console.log('Update normalization failed, trying fallback. Response:', response)
            const fallbackTodo = response.data as any
            if (fallbackTodo && typeof fallbackTodo === 'object' && fallbackTodo.id) {
              toast.success('Todo updated successfully')
              setShowCreateDialog(false)
              setTodos((prev) => prev.map((t) => (t.id === editingTodo.id ? fallbackTodo : t)))
              setEditingTodo(null)
            } else {
              toast.error('Failed to parse updated todo data')
              console.error('Update todo response structure:', response)
            }
          }
        } else {
          toast.error(typeof response.error === 'string' ? response.error : 'Failed to update todo')
        }
      } else {
        const response = await StudentService.createTodo(newTodo)
        if (response.success && response.data) {
          const normalizedTodo = normalizeTodoFromResponse(response)
          if (normalizedTodo) {
            toast.success('Todo created successfully')
            setShowCreateDialog(false)
            setTodos((prev) => [normalizedTodo, ...prev])
            setHasEverHadTodos(true) // Mark that user now has todos
            // Clear search query to ensure new todo is visible
            console.log('Clearing search query after successful creation')
            setSearchQuery('')
          } else {
            // Fallback: try to create todo object from response.data directly
            console.log('Normalization failed, trying fallback. Response:', response)
            const fallbackTodo = response.data as any
            if (fallbackTodo && typeof fallbackTodo === 'object' && fallbackTodo.title) {
              toast.success('Todo created successfully')
              setShowCreateDialog(false)
              setTodos((prev) => [fallbackTodo, ...prev])
              setHasEverHadTodos(true)
              // Clear search query to ensure new todo is visible
              setSearchQuery('')
            } else {
              toast.error('Failed to parse created todo data')
              console.error('Create todo response structure:', response)
            }
          }
        } else {
          toast.error(typeof response.error === 'string' ? response.error : 'Failed to create todo')
        }
      }

      // Reset form
      setNewTodo({
        title: '',
        description: '',
        priority: 'MEDIUM',
        type: 'OTHER',
        dueDate: undefined,
        courseIds: [],
        quizId: undefined,
        estimatedTime: undefined,
        tags: []
      })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to submit todo'
      toast.error(msg)
    }
  }

  const handleToggleTodo = async (todoId: number) => {
    const current = todos.find(t => t.id === todoId)
    if (!current) return

    // Special completion flow for READING todos (optimistic removal + localStorage cleanup)
    if (current.type === 'READING' && current.status !== 'COMPLETED') {
      const prevList = [...todos]
      // Optimistically remove from UI
      setTodos(prev => prev.filter(t => t.id !== todoId))
      try {
        const response = await StudentService.updateTodo(todoId, { status: 'COMPLETED' })
        if (response.success) {
          try { removeReadingTodoCourseIds(todoId) } catch (e) { /* ignore */ }
          toast.success('Todo updated')
        } else {
          throw new Error(typeof response.error === 'string' ? response.error : 'Failed to update todo')
        }
      } catch (error) {
        // Rollback UI and show inline error message
        setTodos(prevList)
        setTodoErrors(prev => ({ ...prev, [todoId]: 'Impossible de terminer ce todo. Réessayez.' }))
        setTimeout(() => setTodoErrors(prev => { const n = { ...prev }; delete n[todoId]; return n }), 4000)
      }
      return
    }

    // Default behavior (non-reading or reopening)
    try {
      let response
      if (current.status !== 'COMPLETED') {
        response = await StudentService.updateTodo(todoId, { status: 'COMPLETED' })
      } else {
        response = await StudentService.updateTodo(todoId, { status: 'IN_PROGRESS' })
      }

      if (response.success && response.data) {
        const normalizedTodo = normalizeTodoFromResponse(response)
        if (normalizedTodo) {
          setTodos(prev => prev.map(todo => (todo.id === todoId ? normalizedTodo : todo)))
          toast.success('Todo updated')
        } else {
          toast.error('Failed to parse updated todo data')
          setTodos(prev => prev.map(todo =>
            todo.id === todoId
              ? { ...todo, status: current.status !== 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS' }
              : todo
          ))
        }
      } else {
        toast.error(typeof response.error === 'string' ? response.error : 'Failed to update todo')
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to update todo'
      toast.error(msg)
    }
  }

  const handleStarTodo = async (todo: ApiTodo) => {
    try {
      const response = await StudentService.updateTodo(todo.id, {
        // Use tags or metadata as needed; assuming backend supports a flag or storing in tags
        // Here we toggle a tag "STARRED" if not present, otherwise remove it
        tags: todo.tags?.includes('STARRED')
          ? todo.tags.filter(t => t !== 'STARRED')
          : [...(todo.tags || []), 'STARRED']
      })

      if (response.success && response.data) {
        const normalizedTodo = normalizeTodoFromResponse(response)
        if (normalizedTodo) {
          setTodos(prev => prev.map(t => t.id === todo.id ? normalizedTodo : t))
        } else {
          // Fallback: try to use response.data directly
          const fallbackTodo = response.data as any
          if (fallbackTodo && typeof fallbackTodo === 'object' && fallbackTodo.id) {
            setTodos(prev => prev.map(t => t.id === todo.id ? fallbackTodo : t))
          } else {
            // Optimistic update as last resort
            const updatedTags = todo.tags?.includes('STARRED')
              ? todo.tags.filter(t => t !== 'STARRED')
              : [...(todo.tags || []), 'STARRED']
            setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, tags: updatedTags } : t))
          }
        }
      } else {
        toast.error(typeof response.error === 'string' ? response.error : 'Failed to update todo')
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to update todo'
      toast.error(msg)
    }
  }

  const handleToggleCourse = async (todoId: number, courseId: number) => {
    // Snapshot previous state for rollback
    const prevTodos = [...todos]
    const target = todos.find(t => t.id === todoId)
    if (!target || !Array.isArray(target.courses)) return

    const prevCompletedIds = target.courses.filter(c => c.completed).map(c => c.id)
    const wasCompleted = !!target.courses.find(c => c.id === courseId)?.completed
    const nextCompletedIds = wasCompleted
      ? prevCompletedIds.filter(id => id !== courseId)
      : Array.from(new Set([...prevCompletedIds, courseId]))

    // Optimistically update localStorage
    try { setReadingTodoCourseIds(todoId, nextCompletedIds) } catch (e) { /* ignore */ }

    // Optimistically update UI
    setTodos(prev => prev.map(todo => {
      if (todo.id === todoId && Array.isArray(todo.courses)) {
        const updatedCourses = todo.courses.map(course =>
          course.id === courseId
            ? { ...course, completed: !course.completed }
            : course
        )

        const allCoursesCompleted = updatedCourses.every(course => course.completed)
        const anyCoursesCompleted = updatedCourses.some(course => course.completed)

        let newStatus = todo.status
        if (allCoursesCompleted && todo.status !== 'COMPLETED') newStatus = 'COMPLETED'
        else if (!anyCoursesCompleted && todo.status === 'COMPLETED') newStatus = 'IN_PROGRESS'
        else if (anyCoursesCompleted && todo.status === 'PENDING') newStatus = 'IN_PROGRESS'

        return { ...todo, courses: updatedCourses, status: newStatus }
      }
      return todo
    }))

    // If all courses are now completed for a READING todo, attempt backend completion
    const allNowCompleted = target.courses.length > 0 && nextCompletedIds.length === target.courses.length
    if (target.type === 'READING' && allNowCompleted && target.status !== 'COMPLETED') {
      const prevList = [...prevTodos]
      // Optimistically remove from UI
      setTodos(prev => prev.filter(t => t.id !== todoId))
      try {
        const response = await StudentService.updateTodo(todoId, { status: 'COMPLETED' })
        if (response.success) {
          try { removeReadingTodoCourseIds(todoId) } catch (e) { /* ignore */ }
          toast.success('Todo updated')
        } else {
          throw new Error(typeof response.error === 'string' ? response.error : 'Failed to update todo')
        }
      } catch (err) {
        // Roll back UI and localStorage
        setTodos(prevList)
        try { setReadingTodoCourseIds(todoId, prevCompletedIds) } catch (e) { /* ignore */ }
        setTodoErrors(prev => ({ ...prev, [todoId]: 'Impossible de terminer ce todo. Réessayez.' }))
        setTimeout(() => setTodoErrors(prev => { const n = { ...prev }; delete n[todoId]; return n }), 4000)
      }
    } else {
      toast.success('Course progress updated')
    }
  }

  const handleReadingTodoCreated = () => {
    // Refresh the todos list and return to main view
    setRefreshTrigger(prev => prev + 1)
    setShowReadingForm(false)
  }

  const handleEditTodo = (todo: ApiTodo) => {
    setEditingTodo(todo)
    setNewTodo({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      type: todo.type,
      dueDate: todo.dueDate,
      courseIds: todo.courseIds,
      quizId: undefined, // Not available in current todo structure
      estimatedTime: todo.estimatedTime,
      tags: todo.tags || []
    })
    setShowCreateDialog(true)
  }

  const handleDeleteTodo = async (todoId: number) => {
    try {
      const response = await StudentService.deleteTodo(todoId)
      if (response.success) {
        setTodos(prev => prev.filter(t => t.id !== todoId))
        toast.success('Todo deleted')
      } else {
        toast.error(typeof response.error === 'string' ? response.error : 'Failed to delete todo')
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to delete todo'
      toast.error(msg)
    }
  }

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'Overdue'
    if (diffDays === 0) return 'Due today'
    if (diffDays === 1) return 'Due tomorrow'
    if (diffDays <= 7) return `Due in ${diffDays} days`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getDueDateColor = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'text-destructive'
    if (diffDays === 0) return 'text-destructive/80'
    if (diffDays <= 3) return 'text-accent-foreground'
    return 'text-muted-foreground'
  }

  // Enhanced progress calculations
  const completedCount = todos.filter(todo => todo.status === 'COMPLETED').length
  const totalCount = todos.length
  const todayTodos = todos.filter(todo => {
    if (!todo.dueDate) return false
    const today = new Date()
    const dueDate = new Date(todo.dueDate)
    return dueDate.toDateString() === today.toDateString()
  })
  const todayCompletedCount = todayTodos.filter(todo => todo.status === 'COMPLETED').length
  const todayTotalCount = todayTodos.length
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const todayProgressPercentage = todayTotalCount > 0 ? Math.round((todayCompletedCount / todayTotalCount) * 100) : 0

  // Toggle description expansion
  const toggleDescription = (todoId: number) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(todoId)) {
        newSet.delete(todoId)
      } else {
        newSet.add(todoId)
      }
      return newSet
    })
  }

  // Truncate description helper
  const truncateDescription = (description: string, maxLines: number = 2) => {
    const words = description.split(' ')
    const wordsPerLine = 12 // Approximate words per line
    const maxWords = maxLines * wordsPerLine

    if (words.length <= maxWords) return description
    return words.slice(0, maxWords).join(' ') + '...'
  }

  if (authLoading || loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  // Show reading form if requested
  if (showReadingForm) {
    return (
      <ReadingTodoForm
        onBack={() => setShowReadingForm(false)}
        onTodoCreated={handleReadingTodoCreated}
      />
    );
  }

  return (
    <div className="flex-1 space-y-6 p-0">
      {/* Enhanced Header with Progress */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-primary/10 border border-primary/20 rounded-xl shadow-sm">
                <CheckSquare className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Todo Manager
                </h1>
                <p className="text-muted-foreground text-base sm:text-lg">
                  Stay organized and boost your productivity
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-center">
            {/* View Mode Toggle - Responsive */}
            <div className="flex items-center bg-muted/50 rounded-lg p-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-2 sm:px-3 text-xs sm:text-sm"
              >
                <List className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                <span className="hidden sm:inline">List</span>
              </Button>
            </div>

            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 px-3 sm:px-4 py-2 text-xs sm:text-sm"
              onClick={() => setShowReadingForm(true)}
            >
              <BookOpen className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Reading Todo</span>
              <span className="sm:hidden">Reading</span>
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="shadow-md hover:shadow-lg transition-all duration-200 border-2 px-3 sm:px-4 py-2 text-xs sm:text-sm"
                  onClick={() => {
                    setEditingTodo(null)
                    setNewTodo({
                      title: '',
                      description: '',
                      priority: 'MEDIUM',
                      type: 'OTHER',
                      dueDate: undefined,
                      courseIds: [],
                      quizId: undefined,
                      estimatedTime: undefined,
                      tags: []
                    })
                    setSearchQuery('')
                  }}
                >
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">New Todo</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingTodo ? 'Edit Todo' : 'Create New Todo'}</DialogTitle>
              <DialogDescription>
                {editingTodo ? 'Update your todo details.' : 'Add a new task to your todo list.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter todo title"
                  value={newTodo.title}
                  onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Enter todo description"
                  value={newTodo.description}
                  onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newTodo.priority} onValueChange={(value: any) => setNewTodo({ ...newTodo, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={newTodo.type} onValueChange={(value: any) => setNewTodo({ ...newTodo, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SESSION">Session</SelectItem>
                      <SelectItem value="EXAM">Exam</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              {editingTodo && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={editingTodo.status} onValueChange={(value: any) => setEditingTodo({ ...editingTodo, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="OVERDUE">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date (Optional)</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={newTodo.dueDate ?? ''}
                  onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitTodo}>
                {editingTodo ? 'Update Todo' : 'Create Todo'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

        </div>


        {/* Progress Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Today's Progress</h3>
            <div className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>

          <Card className="border-2 border-primary/10 bg-gradient-to-r from-primary/5 to-chart-1/5">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Today's Tasks</p>
                    <p className="text-2xl font-bold text-foreground">
                      {todayCompletedCount} of {todayTotalCount}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-muted-foreground">Overall Progress</p>
                    <p className="text-2xl font-bold text-foreground">
                      {completedCount} of {totalCount}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Today</span>
                      <span className="text-muted-foreground">{todayProgressPercentage}%</span>
                    </div>
                    <Progress
                      value={todayProgressPercentage}
                      className="h-2 bg-muted/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Overall</span>
                      <span className="text-muted-foreground">{progressPercentage}%</span>
                    </div>
                    <Progress
                      value={progressPercentage}
                      className="h-2 bg-muted/50"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Enhanced Filters and Search */}
      <div className="space-y-4">
        {/* Mobile-first responsive layout */}
        <div className="space-y-4">
          {/* Search Bar - Full width on mobile */}
          <div className="w-full">
            <div className="relative max-w-md mx-auto sm:mx-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search todos..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                className="w-full pl-10 h-10 border-2 focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col space-y-4">
            {/* Dropdown Filters - Responsive grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setPage(1) }}>
                <SelectTrigger className="w-full h-10 text-sm">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="READING">Reading</SelectItem>
                  <SelectItem value="SESSION">Session</SelectItem>
                  <SelectItem value="EXAM">Exam</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedPriority} onValueChange={(v) => { setSelectedPriority(v); setPage(1) }}>
                <SelectTrigger className="w-full h-10 text-sm">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Priorities</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={(v) => { setSelectedStatus(v); setPage(1) }}>
                <SelectTrigger className="w-full h-10 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-full h-10 text-sm">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dueDate">Due Date</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter Checkboxes - Responsive layout */}
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 pt-2 border-t border-border/50">

              {selectedStatus === 'ALL' && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="show-completed"
                    checked={showCompleted}
                    onCheckedChange={setShowCompleted}
                  />
                  <Label htmlFor="show-completed" className="text-sm font-medium cursor-pointer">
                    Show completed
                  </Label>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Todos Content */}
      {filteredTodos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
            <div className="relative bg-primary p-6 rounded-full">
              <CheckSquare className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>

          <div className="text-center space-y-4 max-w-md">
            <h3 className="text-2xl font-bold text-foreground">
              {searchQuery || selectedCategory !== 'ALL' || selectedPriority !== 'ALL' || selectedStatus !== 'ALL'
                ? "No Todos Found"
                : !hasEverHadTodos
                  ? "Welcome to Your Todo Hub!"
                  : "All Clear!"
              }
            </h3>

            <p className="text-muted-foreground text-lg leading-relaxed">
              {searchQuery || selectedCategory !== 'ALL' || selectedPriority !== 'ALL' || selectedStatus !== 'ALL'
                ? "No todos match your current filters. Try adjusting your search or filters to find what you're looking for."
                : !hasEverHadTodos
                  ? "Start organizing your academic life with todos. Track assignments, study sessions, and important deadlines all in one place."
                  : "Great job! You've completed all your todos. Ready to add more tasks to stay productive?"
              }
            </p>

            {/* Show "Create Your First Todo" only if user has never had todos and no filters are applied */}
            {!hasEverHadTodos && !searchQuery && selectedCategory === 'ALL' && selectedPriority === 'ALL' && selectedStatus === 'ALL' ? (
              <div className="space-y-4 pt-4">
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => setShowReadingForm(true)}
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 touch-target"
                  >
                    <BookOpen className="mr-2 h-5 w-5" />
                    Create Reading Todo
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingTodo(null)
                      setNewTodo({
                        title: '',
                        description: '',
                        priority: 'MEDIUM',
                        type: 'OTHER',
                        dueDate: undefined,
                        courseIds: [],
                        quizId: undefined,
                        estimatedTime: undefined,
                        tags: []
                      })
                      setSearchQuery('')
                      setShowCreateDialog(true)
                    }}
                    size="lg"
                    variant="outline"
                    className="font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 touch-target border-2"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Create Other Todo
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  ✨ Get started with your first task and boost your productivity
                </p>
              </div>
            ) : (
              /* Show regular "Add Todo" buttons for other cases */
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                <Button
                  onClick={() => setShowReadingForm(true)}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 border-[2px] border-primary transition-all duration-200"
                >
                  <BookOpen className="mr-2 h-5 w-5" />
                  Add Reading Todo
                </Button>
                <Button
                  onClick={() => {
                    setEditingTodo(null)
                    setNewTodo({
                      title: '',
                      description: '',
                      priority: 'MEDIUM',
                      type: 'OTHER',
                      dueDate: undefined,
                      courseIds: [],
                      quizId: undefined,
                      estimatedTime: undefined,
                      tags: []
                    })
                    setSearchQuery('')
                    setShowCreateDialog(true)
                  }}
                  variant="outline"
                  size="lg"
                  className="px-6 py-3 border-[2px] border-border hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add Other Todo
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredTodos.map((todo, idx) => (
            <TodoCard
              key={`list-${todo.id ?? idx}`}
              todo={todo}
              expandedDescriptions={expandedDescriptions}
              toggleDescription={toggleDescription}
              truncateDescription={truncateDescription}
              handleEditTodo={handleEditTodo}
              handleToggleTodo={handleToggleTodo}
              handleDeleteTodo={handleDeleteTodo}
              handleToggleCourse={handleToggleCourse}
              errorMessage={todoErrors[todo.id]}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t">
          <div className="text-sm text-muted-foreground text-center sm:text-left">
            Page {pagination.page} of {pagination.totalPages || 1} • {pagination.total} total tasks
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrev}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="h-9 px-3 sm:px-4 text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNext}
              onClick={() => setPage(p => p + 1)}
              className="h-9 px-3 sm:px-4 text-xs sm:text-sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// TodoCard Component Definition
function TodoCard({ todo, expandedDescriptions, toggleDescription, truncateDescription, handleEditTodo, handleToggleTodo, handleDeleteTodo, handleToggleCourse, errorMessage }: {
  todo: ApiTodo
  expandedDescriptions: Set<number>
  toggleDescription: (id: number) => void
  truncateDescription: (desc: string, lines?: number) => string
  handleEditTodo: (todo: ApiTodo) => void
  handleToggleTodo: (id: number) => void
  handleDeleteTodo: (id: number) => void
  handleToggleCourse: (todoId: number, courseId: number) => void
  errorMessage?: string
}) {
  const TypeIcon = TYPE_ICONS[todo.type] || Circle
  const isCompleted = todo.status === 'COMPLETED'
  const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !isCompleted
  const isExpanded = expandedDescriptions.has(todo.id)
  const hasLongDescription = todo.description && todo.description.length > 120

  console.log('🎯 TodoCard render - todo:', todo.id, todo.title, 'type:', todo.type, 'courses:', todo.courses)

  // Helper function to format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Helper function to get relative time
  const getRelativeTime = (dateString?: string) => {
    if (!dateString) return null
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`
    if (diffDays === 0) return 'Due today'
    if (diffDays === 1) return 'Due tomorrow'
    return `Due in ${diffDays} days`
  }

  return (
    <Card className={cn(
      "border rounded-lg p-3 mb-3 transition-all duration-200 hover:shadow-md",
      isCompleted && "opacity-75 bg-muted/30",
      isOverdue && !isCompleted && "border-destructive/30 bg-destructive/5"
    )}>
      {/* Header Row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={() => handleToggleTodo(todo.id)}
            className="mt-0.5 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-semibold text-sm leading-tight mb-1",
              isCompleted && "line-through text-muted-foreground"
            )}>
              {todo.title}
            </h3>
            {todo.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {todo.description}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-primary/10"
            onClick={() => handleEditTodo(todo)}
          >
            <Edit3 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => handleDeleteTodo(todo.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Metadata Row */}
      <div className="flex flex-wrap items-center gap-1 mb-2">
        <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5">
          <TypeIcon className="h-3 w-3 mr-1" />
          {todo.type}
        </Badge>

        <Badge variant="outline" className={cn(
          "text-xs px-1.5 py-0.5 h-5",
          PRIORITY_CHIP_COLORS[todo.priority]
        )}>
          <Flag className="h-3 w-3 mr-1" />
          {todo.priority}
        </Badge>

        <Badge variant="outline" className={cn(
          "text-xs px-1.5 py-0.5 h-5",
          STATUS_CHIP_COLORS[todo.status]
        )}>
          {todo.status === 'COMPLETED' && <CheckCircle2 className="h-3 w-3 mr-1" />}
          {todo.status === 'IN_PROGRESS' && <Clock className="h-3 w-3 mr-1" />}
          {todo.status === 'PENDING' && <Circle className="h-3 w-3 mr-1" />}
          {todo.status.replace('_', ' ')}
        </Badge>

        {todo.dueDate && (
          <Badge variant="outline" className={cn(
            "text-xs px-1.5 py-0.5 h-5",
            isOverdue && !isCompleted ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-muted/50"
          )}>
            <CalendarDays className="h-3 w-3 mr-1" />
            {getRelativeTime(todo.dueDate)}
          </Badge>
        )}

        {todo.estimatedTime && (
          <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5 bg-muted/50">
            <Clock className="h-3 w-3 mr-1" />
            {todo.estimatedTime}m
          </Badge>
        )}

        {todo.tags && todo.tags.length > 0 && (
          todo.tags.map(tag => (
            <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0.5 h-5 bg-accent/50">
              {tag}
            </Badge>
          ))
        )}
      </div>

      {/* Course Information for Reading Todos */}
      {todo.type === 'READING' && todo.courses && todo.courses.length > 0 && (
        <div className="border-t pt-2 mt-2">
          <div className="text-xs font-medium text-muted-foreground mb-1">
            Courses ({todo.courses.length}):
          </div>
          <div className="flex flex-col gap-1">
            {todo.courses.map((course, index) => (
              <div
                key={course.id || index}
                className="text-xs bg-primary/5 border border-primary/20 p-1.5 rounded flex items-center gap-1"
              >
                <Checkbox
                  checked={course.completed || false}
                  onCheckedChange={() => handleToggleCourse(todo.id, course.id)}
                  className="h-3 w-3"
                />
                <span className={cn(
                  "flex-1",
                  course.completed && "line-through text-muted-foreground"
                )}>
                  {course.name || `Course ${course.id}`}
                </span>
              </div>
            ))}
          </div>
        </div>

      )}

      {errorMessage && (
        <div className="mt-2 text-xs text-destructive">
          {errorMessage}
        </div>
      )}


      {/* Additional Information Row */}
      <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 pt-2 border-t">
        <div className="flex items-center gap-3">
          {todo.createdAt && (
            <span>Created: {formatDate(todo.createdAt)}</span>

          )}
          {todo.completedAt && (
            <span>Completed: {formatDate(todo.completedAt)}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {todo.isOverdue && !isCompleted && (
            <Badge variant="destructive" className="text-xs px-1.5 py-0.5 h-5">
              <AlertCircle className="h-3 w-3 mr-1" />
              Overdue
            </Badge>
          )}
        </div>
      </div>

    </Card>
  )
}

