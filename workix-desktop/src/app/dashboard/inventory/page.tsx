'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DesktopLayout } from '@/components/desktop-layout';
import { DataTable } from '@/components/DataTable';
import { CrudModal } from '@/components/CrudModal';
import { SearchFilter } from '@/components/SearchFilter';
import { DeleteConfirmation } from '@/components/DeleteConfirmation';
import {
  useInventoryItems,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
  useInventoryCategories,
} from '@/hooks/useApi';
import { inventoryItemSchema } from '@/lib/validation';
import type { InventoryItem, CreateInventoryItemDTO } from '@/types';

export default function InventoryPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  const { data: items = [], isLoading } = useInventoryItems({ low_stock: lowStockFilter });
  const { data: categories = [] } = useInventoryCategories();
  const createMutation = useCreateInventoryItem();
  const updateMutation = useUpdateInventoryItem();
  const deleteMutation = useDeleteInventoryItem();

  const form = useForm<CreateInventoryItemDTO>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      part_number: '',
      name: '',
      description: '',
      category: '',
      manufacturer: '',
      unit_of_measure: 'EA',
      unit_cost: 0,
      quantity_on_hand: 0,
      reorder_level: 0,
      reorder_quantity: 0,
      location: '',
      barcode: '',
      notes: '',
      is_active: true,
    },
  });

  const filteredItems = useMemo(() => {
    let filtered = items;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((item: InventoryItem) =>
        item.part_number.toLowerCase().includes(term) ||
        item.name.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term)
      );
    }
    if (categoryFilter) {
      filtered = filtered.filter((item: InventoryItem) => item.category === categoryFilter);
    }
    return filtered;
  }, [items, searchTerm, categoryFilter]);

  const handleCreate = () => {
    setEditingItem(null);
    form.reset({
      part_number: '',
      name: '',
      description: '',
      category: '',
      manufacturer: '',
      unit_of_measure: 'EA',
      unit_cost: 0,
      quantity_on_hand: 0,
      reorder_level: 0,
      reorder_quantity: 0,
      location: '',
      barcode: '',
      notes: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    form.reset({
      part_number: item.part_number,
      name: item.name,
      description: item.description || '',
      category: item.category || '',
      manufacturer: item.manufacturer || '',
      unit_of_measure: item.unit_of_measure || 'EA',
      unit_cost: item.unit_cost,
      quantity_on_hand: item.quantity_on_hand || 0,
      reorder_level: item.reorder_level || 0,
      reorder_quantity: item.reorder_quantity || 0,
      location: item.location || '',
      barcode: item.barcode || '',
      notes: item.notes || '',
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving inventory item:', error);
    }
  });

  const handleDelete = async () => {
    if (deleteItem) {
      await deleteMutation.mutateAsync(deleteItem.id);
      setDeleteItem(null);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if ((item.quantity_on_hand || 0) <= (item.reorder_level || 0)) {
      return { label: 'Low Stock', className: 'bg-red-100 text-red-800' };
    }
    return { label: 'In Stock', className: 'bg-green-100 text-green-800' };
  };

  const categoryOptions = categories.map((cat: string) => ({ value: cat, label: cat }));

  return (
    <DesktopLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600 mt-2">Manage parts and supplies inventory</p>
          </div>
          <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            + New Inventory Item
          </button>
        </div>

        <SearchFilter
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search by part number, name, or description..."
          filters={[
            {
              key: 'category',
              label: 'Category',
              type: 'select' as const,
              options: [{ value: '', label: 'All Categories' }, ...categoryOptions],
            },
            {
              key: 'low_stock',
              label: 'Stock Status',
              type: 'select' as const,
              options: [
                { value: '', label: 'All Items' },
                { value: 'true', label: 'Low Stock Only' },
              ],
            },
          ]}
          onFilterChange={(key, value) => {
            if (key === 'category') setCategoryFilter(value as string);
            if (key === 'low_stock') setLowStockFilter(value === 'true');
          }}
        />

        <DataTable
          data={filteredItems}
          loading={isLoading}
          keyExtractor={(i: InventoryItem) => i.id}
          columns={[
            { key: 'part_number', label: 'Part Number', render: (_: any, i: InventoryItem) => <span className="font-medium">{i.part_number}</span> },
            { key: 'name', label: 'Name', render: (_: any, i: InventoryItem) => <span className="text-sm">{i.name}</span> },
            { key: 'category', label: 'Category', render: (_: any, i: InventoryItem) => <span className="text-sm">{i.category || '-'}</span> },
            { key: 'quantity', label: 'Quantity', render: (_: any, i: InventoryItem) => <span className="text-sm">{i.quantity_on_hand || 0} {i.unit_of_measure}</span> },
            { key: 'unit_cost', label: 'Unit Cost', render: (_: any, i: InventoryItem) => <span className="text-sm">${i.unit_cost.toFixed(2)}</span> },
            { key: 'status', label: 'Status', render: (_: any, i: InventoryItem) => {
              const status = getStockStatus(i);
              return <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.className}`}>{status.label}</span>;
            }},
          ]}
          actions={(i: InventoryItem) => (
            <>
              <button onClick={(e) => { e.stopPropagation(); handleEdit(i); }} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button>
              <button onClick={(e) => { e.stopPropagation(); setDeleteItem(i); }} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
            </>
          )}
        />
      </div>

      <CrudModal isOpen={isModalOpen} title={editingItem ? 'Edit Inventory Item' : 'New Inventory Item'} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit} submitText={editingItem ? 'Update' : 'Create'} isSubmitting={createMutation.isPending || updateMutation.isPending} size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Part Number <span className="text-red-500">*</span></label>
              <input {...form.register('part_number')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g., PART-001" />
              {form.formState.errors.part_number && <p className="text-red-500 text-sm mt-1">{form.formState.errors.part_number.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
              <input {...form.register('name')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Item name" />
              {form.formState.errors.name && <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea {...form.register('description')} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Item description..." />
            {form.formState.errors.description && <p className="text-red-500 text-sm mt-1">{form.formState.errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input {...form.register('category')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g., Filters, Belts" />
              {form.formState.errors.category && <p className="text-red-500 text-sm mt-1">{form.formState.errors.category.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
              <input {...form.register('manufacturer')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Manufacturer name" />
              {form.formState.errors.manufacturer && <p className="text-red-500 text-sm mt-1">{form.formState.errors.manufacturer.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost <span className="text-red-500">*</span></label>
              <input {...form.register('unit_cost', { valueAsNumber: true })} type="number" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
              {form.formState.errors.unit_cost && <p className="text-red-500 text-sm mt-1">{form.formState.errors.unit_cost.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input {...form.register('quantity_on_hand', { valueAsNumber: true })} type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="0" />
              {form.formState.errors.quantity_on_hand && <p className="text-red-500 text-sm mt-1">{form.formState.errors.quantity_on_hand.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
              <input {...form.register('reorder_level', { valueAsNumber: true })} type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="0" />
              {form.formState.errors.reorder_level && <p className="text-red-500 text-sm mt-1">{form.formState.errors.reorder_level.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Qty</label>
              <input {...form.register('reorder_quantity', { valueAsNumber: true })} type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="0" />
              {form.formState.errors.reorder_quantity && <p className="text-red-500 text-sm mt-1">{form.formState.errors.reorder_quantity.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure</label>
              <input {...form.register('unit_of_measure')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="EA, BOX, FT, etc." />
              {form.formState.errors.unit_of_measure && <p className="text-red-500 text-sm mt-1">{form.formState.errors.unit_of_measure.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input {...form.register('location')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Storage location" />
              {form.formState.errors.location && <p className="text-red-500 text-sm mt-1">{form.formState.errors.location.message}</p>}
            </div>
          </div>

          <div className="flex items-center">
            <input {...form.register('is_active')} type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
            <label className="ml-2 block text-sm text-gray-900">Active</label>
          </div>
        </div>
      </CrudModal>

      <DeleteConfirmation isOpen={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} title="Delete Inventory Item" message="Are you sure you want to delete this inventory item? This action cannot be undone." itemName={deleteItem?.part_number} isDeleting={deleteMutation.isPending} />
    </DesktopLayout>
  );
}
