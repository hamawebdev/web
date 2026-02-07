'use client'

import React, { useState, useRef } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    Loader2,
    Upload,
    X,
    Image as ImageIcon,
    Link as LinkIcon,
    BookOpen,
    AlertCircle
} from 'lucide-react'
import { ModuleBooksService } from '@/lib/api/module-books-service'
import { toast } from 'sonner'

interface AddBookModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    moduleId: number
    moduleName: string
    onBookAdded: () => void
}

interface BookFormData {
    name: string
    coverFile: File | null
    coverPreview: string | null
    viewUrl: string
}

export function AddBookModal({
    open,
    onOpenChange,
    moduleId,
    moduleName,
    onBookAdded
}: AddBookModalProps) {
    const [formData, setFormData] = useState<BookFormData>({
        name: '',
        coverFile: null,
        coverPreview: null,
        viewUrl: ''
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const resetForm = () => {
        setFormData({
            name: '',
            coverFile: null,
            coverPreview: null,
            viewUrl: ''
        })
        setErrors({})
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleClose = () => {
        resetForm()
        onOpenChange(false)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setErrors(prev => ({ ...prev, cover: 'Please select an image file' }))
            return
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, cover: 'Image must be less than 5MB' }))
            return
        }

        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setFormData(prev => ({
                ...prev,
                coverFile: file,
                coverPreview: reader.result as string
            }))
            setErrors(prev => ({ ...prev, cover: '' }))
        }
        reader.readAsDataURL(file)
    }

    const removeCover = () => {
        setFormData(prev => ({
            ...prev,
            coverFile: null,
            coverPreview: null
        }))
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (!formData.name.trim()) {
            newErrors.name = 'Book name is required'
        } else if (formData.name.trim().length < 3) {
            newErrors.name = 'Book name must be at least 3 characters'
        }

        if (!formData.viewUrl.trim()) {
            newErrors.viewUrl = 'Drive link is required'
        } else {
            try {
                new URL(formData.viewUrl)
            } catch {
                newErrors.viewUrl = 'Please enter a valid URL'
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return

        try {
            setLoading(true)

            let coverPath: string | undefined

            // Upload cover image if provided
            if (formData.coverFile) {
                try {
                    const uploadResponse = await ModuleBooksService.uploadCoverImage(formData.coverFile)
                    if (uploadResponse.success && uploadResponse.data?.path) {
                        coverPath = uploadResponse.data.path
                    }
                } catch (uploadError) {
                    console.warn('Cover upload failed, continuing without cover:', uploadError)
                }
            }

            // Create the book
            const response = await ModuleBooksService.createModuleBooks(moduleId, [{
                name: formData.name.trim(),
                coverPath,
                viewUrl: formData.viewUrl.trim()
            }])

            if (response.success) {
                toast.success('Book added successfully')
                onBookAdded()
                handleClose()
            } else {
                toast.error(response.error || 'Failed to add book')
            }
        } catch (error) {
            console.error('Error adding book:', error)
            toast.error('Failed to add book')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Add Book to {moduleName}
                    </DialogTitle>
                    <DialogDescription>
                        Add a new book resource with cover image and drive link.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Book Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Book Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => {
                                setFormData(prev => ({ ...prev, name: e.target.value }))
                                if (errors.name) setErrors(prev => ({ ...prev, name: '' }))
                            }}
                            placeholder="Enter book name"
                            className={errors.name ? 'border-destructive' : ''}
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Cover Image */}
                    <div className="space-y-2">
                        <Label>Cover Image (Optional)</Label>
                        {formData.coverPreview ? (
                            <div className="relative w-32 h-40 rounded-lg overflow-hidden border">
                                <img
                                    src={formData.coverPreview}
                                    alt="Cover preview"
                                    className="w-full h-full object-cover"
                                />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6"
                                    onClick={removeCover}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ) : (
                            <div
                                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    Click to upload cover image
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    PNG, JPG up to 5MB
                                </p>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        {errors.cover && (
                            <p className="text-sm text-destructive flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {errors.cover}
                            </p>
                        )}
                    </div>

                    {/* Drive Link */}
                    <div className="space-y-2">
                        <Label htmlFor="viewUrl">
                            <span className="flex items-center gap-2">
                                <LinkIcon className="h-4 w-4" />
                                Drive Link (URL) *
                            </span>
                        </Label>
                        <Input
                            id="viewUrl"
                            value={formData.viewUrl}
                            onChange={(e) => {
                                setFormData(prev => ({ ...prev, viewUrl: e.target.value }))
                                if (errors.viewUrl) setErrors(prev => ({ ...prev, viewUrl: '' }))
                            }}
                            placeholder="https://drive.google.com/..."
                            className={errors.viewUrl ? 'border-destructive' : ''}
                        />
                        {errors.viewUrl && (
                            <p className="text-sm text-destructive flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {errors.viewUrl}
                            </p>
                        )}
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Book
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default AddBookModal
