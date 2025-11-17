'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { apiService } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Search, Package, X } from 'lucide-react'

export default function AssetsPage() {
  const searchParams = useSearchParams()
  const siteId = searchParams?.get('site_id')
  
  const [assets, setAssets] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchData()
  }, [siteId, typeFilter])

  const fetchData = async () => {
    try {
      setLoading(true)
      const params: any = { limit: 100 }
      if (siteId) params.site_id = siteId
      if (typeFilter !== 'all') params.type = typeFilter
      
      const [assetsRes, sitesRes]: any = await Promise.all([
        apiService.getAssets(params),
        apiService.getSites({ limit: 100 })
      ])
      setAssets(assetsRes.data.assets || [])
      setSites(sitesRes.data.sites || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAssets = assets.filter(a => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      a.name?.toLowerCase().includes(query) ||
      a.asset_tag?.toLowerCase().includes(query) ||
      a.model?.toLowerCase().includes(query) ||
      a.manufacturer?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Assets</h1>
          <p className="text-gray-600">Manage equipment and machinery</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Asset
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Types</option>
              <option value="chiller">Chiller</option>
              <option value="ahu">AHU</option>
              <option value="pump">Pump</option>
              <option value="cooling_tower">Cooling Tower</option>
              <option value="boiler">Boiler</option>
              <option value="vfd">VFD</option>
              <option value="motor">Motor</option>
              <option value="compressor">Compressor</option>
              <option value="other">Other</option>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => (
            <Card key={asset.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Package className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{asset.name}</CardTitle>
                      <p className="text-sm text-gray-600">{asset.asset_tag}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    {asset.type?.toUpperCase()}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-600">Site</p>
                    <p className="font-medium">{asset.site_name}</p>
                  </div>
                  {asset.manufacturer && (
                    <div>
                      <p className="text-gray-600">Manufacturer</p>
                      <p className="font-medium">{asset.manufacturer}</p>
                    </div>
                  )}
                  {asset.model && (
                    <div>
                      <p className="text-gray-600">Model</p>
                      <p className="font-medium">{asset.model}</p>
                    </div>
                  )}
                  {asset.capacity && (
                    <div>
                      <p className="text-gray-600">Capacity</p>
                      <p className="font-medium">{asset.capacity} {asset.capacity_unit}</p>
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${asset.status === 'operational' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {asset.status?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <AssetModal
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

function AssetModal({ sites, onClose, onSuccess }: { sites: any[], onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    site_id: '',
    asset_tag: '',
    name: '',
    type: 'chiller',
    manufacturer: '',
    model: '',
    serial_number: '',
    capacity: '',
    capacity_unit: '',
    commissioning_date: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.site_id || !formData.asset_tag || !formData.name || !formData.type) {
      alert('Please fill in required fields')
      return
    }

    try {
      setLoading(true)
      await apiService.createAsset(formData)
      alert('Asset created successfully!')
      onSuccess()
    } catch (error: any) {
      alert(error.message || 'Failed to create asset')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Create New Asset</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
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
                    {site.name} ({site.project_name})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="asset_tag">Asset Tag *</Label>
                <Input
                  id="asset_tag"
                  value={formData.asset_tag}
                  onChange={(e) => setFormData({ ...formData, asset_tag: e.target.value })}
                  placeholder="CH-001"
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Type *</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="chiller">Chiller</option>
                  <option value="ahu">AHU</option>
                  <option value="pump">Pump</option>
                  <option value="cooling_tower">Cooling Tower</option>
                  <option value="boiler">Boiler</option>
                  <option value="vfd">VFD</option>
                  <option value="motor">Motor</option>
                  <option value="compressor">Compressor</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="name">Asset Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Main Chiller Unit 1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  placeholder="e.g., Carrier"
                />
              </div>
              <div>
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="e.g., 30XA-502"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="serial_number">Serial Number</Label>
                <Input
                  id="serial_number"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="500"
                />
              </div>
              <div>
                <Label htmlFor="capacity_unit">Unit</Label>
                <Input
                  id="capacity_unit"
                  value={formData.capacity_unit}
                  onChange={(e) => setFormData({ ...formData, capacity_unit: e.target.value })}
                  placeholder="Tons"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="commissioning_date">Commissioning Date</Label>
              <Input
                id="commissioning_date"
                type="date"
                value={formData.commissioning_date}
                onChange={(e) => setFormData({ ...formData, commissioning_date: e.target.value })}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Asset'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

