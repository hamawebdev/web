'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
    BookOpen,
    ExternalLink,
    Trash2,
    Edit2,
    Library,
    Plus,
    ImageOff
} from 'lucide-react'
import { ModuleBooksService, ModuleBook } from '@/lib/api/module-books-service'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { API_BASE_URL } from '@/lib/config'
import { resolveApiAssetUrl } from '@/lib/image-loader'

interface BookManagementListProps {
    moduleId: number
    moduleName: string
    onAddBook: () => void
    refreshTrigger?: number
    className?: string
}

export function BookManagementList({
    moduleId,
    moduleName,
    onAddBook,
    refreshTrigger = 0,
    className
}: BookManagementListProps) {
    const [books, setBooks] = useState<ModuleBook[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [deleteBookId, setDeleteBookId] = useState<number | null>(null)
    const [deleting, setDeleting] = useState(false)

    const fetchBooks = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await ModuleBooksService.getModuleBooksAdmin(moduleId)

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

    useEffect(() => {
        if (moduleId) {
            fetchBooks()
        }
    }, [moduleId, refreshTrigger])

    const handleDelete = async (bookId: number) => {
        // For now, just show toast since delete endpoint may not exist
        toast.info('Delete functionality will be available soon')
        setDeleteBookId(null)
        // TODO: Implement when backend delete endpoint is ready
        // try {
        //   setDeleting(true)
        //   await ModuleBooksService.deleteModuleBook(moduleId, bookId)
        //   toast.success('Book deleted successfully')
        //   fetchBooks()
        // } catch (err) {
        //   toast.error('Failed to delete book')
        // } finally {
        //   setDeleting(false)
        //   setDeleteBookId(null)
        // }
    }

    // Loading state
    if (loading) {
        return (
            <div className={cn("space-y-4", className)}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Library className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Module Books</h3>
                    </div>
                    <Skeleton className="h-9 w-24" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                    ))}
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className={cn("space-y-4", className)}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Library className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Module Books</h3>
                    </div>
                    <Button onClick={onAddBook} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Book
                    </Button>
                </div>
                <div className="text-sm text-destructive p-4 bg-destructive/10 rounded-lg">
                    {error}
                    <Button variant="link" onClick={fetchBooks} className="ml-2 p-0 h-auto">
                        Retry
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className={cn("space-y-4", className)}>
            {/* Header with Add Button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Library className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Module Books</h3>
                    <Badge variant="secondary">{books.length}</Badge>
                </div>
                <Button onClick={onAddBook} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Book
                </Button>
            </div>

            {/* Empty state */}
            {books.length === 0 ? (
                <div className="p-8 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/20">
                    <EmptyState
                        icon={BookOpen}
                        title="No Books Added"
                        description={`No books have been added to ${moduleName} yet.`}
                        action={
                            <Button onClick={onAddBook} className="mt-4">
                                <Plus className="h-4 w-4 mr-2" />
                                Add First Book
                            </Button>
                        }
                    />
                </div>
            ) : (
                /* Books grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {books.map((book, index) => (
                        <Card key={book.id || index} className="overflow-hidden group hover:shadow-md transition-shadow">
                            <div className="flex">
                                {/* Book Cover Thumbnail */}
                                <div className="w-20 h-28 flex-shrink-0 bg-muted relative overflow-hidden">
                                    {book.cover_path ? (
                                        <img
                                            src={resolveApiAssetUrl(book.cover_path, API_BASE_URL)}
                                            alt={book.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement
                                                target.style.display = 'none'
                                                target.nextElementSibling?.classList.remove('hidden')
                                            }}
                                        />
                                    ) : null}
                                    <div className={cn(
                                        "absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5",
                                        book.cover_path ? "hidden" : ""
                                    )}>
                                        <BookOpen className="h-6 w-6 text-primary/40" />
                                    </div>
                                </div>

                                {/* Book Info */}
                                <CardContent className="flex-1 p-3 flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-medium text-sm line-clamp-2">{book.name}</h4>
                                    </div>

                                    <div className="flex items-center gap-2 mt-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 gap-1"
                                            onClick={() => window.open(book.view, '_blank')}
                                        >
                                            <ExternalLink className="h-3 w-3" />
                                            Open
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => setDeleteBookId(book.id || index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteBookId !== null} onOpenChange={() => setDeleteBookId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Book</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this book? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteBookId !== null && handleDelete(deleteBookId)}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

export default BookManagementList
