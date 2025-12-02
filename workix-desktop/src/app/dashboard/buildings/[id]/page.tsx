'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DesktopLayout } from '@/components/desktop-layout';
import { DataTable } from '@/components/DataTable';
import { useBuilding, useFloors, useAssets, useWorkOrders } from '@/hooks/useApi';
import { ArrowLeft, Building, Layers, Box, ClipboardList, MapPin, Calendar, Users } from 'lucide-react';

export default function BuildingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const buildingId = params.id as string;

  const { data: building, isLoading: buildingLoading } = useBuilding(buildingId);
  const { data: floors = [], isLoading: floorsLoading } = useFloors({ building_id: parseInt(buildingId) });
  const { data: assets = [], isLoading: assetsLoading } = useAssets({ building_id: parseInt(buildingId) });
  const { data: workOrders = [], isLoading: workOrdersLoading } = useWorkOrders({ building_id: parseInt(buildingId) });

  const [activeTab, setActiveTab] = useState<'overview' | 'floors' | 'assets' | 'work-orders'>('overview');

  if (buildingLoading) {
    return (
      <DesktopLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DesktopLayout>
    );
  }

  if (!building) {
    return (
      <DesktopLayout>
        <div className="p-6">
          <div className="text-center py-12">
            <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Building Not Found</h2>
            <p className="text-gray-600 mb-4">The building you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => router.push('/dashboard/buildings')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Back to Buildings
            </button>
          </div>
        </div>
      </DesktopLayout>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building },
    { id: 'floors', label: `Floors (${floors.length})`, icon: Layers },
    { id: 'assets', label: `Assets (${assets.length})`, icon: Box },
    { id: 'work-orders', label: `Work Orders (${workOrders.length})`, icon: ClipboardList },
  ];

  return (
    <DesktopLayout>
      <div className="p-6 space-y-6">
        {/* Header with Breadcrumb */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/buildings')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Back to buildings"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <nav className="text-sm text-gray-500 mb-1" aria-label="Breadcrumb">
              <ol className="flex items-center gap-2">
                <li><button onClick={() => router.push('/dashboard')} className="hover:text-purple-600">Dashboard</button></li>
                <li>/</li>
                <li><button onClick={() => router.push('/dashboard/buildings')} className="hover:text-purple-600">Buildings</button></li>
                <li>/</li>
                <li className="text-gray-900 font-medium">{building.name}</li>
              </ol>
            </nav>
            <h1 className="text-3xl font-bold text-gray-900">{building.name}</h1>
            <p className="text-gray-600 mt-1">
              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{building.building_code || 'N/A'}</span>
              {building.site_name && <span className="ml-3">{building.site_name}</span>}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Layers className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Floors</p>
                <p className="text-2xl font-bold text-gray-900">{building.floor_count || floors.length || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Box className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Assets</p>
                <p className="text-2xl font-bold text-gray-900">{building.total_assets || assets.length || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ClipboardList className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Open Work Orders</p>
                <p className="text-2xl font-bold text-gray-900">{building.open_work_orders || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MapPin className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Area (sq ft)</p>
                <p className="text-2xl font-bold text-gray-900">{building.gross_area?.toLocaleString() || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px" role="tablist" aria-label="Building sections">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`${tab.id}-panel`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6" role="tabpanel" id={`${activeTab}-panel`}>
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Building Information</h3>
                  <dl className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-gray-600">Building Code</dt>
                      <dd className="font-medium text-gray-900">{building.building_code || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-gray-600">Site</dt>
                      <dd className="font-medium text-gray-900">{building.site_name || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-gray-600">Enterprise</dt>
                      <dd className="font-medium text-gray-900">{building.enterprise_name || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-gray-600">Occupancy Type</dt>
                      <dd className="font-medium text-gray-900">{building.occupancy_type || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-gray-600">Year Built</dt>
                      <dd className="font-medium text-gray-900">{building.year_built || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-gray-600">Status</dt>
                      <dd>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          building.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {building.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                  <p className="text-gray-600">{building.description || 'No description available.'}</p>
                </div>
              </div>
            )}

            {activeTab === 'floors' && (
              <DataTable
                data={floors}
                loading={floorsLoading}
                keyExtractor={(f: any) => f.id.toString()}
                onRowClick={(f) => router.push(`/dashboard/floors/${f.id}`)}
                emptyMessage="No floors found. Add floors to this building to get started."
                columns={[
                  { key: 'floor_number', label: 'Floor #', render: (_, f) => <span className="font-medium">Floor {f.floor_number}</span> },
                  { key: 'name', label: 'Name' },
                  { key: 'gross_area', label: 'Area (sq ft)', render: (_, f) => f.gross_area?.toLocaleString() || '-' },
                  { key: 'spaces_count', label: 'Spaces', render: (_, f) => f.spaces_count || 0 },
                  { key: 'assets_count', label: 'Assets', render: (_, f) => f.assets_count || 0 },
                ]}
              />
            )}

            {activeTab === 'assets' && (
              <DataTable
                data={assets}
                loading={assetsLoading}
                keyExtractor={(a: any) => a.id}
                onRowClick={(a) => router.push(`/assets/${a.id}`)}
                emptyMessage="No assets found in this building."
                columns={[
                  { key: 'asset_tag', label: 'Asset Tag', render: (_, a) => <span className="font-mono text-sm">{a.asset_tag}</span> },
                  { key: 'name', label: 'Name', render: (_, a) => <span className="font-medium">{a.name}</span> },
                  { key: 'type', label: 'Type', render: (_, a) => <span className="capitalize">{a.type}</span> },
                  { key: 'status', label: 'Status', render: (_, a) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      a.status === 'operational' ? 'bg-green-100 text-green-800' :
                      a.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                      a.status === 'down' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>{a.status}</span>
                  )},
                  { key: 'manufacturer', label: 'Manufacturer' },
                ]}
              />
            )}

            {activeTab === 'work-orders' && (
              <DataTable
                data={workOrders}
                loading={workOrdersLoading}
                keyExtractor={(wo: any) => wo.id}
                onRowClick={(wo) => router.push(`/work-orders/${wo.id}`)}
                emptyMessage="No work orders found for this building."
                columns={[
                  { key: 'work_order_number', label: 'WO #', render: (_, wo) => <span className="font-mono text-sm">{wo.work_order_number}</span> },
                  { key: 'title', label: 'Title', render: (_, wo) => <span className="font-medium">{wo.title}</span> },
                  { key: 'priority', label: 'Priority', render: (_, wo) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      wo.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      wo.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      wo.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>{wo.priority}</span>
                  )},
                  { key: 'status', label: 'Status', render: (_, wo) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      wo.status === 'completed' ? 'bg-green-100 text-green-800' :
                      wo.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      wo.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                    }`}>{wo.status?.replace('_', ' ')}</span>
                  )},
                  { key: 'created_at', label: 'Created', render: (_, wo) => new Date(wo.created_at).toLocaleDateString() },
                ]}
              />
            )}
          </div>
        </div>
      </div>
    </DesktopLayout>
  );
}
