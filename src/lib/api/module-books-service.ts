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
     * Upload cover image and get the path
     * Uses the existing upload endpoint
     */
    static async uploadCoverImage(file: File): Promise<ApiResponse<{ path: string }>> {
        try {
            console.log('📷 [ModuleBooksService] Uploading cover image:', file.name);

            const formData = new FormData();
            formData.append('file', file);

            const response = await apiClient.post<{ path: string }>(
                '/admin/upload/image',
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            console.log('📷 [ModuleBooksService] Upload response:', response);

            return response;
        } catch (error) {
            console.error('💥 [ModuleBooksService] Error uploading cover:', error);
            throw error;
        }
    }
}

export default ModuleBooksService;
