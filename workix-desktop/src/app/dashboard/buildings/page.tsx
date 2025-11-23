'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DesktopLayout } from '@/components/desktop-layout';
import { DataTable } from '@/components/DataTable';
import { useBuildings } from '@/hooks/useApi';

export default function BuildingsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: buildings = [], isLoading } = useBuildings();

  const filteredBuildings = useMemo(() => {
    if (!Array.isArray(buildings)) return [];
    if (!searchTerm) return buildings;
    const term = searchTerm.toLowerCase();
    return buildings.filter((b: any) =>
      b.name?.toLowerCase().includes(term) ||
      b.site_name?.toLowerCase().includes(term) ||
      b.building_code?.toLowerCase().includes(term) ||
      b.enterprise_name?.toLowerCase().includes(term)
    );
  }, [buildings, searchTerm]);

  return (
    <DesktopLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Buildings</h1>
            <p className="text-gray-600 mt-2">Manage buildings across all sites</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Buildings</div>
            <div className="text-2xl font-bold text-gray-900">{Array.isArray(buildings) ? buildings.length : 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Assets</div>
            <div className="text-2xl font-bold text-gray-900">
              {Array.isArray(buildings) ? buildings.reduce((sum: number, b: any) => sum + (b.total_assets || 0), 0) : 0}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Open Work Orders</div>
            <div className="text-2xl font-bold text-gray-900">
              {Array.isArray(buildings) ? buildings.reduce((sum: number, b: any) => sum + (b.open_work_orders || 0), 0) : 0}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">In Progress</div>
            <div className="text-2xl font-bold text-gray-900">
              {Array.isArray(buildings) ? buildings.reduce((sum: number, b: any) => sum + (b.in_progress_work_orders || 0), 0) : 0}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4">
          <input
            type="text"
            placeholder="Search buildings by name, code, site, or enterprise..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <DataTable
          data={filteredBuildings}
          loading={isLoading}
          keyExtractor={(b: any) => b.id}
          onRowClick={(b) => router.push(`/dashboard/buildings/${b.id}`)}
          columns={[
            {
              key: 'building_code',
              label: 'Code',
              render: (_: any, b: any) => (
                <span className="font-mono text-sm font-semibold text-blue-600">{b.building_code || '-'}</span>
              ),
            },
            {
              key: 'name',
              label: 'Name',
              render: (_: any, b: any) => (
                <span className="font-medium">{b.name}</span>
              ),
            },
            {
              key: 'site_name',
              label: 'Site',
              render: (_: any, b: any) => (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (b.site_id) router.push(`/dashboard/sites/${b.site_id}`);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  disabled={!b.site_id}
                >
                  {b.site_name || '-'}
                </button>
              ),
            },
            {
              key: 'enterprise_name',
              label: 'Enterprise',
              render: (_: any, b: any) => (
                <span className="text-sm">{b.enterprise_name || '-'}</span>
              ),
            },
            {
              key: 'floors',
              label: 'Floors',
              render: (_: any, b: any) => (
                <span className="text-sm">{b.floors || 0}</span>
              ),
            },
            {
              key: 'total_area_sqft',
              label: 'Area (sq ft)',
              render: (_: any, b: any) => (
                <span className="text-sm">{b.total_area_sqft ? b.total_area_sqft.toLocaleString() : '-'}</span>
              ),
            },
            {
              key: 'total_assets',
              label: 'Assets',
              render: (_: any, b: any) => (
                <span className="text-sm font-medium text-green-600">{b.total_assets || 0}</span>
              ),
            },
            {
              key: 'status',
              label: 'Status',
              render: (_: any, b: any) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  b.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {b.status || 'Active'}
                </span>
              ),
            },
          ]}
        />
      </div>
    </DesktopLayout>
  );
}
