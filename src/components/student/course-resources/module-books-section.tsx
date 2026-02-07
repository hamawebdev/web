'use client'

import React, { useEffect, useState, useRef } from 'react'
import { BookOpen, ChevronLeft, ChevronRight, Library } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { BookCard } from './book-card'
import { ModuleBooksService, ModuleBook } from '@/lib/api/module-books-service'
import { cn } from '@/lib/utils'

interface ModuleBooksSectionProps {
    moduleId: number
    moduleName: string
    className?: string
}

export function ModuleBooksSection({ moduleId, moduleName, className }: ModuleBooksSectionProps) {
    const [books, setBooks] = useState<ModuleBook[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                setLoading(true)
                setError(null)

                const response = await ModuleBooksService.getModuleBooksStudent(moduleId)

                if (response.success && response.data?.books) {
                    setBooks(response.data.books)
                } else {
                    setBooks([])
                }
            } catch (err) {
                console.error('Error fetching module books:', err)
                setError('Failed to load books')
                setBooks([])
            } finally {
                setLoading(false)
            }
        }

        if (moduleId) {
            fetchBooks()
        }
    }, [moduleId])

    // Check scroll position for arrow visibility
    const checkScrollPosition = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
            setCanScrollLeft(scrollLeft > 0)
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
        }
    }

    useEffect(() => {
        checkScrollPosition()
        const container = scrollContainerRef.current
        if (container) {
            container.addEventListener('scroll', checkScrollPosition)
            window.addEventListener('resize', checkScrollPosition)
            return () => {
                container.removeEventListener('scroll', checkScrollPosition)
                window.removeEventListener('resize', checkScrollPosition)
            }
        }
    }, [books])

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 240 // Slightly more than card width
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            })
        }
    }

    // Loading state
    if (loading) {
        return (
            <div className={cn("space-y-4", className)}>
                <div className="flex items-center gap-2">
                    <Library className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Module Books</h3>
                </div>
                <div className="flex gap-4 overflow-hidden">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="min-w-[180px]">
                            <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                            <Skeleton className="h-4 w-3/4 mt-2" />
                            <Skeleton className="h-8 w-full mt-2" />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className={cn("space-y-4", className)}>
                <div className="flex items-center gap-2">
                    <Library className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Module Books</h3>
                </div>
                <div className="text-sm text-destructive p-4 bg-destructive/10 rounded-lg">
                    {error}
                </div>
            </div>
        )
    }

    // Empty state
    if (books.length === 0) {
        return (
            <div className={cn("space-y-4", className)}>
                <div className="flex items-center gap-2">
                    <Library className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Module Books</h3>
                </div>
                <div className="p-6 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/20">
                    <EmptyState
                        icon={BookOpen}
                        title="No Books Available"
                        description={`No books have been added to ${moduleName} yet.`}
                    />
                </div>
            </div>
        )
    }

    // Books grid/carousel
    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Library className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Module Books</h3>
                    <span className="text-sm text-muted-foreground">({books.length})</span>
                </div>

                {/* Scroll arrows for larger lists */}
                {books.length > 4 && (
                    <div className="flex gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => scroll('left')}
                            disabled={!canScrollLeft}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => scroll('right')}
                            disabled={!canScrollRight}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Scrollable container */}
            <div
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
                style={{ scrollbarWidth: 'thin' }}
            >
                {books.map((book, index) => (
                    <BookCard key={index} book={book} />
                ))}
            </div>
        </div>
    )
}

export default ModuleBooksSection
