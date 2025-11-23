'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DesktopLayout } from '@/components/desktop-layout';
import { DataTable } from '@/components/DataTable';
import { useFloors } from '@/hooks/useApi';

export default function FloorsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: floors = [], isLoading } = useFloors();

  const filteredFloors = useMemo(() => {
    if (!searchTerm) return floors;
    const term = searchTerm.toLowerCase();
    return floors.filter((f: any) =>
      f.name?.toLowerCase().includes(term) ||
      f.floor_number?.toString().includes(term) ||
      f.building_name?.toLowerCase().includes(term)
    );
  }, [floors, searchTerm]);

  return (
    <DesktopLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Floors</h1>
            <p className="text-gray-600 mt-2">Manage building floors across all facilities</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Floors</div>
            <div className="text-2xl font-bold text-gray-900">{floors.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Spaces</div>
            <div className="text-2xl font-bold text-gray-900">
              {floors.reduce((sum: number, f: any) => sum + (f.total_spaces || 0), 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Assets</div>
            <div className="text-2xl font-bold text-gray-900">
              {floors.reduce((sum: number, f: any) => sum + (f.total_assets || 0), 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Area (sq ft)</div>
            <div className="text-2xl font-bold text-gray-900">
              {floors.reduce((sum: number, f: any) => sum + (f.total_area_sqft || 0), 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4">
          <input
            type="text"
            placeholder="Search floors by name, number, or building..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <DataTable
          data={filteredFloors}
          loading={isLoading}
          keyExtractor={(f: any) => f.id}
          columns={[
            {
              key: 'floor_number',
              label: 'Floor #',
              render: (_: any, f: any) => (
                <span className="font-mono text-sm font-semibold text-blue-600">{f.floor_number || '-'}</span>
              ),
            },
            {
              key: 'name',
              label: 'Name',
              render: (_: any, f: any) => (
                <span className="font-medium">{f.name}</span>
              ),
            },
            {
              key: 'building_name',
              label: 'Building',
              render: (_: any, f: any) => (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (f.building_id) router.push(`/dashboard/buildings/${f.building_id}`);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  disabled={!f.building_id}
                >
                  {f.building_name || '-'}
                </button>
              ),
            },
            {
              key: 'site_name',
              label: 'Site',
              render: (_: any, f: any) => (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (f.site_id) router.push(`/dashboard/sites/${f.site_id}`);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  disabled={!f.site_id}
                >
                  {f.site_name || '-'}
                </button>
              ),
            },
            {
              key: 'total_area_sqft',
              label: 'Area (sq ft)',
              render: (_: any, f: any) => (
                <span className="text-sm">{f.total_area_sqft ? f.total_area_sqft.toLocaleString() : '-'}</span>
              ),
            },
            {
              key: 'total_spaces',
              label: 'Spaces',
              render: (_: any, f: any) => (
                <span className="text-sm font-medium text-purple-600">{f.total_spaces || 0}</span>
              ),
            },
            {
              key: 'total_assets',
              label: 'Assets',
              render: (_: any, f: any) => (
                <span className="text-sm font-medium text-green-600">{f.total_assets || 0}</span>
              ),
            },
          ]}
        />
      </div>
    </DesktopLayout>
  );
}
