export default function SettingsLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div>
        <div className="h-8 w-32 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-56 bg-gray-200 rounded"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile card skeleton */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <div className="h-6 w-20 bg-gray-200 rounded"></div>
          <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto"></div>
          <div className="text-center space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded mx-auto"></div>
            <div className="h-5 w-32 bg-gray-200 rounded mx-auto"></div>
          </div>
          <div className="h-10 w-full bg-gray-200 rounded"></div>
        </div>

        {/* Settings cards skeleton */}
        <div className="md:col-span-2 space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow">
              <div className="h-6 w-40 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-4">
                <div className="h-10 w-full bg-gray-100 rounded"></div>
                <div className="h-10 w-full bg-gray-100 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
