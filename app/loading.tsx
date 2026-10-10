export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* HERO SKELETON */}
      <div className="w-full h-[600px] bg-slate-100 animate-pulse rounded-b-3xl"></div>

      {/* CATEGORIES SKELETON */}
      <div className="max-w-7xl mx-auto px-4 w-full py-16">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="w-48 h-10 bg-slate-100 rounded animate-pulse mb-2"></div>
            <div className="w-64 h-4 bg-slate-100 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="w-32 h-32 rounded-3xl bg-slate-100 shrink-0 animate-pulse"></div>
          ))}
        </div>
      </div>

      {/* PROMO GRID SKELETON */}
      <div className="max-w-7xl mx-auto px-4 w-full py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2 bg-slate-100 rounded-3xl h-[600px] animate-pulse"></div>
          <div className="bg-slate-100 rounded-3xl h-[290px] animate-pulse"></div>
          <div className="bg-slate-100 rounded-3xl h-[290px] animate-pulse"></div>
          <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-slate-100 rounded-3xl h-[290px] animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
