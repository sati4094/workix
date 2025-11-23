'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiService } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'

export default function CreateWorkOrderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [sites, setSites] = useState<any[]>([])
  const [buildings, setBuildings] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [assets, setAssets] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    source: 'manual',
    priority: 'medium',
    site_id: '',
    building_id: '',
    assigned_to: '',
    asset_ids: [] as string[],
  })

  useEffect(() => {
    fetchFormData()
  }, [])

  const fetchFormData = async () => {
    try {
      setLoadingData(true)
      const [sitesRes, usersRes]: any = await Promise.all([
        apiService.getSites({ limit: 100 }),
        apiService.getUsers({ role: 'technician', status: 'active', limit: 100 })
      ])
      console.log('Fetched sites:', sitesRes.data.sites)
      console.log('Fetched users:', usersRes.data.users)
      setSites(sitesRes.data.sites || [])
      setUsers(usersRes.data.users || [])
    } catch (error) {
      console.error('Failed to fetch form data:', error)
      alert('Failed to load form data. Please refresh the page.')
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    if (formData.site_id) {
      fetchBuildings(formData.site_id)
      setFormData({ ...formData, building_id: '' })
      setBuildings([])
      setAssets([])
    }
  }, [formData.site_id])

  useEffect(() => {
    if (formData.building_id) {
      fetchAssets(formData.building_id)
    } else if (formData.site_id) {
      // Fetch assets for entire site if no building selected
      fetchAssets(formData.site_id, true)
    }
  }, [formData.building_id])

  const fetchBuildings = async (siteId: string) => {
    try {
      const response: any = await apiService.getBuildings({ site_id: siteId, limit: 100 })
      setBuildings(response.data.buildings || [])
    } catch (error) {
      console.error('Failed to fetch buildings:', error)
    }
  }

  const fetchAssets = async (locationId: string, isSite: boolean = false) => {
    try {
      const params = isSite ? { site_id: locationId } : { building_id: locationId }
      const response: any = await apiService.getAssets({ ...params, limit: 100 })
      setAssets(response.data.assets || [])
    } catch (error) {
      console.error('Failed to fetch assets:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.site_id) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      await apiService.createWorkOrder(formData)
      alert('Work order created successfully!')
      router.push('/dashboard/work-orders')
    } catch (error: any) {
      alert(error.message || 'Failed to create work order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center space-x-4">
        <Button variant="ghost" onClick={() => router.push('/dashboard/work-orders')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Work Order</h1>
          <p className="text-gray-600">Create a new service request or maintenance task</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Work Order Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Chiller Performance Deviation"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the issue or task..."
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Source */}
              <div>
                <Label htmlFor="source">Source *</Label>
                <select
                  id="source"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="manual">Manual Entry</option>
                  <option value="performance_deviation">Performance Deviation</option>
                  <option value="customer_complaint">Customer Complaint</option>
                  <option value="preventive_maintenance">Preventive Maintenance</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <Label htmlFor="priority">Priority *</Label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            {/* Site */}
            <div>
              <Label htmlFor="site">Site *</Label>
              <select
                id="site"
                value={formData.site_id}
                onChange={(e) => setFormData({ ...formData, site_id: e.target.value, building_id: '' })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Select a site...</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name} {site.enterprise_name ? `- ${site.enterprise_name}` : site.project_name ? `- ${site.project_name}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Building */}
              <div>
                <Label htmlFor="building">Building (Optional)</Label>
                <select
                  id="building"
                  value={formData.building_id}
                  onChange={(e) => setFormData({ ...formData, building_id: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={!formData.site_id || buildings.length === 0}
                >
                  <option value="">All buildings in site</option>
                  {buildings.map((building) => (
                    <option key={building.id} value={building.id}>
                      {building.building_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assigned To */}
              <div>
                <Label htmlFor="assigned">Assign To</Label>
                <select
                  id="assigned"
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} {user.team && `(${user.team})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Assets */}
            {assets.length > 0 && (
              <div>
                <Label>Assets (Optional)</Label>
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {assets.map((asset) => (
                    <label key={asset.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.asset_ids.includes(asset.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, asset_ids: [...formData.asset_ids, asset.id] })
                          } else {
                            setFormData({ ...formData, asset_ids: formData.asset_ids.filter(id => id !== asset.id) })
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{asset.name} ({asset.asset_tag})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => router.push('/dashboard/work-orders')}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Work Order'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

