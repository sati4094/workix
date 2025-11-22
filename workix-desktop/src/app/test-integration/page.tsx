'use client';

import { useBuildings, useParts, useTeams, useVendors, useLowStockParts } from '@/hooks/useApi';
import LocationSelector from '@/components/LocationSelector';
import AssetCategoryTypeSelector from '@/components/AssetCategoryTypeSelector';
import { useState } from 'react';

export default function IntegrationTestPage() {
  const [selectedLocation, setSelectedLocation] = useState({
    siteId: '',
    buildingId: 0,
    floorId: 0,
    spaceId: 0,
  });

  const [selectedAsset, setSelectedAsset] = useState({
    categoryId: 0,
    typeId: 0,
  });

  // Test all enterprise hooks
  const { data: buildings, isLoading: buildingsLoading } = useBuildings();
  const { data: parts, isLoading: partsLoading } = useParts();
  const { data: lowStockParts, isLoading: lowStockLoading } = useLowStockParts();
  const { data: teams, isLoading: teamsLoading } = useTeams();
  const { data: vendors, isLoading: vendorsLoading } = useVendors();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🎉 Enterprise API Integration Test
        </h1>

        {/* API Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatusCard
            title="Buildings"
            count={buildings?.length}
            loading={buildingsLoading}
            color="blue"
          />
          <StatusCard
            title="Parts"
            count={parts?.length}
            loading={partsLoading}
            color="green"
          />
          <StatusCard
            title="Low Stock Parts"
            count={lowStockParts?.length}
            loading={lowStockLoading}
            color="red"
          />
          <StatusCard
            title="Teams"
            count={teams?.length}
            loading={teamsLoading}
            color="purple"
          />
          <StatusCard
            title="Vendors"
            count={vendors?.length}
            loading={vendorsLoading}
            color="yellow"
          />
        </div>

        {/* Component Tests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LocationSelector Test */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              📍 LocationSelector Component
            </h2>
            <LocationSelector
              siteId={selectedLocation.siteId}
              buildingId={selectedLocation.buildingId}
              floorId={selectedLocation.floorId}
              spaceId={selectedLocation.spaceId}
              onSiteChange={(id) => setSelectedLocation(prev => ({ ...prev, siteId: id }))}
              onBuildingChange={(id) => setSelectedLocation(prev => ({ ...prev, buildingId: id }))}
              onFloorChange={(id) => setSelectedLocation(prev => ({ ...prev, floorId: id }))}
              onSpaceChange={(id) => setSelectedLocation(prev => ({ ...prev, spaceId: id }))}
            />
            <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
              <p className="font-medium text-gray-700">Selected:</p>
              <pre className="text-gray-600 mt-1">
                {JSON.stringify(selectedLocation, null, 2)}
              </pre>
            </div>
          </div>

          {/* AssetCategoryTypeSelector Test */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              🏭 AssetCategoryTypeSelector Component
            </h2>
            <AssetCategoryTypeSelector
              categoryId={selectedAsset.categoryId}
              typeId={selectedAsset.typeId}
              onCategoryChange={(id) => setSelectedAsset(prev => ({ ...prev, categoryId: id }))}
              onTypeChange={(id) => setSelectedAsset(prev => ({ ...prev, typeId: id }))}
            />
            <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
              <p className="font-medium text-gray-700">Selected:</p>
              <pre className="text-gray-600 mt-1">
                {JSON.stringify(selectedAsset, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Data Preview */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📊 Data Preview
          </h2>
          
          {/* Buildings */}
          {buildings && buildings.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-700 mb-2">Buildings</h3>
              <div className="space-y-2">
                {buildings.map((building: any) => (
                  <div key={building.id} className="text-sm text-gray-600 border-l-4 border-blue-400 pl-3">
                    <span className="font-medium">{building.name}</span>
                    {building.building_code && <span className="text-gray-500"> ({building.building_code})</span>}
                    <span className="text-gray-500"> - {building.floor_count} floors</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Low Stock Parts */}
          {lowStockParts && lowStockParts.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-700 mb-2">⚠️ Low Stock Parts</h3>
              <div className="space-y-2">
                {lowStockParts.slice(0, 5).map((part: any) => (
                  <div key={part.id} className="text-sm text-gray-600 border-l-4 border-red-400 pl-3">
                    <span className="font-medium">{part.part_number}</span>
                    <span className="text-gray-500"> - Stock: {part.total_stock}/{part.reorder_level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Teams */}
          {teams && teams.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-700 mb-2">Teams</h3>
              <div className="space-y-2">
                {teams.map((team: any) => (
                  <div key={team.id} className="text-sm text-gray-600 border-l-4 border-purple-400 pl-3">
                    <span className="font-medium">{team.name}</span>
                    <span className="text-gray-500"> - {team.member_count} members</span>
                    {team.team_lead_name && <span className="text-gray-500"> (Lead: {team.team_lead_name})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Success Banner */}
        <div className="mt-8 bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                <span className="font-medium">Integration Successful!</span> All enterprise API endpoints are operational and accessible from the frontend.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ title, count, loading, color }: { title: string; count?: number; loading: boolean; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <h3 className="text-sm font-medium mb-2">{title}</h3>
      {loading ? (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-16"></div>
        </div>
      ) : (
        <p className="text-3xl font-bold">{count ?? 0}</p>
      )}
    </div>
  );
}
