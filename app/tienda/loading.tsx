export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* BREADCRUMBS SKELETON */}
      <div className="bg-slate-50 border-b border-slate-100 py-4">
        <div className="max-w-7xl mx-auto px-4 w-full">
          <div className="w-1/3 h-5 bg-slate-200 rounded animate-pulse"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 w-full py-12 flex flex-col md:flex-row gap-8">
        
        {/* SIDEBAR SKELETON */}
        <aside className="w-full md:w-1/4 shrink-0 flex flex-col gap-8">
          <div>
            <div className="w-32 h-6 bg-slate-200 rounded animate-pulse mb-6"></div>
            <div className="flex flex-col gap-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-slate-200 rounded animate-pulse"></div>
                  <div className="w-24 h-4 bg-slate-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-slate-100 pt-8">
            <div className="w-32 h-6 bg-slate-200 rounded animate-pulse mb-6"></div>
            <div className="w-full h-2 bg-slate-200 rounded animate-pulse mb-4"></div>
            <div className="flex justify-between">
              <div className="w-16 h-4 bg-slate-200 rounded animate-pulse"></div>
              <div className="w-16 h-8 bg-slate-200 rounded animate-pulse"></div>
            </div>
          </div>
        </aside>

        {/* GRID SKELETON */}
        <div className="flex-1 flex flex-col">
          <div className="mb-8">
            <div className="w-64 h-10 bg-slate-200 rounded animate-pulse mb-4"></div>
            <div className="w-full h-14 bg-slate-50 rounded-xl animate-pulse"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 h-[400px] flex flex-col animate-pulse">
                <div className="w-full h-48 bg-slate-100 rounded-2xl mb-4"></div>
                <div className="w-24 h-4 bg-slate-100 rounded mb-2"></div>
                <div className="w-full h-6 bg-slate-100 rounded mb-4"></div>
                <div className="flex items-center gap-2 mb-auto">
                  <div className="w-20 h-4 bg-slate-100 rounded"></div>
                  <div className="w-10 h-4 bg-slate-100 rounded"></div>
                </div>
                <div className="w-full h-12 bg-slate-100 rounded-xl mt-4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
