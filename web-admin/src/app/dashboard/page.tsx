'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { apiService } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  ClipboardList, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  Wrench,
  Building2
} from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response: any = await apiService.getDashboard()
      setStats(response.data)
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error)
      setError(error.message || 'Failed to load dashboard')
      // Set empty stats to show UI even on error
      setStats({
        work_order_stats: {
          total_work_orders: 0,
          pending: 0,
          in_progress: 0,
          completed: 0,
          critical_priority: 0,
          high_priority: 0
        },
        technician_workload: [],
        overdue_count: 0,
        completed_last_7_days: 0
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name}!</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">⚠️ {error}</p>
        </div>
      )}

      {/* Main Content */}
      <div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Work Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Work Orders</CardTitle>
              <ClipboardList className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.work_order_stats?.total_work_orders || 0}
              </div>
              <p className="text-xs text-gray-600">Last 30 days</p>
            </CardContent>
          </Card>

          {/* In Progress */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats?.work_order_stats?.in_progress || 0}
              </div>
              <p className="text-xs text-gray-600">Active work orders</p>
            </CardContent>
          </Card>

          {/* Completed */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats?.work_order_stats?.completed || 0}
              </div>
              <p className="text-xs text-gray-600">
                {stats?.completed_last_7_days || 0} in last 7 days
              </p>
            </CardContent>
          </Card>

          {/* Critical Priority */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats?.work_order_stats?.critical_priority || 0}
              </div>
              <p className="text-xs text-gray-600">High priority: {stats?.work_order_stats?.high_priority || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and navigation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a href="/dashboard/work-orders">
                <Button className="h-20 w-full flex flex-col items-center justify-center" variant="outline">
                  <ClipboardList className="h-6 w-6 mb-2" />
                  <span>View All Work Orders</span>
                </Button>
              </a>
              <a href="/dashboard/users">
                <Button className="h-20 w-full flex flex-col items-center justify-center" variant="outline">
                  <Users className="h-6 w-6 mb-2" />
                  <span>Manage Users</span>
                </Button>
              </a>
              <a href="/dashboard/assets">
                <Button className="h-20 w-full flex flex-col items-center justify-center" variant="outline">
                  <Building2 className="h-6 w-6 mb-2" />
                  <span>Manage Assets</span>
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Technician Workload */}
        {stats?.technician_workload && stats.technician_workload.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Technician Workload</CardTitle>
              <CardDescription>Current work distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.technician_workload.slice(0, 5).map((tech: any) => (
                  <div key={tech.technician_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                        {tech.technician_name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium">{tech.technician_name}</p>
                        <p className="text-sm text-gray-600">
                          {tech.active_work_orders} active • {tech.completed_last_30_days} completed (30d)
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                        {tech.active_work_orders} Active
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {tech.upcoming_ppm_count || 0} PPM
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Work Order Status</CardTitle>
              <CardDescription>Current distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending</span>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 bg-gray-200 rounded-full w-32">
                      <div 
                        className="h-2 bg-gray-500 rounded-full" 
                        style={{ width: `${(stats?.work_order_stats?.pending / stats?.work_order_stats?.total_work_orders * 100) || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold w-8 text-right">
                      {stats?.work_order_stats?.pending || 0}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">In Progress</span>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 bg-gray-200 rounded-full w-32">
                      <div 
                        className="h-2 bg-yellow-500 rounded-full" 
                        style={{ width: `${(stats?.work_order_stats?.in_progress / stats?.work_order_stats?.total_work_orders * 100) || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold w-8 text-right">
                      {stats?.work_order_stats?.in_progress || 0}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completed</span>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 bg-gray-200 rounded-full w-32">
                      <div 
                        className="h-2 bg-green-500 rounded-full" 
                        style={{ width: `${(stats?.work_order_stats?.completed / stats?.work_order_stats?.total_work_orders * 100) || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold w-8 text-right">
                      {stats?.work_order_stats?.completed || 0}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>Server status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Backend Status</span>
                  <span className="flex items-center text-sm font-medium text-green-600">
                    <span className="h-2 w-2 bg-green-600 rounded-full mr-2"></span>
                    Online
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Database</span>
                  <span className="text-sm font-medium text-green-600">Connected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Environment</span>
                  <span className="text-sm font-medium">Development</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Overdue Tasks</span>
                  <span className="text-sm font-medium text-red-600">
                    {stats?.overdue_count || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

