'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiService } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Search, Building2, Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [projectsRes, clientsRes]: any = await Promise.all([
        apiService.getProjects({ limit: 100 }),
        apiService.getClients({ limit: 100 })
      ])
      setProjects(projectsRes.data.projects || [])
      setClients(clientsRes.data.clients || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = projects.filter(p => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      p.name?.toLowerCase().includes(query) ||
      p.client_name?.toLowerCase().includes(query) ||
      p.contract_number?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-gray-600">Manage EPC projects and contracts</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Project
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl mb-2">{project.name}</CardTitle>
                    <p className="text-sm text-gray-600">Client: {project.client_name}</p>
                    {project.contract_number && (
                      <p className="text-sm text-gray-600">Contract: {project.contract_number}</p>
                    )}
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                    {project.status?.toUpperCase()}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {project.contract_start_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span className="font-medium">{formatDate(project.contract_start_date)}</span>
                    </div>
                  )}
                  {project.contract_end_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">End Date:</span>
                      <span className="font-medium">{formatDate(project.contract_end_date)}</span>
                    </div>
                  )}
                  {project.contract_value && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Contract Value:</span>
                      <span className="font-medium">${project.contract_value.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sites:</span>
                    <span className="font-medium">{project.site_count || 0}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <Button size="sm" className="w-full" onClick={() => router.push(`/dashboard/sites?project_id=${project.id}`)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Sites
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <ProjectModal
          clients={clients}
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

function ProjectModal({ clients, onClose, onSuccess }: { clients: any[], onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    client_id: '',
    contract_number: '',
    contract_start_date: '',
    contract_end_date: '',
    contract_value: '',
    description: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.client_id) {
      alert('Please fill in required fields')
      return
    }

    try {
      setLoading(true)
      await apiService.createProject({
        ...formData,
        contract_value: formData.contract_value ? parseFloat(formData.contract_value) : null
      })
      alert('Project created successfully!')
      onSuccess()
    } catch (error: any) {
      alert(error.message || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Create New Project</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Main Campus Energy Optimization"
                required
              />
            </div>

            <div>
              <Label htmlFor="client">Client *</Label>
              <select
                id="client"
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Select a client...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contract_number">Contract Number</Label>
                <Input
                  id="contract_number"
                  value={formData.contract_number}
                  onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
                  placeholder="EPC-2024-001"
                />
              </div>
              <div>
                <Label htmlFor="contract_value">Contract Value ($)</Label>
                <Input
                  id="contract_value"
                  type="number"
                  value={formData.contract_value}
                  onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })}
                  placeholder="500000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.contract_start_date}
                  onChange={(e) => setFormData({ ...formData, contract_start_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.contract_end_date}
                  onChange={(e) => setFormData({ ...formData, contract_end_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

