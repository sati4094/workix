'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DesktopLayout } from '@/components/desktop-layout';
import { DataTable } from '@/components/DataTable';
import { useEnterprises } from '@/hooks/useApi';
import type { Enterprise } from '@/types';

export default function EnterprisesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: enterprises = [], isLoading } = useEnterprises();

  const filteredEnterprises = useMemo(() => {
    if (!searchTerm) return enterprises;
    const term = searchTerm.toLowerCase();
    return enterprises.filter((e: any) => 
      e.name?.toLowerCase().includes(term) || 
      e.industry?.toLowerCase().includes(term) ||
      e.email?.toLowerCase().includes(term)
    );
  }, [enterprises, searchTerm]);

  return (
    <DesktopLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Enterprises</h1>
            <p className="text-gray-600 mt-2">Manage enterprise organizations</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Enterprises</div>
            <div className="text-2xl font-bold text-gray-900">{enterprises.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Sites</div>
            <div className="text-2xl font-bold text-gray-900">
              {enterprises.reduce((sum: number, e: any) => sum + (e.total_sites || 0), 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Buildings</div>
            <div className="text-2xl font-bold text-gray-900">
              {enterprises.reduce((sum: number, e: any) => sum + (e.total_buildings || 0), 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Assets</div>
            <div className="text-2xl font-bold text-gray-900">
              {enterprises.reduce((sum: number, e: any) => sum + (e.total_assets || 0), 0)}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4">
          <input
            type="text"
            placeholder="Search enterprises by name, industry, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <DataTable
          data={filteredEnterprises}
          loading={isLoading}
          keyExtractor={(e: any) => e.id}
          onRowClick={(e) => router.push(`/dashboard/enterprises/${e.id}`)}
          columns={[
            {
              key: 'name',
              label: 'Name',
              render: (_: any, e: any) => (
                <span className="font-medium">{e.name}</span>
              ),
            },
            {
              key: 'industry',
              label: 'Industry',
              render: (_: any, e: any) => (
                <span className="text-sm">{e.industry || '-'}</span>
              ),
            },
            {
              key: 'email',
              label: 'Email',
              render: (_: any, e: any) => (
                <span className="text-sm">{e.email || '-'}</span>
              ),
            },
            {
              key: 'phone',
              label: 'Phone',
              render: (_: any, e: any) => (
                <span className="text-sm">{e.phone || '-'}</span>
              ),
            },
            {
              key: 'total_sites',
              label: 'Sites',
              render: (_: any, e: any) => (
                <span className="text-sm font-medium text-purple-600">{e.total_sites || 0}</span>
              ),
            },
            {
              key: 'total_buildings',
              label: 'Buildings',
              render: (_: any, e: any) => (
                <span className="text-sm font-medium text-blue-600">{e.total_buildings || 0}</span>
              ),
            },
            {
              key: 'total_assets',
              label: 'Assets',
              render: (_: any, e: any) => (
                <span className="text-sm font-medium text-green-600">{e.total_assets || 0}</span>
              ),
            },
          ]}
        />
      </div>
    </DesktopLayout>
  );
}
