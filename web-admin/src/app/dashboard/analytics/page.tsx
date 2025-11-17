'use client'

import { useEffect, useState } from 'react'
import { apiService } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { TrendingUp, Users, Wrench, Clock } from 'lucide-react'

export default function AnalyticsPage() {
  const [performance, setPerformance] = useState<any[]>([])
  const [reliability, setReliability] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const [perfRes, reliRes]: any = await Promise.all([
        apiService.getTechnicianPerformance(),
        apiService.getAssetReliability()
      ])
      setPerformance(perfRes.data.technician_performance || [])
      setReliability(reliRes.data.asset_reliability || [])
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Analytics & Reports</h1>
        <p className="text-gray-600">Performance metrics and insights</p>
      </div>

      {/* Technician Performance */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Technician Performance (Last 30 Days)</CardTitle>
          <CardDescription>Work completion and efficiency metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Technician</th>
                  <th className="text-right py-3 px-4 font-medium">Assigned</th>
                  <th className="text-right py-3 px-4 font-medium">Completed</th>
                  <th className="text-right py-3 px-4 font-medium">Avg Hours</th>
                  <th className="text-right py-3 px-4 font-medium">On Time</th>
                  <th className="text-right py-3 px-4 font-medium">Completion %</th>
                </tr>
              </thead>
              <tbody>
                {performance.map((tech) => (
                  <tr key={tech.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{tech.name}</td>
                    <td className="py-3 px-4 text-right">{tech.total_assigned || 0}</td>
                    <td className="py-3 px-4 text-right text-green-600 font-medium">{tech.completed || 0}</td>
                    <td className="py-3 px-4 text-right">{tech.avg_completion_hours ? tech.avg_completion_hours.toFixed(1) : '-'}</td>
                    <td className="py-3 px-4 text-right">{tech.on_time_completions || 0}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                        {tech.total_assigned > 0 ? Math.round((tech.completed / tech.total_assigned) * 100) : 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Asset Reliability */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Reliability (Last 90 Days)</CardTitle>
          <CardDescription>Failure frequency by asset</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reliability.slice(0, 10).map((asset) => (
              <div key={asset.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{asset.name}</p>
                  <p className="text-sm text-gray-600">{asset.asset_tag} • {asset.site_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Failures</p>
                  <p className={`text-lg font-bold ${
                    asset.failure_count > 5 ? 'text-red-600' :
                    asset.failure_count > 2 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {asset.failure_count || 0}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

