'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiService } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getStatusColor } from '@/lib/utils'
import { Plus, Search, Edit, Trash2, X } from 'lucide-react'
import { PermissionMatrix } from '@/components/PermissionMatrix'
import { useAuthStore } from '@/store/authStore'

export default function UsersPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'users' | 'permissions'>('users')
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  
  // Permission Matrix state
  const [roles, setRoles] = useState<any[]>([])
  const [permissions, setPermissions] = useState<any[]>([])
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({})
  const [permissionsLoading, setPermissionsLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [roleFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params: any = { limit: 100 }
      if (roleFilter !== 'all') params.role = roleFilter
      
      const response: any = await apiService.getUsers(params)
      setUsers(response.data.users || [])
    } catch (error) {
      console.error('Failed to fetch users:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to deactivate ${userName}?`)) return

    try {
      await apiService.deleteUser(userId)
      alert('User deactivated successfully!')
      fetchUsers()
    } catch (error: any) {
      alert(error.message || 'Failed to deactivate user')
    }
  }

  // Fetch permission matrix when tab changes
  useEffect(() => {
    if (activeTab === 'permissions' && user?.role && ['admin', 'superadmin'].includes(user.role.toLowerCase())) {
      fetchPermissionMatrix()
    }
  }, [activeTab, user])

  const fetchPermissionMatrix = async () => {
    try {
      setPermissionsLoading(true)
      const response = await fetch('http://localhost:5000/api/v1/permissions/matrix', {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch permission matrix')
      
      const data = await response.json()
      setRoles(data.data.roles || [])
      setPermissions(data.data.permissions || [])
      
      // Convert role_permissions object to roleId -> permissionId[] format
      const rolePerms: Record<string, string[]> = {}
      Object.entries(data.data.rolePermissions || {}).forEach(([roleId, perms]: [string, any]) => {
        rolePerms[roleId] = Object.entries(perms)
          .filter(([_, granted]) => granted)
          .map(([permId]) => permId)
      })
      setRolePermissions(rolePerms)
    } catch (error) {
      console.error('Failed to fetch permissions:', error)
    } finally {
      setPermissionsLoading(false)
    }
  }

  const handlePermissionToggle = async (roleId: string, permissionId: string, granted: boolean) => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/roles/${roleId}/permissions/${permissionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ granted })
      })
      
      if (!response.ok) throw new Error('Failed to update permission')
      
      // Update local state
      setRolePermissions(prev => {
        const updated = { ...prev }
        if (!updated[roleId]) updated[roleId] = []
        
        if (granted) {
          if (!updated[roleId].includes(permissionId)) {
            updated[roleId] = [...updated[roleId], permissionId]
          }
        } else {
          updated[roleId] = updated[roleId].filter(id => id !== permissionId)
        }
        
        return updated
      })
    } catch (error) {
      console.error('Failed to toggle permission:', error)
      alert('Failed to update permission. Please try again.')
    }
  }

  const canManagePermissions = user?.role && ['admin', 'superadmin'].includes(user.role.toLowerCase())

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.team?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600">Manage system users and technicians</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'users'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          User Management
        </button>
        {canManagePermissions && (
          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'permissions'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Permission Matrix
          </button>
        )}
      </div>

      {/* User Management Tab */}
      {activeTab === 'users' && (
        <>
          {/* Filters */}
          <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="analyst">Analyst</option>
              <option value="technician">Technician</option>
              <option value="enterprise">Enterprise User</option>
            </select>

            <Button variant="outline" onClick={fetchUsers}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Team</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Phone</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-600">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{user.name}</td>
                        <td className="py-3 px-4 text-gray-600">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            {user.role?.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{user.team || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(user.status)}`}>
                            {user.status?.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{user.phone || '-'}</td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteUser(user.id, user.name)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit User Modal */}
      {(showCreateModal || editingUser) && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowCreateModal(false)
            setEditingUser(null)
          }}
          onSuccess={() => {
            setShowCreateModal(false)
            setEditingUser(null)
            fetchUsers()
          }}
        />
      )}
    </div>
  )
}

function UserModal({ user, onClose, onSuccess }: { user?: any, onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: user?.email || '',
    password: '',
    name: user?.name || '',
    role: user?.role || 'technician',
    phone: user?.phone || '',
    team: user?.team || '',
    status: user?.status || 'active',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.name || !formData.role) {
      alert('Please fill in all required fields')
      return
    }

    if (!user && !formData.password) {
      alert('Password is required for new users')
      return
    }

    try {
      setLoading(true)
      if (user) {
        await apiService.updateUser(user.id, formData)
        alert('User updated successfully!')
      } else {
        await apiService.createUser(formData)
        alert('User created successfully!')
      }
      onSuccess()
    } catch (error: any) {
      alert(error.message || `Failed to ${user ? 'update' : 'create'} user`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{user ? 'Edit User' : 'Create New User'}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={!!user}
                />
              </div>
            </div>

            {!user && (
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 8 characters"
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Role *</Label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="technician">Technician</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="analyst">Analyst</option>
                  <option value="client">Client</option>
                </select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1-555-0100"
                />
              </div>
              <div>
                <Label htmlFor="team">Team</Label>
                <Input
                  id="team"
                  value={formData.team}
                  onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                  placeholder="e.g., Field Team A"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : (user ? 'Update User' : 'Create User')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
        </>
      )}

      {/* Permission Matrix Tab */}
      {activeTab === 'permissions' && canManagePermissions && (
        <div className="space-y-6">
          {permissionsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <PermissionMatrix
              currentUserRole={user?.role?.toLowerCase() || ''}
              currentUserLevel={user?.role?.toLowerCase() === 'superadmin' ? 0 : 2}
              roles={roles}
              permissions={permissions}
              rolePermissions={rolePermissions}
              onPermissionToggle={handlePermissionToggle}
            />
          )}
        </div>
      )}
    </div>
  )
}

