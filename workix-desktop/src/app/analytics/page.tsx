'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';
import { DesktopLayout } from '@/components/desktop-layout';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/v1/analytics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        setAnalytics(data.data || {});
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchAnalytics();
  }, [token]);

  return (
    <DesktopLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-2">View detailed performance metrics and reports</p>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading analytics...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Work Orders', value: analytics?.totalWorkOrders || 0, icon: '📋' },
              { label: 'Completed This Month', value: analytics?.completedThisMonth || 0, icon: '✅' },
              { label: 'Active Assets', value: analytics?.activeAssets || 0, icon: '🔧' },
              { label: 'Team Members', value: analytics?.teamMembers || 0, icon: '👥' }
            ].map((card, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="text-3xl mb-2">{card.icon}</div>
                <p className="text-gray-600 text-sm mb-2">{card.label}</p>
                <p className="text-3xl font-bold">{card.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DesktopLayout>
  );
}
