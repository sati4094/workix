'use client'

import { useEffect, useState } from 'react'
import { apiService } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Search, Edit, Trash2, X, Building, LayoutGrid, List } from 'lucide-react'

export default function EnterprisesPage() {
  const [enterprises, setEnterprises] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingEnterprise, setEditingEnterprise] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')

  useEffect(() => {
    fetchEnterprises()
  }, [])

  const fetchEnterprises = async () => {
    try {
      setLoading(true)
      const response: any = await apiService.getEnterprises({ limit: 100 })
      setEnterprises(response.data.enterprises || [])
    } catch (error) {
      console.error('Failed to fetch enterprises:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete enterprise "${name}"? This will also delete all associated sites, buildings, and assets!`)) return

    try {
      await apiService.deleteEnterprise(id)
      alert('Enterprise deleted successfully!')
      fetchEnterprises()
    } catch (error: any) {
      alert(error.message || 'Failed to delete enterprise')
    }
  }

  const filteredEnterprises = enterprises.filter(enterprise => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      enterprise.name?.toLowerCase().includes(query) ||
      enterprise.contact_person?.toLowerCase().includes(query) ||
      enterprise.city?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Enterprises</h1>
          <p className="text-gray-600">Manage enterprise organizations</p>
        </div>
        <Button onClick={() => { setEditingEnterprise(null); setShowModal(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Enterprise
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search enterprises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* View Toggle */}
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'card' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('card')}
                className="rounded-r-none"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : viewMode === 'card' ? (
        /* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEnterprises.map((enterprise) => (
            <Card key={enterprise.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{enterprise.name}</CardTitle>
                      {enterprise.city && (
                        <p className="text-sm text-gray-600">{enterprise.city}, {enterprise.state}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {enterprise.contact_person && (
                    <div>
                      <p className="text-gray-600">Contact Person</p>
                      <p className="font-medium">{enterprise.contact_person}</p>
                    </div>
                  )}
                  {enterprise.contact_email && (
                    <div>
                      <p className="text-gray-600">Email</p>
                      <p className="font-medium">{enterprise.contact_email}</p>
                    </div>
                  )}
                  {enterprise.contact_phone && (
                    <div>
                      <p className="text-gray-600">Phone</p>
                      <p className="font-medium">{enterprise.contact_phone}</p>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2 mt-4">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditingEnterprise(enterprise); setShowModal(true) }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(enterprise.id, enterprise.name)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* List View */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium">Enterprise Name</th>
                    <th className="text-left py-3 px-4 font-medium">Contact Person</th>
                    <th className="text-left py-3 px-4 font-medium">Email</th>
                    <th className="text-left py-3 px-4 font-medium">Phone</th>
                    <th className="text-left py-3 px-4 font-medium">Location</th>
                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnterprises.map((enterprise) => (
                    <tr key={enterprise.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{enterprise.name}</td>
                      <td className="py-3 px-4">{enterprise.contact_person || '-'}</td>
                      <td className="py-3 px-4 text-gray-600">{enterprise.contact_email || '-'}</td>
                      <td className="py-3 px-4 text-gray-600">{enterprise.contact_phone || '-'}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {enterprise.city && enterprise.state ? `${enterprise.city}, ${enterprise.state}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Button size="sm" variant="ghost" onClick={() => { setEditingEnterprise(enterprise); setShowModal(true) }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(enterprise.id, enterprise.name)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {showModal && (
        <EnterpriseModal
          enterprise={editingEnterprise}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            fetchEnterprises()
          }}
        />
      )}
    </div>
  )
}

function EnterpriseModal({ enterprise, onClose, onSuccess }: { enterprise?: any, onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: enterprise?.name || '',
    contact_person: enterprise?.contact_person || '',
    contact_email: enterprise?.contact_email || '',
    contact_phone: enterprise?.contact_phone || '',
    address: enterprise?.address || '',
    city: enterprise?.city || '',
    state: enterprise?.state || '',
    postal_code: enterprise?.postal_code || '',
    country: enterprise?.country || 'USA',
    notes: enterprise?.notes || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name) {
      alert('Enterprise name is required')
      return
    }

    try {
      setLoading(true)
      if (enterprise) {
        await apiService.updateEnterprise(enterprise.id, formData)
      } else {
        await apiService.createEnterprise(formData)
      }
      alert(`Enterprise ${enterprise ? 'updated' : 'created'} successfully!`)
      onSuccess()
    } catch (error: any) {
      alert(error.message || `Failed to ${enterprise ? 'update' : 'create'} enterprise`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{enterprise ? 'Edit Enterprise' : 'Create New Enterprise'}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Enterprise Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="contact_phone">Phone</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="contact_email">Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
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
                {loading ? 'Saving...' : (enterprise ? 'Update' : 'Create')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
