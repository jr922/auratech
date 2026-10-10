export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen bg-white pb-20">
      
      {/* BREADCRUMBS SKELETON */}
      <div className="bg-slate-50 border-b border-slate-100 py-4 mb-8">
        <div className="max-w-7xl mx-auto px-4 w-full">
          <div className="w-1/3 h-5 bg-slate-200 rounded animate-pulse"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 w-full flex flex-col md:flex-row gap-12">
        
        {/* IMÁGENES SKELETON */}
        <div className="w-full md:w-1/2 flex flex-col gap-4">
          <div className="w-full aspect-square bg-slate-100 rounded-3xl border border-slate-100 animate-pulse"></div>
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-24 h-24 bg-slate-100 rounded-2xl border border-slate-100 shrink-0 animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* DETALLES SKELETON */}
        <div className="w-full md:w-1/2 flex flex-col">
          <div className="w-24 h-6 bg-blue-100 rounded-full animate-pulse mb-4"></div>
          <div className="w-full h-12 bg-slate-100 rounded animate-pulse mb-4"></div>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-32 h-6 bg-slate-100 rounded animate-pulse"></div>
            <div className="w-24 h-6 bg-slate-100 rounded animate-pulse"></div>
          </div>

          <div className="w-3/4 h-24 bg-slate-100 rounded animate-pulse mb-8"></div>

          <div className="border-t border-b border-slate-100 py-6 mb-6">
            <div className="w-48 h-10 bg-slate-100 rounded animate-pulse mb-4"></div>
            <div className="w-32 h-6 bg-slate-100 rounded animate-pulse"></div>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="w-32 h-14 bg-slate-100 rounded-2xl animate-pulse"></div>
            <div className="flex-1 h-14 bg-slate-100 rounded-2xl animate-pulse"></div>
          </div>

          <div className="w-full h-32 bg-slate-50 rounded-2xl animate-pulse border border-slate-100"></div>
        </div>
      </div>
    </div>
  );
}
