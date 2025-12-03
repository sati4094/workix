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
import { useWorkOrders, useCreateWorkOrder, useUpdateWorkOrder, useDeleteWorkOrder, useEnterprises, useProjects, useSites, useAssets, useUsers } from '@/hooks/useApi';
import { workOrderFormSchema, type WorkOrderFormData } from '@/lib/validation';
import { api } from '@/lib/api';
import type { WorkOrder, CreateWorkOrderDTO } from '@/types';
import LocationSelector from '@/components/LocationSelector';
import { Loader2, Upload, X, FileText, AlertCircle } from 'lucide-react';

export default function WorkOrdersPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null);
  const [deleteWorkOrder, setDeleteWorkOrder] = useState<WorkOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedEnterprise, setSelectedEnterprise] = useState<string>('');
  const [locationData, setLocationData] = useState({
    siteId: '',
    buildingId: 0,
    floorId: 0,
    spaceId: 0,
  });

  // React Query hooks
  const { data: workOrders = [], isLoading } = useWorkOrders();
  const { data: enterprises = [] } = useEnterprises();
  const { data: projects = [] } = useProjects();
  const { data: sites = [] } = useSites();
  const { data: assets = [] } = useAssets();
  const { data: users = [] } = useUsers();
  const createMutation = useCreateWorkOrder();
  const updateMutation = useUpdateWorkOrder();
  const deleteMutation = useDeleteWorkOrder();
  
  // Filter sites based on selected enterprise
  const filteredSites = useMemo(() => {
    if (!selectedEnterprise) return sites;
    // Filter sites that belong to the selected enterprise
    return sites.filter(site => site.enterprise_id === selectedEnterprise);
  }, [sites, selectedEnterprise]);

  // Form setup with Zod validation
  const form = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderFormSchema),
    defaultValues: {
      title: '',
      description: '',
      enterprise_id: '',
      site_id: '',
      building_id: 0,
      floor_id: 0,
      space_id: 0,
      building: '',
      asset_id: '',
      location: '',
      priority: 'medium',
      status: 'pending',
      assigned_to: '',
      scheduled_date: '',
      due_date: '',
    },
  });

  // Filter work orders
  const filteredWorkOrders = useMemo(() => {
    let filtered = workOrders;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(wo =>
        wo.title.toLowerCase().includes(term) ||
        wo.description?.toLowerCase().includes(term) ||
        wo.wo_number?.toLowerCase().includes(term)
      );
    }

    if (priorityFilter) {
      filtered = filtered.filter(wo => wo.priority === priorityFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(wo => wo.status === statusFilter);
    }

    return filtered;
  }, [workOrders, searchTerm, priorityFilter, statusFilter]);

  // Handlers
  const handleCreate = () => {
    setEditingWorkOrder(null);
    setSelectedFiles([]);
    setSelectedEnterprise('');
    setLocationData({ siteId: '', buildingId: 0, floorId: 0, spaceId: 0 });
    form.reset({
      title: '',
      description: '',
      enterprise_id: '',
      site_id: '',
      building_id: 0,
      floor_id: 0,
      space_id: 0,
      building: '',
      asset_id: '',
      location: '',
      priority: 'medium',
      status: 'pending',
      assigned_to: '',
      scheduled_date: '',
      due_date: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (workOrder: WorkOrder) => {
    setEditingWorkOrder(workOrder);
    setSelectedFiles([]);
    setSelectedEnterprise(workOrder.enterprise_id || '');
    
    // Load location data if available
    setLocationData({
      siteId: workOrder.site_id || '',
      buildingId: (workOrder as any).building_id || 0,
      floorId: (workOrder as any).floor_id || 0,
      spaceId: (workOrder as any).space_id || 0,
    });
    
    form.reset({
      title: workOrder.title,
      description: workOrder.description || '',
      enterprise_id: workOrder.enterprise_id || '',
      site_id: workOrder.site_id || '',
      building_id: (workOrder as any).building_id || 0,
      floor_id: (workOrder as any).floor_id || 0,
      space_id: (workOrder as any).space_id || 0,
      building: workOrder.building || '',
      asset_id: workOrder.asset_ids?.[0] || '',
      location: workOrder.location || '',
      priority: workOrder.priority,
      status: workOrder.status,
      assigned_to: workOrder.assigned_to || '',
      scheduled_date: workOrder.scheduled_start ? new Date(workOrder.scheduled_start).toISOString().split('T')[0] : '',
      due_date: workOrder.due_date ? new Date(workOrder.due_date).toISOString().split('T')[0] : '',
    });
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      setUploadError('');
      // Convert date to ISO format if provided and add location IDs
      const formattedData = {
        ...data,
        building_id: locationData.buildingId || undefined,
        floor_id: locationData.floorId || undefined,
        space_id: locationData.spaceId || undefined,
        source: 'manual',
        due_date: data.due_date ? new Date(data.due_date).toISOString() : undefined,
        scheduled_date: data.scheduled_date ? new Date(data.scheduled_date).toISOString() : undefined,
        asset_ids: data.asset_id ? [data.asset_id] : [],
      };

      let workOrderId: string;

      if (editingWorkOrder) {
        await updateMutation.mutateAsync({ id: editingWorkOrder.id, data: formattedData });
        workOrderId = editingWorkOrder.id;
      } else {
        const result = await createMutation.mutateAsync(formattedData);
        workOrderId = result?.id || result?.data?.id;
      }

      // Handle file uploads to backend
      if (selectedFiles.length > 0 && workOrderId) {
        setIsUploading(true);
        setUploadProgress('Uploading files...');
        
        try {
          for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            setUploadProgress(`Uploading file ${i + 1} of ${selectedFiles.length}: ${file.name}`);
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('work_order_id', workOrderId);
            formData.append('file_name', file.name);
            formData.append('file_type', file.type || 'application/octet-stream');
            
            await api.attachments.workOrders.upload(formData);
          }
          setUploadProgress('All files uploaded successfully!');
        } catch (uploadErr: any) {
          console.error('Error uploading files:', uploadErr);
          setUploadError(`File upload failed: ${uploadErr?.response?.data?.error || uploadErr.message}`);
          // Work order was still created, just files failed
        } finally {
          setIsUploading(false);
        }
      }

      setIsModalOpen(false);
      setSelectedFiles([]);
      setUploadProgress('');
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  });

  const handleDelete = async () => {
    if (deleteWorkOrder) {
      await deleteMutation.mutateAsync(deleteWorkOrder.id);
      setDeleteWorkOrder(null);
    }
  };

  // Priority badge helper - matches database enum values
  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return colors[priority?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  // Status badge helper - matches database enum values
  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      acknowledged: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      on_hold: 'bg-amber-100 text-amber-800',
      parts_pending: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800',
      closed: 'bg-slate-100 text-slate-800',
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  // Format status for display
  const formatStatus = (status: string) => {
    if (!status) return '';
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <DesktopLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Work Orders</h1>
            <p className="text-gray-600 mt-2">Manage all work orders and assignments</p>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md"
          >
            + New Work Order
          </button>
        </div>

        {/* Search & Filters */}
        <SearchFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search by title, description, or WO number..."
          filters={[
            {
              label: 'Priority',
              value: priorityFilter,
              onChange: setPriorityFilter,
              options: [
                { value: '', label: 'All Priorities' },
                { value: 'Critical', label: 'Critical' },
                { value: 'High', label: 'High' },
                { value: 'Medium', label: 'Medium' },
                { value: 'Low', label: 'Low' },
              ],
            },
            {
              label: 'Status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: '', label: 'All Status' },
                { value: 'Open', label: 'Open' },
                { value: 'In Progress', label: 'In Progress' },
                { value: 'On Hold', label: 'On Hold' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Cancelled', label: 'Cancelled' },
              ],
            },
          ]}
        />

        {/* Data Table */}
        <DataTable
          data={filteredWorkOrders}
          loading={isLoading}
          keyExtractor={(wo) => wo.id}
          columns={[
            {
              key: 'wo_number',
              label: 'WO #',
              render: (_, wo: WorkOrder) => (
                <span className="font-mono text-sm">{wo.wo_number || `WO-${wo.id.substring(0, 8)}`}</span>
              ),
            },
            {
              key: 'title',
              label: 'Title',
              render: (_, wo: WorkOrder) => (
                <span className="font-medium">{wo.title}</span>
              ),
            },
            {
              key: 'enterprise_name',
              label: 'Enterprise',
              render: (_, wo: WorkOrder) => (
                <span className="text-sm">{wo.enterprise_name || '-'}</span>
              ),
            },
            {
              key: 'site_name',
              label: 'Site',
              render: (_, wo: WorkOrder) => (
                <span className="text-sm">{wo.site_name || '-'}</span>
              ),
            },
            {
              key: 'priority',
              label: 'Priority',
              render: (_, wo: WorkOrder) => (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityBadge(wo.priority)}`}>
                  {wo.priority}
                </span>
              ),
            },
            {
              key: 'status',
              label: 'Status',
              render: (_, wo: WorkOrder) => (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(wo.status)}`}>
                  {wo.status}
                </span>
              ),
            },
            {
              key: 'due_date',
              label: 'Due Date',
              render: (_, wo: WorkOrder) => (
                <span className="text-sm">{wo.due_date ? new Date(wo.due_date).toLocaleDateString() : '-'}</span>
              ),
            },
          ]}
          onRowClick={(wo) => router.push(`/work-orders/${wo.id}`)}
          actions={(wo: WorkOrder) => (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(wo);
                }}
                className="text-purple-600 hover:text-purple-800 text-sm font-medium"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteWorkOrder(wo);
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
        title={editingWorkOrder ? 'Edit Work Order' : 'New Work Order'}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        submitText={editingWorkOrder ? 'Update' : 'Create'}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              {...form.register('title')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Work order title"
            />
            {form.formState.errors.title && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              {...form.register('description')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Detailed description of the work required"
              rows={3}
            />
            {form.formState.errors.description && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enterprise <span className="text-red-500">*</span>
              </label>
              <select
                {...form.register('enterprise_id')}
                onChange={(e) => {
                  setSelectedEnterprise(e.target.value);
                  form.setValue('enterprise_id', e.target.value);
                  form.setValue('site_id', ''); // Reset site when enterprise changes
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Enterprise</option>
                {enterprises.map((enterprise) => (
                  <option key={enterprise.id} value={enterprise.id}>
                    {enterprise.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.enterprise_id && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.enterprise_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site <span className="text-red-500">*</span>
              </label>
              <select
                {...form.register('site_id')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!selectedEnterprise && !form.watch('enterprise_id')}
              >
                <option value="">Select Site</option>
                {filteredSites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.site_id && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.site_id.message}</p>
              )}
            </div>
          </div>

          {/* Location Hierarchy */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">📍 Location Details</h3>
            <LocationSelector
              siteId={locationData.siteId || form.watch('site_id')}
              buildingId={locationData.buildingId}
              floorId={locationData.floorId}
              spaceId={locationData.spaceId}
              onSiteChange={(id) => {
                setLocationData(prev => ({ ...prev, siteId: id }));
                form.setValue('site_id', id);
              }}
              onBuildingChange={(id) => {
                setLocationData(prev => ({ ...prev, buildingId: id }));
                form.setValue('building_id', id);
              }}
              onFloorChange={(id) => {
                setLocationData(prev => ({ ...prev, floorId: id }));
                form.setValue('floor_id', id);
              }}
              onSpaceChange={(id) => {
                setLocationData(prev => ({ ...prev, spaceId: id }));
                form.setValue('space_id', id);
              }}
              showLabels={false}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
            <select
              {...form.register('asset_id')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Asset (Optional)</option>
              {assets
                .filter(asset => !form.watch('site_id') || asset.site_id === form.watch('site_id'))
                .map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} ({asset.asset_tag}) - {asset.type}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                {...form.register('priority')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                {...form.register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pending">Pending</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="in_progress">In Progress</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
            <select
              {...form.register('assigned_to')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Unassigned</option>
              {users
                .filter(user => user.role === 'technician' || user.role === 'manager')
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {user.role}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
              <input
                {...form.register('scheduled_date')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                {...form.register('due_date')}
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {form.formState.errors.due_date && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.due_date.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attachments (Pictures & Documents)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                onChange={handleFileChange}
                disabled={isUploading}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Upload className="w-3 h-3" />
                Supported: Images (JPG, PNG), PDF, Word, Excel (Max 10MB per file)
              </p>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-700">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">{uploadProgress}</span>
                </div>
              </div>
            )}

            {/* Upload Error */}
            {uploadError && (
              <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{uploadError}</span>
                </div>
              </div>
            )}

            {selectedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-gray-700">Selected Files ({selectedFiles.length}):</p>
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      disabled={isUploading}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CrudModal>

      {/* Delete Confirmation */}
      <DeleteConfirmation
        isOpen={!!deleteWorkOrder}
        itemName={deleteWorkOrder?.title || ''}
        onConfirm={handleDelete}
        onClose={() => setDeleteWorkOrder(null)}
        isDeleting={deleteMutation.isPending}
      />
    </DesktopLayout>
  );
}
