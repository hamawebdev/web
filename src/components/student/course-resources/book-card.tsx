'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink, BookOpen, ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { API_BASE_URL } from '@/lib/config'
import { resolveApiAssetUrl } from '@/lib/image-loader'

interface BookCardProps {
    book: {
        name: string
        cover_path: string | null
        view: string // Drive link URL
    }
    className?: string
}

export function BookCard({ book, className }: BookCardProps) {
    const handleOpenLink = () => {
        if (book.view) {
            window.open(book.view, '_blank', 'noopener,noreferrer')
        }
    }

    return (
        <Card
            className={cn(
                "min-w-[180px] max-w-[200px] flex-shrink-0 overflow-hidden",
                "transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
                "border-border/50 hover:border-primary/30 group cursor-pointer",
                className
            )}
            onClick={handleOpenLink}
        >
            {/* Cover Image */}
            <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                {book.cover_path ? (
                    <img
                        src={resolveApiAssetUrl(book.cover_path, API_BASE_URL)}
                        alt={book.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                            // Fallback to placeholder on error
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            target.nextElementSibling?.classList.remove('hidden')
                        }}
                    />
                ) : null}
                {/* Placeholder for missing/failed images */}
                <div className={cn(
                    "absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5",
                    book.cover_path ? "hidden" : ""
                )}>
                    <BookOpen className="h-12 w-12 text-primary/40 mb-2" />
                    <span className="text-xs text-muted-foreground">No Cover</span>
                </div>
            </div>

            {/* Book Info */}
            <CardContent className="p-3">
                <h4 className="font-medium text-sm line-clamp-2 mb-2 min-h-[2.5rem]">
                    {book.name}
                </h4>
                <Button
                    variant="default"
                    size="sm"
                    className="w-full gap-2"
                    onClick={(e) => {
                        e.stopPropagation()
                        handleOpenLink()
                    }}
                >
                    <ExternalLink className="h-3 w-3" />
                    Open Book
                </Button>
            </CardContent>
        </Card>
    )
}

export default BookCard
