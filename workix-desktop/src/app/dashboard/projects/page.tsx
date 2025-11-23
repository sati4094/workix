'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DesktopLayout } from '@/components/desktop-layout';
import { DataTable } from '@/components/DataTable';
import { CrudModal } from '@/components/CrudModal';
import { SearchFilter } from '@/components/SearchFilter';
import { DeleteConfirmation } from '@/components/DeleteConfirmation';
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '@/hooks/useApi';
import { projectSchema } from '@/lib/validation';
import type { Project, CreateProjectDTO } from '@/types';

export default function ProjectsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: projects = [], isLoading } = useProjects();
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  const form = useForm<CreateProjectDTO>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: '', description: '', enterprise_id: '', status: 'planning', start_date: '', end_date: '', budget: undefined },
  });

  const filteredProjects = useMemo(() => {
    let filtered = projects;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((p: Project) => p.name.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term));
    }
    if (statusFilter) filtered = filtered.filter((p: Project) => p.status === statusFilter);
    return filtered;
  }, [projects, searchTerm, statusFilter]);

  const handleCreate = () => {
    setEditingProject(null);
    form.reset({ name: '', description: '', enterprise_id: '', status: 'planning', start_date: '', end_date: '', budget: undefined });
    setIsModalOpen(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    form.reset({ name: project.name, description: project.description || '', enterprise_id: (project as any).enterprise_id, status: project.status, start_date: project.start_date || '', end_date: project.end_date || '', budget: project.budget || undefined });
    setIsModalOpen(true);
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    if (editingProject) await updateMutation.mutateAsync({ id: editingProject.id, data });
    else await createMutation.mutateAsync(data);
    setIsModalOpen(false);
  });

  const handleDelete = async () => {
    if (deleteProject) {
      await deleteMutation.mutateAsync(deleteProject.id);
      setDeleteProject(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = { planning: 'bg-purple-100 text-purple-800', active: 'bg-green-100 text-green-800', on_hold: 'bg-yellow-100 text-yellow-800', completed: 'bg-gray-100 text-gray-800', cancelled: 'bg-red-100 text-red-800' };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <DesktopLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-2">Manage HVAC projects</p>
          </div>
          <button onClick={handleCreate} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md">+ New Project</button>
        </div>

        <SearchFilter onSearchChange={setSearchTerm} searchPlaceholder="Search projects..." filters={[{ key: 'status', label: 'Status', type: 'select' as const, options: [{ value: '', label: 'All' }, { value: 'planning', label: 'Planning' }, { value: 'active', label: 'Active' }, { value: 'on_hold', label: 'On Hold' }, { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' }] }]} onFilterChange={(key, value) => setStatusFilter(value as string)} />

        <DataTable data={filteredProjects} loading={isLoading} keyExtractor={(p: Project) => p.id} columns={[
          { key: 'name', label: 'Project', render: (_: any, p: Project) => <span className="font-medium">{p.name}</span> },
          { key: 'enterprise_name', label: 'Enterprise', render: (_: any, p: Project) => <span className="text-sm">{(p as any).enterprise_name || '-'}</span> },
          { key: 'status', label: 'Status', render: (_: any, p: Project) => <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(p.status)}`}>{p.status}</span> },
          { key: 'start_date', label: 'Start', render: (_: any, p: Project) => <span className="text-sm">{p.start_date ? new Date(p.start_date).toLocaleDateString() : '-'}</span> },
          { key: 'end_date', label: 'End', render: (_: any, p: Project) => <span className="text-sm">{p.end_date ? new Date(p.end_date).toLocaleDateString() : '-'}</span> },
          { key: 'budget', label: 'Budget', render: (_: any, p: Project) => <span className="text-sm">{p.budget ? `$${p.budget.toLocaleString()}` : '-'}</span> },
        ]} actions={(p: Project) => (<><button onClick={(e) => { e.stopPropagation(); handleEdit(p); }} className="text-purple-600 hover:text-purple-800 text-sm font-medium">Edit</button><button onClick={(e) => { e.stopPropagation(); setDeleteProject(p); }} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button></>)} />
      </div>

      <CrudModal isOpen={isModalOpen} title={editingProject ? 'Edit Project' : 'New Project'} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit} submitText={editingProject ? 'Update' : 'Create'} isSubmitting={createMutation.isPending || updateMutation.isPending} size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
            <input {...form.register('name')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Project name" />
            {form.formState.errors.name && <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea {...form.register('description')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Project description" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enterprise <span className="text-red-500">*</span></label>
            <input {...form.register('enterprise_id')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Enterprise identifier" />
            {form.formState.errors.enterprise_id && <p className="text-red-500 text-sm mt-1">{form.formState.errors.enterprise_id.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input {...form.register('start_date')} type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input {...form.register('end_date')} type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              {form.formState.errors.end_date && <p className="text-red-500 text-sm mt-1">{form.formState.errors.end_date.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
              <input {...form.register('budget', { valueAsNumber: true })} type="number" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select {...form.register('status')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </CrudModal>

      <DeleteConfirmation isOpen={!!deleteProject} itemName={deleteProject?.name || ''} onConfirm={handleDelete} onClose={() => setDeleteProject(null)} isDeleting={deleteMutation.isPending} />
    </DesktopLayout>
  );
}
