'use client';

import React, { useState, useMemo } from 'react';

interface Permission {
  id: string;
  name: string;
  slug: string;
  resource: string;
  action: string;
  category: string;
}

interface Role {
  id: string;
  name: string;
  slug: string;
  level: number;
  color: string;
  permissions?: string[]; // Array of permission slugs
}

interface PermissionMatrixProps {
  currentUserRole: string; // 'superadmin' or 'admin'
  currentUserLevel: number; // 0-7
  roles: Role[];
  permissions: Permission[];
  rolePermissions: Record<string, string[]>; // { roleId: [permissionIds] }
  onPermissionToggle: (roleId: string, permissionId: string, granted: boolean) => Promise<void>;
  isLoading?: boolean;
}

export function PermissionMatrix({
  currentUserRole,
  currentUserLevel,
  roles,
  permissions,
  rolePermissions,
  onPermissionToggle,
  isLoading = false
}: PermissionMatrixProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter roles based on current user's level
  const accessibleRoles = useMemo(() => {
    if (currentUserRole === 'superadmin') {
      // SuperAdmin can control levels 0-7
      return roles;
    } else if (currentUserRole === 'admin') {
      // Client Admin can control levels 3-7 (Portfolio Manager to Basic User)
      return roles.filter(role => role.level >= 3 && role.level <= 7);
    }
    return [];
  }, [currentUserRole, currentUserLevel, roles]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(permissions.map(p => p.category));
    return ['all', ...Array.from(cats)];
  }, [permissions]);

  // Filter permissions based on selected category and search
  const filteredPermissions = useMemo(() => {
    let filtered = permissions;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.resource.toLowerCase().includes(term) ||
        p.action.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [permissions, selectedCategory, searchTerm]);

  // Filter roles for display
  const displayRoles = useMemo(() => {
    if (selectedRole === 'all') {
      return accessibleRoles;
    }
    return accessibleRoles.filter(r => r.id === selectedRole);
  }, [accessibleRoles, selectedRole]);

  const hasPermission = (roleId: string, permissionId: string): boolean => {
    return rolePermissions[roleId]?.includes(permissionId) || false;
  };

  const handleToggle = async (roleId: string, permissionId: string, currentValue: boolean) => {
    if (isLoading) return;
    await onPermissionToggle(roleId, permissionId, !currentValue);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 rounded-lg p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Permission Matrix</h2>
        <p className="text-purple-100">
          {currentUserRole === 'superadmin' 
            ? 'SuperAdmin: Manage permissions for all roles (Level 0-7)'
            : 'Admin: Manage permissions for Portfolio Manager and below (Level 3-7)'}
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Permissions
            </label>
            <input
              type="text"
              placeholder="Search by name, resource, or action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              {accessibleRoles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name} (Level {role.level})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Showing {filteredPermissions.length} of {permissions.length} permissions
            {' · '}
            {displayRoles.length} role{displayRoles.length !== 1 ? 's' : ''}
          </div>
          <div className="text-sm text-gray-500">
            {isLoading && (
              <span className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full" />
                Saving...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Permission Matrix Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="sticky left-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permission
                </th>
                {displayRoles.map(role => (
                  <th
                    key={role.id}
                    className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                    style={{ color: role.color }}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span>{role.name}</span>
                      <span className="text-xs text-gray-500 normal-case">Level {role.level}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPermissions.map((permission, idx) => (
                <tr
                  key={permission.id}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="sticky left-0 z-10 px-6 py-4 whitespace-nowrap bg-inherit">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">
                        {permission.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {permission.resource}.{permission.action}
                      </div>
                    </div>
                  </td>
                  {displayRoles.map(role => {
                    const isGranted = hasPermission(role.id, permission.id);
                    return (
                      <td key={role.id} className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggle(role.id, permission.id, isGranted)}
                          disabled={isLoading}
                          className={`
                            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                            focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                            disabled:opacity-50 disabled:cursor-not-allowed
                            ${isGranted 
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600' 
                              : 'bg-gray-200'}
                          `}
                          title={isGranted ? 'Click to revoke' : 'Click to grant'}
                        >
                          <span
                            className={`
                              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                              ${isGranted ? 'translate-x-6' : 'translate-x-1'}
                            `}
                          />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPermissions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">
              No permissions found matching your filters.
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Legend</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-6 w-11 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-end pr-1">
              <div className="h-4 w-4 bg-white rounded-full" />
            </div>
            <span className="text-gray-600">Permission Granted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-11 bg-gray-200 rounded-full flex items-center justify-start pl-1">
              <div className="h-4 w-4 bg-white rounded-full" />
            </div>
            <span className="text-gray-600">Permission Denied</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">Level 0</span>
            <span className="text-gray-600">SuperAdmin</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded text-xs font-medium">Level 7</span>
            <span className="text-gray-600">Basic User</span>
          </div>
        </div>
      </div>
    </div>
  );
}
