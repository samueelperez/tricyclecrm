'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export function Skeleton({
  className,
  width = "w-full",
  height = "h-4",
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200",
        width,
        height,
        className
      )}
    />
  );
}

// Componente preconfigurado para mostrar filas de skeleton
export function SkeletonList({ rows = 3, className = '' }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} />
      ))}
    </div>
  );
}

// Componente para tarjetas skeleton
export function SkeletonCard({ className = '' }) {
  return (
    <div className={cn('space-y-3 p-4 bg-white rounded-lg shadow', className)}>
      <Skeleton width="w-1/4" />
      <Skeleton />
      <Skeleton width="w-3/4" />
      <Skeleton width="w-1/2" />
    </div>
  );
} 