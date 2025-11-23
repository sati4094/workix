'use client';

import { useState, useMemo } from 'react';
import { DesktopLayout } from '@/components/desktop-layout';
import { DataTable } from '@/components/DataTable';
import { useVendors } from '@/hooks/useApi';

export default function VendorsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: vendors = [], isLoading } = useVendors();

  const filteredVendors = useMemo(() => {
    if (!searchTerm) return vendors;
    const term = searchTerm.toLowerCase();
    return vendors.filter((v: any) =>
      v.vendor_name?.toLowerCase().includes(term) ||
      v.vendor_type?.toLowerCase().includes(term) ||
      v.contact_person?.toLowerCase().includes(term)
    );
  }, [vendors, searchTerm]);

  return (
    <DesktopLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vendors</h1>
            <p className="text-gray-600 mt-2">Manage service providers and suppliers</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Vendors</div>
            <div className="text-2xl font-bold text-gray-900">{vendors.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Active Vendors</div>
            <div className="text-2xl font-bold text-green-600">
              {vendors.filter((v: any) => v.is_active).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Service Providers</div>
            <div className="text-2xl font-bold text-blue-600">
              {vendors.filter((v: any) => v.vendor_type === 'service').length}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4">
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <DataTable
          data={filteredVendors}
          loading={isLoading}
          keyExtractor={(v: any) => v.id}
          columns={[
            {
              key: 'vendor_name',
              label: 'Vendor Name',
              render: (_: any, v: any) => (
                <span className="font-medium">{v.vendor_name}</span>
              ),
            },
            {
              key: 'vendor_type',
              label: 'Type',
              render: (_: any, v: any) => (
                <span className="text-sm capitalize">{v.vendor_type || '-'}</span>
              ),
            },
            {
              key: 'contact_person',
              label: 'Contact',
              render: (_: any, v: any) => (
                <span className="text-sm">{v.contact_person || '-'}</span>
              ),
            },
            {
              key: 'email',
              label: 'Email',
              render: (_: any, v: any) => (
                <span className="text-sm text-blue-600">{v.email || '-'}</span>
              ),
            },
            {
              key: 'phone',
              label: 'Phone',
              render: (_: any, v: any) => (
                <span className="text-sm">{v.phone || '-'}</span>
              ),
            },
            {
              key: 'services_provided',
              label: 'Services',
              render: (_: any, v: any) => (
                <span className="text-sm">{v.services_provided || '-'}</span>
              ),
            },
            {
              key: 'is_active',
              label: 'Status',
              render: (_: any, v: any) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${v.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {v.is_active ? 'Active' : 'Inactive'}
                </span>
              ),
            },
          ]}
        />
      </div>
    </DesktopLayout>
  );
}
