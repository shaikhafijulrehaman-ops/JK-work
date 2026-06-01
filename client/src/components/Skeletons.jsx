import React from 'react';

// Reusable Pulse Bar
export const SkeletonPulse = ({ className = 'h-4 bg-slate-200 rounded' }) => (
  <div className={`animate-pulse ${className}`} />
);

// Card Skeleton for Metrics / KPI Counters
export const CardSkeleton = () => (
  <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-3">
    <div className="flex items-center justify-between">
      <SkeletonPulse className="w-1/3 h-3 bg-slate-200 rounded" />
      <SkeletonPulse className="w-8 h-8 rounded-xl bg-slate-200" />
    </div>
    <SkeletonPulse className="w-1/2 h-6 bg-slate-300 rounded" />
    <SkeletonPulse className="w-1/4 h-2.5 bg-slate-200 rounded mt-1" />
  </div>
);

// Table Skeleton
export const TableSkeleton = ({ cols = 5, rows = 4 }) => (
  <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
    <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between gap-4">
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonPulse key={i} className="w-20 h-3 bg-slate-300 rounded" />
      ))}
    </div>
    <div className="divide-y divide-slate-50">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="p-4 flex justify-between items-center gap-4">
          <div className="flex items-center space-x-3 w-1/4">
            <SkeletonPulse className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
            <div className="space-y-1.5 w-full">
              <SkeletonPulse className="w-2/3 h-3 bg-slate-200 rounded" />
              <SkeletonPulse className="w-1/2 h-2.5 bg-slate-100 rounded" />
            </div>
          </div>
          {Array.from({ length: cols - 1 }).map((_, c) => (
            <SkeletonPulse key={c} className="w-16 h-3 bg-slate-100 rounded" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

// Analytics / Charts Skeleton
export const AnalyticsSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <SkeletonPulse className="w-32 h-4 bg-slate-300 rounded" />
          <SkeletonPulse className="w-20 h-6 bg-slate-200 rounded" />
        </div>
        <div className="h-64 bg-slate-50 rounded-xl flex items-end justify-between p-4 space-x-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonPulse 
              key={i} 
              className="bg-slate-200 rounded-t w-full" 
              style={{ height: `${Math.floor(Math.random() * 80) + 15}%` }} 
            />
          ))}
        </div>
      </div>
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
        <SkeletonPulse className="w-28 h-4 bg-slate-300 rounded" />
        <div className="flex justify-center items-center py-6">
          <SkeletonPulse className="w-40 h-40 rounded-full bg-slate-200 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-white" />
          </SkeletonPulse>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <SkeletonPulse className="w-12 h-3 bg-slate-100 rounded" />
            <SkeletonPulse className="w-8 h-3 bg-slate-200 rounded" />
          </div>
          <div className="flex justify-between">
            <SkeletonPulse className="w-16 h-3 bg-slate-100 rounded" />
            <SkeletonPulse className="w-6 h-3 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  </div>
);
