'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiService } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDateTime, getPriorityColor, getStatusColor } from '@/lib/utils'
import { ArrowLeft, Edit, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { WorkOrderChat } from './chat'

export default function WorkOrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [workOrder, setWorkOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchWorkOrder()
  }, [params.id])

  const fetchWorkOrder = async () => {
    try {
      setLoading(true)
      const response: any = await apiService.getWorkOrderById(params.id)
      setWorkOrder(response.data.work_order)
    } catch (error) {
      console.error('Failed to fetch work order:', error)
      alert('Failed to load work order')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (newStatus: string) => {
    if (!confirm(`Change status to ${newStatus}?`)) return

    try {
      setUpdating(true)
      await apiService.updateWorkOrder(params.id, { status: newStatus })
      alert('Status updated successfully!')
      fetchWorkOrder()
    } catch (error: any) {
      alert(error.message || 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const deleteWorkOrder = async () => {
    if (!confirm('Are you sure you want to cancel this work order? This action cannot be undone.')) return

    try {
      setUpdating(true)
      await apiService.deleteWorkOrder(params.id)
      alert('Work order cancelled successfully!')
      router.push('/dashboard/work-orders')
    } catch (error: any) {
      alert(error.message || 'Failed to cancel work order')
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!workOrder) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Work order not found</p>
            <Button className="mt-4" onClick={() => router.push('/dashboard/work-orders')}>
              Back to Work Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const wo = workOrder

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push('/dashboard/work-orders')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{wo.work_order_number}</h1>
            <p className="text-gray-600">{wo.title}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          {wo.status !== 'completed' && wo.status !== 'cancelled' && (
            <>
              {wo.status === 'pending' && (
                <Button onClick={() => updateStatus('acknowledged')} disabled={updating}>
                  Acknowledge
                </Button>
              )}
              {(wo.status === 'acknowledged' || wo.status === 'in_progress') && (
                <Button onClick={() => updateStatus('completed')} disabled={updating}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete
                </Button>
              )}
              <Button variant="destructive" onClick={deleteWorkOrder} disabled={updating}>
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status & Priority */}
      <div className="mb-6 flex space-x-2">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(wo.status)}`}>
          {wo.status?.replace('_', ' ').toUpperCase()}
        </span>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(wo.priority)}`}>
          Priority: {wo.priority?.toUpperCase()}
        </span>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
          Source: {wo.source?.replace('_', ' ')}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chat/Activity Stream */}
          <WorkOrderChat workOrderId={params.id} />
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{wo.description || 'No description provided'}</p>
            </CardContent>
          </Card>

          {/* Location Info */}
          <Card>
            <CardHeader>
              <CardTitle>Location Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Enterprise</p>
                  <p className="font-medium">{wo.enterprise_name || wo.client_name || '-'}</p>
                  {wo.enterprise_contact_person && (
                    <p className="text-sm text-gray-600 mt-1">
                      {wo.enterprise_contact_person} • {wo.enterprise_contact_phone}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Site</p>
                  <p className="font-medium">{wo.site_name}</p>
                  <p className="text-sm text-gray-600 mt-1">{wo.site_address}</p>
                  {wo.site_contact_person && (
                    <p className="text-sm text-gray-600">
                      {wo.site_contact_person} • {wo.site_contact_phone}
                    </p>
                  )}
                </div>
                {wo.building_name && (
                  <div>
                    <p className="text-sm text-gray-600">Building</p>
                    <p className="font-medium">{wo.building_name}</p>
                    {wo.building_code && (
                      <p className="text-sm text-gray-600">{wo.building_code}</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assets */}
          {wo.assets && wo.assets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Assets ({wo.assets.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {wo.assets.map((asset: any) => (
                    <div key={asset.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{asset.name}</p>
                          <p className="text-sm text-gray-600">{asset.asset_tag} • {asset.type}</p>
                          {asset.manufacturer && (
                            <p className="text-sm text-gray-600">{asset.manufacturer} {asset.model}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Activities Summary (optional - chat shows all) */}
          {wo.activities && wo.activities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity Summary</CardTitle>
                <CardDescription>Latest {Math.min(wo.activities.length, 5)} activities (see chat for all)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {wo.activities.slice(0, 5).map((activity: any) => {
                    const userName = activity.created_by_name || activity.created_by || 'System'
                    
                    return (
                      <div key={activity.id} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                              {activity.activity_type?.replace('_', ' ').toUpperCase()}
                            </span>
                            {activity.ai_enhanced && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                                ✨ AI Enhanced
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDateTime(activity.created_at)}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-1">{activity.description}</p>
                        <p className="text-xs text-gray-600">By {userName}</p>
                        
                        {/* Show image thumbnails if available */}
                        {activity.pictures && Array.isArray(activity.pictures) && activity.pictures.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {activity.pictures.map((pic: string, idx: number) => {
                              const isUrl = pic.startsWith('http://') || pic.startsWith('https://') || pic.startsWith('data:')
                              return isUrl ? (
                                <img 
                                  key={idx}
                                  src={pic} 
                                  alt={`Attachment ${idx + 1}`}
                                  className="h-16 w-16 object-cover rounded cursor-pointer border"
                                  onClick={() => window.open(pic, '_blank')}
                                />
                              ) : (
                                <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  📷 {pic}
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="font-medium">{formatDateTime(wo.created_at)}</p>
              </div>
              {wo.acknowledged_at && (
                <div>
                  <p className="text-sm text-gray-600">Acknowledged</p>
                  <p className="font-medium">{formatDateTime(wo.acknowledged_at)}</p>
                </div>
              )}
              {wo.started_at && (
                <div>
                  <p className="text-sm text-gray-600">Started</p>
                  <p className="font-medium">{formatDateTime(wo.started_at)}</p>
                </div>
              )}
              {wo.completed_at && (
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="font-medium">{formatDateTime(wo.completed_at)}</p>
                </div>
              )}
              {wo.due_date && (
                <div>
                  <p className="text-sm text-gray-600">Due Date</p>
                  <p className="font-medium">{formatDateTime(wo.due_date)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assignment Card */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Reported By</p>
                <p className="font-medium">{wo.reported_by_name || 'System'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Assigned To</p>
                <p className="font-medium">{wo.assigned_technician_name || 'Unassigned'}</p>
                {wo.assigned_technician_phone && (
                  <p className="text-sm text-gray-600">{wo.assigned_technician_phone}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {wo.status === 'pending' && (
                <Button className="w-full" onClick={() => updateStatus('acknowledged')} disabled={updating}>
                  Acknowledge
                </Button>
              )}
              {wo.status === 'acknowledged' && (
                <Button className="w-full" onClick={() => updateStatus('in_progress')} disabled={updating}>
                  Start Work
                </Button>
              )}
              {(wo.status === 'acknowledged' || wo.status === 'in_progress') && (
                <Button className="w-full" onClick={() => updateStatus('parts_pending')} disabled={updating}>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Parts Pending
                </Button>
              )}
              {(wo.status === 'in_progress' || wo.status === 'parts_pending') && (
                <Button className="w-full" onClick={() => updateStatus('completed')} disabled={updating}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete
                </Button>
              )}
              {wo.status !== 'completed' && wo.status !== 'cancelled' && (
                <Button className="w-full" variant="destructive" onClick={deleteWorkOrder} disabled={updating}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Work Order
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

