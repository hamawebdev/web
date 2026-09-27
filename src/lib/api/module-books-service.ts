/**
 * Module Books API Service
 * 
 * Service layer for module books management API endpoints.
 * Used by both Admin (full CRUD) and Student (read-only) interfaces.
 */

import { apiClient, ApiResponse } from '../api-client';

// Type definitions
export interface ModuleBook {
    id?: number;
    name: string;
    cover_path: string | null;
    view: string; // Drive link URL
}

export interface ModuleBooksResponse {
    books: ModuleBook[];
}

export interface CreateModuleBooksRequest {
    books: Array<{
        name: string;
        coverPath?: string;
        viewUrl: string;
    }>;
}

export interface CreateModuleBooksResponse {
    books: ModuleBook[];
    totalCreated: number;
    message: string;
}

/**
 * Module Books API Service
 */
export class ModuleBooksService {
    /**
     * Get all books for a module (Admin)
     * GET /api/v1/admin/modules/:id/books
     */
    static async getModuleBooksAdmin(moduleId: number): Promise<ApiResponse<ModuleBooksResponse>> {
        try {
            console.log('📚 [ModuleBooksService] Fetching books for module:', moduleId);

            const response = await apiClient.get<ModuleBooksResponse>(
                `/admin/modules/${moduleId}/books`
            );

            console.log('📚 [ModuleBooksService] Books response:', {
                success: response.success,
                booksCount: response.data?.books?.length || 0
            });

            return response;
        } catch (error) {
            console.error('💥 [ModuleBooksService] Error fetching books:', error);
            throw error;
        }
    }

    /**
     * Get all books for a module (Student - read-only)
     * GET /api/v1/students/modules/:id/books
     * Note: Falls back to admin endpoint if student endpoint not available
     */
    static async getModuleBooksStudent(moduleId: number): Promise<ApiResponse<ModuleBooksResponse>> {
        try {
            console.log('📚 [ModuleBooksService] Fetching books for student, module:', moduleId);

            // Try student endpoint first, fall back to admin if not available
            try {
                const response = await apiClient.get<ModuleBooksResponse>(
                    `/students/modules/${moduleId}/books`
                );
                return response;
            } catch (studentError: any) {
                // If student endpoint doesn't exist (404), try admin endpoint
                if (studentError?.response?.status === 404) {
                    console.log('📚 [ModuleBooksService] Student endpoint not found, trying admin endpoint');
                    return await this.getModuleBooksAdmin(moduleId);
                }
                throw studentError;
            }
        } catch (error) {
            console.error('💥 [ModuleBooksService] Error fetching books for student:', error);
            throw error;
        }
    }

    /**
     * Create books for a module (Admin only)
     * POST /api/v1/admin/modules/:id/books
     */
    static async createModuleBooks(
        moduleId: number,
        books: CreateModuleBooksRequest['books']
    ): Promise<ApiResponse<CreateModuleBooksResponse>> {
        try {
            console.log('📚 [ModuleBooksService] Creating books for module:', moduleId, books);

            const response = await apiClient.post<CreateModuleBooksResponse>(
                `/admin/modules/${moduleId}/books`,
                { books }
            );

            console.log('📚 [ModuleBooksService] Create response:', {
                success: response.success,
                totalCreated: response.data?.totalCreated
            });

            return response;
        } catch (error) {
            console.error('💥 [ModuleBooksService] Error creating books:', error);
            throw error;
        }
    }

    /**
     * Upload a cover image and return its media URL as `data.path`.
     *
     * Backend contract (POST /admin/upload/image): multipart field `images` (up to 10 files),
     * response body `{ uploadedFiles: [{ filename, path, size, url }] }` with no success/data
     * envelope. `url` is the public media route (/api/v1/media/images/<file>); `path` is the
     * server filesystem path and must not be stored.
     */
    static async uploadCoverImage(file: File): Promise<ApiResponse<{ path: string }>> {
        try {
            console.log('📷 [ModuleBooksService] Uploading cover image:', file.name);

            const formData = new FormData();
            formData.append('images', file);

            // Content-Type is left to the browser so the multipart boundary is set.
            const raw: any = await apiClient.post<any>('/admin/upload/image', formData);

            const uploadedFiles: any[] =
                raw?.uploadedFiles ?? raw?.data?.uploadedFiles ?? [];
            const url: string | undefined = uploadedFiles[0]?.url;

            if (!url) {
                console.warn('📷 [ModuleBooksService] Upload response has no uploadedFiles[0].url');
                return { success: false, data: { path: '' }, error: 'Cover upload returned no file URL' };
            }

            console.log('📷 [ModuleBooksService] Cover uploaded:', { url });
            return { success: true, data: { path: url } };
        } catch (error) {
            console.error('💥 [ModuleBooksService] Error uploading cover:', error);
            throw error;
        }
    }
}

export default ModuleBooksService;
