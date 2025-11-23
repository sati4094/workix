'use client';

import { useState, useMemo } from 'react';
import { DesktopLayout } from '@/components/desktop-layout';
import { DataTable } from '@/components/DataTable';
import { useTeams } from '@/hooks/useApi';

export default function TeamsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: teams = [], isLoading } = useTeams();

  const filteredTeams = useMemo(() => {
    if (!searchTerm) return teams;
    const term = searchTerm.toLowerCase();
    return teams.filter((t: any) =>
      t.team_name?.toLowerCase().includes(term) ||
      t.team_lead_name?.toLowerCase().includes(term) ||
      t.specialization?.toLowerCase().includes(term)
    );
  }, [teams, searchTerm]);

  return (
    <DesktopLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
            <p className="text-gray-600 mt-2">Manage maintenance and service teams</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Teams</div>
            <div className="text-2xl font-bold text-gray-900">{teams.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Active Teams</div>
            <div className="text-2xl font-bold text-green-600">
              {teams.filter((t: any) => t.is_active).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Members</div>
            <div className="text-2xl font-bold text-blue-600">
              {teams.reduce((sum: number, t: any) => sum + (t.member_count || 0), 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Avg Team Size</div>
            <div className="text-2xl font-bold text-gray-900">
              {teams.length > 0 ? (teams.reduce((sum: number, t: any) => sum + (t.member_count || 0), 0) / teams.length).toFixed(1) : 0}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4">
          <input
            type="text"
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <DataTable
          data={filteredTeams}
          loading={isLoading}
          keyExtractor={(t: any) => t.id}
          columns={[
            {
              key: 'team_name',
              label: 'Team Name',
              render: (_: any, t: any) => (
                <span className="font-medium">{t.team_name}</span>
              ),
            },
            {
              key: 'team_lead_name',
              label: 'Team Lead',
              render: (_: any, t: any) => (
                <span className="text-sm">{t.team_lead_name || '-'}</span>
              ),
            },
            {
              key: 'specialization',
              label: 'Specialization',
              render: (_: any, t: any) => (
                <span className="text-sm capitalize">{t.specialization || '-'}</span>
              ),
            },
            {
              key: 'member_count',
              label: 'Members',
              render: (_: any, t: any) => (
                <span className="text-sm font-medium text-blue-600">{t.member_count || 0}</span>
              ),
            },
            {
              key: 'max_capacity',
              label: 'Capacity',
              render: (_: any, t: any) => (
                <span className="text-sm">{t.max_capacity || '-'}</span>
              ),
            },
            {
              key: 'is_active',
              label: 'Status',
              render: (_: any, t: any) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {t.is_active ? 'Active' : 'Inactive'}
                </span>
              ),
            },
          ]}
        />
      </div>
    </DesktopLayout>
  );
}
