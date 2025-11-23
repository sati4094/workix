'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DesktopLayout } from '@/components/desktop-layout';
import { DataTable } from '@/components/DataTable';
import { CrudModal } from '@/components/CrudModal';
import { SearchFilter } from '@/components/SearchFilter';
import { DeleteConfirmation } from '@/components/DeleteConfirmation';
import { usePPMSchedules, useCreatePPM, useUpdatePPM, useDeletePPM } from '@/hooks/useApi';
import { ppmSchema, type PPMFormData } from '@/lib/validation';
import type { PPMSchedule } from '@/types';

export default function PPMPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<PPMSchedule | null>(null);
  const [deleteSchedule, setDeleteSchedule] = useState<PPMSchedule | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: schedules = [], isLoading } = usePPMSchedules();
  const createMutation = useCreatePPM();
  const updateMutation = useUpdatePPM();
  const deleteMutation = useDeletePPM();

  const form = useForm<PPMFormData>({
    resolver: zodResolver(ppmSchema),
    defaultValues: { name: '', asset_id: '', schedule_type: 'calendar', frequency: 'monthly', frequency_value: 1, meter_threshold: undefined, is_active: true, work_order_template: { title: '', description: '', priority: 'medium', estimated_hours: undefined, checklist: [], required_parts: [] } },
  });

  const filteredSchedules = useMemo(() => {
    let filtered = schedules;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((s: PPMSchedule) => s.name.toLowerCase().includes(term));
    }
    if (frequencyFilter) filtered = filtered.filter((s: PPMSchedule) => s.frequency === frequencyFilter);
    if (statusFilter) filtered = filtered.filter((s: PPMSchedule) => (statusFilter === 'active' ? s.is_active : !s.is_active));
    return filtered;
  }, [schedules, searchTerm, frequencyFilter, statusFilter]);

  const handleCreate = () => {
    setEditingSchedule(null);
    form.reset({ name: '', asset_id: '', schedule_type: 'calendar', frequency: 'monthly', frequency_value: 1, meter_threshold: undefined, is_active: true, work_order_template: { title: '', description: '', priority: 'medium', estimated_hours: undefined, checklist: [], required_parts: [] } });
    setIsModalOpen(true);
  };

  const handleEdit = (schedule: PPMSchedule) => {
    setEditingSchedule(schedule);
    form.reset({ name: schedule.name, asset_id: schedule.asset_id, schedule_type: schedule.schedule_type, frequency: schedule.frequency, frequency_value: schedule.frequency_value, meter_threshold: schedule.meter_threshold || undefined, is_active: schedule.is_active, work_order_template: schedule.work_order_template });
    setIsModalOpen(true);
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    if (editingSchedule) await updateMutation.mutateAsync({ id: editingSchedule.id, data });
    else await createMutation.mutateAsync(data);
    setIsModalOpen(false);
  });

  const handleDelete = async () => {
    if (deleteSchedule) {
      await deleteMutation.mutateAsync(deleteSchedule.id);
      setDeleteSchedule(null);
    }
  };

  const getFrequencyBadge = (frequency: string) => {
    const colors = { daily: 'bg-red-100 text-red-800', weekly: 'bg-orange-100 text-orange-800', monthly: 'bg-purple-100 text-purple-800', quarterly: 'bg-purple-100 text-purple-800', annually: 'bg-gray-100 text-gray-800' };
    return colors[frequency as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <DesktopLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">PPM Schedules</h1>
            <p className="text-gray-600 mt-2">Planned Preventive Maintenance scheduling</p>
          </div>
          <button onClick={handleCreate} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md">+ New Schedule</button>
        </div>

        <SearchFilter onSearchChange={setSearchTerm} searchPlaceholder="Search schedules..." filters={[
          { key: 'frequency', label: 'Frequency', type: 'select' as const, options: [{ value: '', label: 'All' }, { value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'annually', label: 'Annually' }] },
          { key: 'status', label: 'Status', type: 'select' as const, options: [{ value: '', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] }
        ]} onFilterChange={(key, value) => { if (key === 'frequency') setFrequencyFilter(value as string); else if (key === 'status') setStatusFilter(value as string); }} />

        <DataTable data={filteredSchedules} loading={isLoading} keyExtractor={(s: PPMSchedule) => s.id} columns={[
          { key: 'name', label: 'Schedule', render: (_: any, s: PPMSchedule) => <span className="font-medium">{s.name}</span> },
          { key: 'schedule_type', label: 'Type', render: (_: any, s: PPMSchedule) => <span className="text-sm capitalize">{s.schedule_type.replace('_', ' ')}</span> },
          { key: 'frequency', label: 'Frequency', render: (_: any, s: PPMSchedule) => <span className={`px-3 py-1 rounded-full text-sm font-medium ${getFrequencyBadge(s.frequency || '')}`}>{s.frequency || '-'}</span> },
          { key: 'frequency_value', label: 'Interval', render: (_: any, s: PPMSchedule) => <span className="text-sm">Every {s.frequency_value}</span> },
          { key: 'is_active', label: 'Status', render: (_: any, s: PPMSchedule) => <span className={`px-3 py-1 rounded-full text-sm font-medium ${s.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{s.is_active ? 'Active' : 'Inactive'}</span> },
        ]} actions={(s: PPMSchedule) => (<><button onClick={(e) => { e.stopPropagation(); handleEdit(s); }} className="text-purple-600 hover:text-purple-800 text-sm font-medium">Edit</button><button onClick={(e) => { e.stopPropagation(); setDeleteSchedule(s); }} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button></>)} />
      </div>

      <CrudModal isOpen={isModalOpen} title={editingSchedule ? 'Edit Schedule' : 'New Schedule'} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit} submitText={editingSchedule ? 'Update' : 'Create'} isSubmitting={createMutation.isPending || updateMutation.isPending} size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
            <input {...form.register('name')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Schedule name" />
            {form.formState.errors.name && <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asset ID <span className="text-red-500">*</span></label>
            <input {...form.register('asset_id')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Asset identifier" />
            {form.formState.errors.asset_id && <p className="text-red-500 text-sm mt-1">{form.formState.errors.asset_id.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Type</label>
              <select {...form.register('schedule_type')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="time_based">Time Based</option>
                <option value="meter_based">Meter Based</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
              <select {...form.register('frequency')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency Value <span className="text-red-500">*</span></label>
              <input {...form.register('frequency_value', { valueAsNumber: true })} type="number" min="1" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="1" />
              {form.formState.errors.frequency_value && <p className="text-red-500 text-sm mt-1">{form.formState.errors.frequency_value.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meter Threshold</label>
              <input {...form.register('meter_threshold', { valueAsNumber: true })} type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Hours/cycles" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input {...form.register('is_active')} type="checkbox" className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500" />
            <label className="text-sm font-medium text-gray-700">Active Schedule</label>
          </div>
        </div>
      </CrudModal>

      <DeleteConfirmation isOpen={!!deleteSchedule} itemName={deleteSchedule?.name || ''} onConfirm={handleDelete} onClose={() => setDeleteSchedule(null)} isDeleting={deleteMutation.isPending} />
    </DesktopLayout>
  );
}
