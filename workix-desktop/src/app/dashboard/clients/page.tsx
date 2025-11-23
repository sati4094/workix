'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DesktopLayout } from '@/components/desktop-layout';
import { DataTable } from '@/components/DataTable';
import { CrudModal } from '@/components/CrudModal';
import { SearchFilter } from '@/components/SearchFilter';
import { DeleteConfirmation } from '@/components/DeleteConfirmation';
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '@/hooks/useApi';
import { clientSchema } from '@/lib/validation';
import type { Client, CreateClientDTO } from '@/types';

export default function ClientsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: clients = [], isLoading } = useClients();
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const deleteMutation = useDeleteClient();

  const form = useForm<CreateClientDTO>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      contact_email: '',
      contact_phone: '',
      contact_person: '',
      address: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
      status: 'active',
    },
  });

  const filteredClients = useMemo(() => {
    let filtered = clients;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((client: Client) =>
        client.name.toLowerCase().includes(term) ||
        client.contact_email?.toLowerCase().includes(term) ||
        client.contact_person?.toLowerCase().includes(term)
      );
    }
    if (statusFilter) {
      filtered = filtered.filter((client: Client) => client.status === statusFilter);
    }
    return filtered;
  }, [clients, searchTerm, statusFilter]);

  const handleCreate = () => {
    setEditingClient(null);
    form.reset({
      name: '',
      contact_email: '',
      contact_phone: '',
      contact_person: '',
      address: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    form.reset({
      name: client.name,
      contact_email: client.contact_email || '',
      contact_phone: client.contact_phone || '',
      contact_person: client.contact_person || '',
      address: client.address || '',
      city: client.city || '',
      state: client.state || '',
      postal_code: client.postal_code || '',
      country: client.country || '',
      status: client.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    if (editingClient) {
      await updateMutation.mutateAsync({ id: editingClient.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setIsModalOpen(false);
  });

  const handleDelete = async () => {
    if (deleteClient) {
      await deleteMutation.mutateAsync(deleteClient.id);
      setDeleteClient(null);
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  return (
    <DesktopLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
            <p className="text-gray-600 mt-2">Manage client accounts</p>
          </div>
          <button onClick={handleCreate} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md">
            + New Client
          </button>
        </div>

        <SearchFilter
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search by name, email, or contact person..."
          filters={[
            {
              key: 'status',
              label: 'Status',
              type: 'select' as const,
              options: [
                { value: '', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ],
            },
          ]}
          onFilterChange={(key, value) => setStatusFilter(value as string)}
        />

        <DataTable
          data={filteredClients}
          loading={isLoading}
          keyExtractor={(c: Client) => c.id}
          columns={[
            { key: 'name', label: 'Name', render: (_: any, c: Client) => <span className="font-medium">{c.name}</span> },
            { key: 'contact_email', label: 'Email', render: (_: any, c: Client) => <span className="text-sm">{c.contact_email || '-'}</span> },
            { key: 'contact_phone', label: 'Phone', render: (_: any, c: Client) => <span className="text-sm">{c.contact_phone || '-'}</span> },
            { key: 'contact_person', label: 'Contact', render: (_: any, c: Client) => <span className="text-sm">{c.contact_person || '-'}</span> },
            { key: 'city', label: 'City', render: (_: any, c: Client) => <span className="text-sm">{c.city || '-'}</span> },
            { key: 'status', label: 'Status', render: (_: any, c: Client) => <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(c.status || 'active')}`}>{c.status || 'active'}</span> },
          ]}
          actions={(c: Client) => (
            <>
              <button onClick={(e) => { e.stopPropagation(); handleEdit(c); }} className="text-purple-600 hover:text-purple-800 text-sm font-medium">Edit</button>
              <button onClick={(e) => { e.stopPropagation(); setDeleteClient(c); }} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
            </>
          )}
        />
      </div>

      <CrudModal isOpen={isModalOpen} title={editingClient ? 'Edit Client' : 'New Client'} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit} submitText={editingClient ? 'Update' : 'Create'} isSubmitting={createMutation.isPending || updateMutation.isPending} size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
            <input {...form.register('name')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Client name" />
            {form.formState.errors.name && <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
              <input {...form.register('contact_email')} type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="email@example.com" />
              {form.formState.errors.contact_email && <p className="text-red-500 text-sm mt-1">{form.formState.errors.contact_email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input {...form.register('contact_phone')} type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="+1 (555) 123-4567" />
              {form.formState.errors.contact_phone && <p className="text-red-500 text-sm mt-1">{form.formState.errors.contact_phone.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
            <input {...form.register('contact_person')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Primary contact" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input {...form.register('address')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Street address" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input {...form.register('city')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="City" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input {...form.register('state')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="State" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
              <input {...form.register('postal_code')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="12345" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input {...form.register('country')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Country" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select {...form.register('status')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </CrudModal>

      <DeleteConfirmation isOpen={!!deleteClient} itemName={deleteClient?.name || ''} onConfirm={handleDelete} onClose={() => setDeleteClient(null)} isDeleting={deleteMutation.isPending} />
    </DesktopLayout>
  );
}
