'use client';

import { useState, useMemo } from 'react';
import { DesktopLayout } from '@/components/desktop-layout';
import { DataTable } from '@/components/DataTable';
import { useStorerooms } from '@/hooks/useApi';

export default function StoreroomsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: storerooms = [], isLoading } = useStorerooms();

  const filteredStorerooms = useMemo(() => {
    if (!searchTerm) return storerooms;
    const term = searchTerm.toLowerCase();
    return storerooms.filter((s: any) =>
      s.storeroom_name?.toLowerCase().includes(term) ||
      s.location?.toLowerCase().includes(term) ||
      s.site_name?.toLowerCase().includes(term)
    );
  }, [storerooms, searchTerm]);

  return (
    <DesktopLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Storerooms</h1>
            <p className="text-gray-600 mt-2">Manage inventory storage locations</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Storerooms</div>
            <div className="text-2xl font-bold text-gray-900">{storerooms.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Active Storerooms</div>
            <div className="text-2xl font-bold text-green-600">
              {storerooms.filter((s: any) => s.is_active).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Parts Stored</div>
            <div className="text-2xl font-bold text-blue-600">
              {storerooms.reduce((sum: number, s: any) => sum + (s.total_parts || 0), 0)}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4">
          <input
            type="text"
            placeholder="Search storerooms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <DataTable
          data={filteredStorerooms}
          loading={isLoading}
          keyExtractor={(s: any) => s.id}
          columns={[
            {
              key: 'storeroom_name',
              label: 'Storeroom Name',
              render: (_: any, s: any) => (
                <span className="font-medium">{s.storeroom_name}</span>
              ),
            },
            {
              key: 'site_name',
              label: 'Site',
              render: (_: any, s: any) => (
                <span className="text-sm">{s.site_name || '-'}</span>
              ),
            },
            {
              key: 'location',
              label: 'Location',
              render: (_: any, s: any) => (
                <span className="text-sm">{s.location || '-'}</span>
              ),
            },
            {
              key: 'manager_name',
              label: 'Manager',
              render: (_: any, s: any) => (
                <span className="text-sm">{s.manager_name || '-'}</span>
              ),
            },
            {
              key: 'total_parts',
              label: 'Parts',
              render: (_: any, s: any) => (
                <span className="text-sm font-medium text-blue-600">{s.total_parts || 0}</span>
              ),
            },
            {
              key: 'is_active',
              label: 'Status',
              render: (_: any, s: any) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {s.is_active ? 'Active' : 'Inactive'}
                </span>
              ),
            },
          ]}
        />
      </div>
    </DesktopLayout>
  );
}
