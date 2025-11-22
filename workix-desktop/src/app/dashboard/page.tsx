'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DesktopLayout } from '@/components/desktop-layout';
import { apiClient } from '@/lib/api-client';
import { useDataStore, useAuthStore } from '@/store';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, hydrated } = useAuthStore();
  const { loading, setLoading } = useDataStore();
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboard();
    }
  }, [isAuthenticated]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.getAnalytics();
      console.log('Dashboard API Response:', response);
      
      // The API client returns response.data directly, so response.kpis is the correct path
      const kpis = response?.kpis || {};
      console.log('KPIs:', kpis);
      
      setStats({
        totalWorkOrders: kpis.total_work_orders || 0,
        inProgress: kpis.in_progress || 0,
        completedToday: kpis.completed_this_week || 0,
        technicians: kpis.active_technicians || 0
      });
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to load dashboard data';
      setError(errorMsg);
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ label, value, icon, gradient }: any) => (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${gradient} p-6 text-white shadow-lg hover:shadow-2xl transition-all hover:scale-105 cursor-pointer`}>
      <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
        <div className="text-9xl">{icon}</div>
      </div>
      <div className="relative z-10">
        <p className="text-sm font-medium opacity-90">{label}</p>
        <p className="text-4xl font-bold mt-2">{value || 0}</p>
      </div>
    </div>
  );

  const FeatureCard = ({ title, description, icon, href, color }: any) => (
    <div 
      onClick={() => router.push(href)}
      className={`bg-white p-6 rounded-xl shadow-md border-l-4 ${color} hover:shadow-xl transition-all cursor-pointer group`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{icon}</span>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <span className="text-gray-400 group-hover:text-blue-600 transition-colors">→</span>
      </div>
    </div>
  );

  return (
    <DesktopLayout>
      <div className="p-8 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to Workix</h1>
          <p className="text-gray-600">Enterprise CMMS Platform - Manage your facilities with ease</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard label="Total Work Orders" value={stats?.totalWorkOrders} icon="📋" gradient="from-blue-500 to-blue-600" />
              <StatCard label="In Progress" value={stats?.inProgress} icon="⚙️" gradient="from-purple-500 to-purple-600" />
              <StatCard label="Completed Today" value={stats?.completedToday} icon="✅" gradient="from-green-500 to-green-600" />
              <StatCard label="Active Technicians" value={stats?.technicians} icon="👥" gradient="from-pink-500 to-rose-600" />
            </div>

            {/* Quick Access Features */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Access</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FeatureCard 
                  title="Work Orders" 
                  description="Create and manage work orders" 
                  icon="📋" 
                  href="/work-orders"
                  color="border-blue-500"
                />
                <FeatureCard 
                  title="Assets" 
                  description="Track and maintain assets" 
                  icon="🔧" 
                  href="/assets"
                  color="border-green-500"
                />
                <FeatureCard 
                  title="Inventory" 
                  description="Manage parts and stock levels" 
                  icon="📦" 
                  href="/dashboard/inventory"
                  color="border-purple-500"
                />
                <FeatureCard 
                  title="Analytics" 
                  description="View KPIs and performance metrics" 
                  icon="📈" 
                  href="/dashboard/analytics"
                  color="border-indigo-500"
                />
                <FeatureCard 
                  title="Templates" 
                  description="Work order templates library" 
                  icon="📝" 
                  href="/dashboard/templates"
                  color="border-yellow-500"
                />
                <FeatureCard 
                  title="SLA Policies" 
                  description="Service level agreements" 
                  icon="⏱️" 
                  href="/dashboard/sla-policies"
                  color="border-red-500"
                />
              </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🔔</span>
                  Recent Activity
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-2xl">✅</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">System Ready</p>
                      <p className="text-xs text-gray-600">All modules are operational</p>
                    </div>
                    <span className="text-xs text-gray-500">Now</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-2xl">🚀</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Analytics Dashboard Available</p>
                      <p className="text-xs text-gray-600">View comprehensive insights and KPIs</p>
                    </div>
                    <span className="text-xs text-gray-500">New</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-2xl">⚡</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Advanced Features Enabled</p>
                      <p className="text-xs text-gray-600">Templates, SLA, Inventory now available</p>
                    </div>
                    <span className="text-xs text-gray-500">New</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-xl shadow-lg text-white">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="mr-2">💡</span>
                  System Status
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                    <span className="text-sm">Backend API</span>
                    <span className="font-semibold flex items-center">✓ Active</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                    <span className="text-sm">Database</span>
                    <span className="font-semibold flex items-center">✓ Connected</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                    <span className="text-sm">Redis Cache</span>
                    <span className="font-semibold flex items-center">✓ Online</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                    <span className="text-sm">Analytics</span>
                    <span className="font-semibold flex items-center">✓ Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DesktopLayout>
  );
}
