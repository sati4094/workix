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
  useSLAPolicies,
  useCreateSLAPolicy,
  useUpdateSLAPolicy,
  useDeleteSLAPolicy,
} from '@/hooks/useApi';
import { slaPolicySchema } from '@/lib/validation';
import type { SLAPolicy, CreateSLAPolicyDTO } from '@/types';

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export default function SLAPoliciesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<SLAPolicy | null>(null);
  const [deletePolicy, setDeletePolicy] = useState<SLAPolicy | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const { data: policies = [], isLoading } = useSLAPolicies();
  const createMutation = useCreateSLAPolicy();
  const updateMutation = useUpdateSLAPolicy();
  const deleteMutation = useDeleteSLAPolicy();

  const form = useForm<CreateSLAPolicyDTO>({
    resolver: zodResolver(slaPolicySchema),
    defaultValues: {
      name: '',
      description: '',
      priority: 'medium',
      response_time_hours: 1,
      resolution_time_hours: 4,
      escalation_enabled: true,
      escalation_1_hours: 1,
      escalation_1_notify: [],
      escalation_2_hours: 2,
      escalation_2_notify: [],
      escalation_3_hours: 3,
      escalation_3_notify: [],
      business_hours_only: false,
      is_active: true,
    },
  });

  const filteredPolicies = useMemo(() => {
    let filtered = policies;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((policy: SLAPolicy) =>
        policy.name.toLowerCase().includes(term) ||
        policy.description?.toLowerCase().includes(term)
      );
    }
    if (priorityFilter) {
      filtered = filtered.filter((policy: SLAPolicy) => policy.priority === priorityFilter);
    }
    return filtered;
  }, [policies, searchTerm, priorityFilter]);

  const handleCreate = () => {
    setEditingPolicy(null);
    form.reset({
      name: '',
      description: '',
      priority: 'medium',
      response_time_hours: 1,
      resolution_time_hours: 4,
      escalation_enabled: true,
      escalation_1_hours: 1,
      escalation_1_notify: [],
      escalation_2_hours: 2,
      escalation_2_notify: [],
      escalation_3_hours: 3,
      escalation_3_notify: [],
      business_hours_only: false,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (policy: SLAPolicy) => {
    setEditingPolicy(policy);
    form.reset({
      name: policy.name,
      description: policy.description || '',
      priority: policy.priority,
      response_time_hours: policy.response_time_hours,
      resolution_time_hours: policy.resolution_time_hours,
      escalation_enabled: policy.escalation_enabled,
      escalation_1_hours: policy.escalation_1_hours || 1,
      escalation_1_notify: policy.escalation_1_notify || [],
      escalation_2_hours: policy.escalation_2_hours || 2,
      escalation_2_notify: policy.escalation_2_notify || [],
      escalation_3_hours: policy.escalation_3_hours || 3,
      escalation_3_notify: policy.escalation_3_notify || [],
      business_hours_only: policy.business_hours_only || false,
      is_active: policy.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      if (editingPolicy) {
        await updateMutation.mutateAsync({ id: editingPolicy.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving SLA policy:', error);
    }
  });

  const handleDelete = async () => {
    if (deletePolicy) {
      await deleteMutation.mutateAsync(deletePolicy.id);
      setDeletePolicy(null);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DesktopLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">SLA Policies</h1>
            <p className="text-gray-600 mt-2">Manage service level agreement policies</p>
          </div>
          <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            + New SLA Policy
          </button>
        </div>

        <SearchFilter
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search SLA policies..."
          filters={[
            {
              key: 'priority',
              label: 'Priority',
              type: 'select' as const,
              options: PRIORITY_OPTIONS,
            },
          ]}
          onFilterChange={(key, value) => {
            if (key === 'priority') setPriorityFilter(value as string);
          }}
        />

        <DataTable
          data={filteredPolicies}
          loading={isLoading}
          keyExtractor={(p: SLAPolicy) => p.id}
          columns={[
            { key: 'name', label: 'Policy Name', render: (_: any, p: SLAPolicy) => <span className="font-medium">{p.name}</span> },
            { key: 'priority', label: 'Priority', render: (_: any, p: SLAPolicy) => <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityBadge(p.priority)}`}>{p.priority}</span> },
            { key: 'response_time', label: 'Response Time', render: (_: any, p: SLAPolicy) => <span className="text-sm">{p.response_time_hours}h</span> },
            { key: 'resolution_time', label: 'Resolution Time', render: (_: any, p: SLAPolicy) => <span className="text-sm">{p.resolution_time_hours}h</span> },
            { key: 'escalation', label: 'Escalation', render: (_: any, p: SLAPolicy) => <span className={`px-3 py-1 rounded-full text-sm font-medium ${p.escalation_enabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{p.escalation_enabled ? 'Enabled' : 'Disabled'}</span> },
            { key: 'is_active', label: 'Status', render: (_: any, p: SLAPolicy) => <span className={`px-3 py-1 rounded-full text-sm font-medium ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{p.is_active ? 'Active' : 'Inactive'}</span> },
          ]}
          actions={(p: SLAPolicy) => (
            <>
              <button onClick={(e) => { e.stopPropagation(); handleEdit(p); }} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button>
              <button onClick={(e) => { e.stopPropagation(); setDeletePolicy(p); }} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
            </>
          )}
        />
      </div>

      <CrudModal isOpen={isModalOpen} title={editingPolicy ? 'Edit SLA Policy' : 'New SLA Policy'} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit} submitText={editingPolicy ? 'Update' : 'Create'} isSubmitting={createMutation.isPending || updateMutation.isPending} size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Policy Name <span className="text-red-500">*</span></label>
            <input {...form.register('name')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g., Critical Equipment SLA" />
            {form.formState.errors.name && <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea {...form.register('description')} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Describe the SLA policy..." />
            {form.formState.errors.description && <p className="text-red-500 text-sm mt-1">{form.formState.errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority <span className="text-red-500">*</span></label>
              <select {...form.register('priority')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              {form.formState.errors.priority && <p className="text-red-500 text-sm mt-1">{form.formState.errors.priority.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Response Time (hours) <span className="text-red-500">*</span></label>
              <input {...form.register('response_time_hours', { valueAsNumber: true })} type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="1" />
              {form.formState.errors.response_time_hours && <p className="text-red-500 text-sm mt-1">{form.formState.errors.response_time_hours.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Time (hours) <span className="text-red-500">*</span></label>
              <input {...form.register('resolution_time_hours', { valueAsNumber: true })} type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="4" />
              {form.formState.errors.resolution_time_hours && <p className="text-red-500 text-sm mt-1">{form.formState.errors.resolution_time_hours.message}</p>}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input {...form.register('escalation_enabled')} type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <label className="ml-2 block text-sm text-gray-900">Enable Escalation</label>
            </div>
            <div className="flex items-center">
              <input {...form.register('business_hours_only')} type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <label className="ml-2 block text-sm text-gray-900">Business Hours Only</label>
            </div>
            <div className="flex items-center">
              <input {...form.register('is_active')} type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <label className="ml-2 block text-sm text-gray-900">Active</label>
            </div>
          </div>
        </div>
      </CrudModal>

      <DeleteConfirmation isOpen={!!deletePolicy} onClose={() => setDeletePolicy(null)} onConfirm={handleDelete} title="Delete SLA Policy" message="Are you sure you want to delete this SLA policy? This action cannot be undone." itemName={deletePolicy?.name} isDeleting={deleteMutation.isPending} />
    </DesktopLayout>
  );
}
