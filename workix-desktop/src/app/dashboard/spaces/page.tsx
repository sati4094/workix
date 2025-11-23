'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DesktopLayout } from '@/components/desktop-layout';
import { DataTable } from '@/components/DataTable';
import { useSpaces } from '@/hooks/useApi';

export default function SpacesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const { data: spaces = [], isLoading } = useSpaces();

  const filteredSpaces = useMemo(() => {
    if (!searchTerm) return spaces;
    const term = searchTerm.toLowerCase();
    return spaces.filter((s: any) =>
      s.space_name?.toLowerCase().includes(term) ||
      s.space_number?.toLowerCase().includes(term) ||
      s.space_type?.toLowerCase().includes(term) ||
      s.floor_name?.toLowerCase().includes(term)
    );
  }, [spaces, searchTerm]);

  return (
    <DesktopLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Spaces</h1>
            <p className="text-gray-600 mt-2">Manage building spaces and rooms</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Spaces</div>
            <div className="text-2xl font-bold text-gray-900">{spaces.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Assets</div>
            <div className="text-2xl font-bold text-blue-600">
              {spaces.reduce((sum: number, s: any) => sum + (s.total_assets || 0), 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Area</div>
            <div className="text-2xl font-bold text-gray-900">
              {spaces.reduce((sum: number, s: any) => sum + (s.area_sqft || 0), 0).toFixed(0)} sqft
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Occupied Spaces</div>
            <div className="text-2xl font-bold text-green-600">
              {spaces.filter((s: any) => s.occupancy_status === 'occupied').length}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4">
          <input
            type="text"
            placeholder="Search spaces..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <DataTable
          data={filteredSpaces}
          loading={isLoading}
          keyExtractor={(s: any) => s.id}
          columns={[
            {
              key: 'space_number',
              label: 'Space #',
              render: (_: any, s: any) => (
                <span className="font-mono text-sm font-semibold text-blue-600">{s.space_number}</span>
              ),
            },
            {
              key: 'space_name',
              label: 'Name',
              render: (_: any, s: any) => (
                <span className="font-medium">{s.space_name}</span>
              ),
            },
            {
              key: 'space_type',
              label: 'Type',
              render: (_: any, s: any) => (
                <span className="text-sm capitalize">{s.space_type || '-'}</span>
              ),
            },
            {
              key: 'floor_name',
              label: 'Floor',
              render: (_: any, s: any) => (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (s.floor_id) router.push(`/dashboard/floors/${s.floor_id}`);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  disabled={!s.floor_id}
                >
                  {s.floor_name || '-'}
                </button>
              ),
            },
            {
              key: 'building_name',
              label: 'Building',
              render: (_: any, s: any) => (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (s.building_id) router.push(`/dashboard/buildings/${s.building_id}`);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  disabled={!s.building_id}
                >
                  {s.building_name || '-'}
                </button>
              ),
            },
            {
              key: 'site_name',
              label: 'Site',
              render: (_: any, s: any) => (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (s.site_id) router.push(`/dashboard/sites/${s.site_id}`);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  disabled={!s.site_id}
                >
                  {s.site_name || '-'}
                </button>
              ),
            },
            {
              key: 'area_sqft',
              label: 'Area (sqft)',
              render: (_: any, s: any) => (
                <span className="text-sm">{s.area_sqft ? s.area_sqft.toFixed(0) : '-'}</span>
              ),
            },
            {
              key: 'total_assets',
              label: 'Assets',
              render: (_: any, s: any) => (
                <span className="text-sm font-medium text-blue-600">{s.total_assets || 0}</span>
              ),
            },
            {
              key: 'occupancy_status',
              label: 'Status',
              render: (_: any, s: any) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                  s.occupancy_status === 'occupied' ? 'bg-green-100 text-green-800' :
                  s.occupancy_status === 'vacant' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {s.occupancy_status || 'unknown'}
                </span>
              ),
            },
          ]}
        />
      </div>
    </DesktopLayout>
  );
}
