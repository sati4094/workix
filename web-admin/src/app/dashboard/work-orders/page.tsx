'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiService } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDateTime, getPriorityColor, getStatusColor } from '@/lib/utils'
import { Plus, Search, Filter, Eye } from 'lucide-react'

export default function WorkOrdersPage() {
  const router = useRouter()
  const [workOrders, setWorkOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  useEffect(() => {
    fetchWorkOrders()
  }, [statusFilter, priorityFilter])

  const fetchWorkOrders = async () => {
    try {
      setLoading(true)
      const params: any = { limit: 100 }
      if (statusFilter !== 'all') params.status = statusFilter
      if (priorityFilter !== 'all') params.priority = priorityFilter
      
      const response: any = await apiService.getWorkOrders(params)
      setWorkOrders(response.data.work_orders || [])
    } catch (error) {
      console.error('Failed to fetch work orders:', error)
      setWorkOrders([])
    } finally {
      setLoading(false)
    }
  }

  const filteredWorkOrders = workOrders.filter(wo => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      wo.title?.toLowerCase().includes(query) ||
      wo.work_order_number?.toLowerCase().includes(query) ||
      wo.site_name?.toLowerCase().includes(query) ||
      wo.building_name?.toLowerCase().includes(query) ||
      wo.asset_name?.toLowerCase().includes(query) ||
      wo.enterprise_name?.toLowerCase().includes(query) ||
      wo.client_name?.toLowerCase().includes(query)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Work Orders</h1>
          <p className="text-gray-600">Manage all service requests and maintenance tasks</p>
        </div>
        <Button onClick={() => router.push('/dashboard/work-orders/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Work Order
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search work orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="in_progress">In Progress</option>
              <option value="parts_pending">Parts Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>

            <Button variant="outline" onClick={fetchWorkOrders}>
              <Filter className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Work Orders List */}
      <div className="space-y-4">
        {filteredWorkOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">No work orders found</p>
              <Button className="mt-4" onClick={() => router.push('/dashboard/work-orders/create')}>
                Create Your First Work Order
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredWorkOrders.map((wo) => (
            <Card key={wo.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/dashboard/work-orders/${wo.id}`)}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-gray-600">{wo.work_order_number}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(wo.priority)}`}>
                        {wo.priority?.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(wo.status)}`}>
                        {wo.status?.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <CardTitle className="text-xl mb-2">{wo.title}</CardTitle>
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                      {wo.enterprise_name && <span>🏢 {wo.enterprise_name}</span>}
                      {wo.site_name && <span>📍 {wo.site_name}</span>}
                      {wo.building_name && <span>🏗️ {wo.building_name}</span>}
                      {wo.asset_name && <span>⚙️ {wo.asset_name}</span>}
                      {wo.assigned_technician_name && (
                        <span>👤 {wo.assigned_technician_name}</span>
                      )}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/dashboard/work-orders/${wo.id}`)
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Source</p>
                    <p className="font-medium">{wo.source?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Created</p>
                    <p className="font-medium">{formatDateTime(wo.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Activities</p>
                    <p className="font-medium">{wo.activity_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Assets</p>
                    <p className="font-medium">{wo.asset_count || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
