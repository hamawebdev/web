
import React from 'react';

interface AILoaderProps {
    title?: string;
    subtitle?: string;
    size?: 'sm' | 'md' | 'lg';
}

export default function AILoader({ title, subtitle, size = 'md' }: AILoaderProps) {
    return (
        <div className="flex flex-col items-center justify-center p-4 text-center">
            <div className="animate-pulse bg-muted rounded-full w-12 h-12 mb-4"></div>
            {title && <h3 className="text-lg font-medium">{title}</h3>}
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
    );
}
