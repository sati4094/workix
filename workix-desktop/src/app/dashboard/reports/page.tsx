'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';
import { DesktopLayout } from '@/components/desktop-layout';

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        // Fetch from analytics endpoint
        const response = await fetch('http://localhost:5000/api/v1/analytics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        setReports([data.data || {}]);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchReports();
  }, [token]);

  return (
    <DesktopLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-2">View and generate business reports</p>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading reports...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold text-lg mb-2">Work Orders Report</h3>
              <p className="text-gray-600 text-sm">Analyze work order trends and metrics</p>
              <button className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded hover:from-purple-700 hover:to-pink-700 shadow-md">Generate Report</button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold text-lg mb-2">Asset Performance</h3>
              <p className="text-gray-600 text-sm">Track asset utilization and efficiency</p>
              <button className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded hover:from-purple-700 hover:to-pink-700 shadow-md">Generate Report</button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold text-lg mb-2">Maintenance Analytics</h3>
              <p className="text-gray-600 text-sm">View maintenance costs and history</p>
              <button className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded hover:from-purple-700 hover:to-pink-700 shadow-md">Generate Report</button>
            </div>
          </div>
        )}
      </div>
    </DesktopLayout>
  );
}
