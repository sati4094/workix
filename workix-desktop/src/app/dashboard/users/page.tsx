'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DesktopLayout } from '@/components/desktop-layout';
import { DataTable } from '@/components/DataTable';
import { CrudModal } from '@/components/CrudModal';
import { SearchFilter } from '@/components/SearchFilter';
import { DeleteConfirmation } from '@/components/DeleteConfirmation';
import { PermissionMatrix } from '@/components/PermissionMatrix';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useApi';
import { userSchema } from '@/lib/validation';
import type { User, CreateUserDTO } from '@/types';
import { useAuthStore } from '@/store';

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'permissions'>('users');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Permission Matrix state
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  
  const { user } = useAuthStore();

  const { data: users = [], isLoading } = useUsers();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const form = useForm<CreateUserDTO>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: '', email: '', phone: '', role: 'technician', status: 'active', department: '', job_title: '', employee_id: '' },
  });

  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];
    let filtered = users;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((u: User) => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) || u.employee_id?.toLowerCase().includes(term));
    }
    if (roleFilter) filtered = filtered.filter((u: User) => u.role === roleFilter);
    if (statusFilter) filtered = filtered.filter((u: User) => u.status === statusFilter);
    return filtered;
  }, [users, searchTerm, roleFilter, statusFilter]);

  const handleCreate = () => {
    setEditingUser(null);
    form.reset({ name: '', email: '', phone: '', role: 'technician', status: 'active', department: '', job_title: '', employee_id: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.reset({ name: user.name, email: user.email, phone: user.phone || '', role: user.role, status: user.status, department: user.department || '', job_title: user.job_title || '', employee_id: user.employee_id || '' });
    setIsModalOpen(true);
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    if (editingUser) await updateMutation.mutateAsync({ id: editingUser.id, data });
    else await createMutation.mutateAsync(data);
    setIsModalOpen(false);
  });

  const handleDelete = async () => {
    if (deleteUser) {
      await deleteMutation.mutateAsync(deleteUser.id);
      setDeleteUser(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = { admin: 'bg-red-100 text-red-800', manager: 'bg-purple-100 text-purple-800', technician: 'bg-purple-100 text-purple-800', client: 'bg-gray-100 text-gray-800' };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  // Fetch roles and permissions for Permission Matrix
  useEffect(() => {
    if (activeTab === 'permissions' && user?.role && ['admin', 'superadmin'].includes(user.role.toLowerCase())) {
      fetchPermissionMatrix();
    }
  }, [activeTab, user]);

  const fetchPermissionMatrix = async () => {
    try {
      setPermissionsLoading(true);
      const response = await fetch('http://localhost:5000/api/v1/permissions/matrix', {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch permission matrix');
      
      const data = await response.json();
      setRoles(data.data.roles || []);
      setPermissions(data.data.permissions || []);
      
      // Convert role_permissions object to roleId -> permissionId[] format
      const rolePerms: Record<string, string[]> = {};
      Object.entries(data.data.rolePermissions || {}).forEach(([roleId, perms]: [string, any]) => {
        rolePerms[roleId] = Object.entries(perms)
          .filter(([_, granted]) => granted)
          .map(([permId]) => permId);
      });
      setRolePermissions(rolePerms);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const handlePermissionToggle = async (roleId: string, permissionId: string, granted: boolean) => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/roles/${roleId}/permissions/${permissionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ granted })
      });
      
      if (!response.ok) throw new Error('Failed to update permission');
      
      // Update local state
      setRolePermissions(prev => {
        const updated = { ...prev };
        if (!updated[roleId]) updated[roleId] = [];
        
        if (granted) {
          if (!updated[roleId].includes(permissionId)) {
            updated[roleId] = [...updated[roleId], permissionId];
          }
        } else {
          updated[roleId] = updated[roleId].filter(id => id !== permissionId);
        }
        
        return updated;
      });
    } catch (error) {
      console.error('Failed to toggle permission:', error);
      alert('Failed to update permission. Please try again.');
    }
  };

  // Check if user can access permission matrix
  const canManagePermissions = user?.role && ['admin', 'superadmin'].includes(user.role.toLowerCase());

  return (
    <DesktopLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Users & Permissions</h1>
            <p className="text-gray-600 mt-2">Manage system users and role permissions</p>
          </div>
          {activeTab === 'users' && (
            <button onClick={handleCreate} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md">+ New User</button>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'users'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Management
            </button>
            {canManagePermissions && (
              <button
                onClick={() => setActiveTab('permissions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'permissions'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Permission Matrix
              </button>
            )}
          </nav>
        </div>

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <>
            <SearchFilter onSearchChange={setSearchTerm} searchPlaceholder="Search users..." filters={[
              { key: 'role', label: 'Role', type: 'select' as const, options: [
                { value: '', label: 'All Roles' },
                { value: 'superadmin', label: 'SuperAdmin' },
                { value: 'supertech', label: 'SuperTech' },
                { value: 'admin', label: 'Admin' },
                { value: 'portfolio_manager', label: 'Portfolio Manager' },
                { value: 'facility_manager', label: 'Facility Manager' },
                { value: 'engineer', label: 'Engineer' },
                { value: 'technician', label: 'Technician' },
                { value: 'basic_user', label: 'Basic User' }
              ]},
              { key: 'status', label: 'Status', type: 'select' as const, options: [{ value: '', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] }
            ]} onFilterChange={(key, value) => { if (key === 'role') setRoleFilter(value as string); else if (key === 'status') setStatusFilter(value as string); }} />

            <DataTable data={filteredUsers} loading={isLoading} keyExtractor={(u: User) => u.id} columns={[
          { key: 'name', label: 'Name', render: (_: any, u: User) => <span className="font-medium">{u.name}</span> },
          { key: 'email', label: 'Email', render: (_: any, u: User) => <span className="text-sm">{u.email}</span> },
          { key: 'employee_id', label: 'Employee ID', render: (_: any, u: User) => <span className="text-sm">{u.employee_id || '-'}</span> },
          { key: 'role', label: 'Role', render: (_: any, u: User) => <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadge(u.role)}`}>{u.role}</span> },
          { key: 'status', label: 'Status', render: (_: any, u: User) => <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(u.status)}`}>{u.status}</span> },
          { key: 'phone', label: 'Phone', render: (_: any, u: User) => <span className="text-sm">{u.phone || '-'}</span> },
        ]} actions={(u: User) => (<><button onClick={(e) => { e.stopPropagation(); handleEdit(u); }} className="text-purple-600 hover:text-purple-800 text-sm font-medium">Edit</button><button onClick={(e) => { e.stopPropagation(); setDeleteUser(u); }} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button></>)} />
          </>
        )}

        {/* Permission Matrix Tab */}
        {activeTab === 'permissions' && canManagePermissions && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            {permissionsLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <PermissionMatrix
                currentUserRole={user?.role?.toLowerCase() || 'technician'}
                currentUserLevel={user?.role?.toLowerCase() === 'superadmin' ? 0 : user?.role?.toLowerCase() === 'admin' ? 2 : 7}
                roles={roles}
                permissions={permissions}
                rolePermissions={rolePermissions}
                onPermissionToggle={handlePermissionToggle}
              />
            )}
          </div>
        )}
      </div>

      <CrudModal isOpen={isModalOpen} title={editingUser ? 'Edit User' : 'New User'} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit} submitText={editingUser ? 'Update' : 'Create'} isSubmitting={createMutation.isPending || updateMutation.isPending} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
              <input {...form.register('name')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Full name" />
              {form.formState.errors.name && <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
              <input {...form.register('email')} type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="email@example.com" />
              {form.formState.errors.email && <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
              <input {...form.register('employee_id')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="EMP-001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input {...form.register('phone')} type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="+1 (555) 123-4567" />
              {form.formState.errors.phone && <p className="text-red-500 text-sm mt-1">{form.formState.errors.phone.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input {...form.register('department')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Maintenance" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
              <input {...form.register('job_title')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Senior Technician" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select {...form.register('role')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="superadmin">SuperAdmin (L0)</option>
                <option value="supertech">SuperTech (L1)</option>
                <option value="admin">Admin (L2)</option>
                <option value="portfolio_manager">Portfolio Manager (L3)</option>
                <option value="facility_manager">Facility Manager (L4)</option>
                <option value="engineer">Engineer (L5)</option>
                <option value="technician">Technician (L6)</option>
                <option value="basic_user">Basic User (L7)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select {...form.register('status')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input {...form.register('phone')} type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="+1 (555) 123-4567" />
            {form.formState.errors.phone && <p className="text-red-500 text-sm mt-1">{form.formState.errors.phone.message}</p>}
          </div>
        </div>
      </CrudModal>

      <DeleteConfirmation isOpen={!!deleteUser} itemName={deleteUser?.name || ''} onConfirm={handleDelete} onClose={() => setDeleteUser(null)} isDeleting={deleteMutation.isPending} />
    </DesktopLayout>
  );
}
