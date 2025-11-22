import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { api, handleApiError } from '@/lib/api';
import { toast } from 'react-hot-toast';
import type {
  WorkOrder,
  Asset,
  Client,
  Project,
  Site,
  User,
  PPMSchedule,
  WorkOrderActivity,
  WorkOrderFilters,
  AssetFilters,
  PaginationParams,
} from '@/types';

// ============================================================================
// Query Keys
// ============================================================================

export const queryKeys = {
  workOrders: (filters?: WorkOrderFilters & PaginationParams) => ['workOrders', filters] as const,
  workOrder: (id: string) => ['workOrder', id] as const,
  workOrderActivities: (id: string) => ['workOrderActivities', id] as const,
  
  assets: (filters?: AssetFilters & PaginationParams) => ['assets', filters] as const,
  asset: (id: string) => ['asset', id] as const,
  
  clients: (params?: PaginationParams) => ['clients', params] as const,
  client: (id: string) => ['client', id] as const,
  
  projects: (params?: PaginationParams) => ['projects', params] as const,
  project: (id: string) => ['project', id] as const,
  
  sites: (params?: PaginationParams) => ['sites', params] as const,
  site: (id: string) => ['site', id] as const,
  
  users: (params?: PaginationParams) => ['users', params] as const,
  user: (id: string) => ['user', id] as const,
  
  ppm: (params?: PaginationParams) => ['ppm', params] as const,
  ppmSchedule: (id: string) => ['ppmSchedule', id] as const,
  
  analytics: () => ['analytics'] as const,
};

// ============================================================================
// Work Order Hooks
// ============================================================================

export function useWorkOrders(filters?: WorkOrderFilters & PaginationParams) {
  return useQuery({
    queryKey: queryKeys.workOrders(filters),
    queryFn: async () => {
      const response = await api.workOrders.getAll(filters);
      return response.data?.data?.work_orders || [];
    },
  });
}

export function useWorkOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.workOrder(id),
    queryFn: async () => {
      const response = await api.workOrders.getById(id);
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useWorkOrderActivities(workOrderId: string) {
  return useQuery({
    queryKey: queryKeys.workOrderActivities(workOrderId),
    queryFn: async () => {
      const response = await api.workOrders.getActivities(workOrderId);
      return response.data.data;
    },
    enabled: !!workOrderId,
  });
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<WorkOrder>) => api.workOrders.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      toast.success('Work order created successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useUpdateWorkOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WorkOrder> }) =>
      api.workOrders.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.workOrder(variables.id) });
      toast.success('Work order updated successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useDeleteWorkOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.workOrders.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      toast.success('Work order deleted successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useAddActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ workOrderId, data }: { workOrderId: string; data: Partial<WorkOrderActivity> }) =>
      api.workOrders.addActivity(workOrderId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workOrderActivities(variables.workOrderId) });
      toast.success('Activity added successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useEnhanceDescription() {
  return useMutation({
    mutationFn: ({ workOrderId, description }: { workOrderId: string; description: string }) =>
      api.workOrders.enhanceDescription(workOrderId, description),
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

// ============================================================================
// Asset Hooks
// ============================================================================

export function useAssets(filters?: AssetFilters & PaginationParams) {
  return useQuery({
    queryKey: queryKeys.assets(filters),
    queryFn: async () => {
      const response = await api.assets.getAll(filters);
      return response.data?.data?.assets || [];
    },
  });
}

export function useAsset(id: string) {
  return useQuery({
    queryKey: queryKeys.asset(id),
    queryFn: async () => {
      const response = await api.assets.getById(id);
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Asset>) => api.assets.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset created successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Asset> }) =>
      api.assets.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.asset(variables.id) });
      toast.success('Asset updated successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.assets.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset deleted successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

// ============================================================================
// Client Hooks
// ============================================================================

export function useClients(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.clients(params),
    queryFn: async () => {
      const response = await api.clients.getAll(params);
      return response.data?.data?.clients || [];
    },
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Client>) => api.clients.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client created successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Client> }) =>
      api.clients.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client updated successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.clients.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client deleted successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

// ============================================================================
// Project Hooks
// ============================================================================

export function useProjects(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.projects(params),
    queryFn: async () => {
      const response = await api.projects.getAll(params);
      return response.data?.data?.projects || [];
    },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Project>) => api.projects.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) =>
      api.projects.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project updated successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.projects.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

// ============================================================================
// Site Hooks
// ============================================================================

export function useSites(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.sites(params),
    queryFn: async () => {
      const response = await api.sites.getAll(params);
      return response.data?.data?.sites || [];
    },
  });
}

export function useCreateSite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Site>) => api.sites.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      toast.success('Site created successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useUpdateSite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Site> }) =>
      api.sites.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      toast.success('Site updated successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useDeleteSite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.sites.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      toast.success('Site deleted successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

// ============================================================================
// User Hooks
// ============================================================================

export function useUsers(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.users(params),
    queryFn: async () => {
      const response = await api.users.getAll(params);
      return response.data?.data?.users || [];
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<User>) => api.users.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      api.users.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.users.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

// ============================================================================
// PPM Hooks
// ============================================================================

export function usePPMSchedules(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.ppm(params),
    queryFn: async () => {
      const response = await api.ppm.getAll(params);
      return response.data?.data?.ppm_plans || [];
    },
  });
}

export function useCreatePPM() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<PPMSchedule>) => api.ppm.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ppm'] });
      toast.success('PPM schedule created successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useUpdatePPM() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PPMSchedule> }) =>
      api.ppm.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ppm'] });
      toast.success('PPM schedule updated successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useDeletePPM() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.ppm.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ppm'] });
      toast.success('PPM schedule deleted successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

// ============================================================================
// Analytics Hooks
// ============================================================================

export function useAnalytics() {
  return useQuery({
    queryKey: queryKeys.analytics(),
    queryFn: async () => {
      const response = await api.analytics.getDashboardStats();
      return response.data.data;
    },
  });
}

// ============================================================================
// Templates Hooks
// ============================================================================

export function useTemplates(params?: { category?: string; is_active?: boolean; priority?: string }) {
  return useQuery({
    queryKey: ['templates', params],
    queryFn: async () => {
      const response = await api.templates.getAll(params);
      return response.data.data;
    },
  });
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: ['templates', id],
    queryFn: async () => {
      const response = await api.templates.getById(id);
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useTemplateCategories() {
  return useQuery({
    queryKey: ['templates', 'categories'],
    queryFn: async () => {
      const response = await api.templates.getCategories();
      return response.data.data;
    },
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => api.templates.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template created successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.templates.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template updated successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.templates.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template deleted successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

// ============================================================================
// SLA Hooks
// ============================================================================

export function useSLAPolicies(params?: { priority?: string; is_active?: boolean }) {
  return useQuery({
    queryKey: ['sla-policies', params],
    queryFn: async () => {
      const response = await api.sla.policies.getAll(params);
      return response.data.data;
    },
  });
}

export function useSLAPolicy(id: string) {
  return useQuery({
    queryKey: ['sla-policies', id],
    queryFn: async () => {
      const response = await api.sla.policies.getById(id);
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateSLAPolicy() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => api.sla.policies.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-policies'] });
      toast.success('SLA policy created successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useUpdateSLAPolicy() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.sla.policies.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-policies'] });
      toast.success('SLA policy updated successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useDeleteSLAPolicy() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.sla.policies.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-policies'] });
      toast.success('SLA policy deleted successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useSLAViolations(params?: { work_order_id?: string; violation_type?: string; escalation_level?: number }) {
  return useQuery({
    queryKey: ['sla-violations', params],
    queryFn: async () => {
      const response = await api.sla.violations.getAll(params);
      return response.data.data;
    },
  });
}

// ============================================================================
// Inventory Hooks
// ============================================================================

export function useInventoryItems(params?: { category?: string; is_active?: boolean; low_stock?: boolean }) {
  return useQuery({
    queryKey: ['inventory-items', params],
    queryFn: async () => {
      const response = await api.inventory.items.getAll(params);
      return response.data.data;
    },
  });
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: ['inventory-items', id],
    queryFn: async () => {
      const response = await api.inventory.items.getById(id);
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useInventoryCategories() {
  return useQuery({
    queryKey: ['inventory', 'categories'],
    queryFn: async () => {
      const response = await api.inventory.items.getCategories();
      return response.data.data;
    },
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => api.inventory.items.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success('Inventory item created successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.inventory.items.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success('Inventory item updated successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.inventory.items.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success('Inventory item deleted successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function usePartsUsage(params?: { work_order_id?: string }) {
  return useQuery({
    queryKey: ['parts-usage', params],
    queryFn: async () => {
      const response = await api.inventory.partsUsage.getAll(params);
      return response.data.data;
    },
  });
}

export function useRecordPartsUsage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => api.inventory.partsUsage.record(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts-usage'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success('Parts usage recorded successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useInventoryTransactions(params?: { inventory_item_id?: string; transaction_type?: string }) {
  return useQuery({
    queryKey: ['inventory-transactions', params],
    queryFn: async () => {
      const response = await api.inventory.transactions.getAll(params);
      return response.data.data;
    },
  });
}

// ============================================================================
// Attachments Hooks
// ============================================================================

export function useWorkOrderAttachments(workOrderId?: string) {
  return useQuery({
    queryKey: ['work-order-attachments', workOrderId],
    queryFn: async () => {
      const response = await api.attachments.workOrders.getAll({ work_order_id: workOrderId });
      return response.data.data;
    },
    enabled: !!workOrderId,
  });
}

export function useUploadWorkOrderAttachment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (formData: FormData) => api.attachments.workOrders.upload(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order-attachments'] });
      toast.success('File uploaded successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useDeleteWorkOrderAttachment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.attachments.workOrders.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order-attachments'] });
      toast.success('Attachment deleted successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useAssetDocuments(assetId?: string, documentType?: string) {
  return useQuery({
    queryKey: ['asset-documents', assetId, documentType],
    queryFn: async () => {
      const response = await api.attachments.assets.getAll({ 
        asset_id: assetId, 
        document_type: documentType 
      });
      return response.data.data;
    },
    enabled: !!assetId,
  });
}

export function useUploadAssetDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (formData: FormData) => api.attachments.assets.upload(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-documents'] });
      toast.success('Document uploaded successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useDeleteAssetDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.attachments.assets.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-documents'] });
      toast.success('Document deleted successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

// ============================================================================
// Notifications Hooks
// ============================================================================

export function useNotifications(params?: { is_read?: boolean; notification_type?: string; priority?: string }) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: async () => {
      const response = await api.notifications.getAll(params);
      return response.data.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const response = await api.notifications.getUnreadCount();
      return response.data.count;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.notifications.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => api.notifications.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      toast.success('All notifications marked as read');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.notifications.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      toast.success('Notification deleted successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

// Analytics Hooks
export function useDashboardStats(timeRange: string = '30') {
  return useQuery({
    queryKey: ['analytics-dashboard', timeRange],
    queryFn: () => api.analytics.getDashboardStats({ timeRange }),
    refetchInterval: 60000, // Refetch every 60 seconds for real-time updates
  });
}

export function useRealTimeMetrics() {
  return useQuery({
    queryKey: ['analytics-real-time'],
    queryFn: () => api.analytics.getRealTimeMetrics(),
    refetchInterval: 30000, // Refetch every 30 seconds for real-time data
  });
}

export function useAnalyticsTrends(period: string = '30') {
  return useQuery({
    queryKey: ['analytics-trends', period],
    queryFn: () => api.analytics.getTrends(period),
  });
}

export function useAssetReliability() {
  return useQuery({
    queryKey: ['analytics-asset-reliability'],
    queryFn: () => api.analytics.getAssetReliability(),
  });
}

export function useTechnicianPerformance() {
  return useQuery({
    queryKey: ['analytics-technician-performance'],
    queryFn: () => api.analytics.getTechnicianPerformance(),
  });
}

export function useAnalyticsMTTR() {
  return useQuery({
    queryKey: ['analytics-mttr'],
    queryFn: () => api.analytics.getMTTR(),
  });
}

export function useAnalyticsBySource() {
  return useQuery({
    queryKey: ['analytics-by-source'],
    queryFn: () => api.analytics.getBySource(),
  });
}

// ============================================================================
// Enterprise Location Hooks (Buildings, Floors, Spaces)
// ============================================================================

export function useBuildings(params?: { site_id?: string; search?: string } & PaginationParams) {
  return useQuery({
    queryKey: ['buildings', params],
    queryFn: async () => {
      const response = await api.buildings.getAll(params);
      return response.data?.data || [];
    },
  });
}

export function useBuilding(id: number) {
  return useQuery({
    queryKey: ['building', id],
    queryFn: async () => {
      const response = await api.buildings.getById(id);
      return response.data?.data;
    },
    enabled: !!id,
  });
}

export function useCreateBuilding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.buildings.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      toast.success('Building created successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useUpdateBuilding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.buildings.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      toast.success('Building updated successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useDeleteBuilding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.buildings.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      toast.success('Building deleted successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useFloors(params?: { building_id?: number } & PaginationParams) {
  return useQuery({
    queryKey: ['floors', params],
    queryFn: async () => {
      const response = await api.floors.getAll(params);
      return response.data?.data || [];
    },
  });
}

export function useFloor(id: number) {
  return useQuery({
    queryKey: ['floor', id],
    queryFn: async () => {
      const response = await api.floors.getById(id);
      return response.data?.data;
    },
    enabled: !!id,
  });
}

export function useCreateFloor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.floors.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floors'] });
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      toast.success('Floor created successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useUpdateFloor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.floors.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floors'] });
      toast.success('Floor updated successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useDeleteFloor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.floors.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floors'] });
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      toast.success('Floor deleted successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useSpaces(params?: { floor_id?: number; space_type?: string } & PaginationParams) {
  return useQuery({
    queryKey: ['spaces', params],
    queryFn: async () => {
      const response = await api.spaces.getAll(params);
      return response.data?.data || [];
    },
  });
}

export function useSpace(id: number) {
  return useQuery({
    queryKey: ['space', id],
    queryFn: async () => {
      const response = await api.spaces.getById(id);
      return response.data?.data;
    },
    enabled: !!id,
  });
}

export function useCreateSpace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.spaces.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['floors'] });
      toast.success('Space created successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useUpdateSpace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.spaces.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      toast.success('Space updated successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useDeleteSpace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.spaces.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['floors'] });
      toast.success('Space deleted successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

// ============================================================================
// Parts & Inventory Hooks
// ============================================================================

export function useParts(params?: { search?: string; category_id?: number; low_stock?: boolean } & PaginationParams) {
  return useQuery({
    queryKey: ['parts', params],
    queryFn: async () => {
      const response = await api.parts.getAll(params);
      return response.data?.data || [];
    },
  });
}

export function usePart(id: number) {
  return useQuery({
    queryKey: ['part', id],
    queryFn: async () => {
      const response = await api.parts.getById(id);
      return response.data?.data;
    },
    enabled: !!id,
  });
}

export function useLowStockParts() {
  return useQuery({
    queryKey: ['parts', 'low-stock'],
    queryFn: async () => {
      const response = await api.parts.getLowStock();
      return response.data?.data || [];
    },
  });
}

export function useCreatePart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.parts.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      toast.success('Part created successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useUpdatePart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.parts.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      toast.success('Part updated successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useDeletePart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.parts.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      toast.success('Part deleted successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useStorerooms(params?: { organization_id?: number; site_id?: string } & PaginationParams) {
  return useQuery({
    queryKey: ['storerooms', params],
    queryFn: async () => {
      const response = await api.storerooms.getAll(params);
      return response.data?.data || [];
    },
  });
}

export function useStoreroom(id: number) {
  return useQuery({
    queryKey: ['storeroom', id],
    queryFn: async () => {
      const response = await api.storerooms.getById(id);
      return response.data?.data;
    },
    enabled: !!id,
  });
}

export function useCreateStoreroom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.storerooms.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storerooms'] });
      toast.success('Storeroom created successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useUpdateStoreroom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.storerooms.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storerooms'] });
      toast.success('Storeroom updated successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useDeleteStoreroom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.storerooms.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storerooms'] });
      toast.success('Storeroom deleted successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

// ============================================================================
// Vendor Hooks
// ============================================================================

export function useVendors(params?: { vendor_type?: string; search?: string } & PaginationParams) {
  return useQuery({
    queryKey: ['vendors', params],
    queryFn: async () => {
      const response = await api.vendors.getAll(params);
      return response.data?.data || [];
    },
  });
}

export function useVendor(id: number) {
  return useQuery({
    queryKey: ['vendor', id],
    queryFn: async () => {
      const response = await api.vendors.getById(id);
      return response.data?.data;
    },
    enabled: !!id,
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.vendors.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor created successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useUpdateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.vendors.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor updated successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useDeleteVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.vendors.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor deleted successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

// ============================================================================
// Team Hooks
// ============================================================================

export function useTeams(params?: { organization_id?: number } & PaginationParams) {
  return useQuery({
    queryKey: ['teams', params],
    queryFn: async () => {
      const response = await api.teams.getAll(params);
      return response.data?.data || [];
    },
  });
}

export function useTeam(id: number) {
  return useQuery({
    queryKey: ['team', id],
    queryFn: async () => {
      const response = await api.teams.getById(id);
      return response.data?.data;
    },
    enabled: !!id,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.teams.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team created successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.teams.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team updated successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.teams.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team deleted successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: number; userId: number }) => 
      api.teams.addMember(teamId, userId),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Member added to team');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: number; userId: number }) => 
      api.teams.removeMember(teamId, userId),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Member removed from team');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

// ============================================================================
// Role Hooks
// ============================================================================

export function useRoles(params?: { organization_id?: number } & PaginationParams) {
  return useQuery({
    queryKey: ['roles', params],
    queryFn: async () => {
      const response = await api.roles.getAll(params);
      return response.data?.data || [];
    },
  });
}

export function useRole(id: number) {
  return useQuery({
    queryKey: ['role', id],
    queryFn: async () => {
      const response = await api.roles.getById(id);
      return response.data?.data;
    },
    enabled: !!id,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.roles.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role created successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.roles.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role updated successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.roles.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role deleted successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

// ============================================================================
// Asset Category & Type Hooks
// ============================================================================

export function useAssetCategories(params?: { organization_id?: number; parent_id?: number } & PaginationParams) {
  return useQuery({
    queryKey: ['asset-categories', params],
    queryFn: async () => {
      const response = await api.assetCategories.getAll(params);
      return response.data?.data || [];
    },
  });
}

export function useAssetCategory(id: number) {
  return useQuery({
    queryKey: ['asset-category', id],
    queryFn: async () => {
      const response = await api.assetCategories.getById(id);
      return response.data?.data;
    },
    enabled: !!id,
  });
}

export function useCreateAssetCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.assetCategories.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-categories'] });
      toast.success('Asset category created successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useUpdateAssetCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.assetCategories.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-categories'] });
      toast.success('Asset category updated successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useDeleteAssetCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.assetCategories.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-categories'] });
      toast.success('Asset category deleted successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useAssetTypes(params?: { category_id?: number } & PaginationParams) {
  return useQuery({
    queryKey: ['asset-types', params],
    queryFn: async () => {
      const response = await api.assetTypes.getAll(params);
      return response.data?.data || [];
    },
  });
}

export function useAssetType(id: number) {
  return useQuery({
    queryKey: ['asset-type', id],
    queryFn: async () => {
      const response = await api.assetTypes.getById(id);
      return response.data?.data;
    },
    enabled: !!id,
  });
}

export function useCreateAssetType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.assetTypes.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-types'] });
      queryClient.invalidateQueries({ queryKey: ['asset-categories'] });
      toast.success('Asset type created successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useUpdateAssetType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.assetTypes.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-types'] });
      toast.success('Asset type updated successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useDeleteAssetType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.assetTypes.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-types'] });
      queryClient.invalidateQueries({ queryKey: ['asset-categories'] });
      toast.success('Asset type deleted successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}
