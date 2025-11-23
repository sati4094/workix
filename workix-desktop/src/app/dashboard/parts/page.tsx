'use client';

import { useState, useMemo } from 'react';
import { DesktopLayout } from '@/components/desktop-layout';
import { DataTable } from '@/components/DataTable';
import { useParts } from '@/hooks/useApi';

export default function PartsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: parts = [], isLoading } = useParts();

  const filteredParts = useMemo(() => {
    if (!searchTerm) return parts;
    const term = searchTerm.toLowerCase();
    return parts.filter((p: any) =>
      p.part_name?.toLowerCase().includes(term) ||
      p.part_number?.toLowerCase().includes(term) ||
      p.category?.toLowerCase().includes(term)
    );
  }, [parts, searchTerm]);

  return (
    <DesktopLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Parts Inventory</h1>
            <p className="text-gray-600 mt-2">Manage spare parts and inventory</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Parts</div>
            <div className="text-2xl font-bold text-gray-900">{parts.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Quantity</div>
            <div className="text-2xl font-bold text-gray-900">
              {parts.reduce((sum: number, p: any) => sum + (p.quantity_on_hand || 0), 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Low Stock Items</div>
            <div className="text-2xl font-bold text-red-600">
              {parts.filter((p: any) => (p.quantity_on_hand || 0) <= (p.reorder_point || 0)).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Value</div>
            <div className="text-2xl font-bold text-gray-900">
              ${parts.reduce((sum: number, p: any) => sum + ((p.unit_cost || 0) * (p.quantity_on_hand || 0)), 0).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4">
          <input
            type="text"
            placeholder="Search parts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <DataTable
          data={filteredParts}
          loading={isLoading}
          keyExtractor={(p: any) => p.id}
          columns={[
            {
              key: 'part_number',
              label: 'Part #',
              render: (_: any, p: any) => (
                <span className="font-mono text-sm font-semibold text-blue-600">{p.part_number}</span>
              ),
            },
            {
              key: 'part_name',
              label: 'Name',
              render: (_: any, p: any) => (
                <span className="font-medium">{p.part_name}</span>
              ),
            },
            {
              key: 'category',
              label: 'Category',
              render: (_: any, p: any) => (
                <span className="text-sm">{p.category || '-'}</span>
              ),
            },
            {
              key: 'quantity_on_hand',
              label: 'Quantity',
              render: (_: any, p: any) => (
                <span className={`text-sm font-medium ${(p.quantity_on_hand || 0) <= (p.reorder_point || 0) ? 'text-red-600' : 'text-green-600'}`}>
                  {p.quantity_on_hand || 0}
                </span>
              ),
            },
            {
              key: 'reorder_point',
              label: 'Reorder Point',
              render: (_: any, p: any) => (
                <span className="text-sm">{p.reorder_point || '-'}</span>
              ),
            },
            {
              key: 'unit_cost',
              label: 'Unit Cost',
              render: (_: any, p: any) => (
                <span className="text-sm">${(p.unit_cost || 0).toFixed(2)}</span>
              ),
            },
            {
              key: 'storeroom_name',
              label: 'Location',
              render: (_: any, p: any) => (
                <span className="text-sm">{p.storeroom_name || '-'}</span>
              ),
            },
          ]}
        />
      </div>
    </DesktopLayout>
  );
}
