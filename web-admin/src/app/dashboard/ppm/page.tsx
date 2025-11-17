'use client'

import { useEffect, useState } from 'react'
import { apiService } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { Calendar, Plus } from 'lucide-react'

export default function PPMPage() {
  const [schedules, setSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSchedules()
  }, [])

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      const response: any = await apiService.getPPMSchedules({ limit: 100 })
      setSchedules(response.data.ppm_schedules || [])
    } catch (error) {
      console.error('Failed to fetch PPM schedules:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">PPM Schedule</h1>
          <p className="text-gray-600">Preventive Maintenance Planning</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Schedule PPM
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {schedules.map((schedule) => (
            <Card key={schedule.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{schedule.ppm_plan_name}</CardTitle>
                    <p className="text-sm text-gray-600">{schedule.asset_name} ({schedule.asset_tag})</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    schedule.status === 'completed' ? 'bg-green-100 text-green-800' :
                    schedule.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {schedule.status?.toUpperCase()}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Site</p>
                    <p className="font-medium">{schedule.site_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Scheduled Date</p>
                    <p className="font-medium">{formatDate(schedule.scheduled_date)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Technician</p>
                    <p className="font-medium">{schedule.assigned_technician_name || 'Unassigned'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {schedules.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No PPM schedules found</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

