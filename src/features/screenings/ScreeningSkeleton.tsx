import React from 'react';

export const ScreeningSkeletonGrid: React.FC<{ viewMode?: string }> = ({ viewMode = 'list_view' }) => {
  if (viewMode === 'list' || viewMode === 'list_view') {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-black/10 animate-pulse"
          >
            {/* Poster Thumbnail */}
            <div className="w-16 sm:w-20 h-20 sm:h-24 rounded-xl bg-white/5 shrink-0 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
            </div>

            {/* Middle Info */}
            <div className="flex-1 min-w-0 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="h-4 w-20 bg-[#ff3650]/20 rounded-md" />
                <div className="h-4 w-16 bg-white/10 rounded-md" />
              </div>
              <div className="h-5 w-3/4 sm:w-1/2 bg-white/10 rounded-md" />
              <div className="flex items-center gap-3">
                <div className="h-3.5 w-28 bg-white/5 rounded" />
                <div className="h-3.5 w-24 bg-white/5 rounded hidden sm:block" />
              </div>
            </div>

            {/* Right Action */}
            <div className="shrink-0 flex flex-col items-end gap-2">
              <div className="h-8 w-20 rounded-full bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (viewMode === 'pack' || viewMode === 'pack_view') {
    return (
      <div className="space-y-8">
        {[1, 2].map((group) => (
          <div key={group} className="space-y-4">
            {/* Month Header Pill Skeleton */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-32 rounded-full bg-white/10 animate-pulse" />
              <div className="h-4 w-20 rounded-md bg-white/5 animate-pulse" />
            </div>

            {/* Pack Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((card) => (
                <div
                  key={card}
                  className="rounded-2xl bg-white border border-black/10 p-5 space-y-4 animate-pulse"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-16 bg-[#ff3650]/20 rounded" />
                      <div className="h-5 w-4/5 bg-white/10 rounded-md" />
                    </div>
                    <div className="w-12 h-16 rounded-lg bg-white/5 shrink-0" />
                  </div>
                  <div className="space-y-2 pt-2 border-t border-black/5">
                    <div className="h-3.5 w-2/3 bg-white/5 rounded" />
                    <div className="h-3.5 w-1/2 bg-white/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default 'card' view mode
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div
          key={i}
          className="rounded-3xl bg-white border border-black/10 overflow-hidden animate-pulse flex flex-col"
        >
          {/* Poster Area Skeleton */}
          <div className="aspect-[16/10] sm:aspect-[16/11] bg-white/5 relative overflow-hidden">
            <div className="absolute top-3 left-3 h-5 w-20 rounded-md bg-[#ff3650]/20" />
            <div className="absolute top-3 right-3 h-5 w-14 rounded-md bg-black/40" />
          </div>

          {/* Body Meta Skeleton */}
          <div className="p-4 sm:p-5 space-y-3.5 flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="h-5 w-4/5 bg-white/10 rounded-md" />
              <div className="h-3.5 w-1/2 bg-white/5 rounded" />
            </div>

            <div className="space-y-2 pt-3 border-t border-black/5">
              <div className="flex items-center justify-between">
                <div className="h-3.5 w-28 bg-white/5 rounded" />
                <div className="h-3.5 w-16 bg-white/5 rounded" />
              </div>
              <div className="h-8 w-full rounded-xl bg-white/10 mt-2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
