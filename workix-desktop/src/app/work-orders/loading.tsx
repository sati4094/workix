export default function WorkOrdersLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 w-40 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-56 bg-gray-200 rounded"></div>
        </div>
        <div className="h-10 w-36 bg-gray-200 rounded"></div>
      </div>

      {/* Search/Filter skeleton */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4">
          <div className="flex-1 h-10 bg-gray-200 rounded"></div>
          <div className="w-32 h-10 bg-gray-200 rounded"></div>
          <div className="w-32 h-10 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="h-12 bg-gray-100 border-b"></div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-16 border-b border-gray-100 flex items-center px-6 gap-4">
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
            <div className="h-4 w-48 bg-gray-200 rounded"></div>
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
            <div className="flex-1"></div>
            <div className="h-8 w-20 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
