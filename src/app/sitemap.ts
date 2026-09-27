import { MetadataRoute } from 'next'
import { APP_URL } from '@/lib/config'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = APP_URL
    const lastModified = new Date()

    return [
        {
            url: baseUrl,
            lastModified,
            changeFrequency: 'daily',
            priority: 1,
        },
        // Auth pages live in the (auth) route group, so they are served at /login and /register.
        {
            url: `${baseUrl}/login`,
            lastModified,
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/register`,
            lastModified,
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        // Legal pages from the (legal) route group.
        {
            url: `${baseUrl}/privacy`,
            lastModified,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
    ]
}
