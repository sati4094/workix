'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DesktopLayout } from '@/components/desktop-layout';
import { DataTable } from '@/components/DataTable';
import { CrudModal } from '@/components/CrudModal';
import { SearchFilter } from '@/components/SearchFilter';
import { DeleteConfirmation } from '@/components/DeleteConfirmation';
import { useAssets, useCreateAsset, useUpdateAsset, useDeleteAsset } from '@/hooks/useApi';
import { assetSchema } from '@/lib/validation';
import type { Asset, CreateAssetDTO } from '@/types';

export default function AssetsPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deleteAsset, setDeleteAsset] = useState<Asset | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // React Query hooks
  const { data: assets = [], isLoading } = useAssets();
  const createMutation = useCreateAsset();
  const updateMutation = useUpdateAsset();
  const deleteMutation = useDeleteAsset();

  // Form setup with Zod validation
  const form = useForm<CreateAssetDTO>({
    defaultValues: {
      name: '',
      asset_tag: '',
      type: 'HVAC',
      model: '',
      manufacturer: '',
      serial_number: '',
      status: 'Active',
      location: '',
      site_id: '',
      purchase_date: undefined,
      warranty_expiry: undefined,
    },
  });

  // Filter assets
  const filteredAssets = useMemo(() => {
    let filtered = assets;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(asset =>
        asset.name.toLowerCase().includes(term) ||
        asset.asset_tag?.toLowerCase().includes(term) ||
        asset.serial_number?.toLowerCase().includes(term)
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(asset => asset.type === typeFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(asset => asset.status === statusFilter);
    }

    return filtered;
  }, [assets, searchTerm, typeFilter, statusFilter]);

  // Handlers
  const handleCreate = () => {
    setEditingAsset(null);
    form.reset({
      name: '',
      asset_tag: '',
      type: 'HVAC',
      model: '',
      manufacturer: '',
      serial_number: '',
      status: 'Active',
      location: '',
      site_id: '',
      purchase_date: undefined,
      warranty_expiry: undefined,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    form.reset({
      name: asset.name,
      asset_tag: asset.asset_tag || '',
      type: asset.type,
      model: asset.model || '',
      manufacturer: asset.manufacturer || '',
      serial_number: asset.serial_number || '',
      status: asset.status,
      location: asset.location || '',
      site_id: asset.site_id || '',
      purchase_date: asset.purchase_date || undefined,
      warranty_expiry: asset.warranty_expiry || undefined,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    if (editingAsset) {
      await updateMutation.mutateAsync({ id: editingAsset.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setIsModalOpen(false);
  });

  const handleDelete = async () => {
    if (deleteAsset) {
      await deleteMutation.mutateAsync(deleteAsset.id);
      setDeleteAsset(null);
    }
  };

  // Status badge helper
  const getStatusBadge = (status: string) => {
    const colors = {
      Active: 'bg-green-100 text-green-800',
      Inactive: 'bg-gray-100 text-gray-800',
      Maintenance: 'bg-yellow-100 text-yellow-800',
      'Out of Service': 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <DesktopLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Assets</h1>
            <p className="text-gray-600 mt-2">HVAC Equipment & Asset Inventory</p>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md"
          >
            + New Asset
          </button>
        </div>

        {/* Search & Filters */}
        <SearchFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search by name, asset tag, or serial number..."
          filters={[
            {
              label: 'Type',
              value: typeFilter,
              onChange: setTypeFilter,
              options: [
                { value: '', label: 'All Types' },
                { value: 'HVAC', label: 'HVAC' },
                { value: 'Chiller', label: 'Chiller' },
                { value: 'Boiler', label: 'Boiler' },
                { value: 'AHU', label: 'Air Handling Unit' },
                { value: 'Pump', label: 'Pump' },
                { value: 'Fan', label: 'Fan' },
                { value: 'Other', label: 'Other' },
              ],
            },
            {
              label: 'Status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: '', label: 'All Status' },
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
                { value: 'Maintenance', label: 'Maintenance' },
                { value: 'Out of Service', label: 'Out of Service' },
              ],
            },
          ]}
        />

        {/* Data Table */}
        <DataTable
          data={filteredAssets}
          loading={isLoading}
          keyExtractor={(asset) => asset.id}
          onRowClick={(asset) => router.push(`/assets/${asset.id}`)}
          columns={[
            {
              key: 'asset_tag',
              label: 'Asset Tag',
              render: (_, asset: Asset) => (
                <span className="font-mono text-sm text-blue-600 font-semibold">
                  {asset.asset_tag || '-'}
                </span>
              ),
            },
            {
              key: 'name',
              label: 'Name',
              render: (_, asset: Asset) => (
                <span className="font-medium">{asset.name}</span>
              ),
            },
            {
              key: 'type',
              label: 'Type',
              render: (_, asset: Asset) => (
                <span className="text-sm">{asset.type}</span>
              ),
            },
            {
              key: 'model',
              label: 'Model',
              render: (_, asset: Asset) => (
                <span className="text-sm">{asset.model || '-'}</span>
              ),
            },
            {
              key: 'serial_number',
              label: 'Serial Number',
              render: (_, asset: Asset) => (
                <span className="font-mono text-sm">{asset.serial_number || '-'}</span>
              ),
            },
            {
              key: 'status',
              label: 'Status',
              render: (_, asset: Asset) => (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(asset.status)}`}>
                  {asset.status}
                </span>
              ),
            },
            {
              key: 'location',
              label: 'Location',
              render: (_, asset: Asset) => (
                <span className="text-sm">{asset.location || '-'}</span>
              ),
            },
          ]}
          actions={(asset: Asset) => (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(asset);
                }}
                className="text-purple-600 hover:text-purple-800 text-sm font-medium"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteAsset(asset);
                }}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Delete
              </button>
            </>
          )}
        />
      </div>

      {/* Create/Edit Modal */}
      <CrudModal
        isOpen={isModalOpen}
        title={editingAsset ? 'Edit Asset' : 'New Asset'}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        submitText={editingAsset ? 'Update' : 'Create'}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              {...form.register('name')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Asset name"
            />
            {form.formState.errors.name && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asset Tag <span className="text-red-500">*</span>
              </label>
              <input
                {...form.register('asset_tag')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="AST-001"
              />
              {form.formState.errors.asset_tag && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.asset_tag.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                {...form.register('type')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="HVAC">HVAC</option>
                <option value="Chiller">Chiller</option>
                <option value="Boiler">Boiler</option>
                <option value="AHU">Air Handling Unit</option>
                <option value="Pump">Pump</option>
                <option value="Fan">Fan</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
              <input
                {...form.register('manufacturer')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Manufacturer name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <input
                {...form.register('model')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Model number"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
            <input
              {...form.register('serial_number')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Serial number"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                {...form.register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Out of Service">Out of Service</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site ID <span className="text-red-500">*</span>
              </label>
              <input
                {...form.register('site_id')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Site identifier"
              />
              {form.formState.errors.site_id && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.site_id.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              {...form.register('location')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Physical location"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
              <input
                {...form.register('purchase_date')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Expiry</label>
              <input
                {...form.register('warranty_expiry')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {form.formState.errors.warranty_expiry && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.warranty_expiry.message}</p>
              )}
            </div>
          </div>
        </div>
      </CrudModal>

      {/* Delete Confirmation */}
      <DeleteConfirmation
        isOpen={!!deleteAsset}
        itemName={deleteAsset?.name || ''}
        onConfirm={handleDelete}
        onClose={() => setDeleteAsset(null)}
        isDeleting={deleteMutation.isPending}
      />
    </DesktopLayout>
  );
}
