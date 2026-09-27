'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { resolveImagePath } from '@/lib/image-loader';
import { UnitModuleItem } from './unit-module-compact-card';
import { Building2, BookOpen, GraduationCap } from 'lucide-react';

interface UnitModuleImageCardProps {
    item: UnitModuleItem;
    onClick: (item: UnitModuleItem) => void;
    variant?: 'practice' | 'exam';
    className?: string;
    showSessionCount?: boolean;
    isSelected?: boolean;
}

export function UnitModuleImageCard({
    item,
    onClick,
    variant = 'practice',
    className,
    isSelected = false
}: UnitModuleImageCardProps) {

    // Default gradients if no image is present
    const getGradient = (id: number) => {
        const gradients = [
            'from-blue-600 to-indigo-900',
            'from-purple-600 to-blue-900',
            'from-emerald-600 to-teal-900',
            'from-rose-600 to-pink-900',
            'from-amber-600 to-orange-900',
            'from-cyan-600 to-blue-900',
        ];
        return gradients[id % gradients.length];
    };

    const gradient = getGradient(item.id);

    // Fallback icon logic if needed
    const Icon = item.type === 'unite' ? Building2 : (item.isIndependent ? GraduationCap : BookOpen);

    return (
        <Card
            className={cn(
                "group relative overflow-hidden rounded-3xl border-0 cursor-pointer h-64",
                isSelected && "ring-2 ring-primary ring-offset-2",
                className
            )}
            onClick={() => onClick(item)}
        >
            {/* Background Image or Gradient */}
            {/* Background Image or Gradient */}
            {item.logoUrl ? (
                <div className="absolute inset-0">
                    <img
                        src={resolveImagePath(item.logoUrl)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                    />
                </div>
            ) : (
                <div className={cn(
                    "absolute inset-0 bg-gradient-to-br",
                    gradient
                )}>
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat" />
                </div>
            )}

            {/* Dark Gradient Overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

            <CardContent className="relative h-full flex flex-col justify-end p-6 z-10">
                <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-white leading-tight line-clamp-2">
                        {item.name}
                    </h3>
                    <p className="text-sm text-gray-200 line-clamp-1 font-medium">
                        {item.description || (item.type === 'unite' ? 'Unit' : 'Module')}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
