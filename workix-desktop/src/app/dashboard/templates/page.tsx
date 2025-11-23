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
  useTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  useTemplateCategories,
} from '@/hooks/useApi';
import { workOrderTemplateSchema } from '@/lib/validation';
import type { WorkOrderTemplate, CreateTemplateDTO } from '@/types';

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export default function TemplatesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkOrderTemplate | null>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<WorkOrderTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const { data: templates = [], isLoading } = useTemplates();
  const { data: categories = [] } = useTemplateCategories();
  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();
  const deleteMutation = useDeleteTemplate();

  const form = useForm<CreateTemplateDTO>({
    resolver: zodResolver(workOrderTemplateSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      priority: 'medium',
      estimated_hours: 0,
      default_checklist: [],
      required_parts: [],
      instructions: '',
      safety_notes: '',
      is_active: true,
    },
  });

  const filteredTemplates = useMemo(() => {
    let filtered = templates;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((template: WorkOrderTemplate) =>
        template.name.toLowerCase().includes(term) ||
        template.description?.toLowerCase().includes(term) ||
        template.category?.toLowerCase().includes(term)
      );
    }
    if (categoryFilter) {
      filtered = filtered.filter((template: WorkOrderTemplate) => template.category === categoryFilter);
    }
    if (priorityFilter) {
      filtered = filtered.filter((template: WorkOrderTemplate) => template.priority === priorityFilter);
    }
    return filtered;
  }, [templates, searchTerm, categoryFilter, priorityFilter]);

  const handleCreate = () => {
    setEditingTemplate(null);
    form.reset({
      name: '',
      description: '',
      category: '',
      priority: 'medium',
      estimated_hours: 0,
      default_checklist: [],
      required_parts: [],
      instructions: '',
      safety_notes: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (template: WorkOrderTemplate) => {
    setEditingTemplate(template);
    form.reset({
      name: template.name,
      description: template.description || '',
      category: template.category || '',
      priority: template.priority,
      estimated_hours: template.estimated_hours || 0,
      default_checklist: template.default_checklist || [],
      required_parts: template.required_parts || [],
      instructions: template.instructions || '',
      safety_notes: template.safety_notes || '',
      is_active: template.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      if (editingTemplate) {
        await updateMutation.mutateAsync({ id: editingTemplate.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving template:', error);
    }
  });

  const handleDelete = async () => {
    if (deleteTemplate) {
      await deleteMutation.mutateAsync(deleteTemplate.id);
      setDeleteTemplate(null);
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

  const categoryOptions = categories.map((cat: string) => ({ value: cat, label: cat }));

  return (
    <DesktopLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Work Order Templates</h1>
            <p className="text-gray-600 mt-2">Manage reusable work order templates</p>
          </div>
          <button onClick={handleCreate} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md">
            + New Template
          </button>
        </div>

        <SearchFilter
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search templates..."
          filters={[
            {
              key: 'category',
              label: 'Category',
              type: 'select' as const,
              options: [{ value: '', label: 'All Categories' }, ...categoryOptions],
            },
            {
              key: 'priority',
              label: 'Priority',
              type: 'select' as const,
              options: PRIORITY_OPTIONS,
            },
          ]}
          onFilterChange={(key, value) => {
            if (key === 'category') setCategoryFilter(value as string);
            if (key === 'priority') setPriorityFilter(value as string);
          }}
        />

        <DataTable
          data={filteredTemplates}
          loading={isLoading}
          keyExtractor={(t: WorkOrderTemplate) => t.id}
          columns={[
            { key: 'name', label: 'Template Name', render: (_: any, t: WorkOrderTemplate) => <span className="font-medium">{t.name}</span> },
            { key: 'category', label: 'Category', render: (_: any, t: WorkOrderTemplate) => <span className="text-sm">{t.category || '-'}</span> },
            { key: 'priority', label: 'Priority', render: (_: any, t: WorkOrderTemplate) => <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityBadge(t.priority)}`}>{t.priority}</span> },
            { key: 'estimated_hours', label: 'Est. Hours', render: (_: any, t: WorkOrderTemplate) => <span className="text-sm">{t.estimated_hours || 0}h</span> },
            { key: 'is_active', label: 'Status', render: (_: any, t: WorkOrderTemplate) => <span className={`px-3 py-1 rounded-full text-sm font-medium ${t.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{t.is_active ? 'Active' : 'Inactive'}</span> },
          ]}
          actions={(t: WorkOrderTemplate) => (
            <>
              <button onClick={(e) => { e.stopPropagation(); handleEdit(t); }} className="text-purple-600 hover:text-purple-800 text-sm font-medium">Edit</button>
              <button onClick={(e) => { e.stopPropagation(); setDeleteTemplate(t); }} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
            </>
          )}
        />
      </div>

      <CrudModal isOpen={isModalOpen} title={editingTemplate ? 'Edit Template' : 'New Template'} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit} submitText={editingTemplate ? 'Update' : 'Create'} isSubmitting={createMutation.isPending || updateMutation.isPending} size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Template Name <span className="text-red-500">*</span></label>
              <input {...form.register('name')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g., Chiller Preventive Maintenance" />
              {form.formState.errors.name && <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
              <input {...form.register('category')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g., HVAC, Electrical" />
              {form.formState.errors.category && <p className="text-red-500 text-sm mt-1">{form.formState.errors.category.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea {...form.register('description')} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Describe the template..." />
            {form.formState.errors.description && <p className="text-red-500 text-sm mt-1">{form.formState.errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
              <input {...form.register('estimated_hours', { valueAsNumber: true })} type="number" step="0.5" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="0" />
              {form.formState.errors.estimated_hours && <p className="text-red-500 text-sm mt-1">{form.formState.errors.estimated_hours.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
            <textarea {...form.register('instructions')} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Step-by-step instructions..." />
            {form.formState.errors.instructions && <p className="text-red-500 text-sm mt-1">{form.formState.errors.instructions.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Safety Notes</label>
            <textarea {...form.register('safety_notes')} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Important safety information..." />
            {form.formState.errors.safety_notes && <p className="text-red-500 text-sm mt-1">{form.formState.errors.safety_notes.message}</p>}
          </div>

          <div className="flex items-center">
            <input {...form.register('is_active')} type="checkbox" className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded" />
            <label className="ml-2 block text-sm text-gray-900">Active</label>
          </div>
        </div>
      </CrudModal>

      <DeleteConfirmation isOpen={!!deleteTemplate} onClose={() => setDeleteTemplate(null)} onConfirm={handleDelete} title="Delete Template" message="Are you sure you want to delete this template? This action cannot be undone." itemName={deleteTemplate?.name} isDeleting={deleteMutation.isPending} />
    </DesktopLayout>
  );
}
