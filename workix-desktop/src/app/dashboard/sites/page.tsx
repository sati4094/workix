'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DesktopLayout } from '@/components/desktop-layout';
import { DataTable } from '@/components/DataTable';
import { CrudModal } from '@/components/CrudModal';
import { SearchFilter } from '@/components/SearchFilter';
import { DeleteConfirmation } from '@/components/DeleteConfirmation';
import { useSites, useCreateSite, useUpdateSite, useDeleteSite } from '@/hooks/useApi';
import { siteSchema } from '@/lib/validation';
import type { Site, CreateSiteDTO } from '@/types';

export default function SitesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [deleteSite, setDeleteSite] = useState<Site | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: sites = [], isLoading } = useSites();
  const createMutation = useCreateSite();
  const updateMutation = useUpdateSite();
  const deleteMutation = useDeleteSite();

  const form = useForm<CreateSiteDTO>({
    resolver: zodResolver(siteSchema),
    defaultValues: { name: '', project_id: '', address: '', city: '', state: '', postal_code: '', country: '', contact_person: '', contact_phone: '', contact_email: '' },
  });

  const filteredSites = useMemo(() => {
    if (!searchTerm) return sites;
    const term = searchTerm.toLowerCase();
    return sites.filter((s: Site) => s.name.toLowerCase().includes(term) || s.city?.toLowerCase().includes(term) || s.address?.toLowerCase().includes(term));
  }, [sites, searchTerm]);

  const handleCreate = () => {
    setEditingSite(null);
    form.reset({ name: '', project_id: '', address: '', city: '', state: '', postal_code: '', country: '', contact_person: '', contact_phone: '', contact_email: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (site: Site) => {
    setEditingSite(site);
    form.reset({ name: site.name, project_id: site.project_id, address: site.address || '', city: site.city || '', state: site.state || '', postal_code: site.postal_code || '', country: site.country || '', contact_person: site.contact_person || '', contact_phone: site.contact_phone || '', contact_email: site.contact_email || '' });
    setIsModalOpen(true);
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    if (editingSite) await updateMutation.mutateAsync({ id: editingSite.id, data });
    else await createMutation.mutateAsync(data);
    setIsModalOpen(false);
  });

  const handleDelete = async () => {
    if (deleteSite) {
      await deleteMutation.mutateAsync(deleteSite.id);
      setDeleteSite(null);
    }
  };

  return (
    <DesktopLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sites</h1>
            <p className="text-gray-600 mt-2">Manage facility locations</p>
          </div>
          <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">+ New Site</button>
        </div>

        <SearchFilter onSearchChange={setSearchTerm} searchPlaceholder="Search sites..." />

        <DataTable data={filteredSites} loading={isLoading} keyExtractor={(s: Site) => s.id} columns={[
          { key: 'name', label: 'Name', render: (_: any, s: Site) => <span className="font-medium">{s.name}</span> },
          { key: 'address', label: 'Address', render: (_: any, s: Site) => <span className="text-sm">{s.address || '-'}</span> },
          { key: 'city', label: 'City', render: (_: any, s: Site) => <span className="text-sm">{s.city || '-'}</span> },
          { key: 'state', label: 'State', render: (_: any, s: Site) => <span className="text-sm">{s.state || '-'}</span> },
          { key: 'contact_person', label: 'Contact', render: (_: any, s: Site) => <span className="text-sm">{s.contact_person || '-'}</span> },
          { key: 'contact_phone', label: 'Phone', render: (_: any, s: Site) => <span className="text-sm">{s.contact_phone || '-'}</span> },
        ]} actions={(s: Site) => (<><button onClick={(e) => { e.stopPropagation(); handleEdit(s); }} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button><button onClick={(e) => { e.stopPropagation(); setDeleteSite(s); }} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button></>)} />
      </div>

      <CrudModal isOpen={isModalOpen} title={editingSite ? 'Edit Site' : 'New Site'} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit} submitText={editingSite ? 'Update' : 'Create'} isSubmitting={createMutation.isPending || updateMutation.isPending} size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
            <input {...form.register('name')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Site name" />
            {form.formState.errors.name && <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project ID <span className="text-red-500">*</span></label>
            <input {...form.register('project_id')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Project identifier" />
            {form.formState.errors.project_id && <p className="text-red-500 text-sm mt-1">{form.formState.errors.project_id.message}</p>}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
            <input {...form.register('contact_person')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Contact person" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input {...form.register('contact_phone')} type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="+1 (555) 123-4567" />
              {form.formState.errors.contact_phone && <p className="text-red-500 text-sm mt-1">{form.formState.errors.contact_phone.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input {...form.register('contact_email')} type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="email@example.com" />
              {form.formState.errors.contact_email && <p className="text-red-500 text-sm mt-1">{form.formState.errors.contact_email.message}</p>}
            </div>
          </div>
        </div>
      </CrudModal>

      <DeleteConfirmation isOpen={!!deleteSite} itemName={deleteSite?.name || ''} onConfirm={handleDelete} onClose={() => setDeleteSite(null)} isDeleting={deleteMutation.isPending} />
    </DesktopLayout>
  );
}
