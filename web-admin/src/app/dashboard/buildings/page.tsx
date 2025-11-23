'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiService } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Search, Building2, Eye, X, Edit, Trash2 } from 'lucide-react'

export default function BuildingsPage() {
  const router = useRouter()
  const [buildings, setBuildings] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [enterprises, setEnterprises] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [siteFilter, setSiteFilter] = useState('all')
  const [enterpriseFilter, setEnterpriseFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingBuilding, setEditingBuilding] = useState<any>(null)

  useEffect(() => {
    fetchData()
  }, [siteFilter, enterpriseFilter])

  const fetchData = async () => {
    try {
      setLoading(true)
      const params: any = { limit: 100 }
      if (siteFilter !== 'all') params.site_id = siteFilter
      if (enterpriseFilter !== 'all') params.enterprise_id = enterpriseFilter
      
      const [buildingsRes, sitesRes, enterprisesRes]: any = await Promise.all([
        apiService.getBuildings(params),
        apiService.getSites({ limit: 100 }),
        apiService.getEnterprises({ limit: 100 })
      ])
      
      setBuildings(buildingsRes.data.buildings || [])
      setSites(sitesRes.data.sites || [])
      setEnterprises(enterprisesRes.data.enterprises || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setBuildings([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete building "${name}"? This will also delete all associated assets!`)) return

    try {
      await apiService.deleteBuilding(id)
      alert('Building deleted successfully!')
      fetchData()
    } catch (error: any) {
      alert(error.message || 'Failed to delete building')
    }
  }

  const filteredBuildings = buildings.filter(building => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      building.building_name?.toLowerCase().includes(query) ||
      building.site_name?.toLowerCase().includes(query) ||
      building.enterprise_name?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Buildings</h1>
          <p className="text-gray-600">Manage buildings within sites</p>
        </div>
        <Button onClick={() => { setEditingBuilding(null); setShowModal(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Building
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search buildings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={enterpriseFilter}
              onChange={(e) => setEnterpriseFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Enterprises</option>
              {enterprises.map((ent) => (
                <option key={ent.id} value={ent.id}>{ent.name}</option>
              ))}
            </select>

            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Sites</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>

            <Button variant="outline" onClick={fetchData}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium">Building Name</th>
                    <th className="text-left py-3 px-4 font-medium">Site</th>
                    <th className="text-left py-3 px-4 font-medium">Enterprise</th>
                    <th className="text-center py-3 px-4 font-medium">Floors</th>
                    <th className="text-center py-3 px-4 font-medium">Assets</th>
                    <th className="text-center py-3 px-4 font-medium">Open WOs</th>
                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBuildings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-600">
                        No buildings found
                      </td>
                    </tr>
                  ) : (
                    filteredBuildings.map((building) => (
                      <tr key={building.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="p-2 bg-purple-100 rounded">
                              <Building2 className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium">{building.building_name}</p>
                              {building.building_code && (
                                <p className="text-xs text-gray-500">{building.building_code}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">{building.site_name || '-'}</td>
                        <td className="py-3 px-4">{building.enterprise_name || '-'}</td>
                        <td className="py-3 px-4 text-center">{building.floors || '-'}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                            {building.asset_count || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded text-sm ${
                            (building.open_work_orders || 0) > 0 
                              ? 'bg-yellow-100 text-yellow-700' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {building.open_work_orders || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => router.push(`/dashboard/assets?building_id=${building.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => { setEditingBuilding(building); setShowModal(true) }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDelete(building.id, building.building_name)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {showModal && (
        <BuildingModal
          building={editingBuilding}
          sites={sites}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            fetchData()
          }}
        />
      )}
    </div>
  )
}

function BuildingModal({ building, sites, onClose, onSuccess }: { 
  building?: any, 
  sites: any[], 
  onClose: () => void, 
  onSuccess: () => void 
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    site_id: building?.site_id || '',
    building_name: building?.building_name || '',
    building_code: building?.building_code || '',
    floors: building?.floors || '',
    construction_year: building?.construction_year || '',
    square_feet: building?.square_feet || '',
    notes: building?.notes || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.building_name || !formData.site_id) {
      alert('Building name and site are required')
      return
    }

    try {
      setLoading(true)
      if (building) {
        await apiService.updateBuilding(building.id, formData)
      } else {
        await apiService.createBuilding(formData)
      }
      alert(`Building ${building ? 'updated' : 'created'} successfully!`)
      onSuccess()
    } catch (error: any) {
      alert(error.message || `Failed to ${building ? 'update' : 'create'} building`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{building ? 'Edit Building' : 'Create New Building'}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="site">Site *</Label>
              <select
                id="site"
                value={formData.site_id}
                onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Select a site...</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name} ({site.enterprise_name || site.client_name})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="building_name">Building Name *</Label>
                <Input
                  id="building_name"
                  value={formData.building_name}
                  onChange={(e) => setFormData({ ...formData, building_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="building_code">Building Code</Label>
                <Input
                  id="building_code"
                  value={formData.building_code}
                  onChange={(e) => setFormData({ ...formData, building_code: e.target.value })}
                  placeholder="e.g., BLD-A, T3"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="floors">Floors</Label>
                <Input
                  id="floors"
                  type="number"
                  value={formData.floors}
                  onChange={(e) => setFormData({ ...formData, floors: e.target.value })}
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="construction_year">Year Built</Label>
                <Input
                  id="construction_year"
                  type="number"
                  value={formData.construction_year}
                  onChange={(e) => setFormData({ ...formData, construction_year: e.target.value })}
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
              <div>
                <Label htmlFor="square_feet">Square Feet</Label>
                <Input
                  id="square_feet"
                  type="number"
                  value={formData.square_feet}
                  onChange={(e) => setFormData({ ...formData, square_feet: e.target.value })}
                  min="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : (building ? 'Update' : 'Create')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
