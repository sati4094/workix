'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DesktopLayout } from '@/components/desktop-layout';
import { DataTable } from '@/components/DataTable';
import { CrudModal } from '@/components/CrudModal';
import { SearchFilter } from '@/components/SearchFilter';
import { DeleteConfirmation } from '@/components/DeleteConfirmation';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useApi';
import { userSchema } from '@/lib/validation';
import type { User, CreateUserDTO } from '@/types';

export default function UsersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: users = [], isLoading } = useUsers();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const form = useForm<CreateUserDTO>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: '', email: '', phone: '', role: 'technician', status: 'active', department: '', job_title: '', employee_id: '' },
  });

  const filteredUsers = useMemo(() => {
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
    const colors = { admin: 'bg-red-100 text-red-800', manager: 'bg-purple-100 text-purple-800', technician: 'bg-blue-100 text-blue-800', client: 'bg-gray-100 text-gray-800' };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  return (
    <DesktopLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Users</h1>
            <p className="text-gray-600 mt-2">Manage system users and permissions</p>
          </div>
          <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">+ New User</button>
        </div>

        <SearchFilter onSearchChange={setSearchTerm} searchPlaceholder="Search users..." filters={[
          { key: 'role', label: 'Role', type: 'select' as const, options: [{ value: '', label: 'All' }, { value: 'admin', label: 'Admin' }, { value: 'manager', label: 'Manager' }, { value: 'technician', label: 'Technician' }, { value: 'client', label: 'Client' }] },
          { key: 'status', label: 'Status', type: 'select' as const, options: [{ value: '', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] }
        ]} onFilterChange={(key, value) => { if (key === 'role') setRoleFilter(value as string); else if (key === 'status') setStatusFilter(value as string); }} />

        <DataTable data={filteredUsers} loading={isLoading} keyExtractor={(u: User) => u.id} columns={[
          { key: 'name', label: 'Name', render: (_: any, u: User) => <span className="font-medium">{u.name}</span> },
          { key: 'email', label: 'Email', render: (_: any, u: User) => <span className="text-sm">{u.email}</span> },
          { key: 'employee_id', label: 'Employee ID', render: (_: any, u: User) => <span className="text-sm">{u.employee_id || '-'}</span> },
          { key: 'role', label: 'Role', render: (_: any, u: User) => <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadge(u.role)}`}>{u.role}</span> },
          { key: 'status', label: 'Status', render: (_: any, u: User) => <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(u.status)}`}>{u.status}</span> },
          { key: 'phone', label: 'Phone', render: (_: any, u: User) => <span className="text-sm">{u.phone || '-'}</span> },
        ]} actions={(u: User) => (<><button onClick={(e) => { e.stopPropagation(); handleEdit(u); }} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button><button onClick={(e) => { e.stopPropagation(); setDeleteUser(u); }} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button></>)} />
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
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="technician">Technician</option>
                <option value="client">Client</option>
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
