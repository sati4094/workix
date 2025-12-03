export default function AssetsLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 w-32 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-48 bg-gray-200 rounded"></div>
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded"></div>
      </div>

      {/* Search/Filter skeleton */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4">
          <div className="flex-1 h-10 bg-gray-200 rounded"></div>
          <div className="w-32 h-10 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow">
            <div className="h-6 w-32 bg-gray-200 rounded mb-3"></div>
            <div className="h-4 w-full bg-gray-100 rounded mb-2"></div>
            <div className="h-4 w-3/4 bg-gray-100 rounded mb-4"></div>
            <div className="flex justify-between">
              <div className="h-6 w-16 bg-gray-200 rounded"></div>
              <div className="h-6 w-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
