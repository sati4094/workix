'use client'

import { useState, useEffect } from 'react'
import { apiService } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, Download, Calendar, Building2, Package, Users } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'

export default function ReportsPage() {
  const [reportType, setReportType] = useState('work_orders')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedSite, setSelectedSite] = useState('')
  const [selectedClient, setSelectedClient] = useState('')
  const [sites, setSites] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [reportData, setReportData] = useState<any>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchFormData()
    // Set default dates (last 30 days)
    const today = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(today.getDate() - 30)
    
    setDateTo(today.toISOString().split('T')[0])
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0])
  }, [])

  const fetchFormData = async () => {
    try {
      const [sitesRes, clientsRes]: any = await Promise.all([
        apiService.getSites({ limit: 100 }),
        apiService.getClients({ limit: 100 })
      ])
      setSites(sitesRes.data.sites || [])
      setClients(clientsRes.data.clients || [])
    } catch (error) {
      console.error('Failed to fetch form data:', error)
    }
  }

  const generateReport = async () => {
    try {
      setGenerating(true)
      setReportData(null)

      let data: any = {}

      switch (reportType) {
        case 'work_orders':
          // Generate work order summary
          const woParams: any = { limit: 1000 }
          if (selectedSite) woParams.site_id = selectedSite
          
          const woRes: any = await apiService.getWorkOrders(woParams)
          const allWorkOrders = woRes.data.work_orders || []
          
          // Filter by date
          const filtered = allWorkOrders.filter((wo: any) => {
            const created = new Date(wo.created_at)
            const from = new Date(dateFrom)
            const to = new Date(dateTo)
            return created >= from && created <= to
          })

          // Calculate statistics
          const stats = {
            total: filtered.length,
            completed: filtered.filter((wo: any) => wo.status === 'completed').length,
            pending: filtered.filter((wo: any) => wo.status === 'pending').length,
            in_progress: filtered.filter((wo: any) => wo.status === 'in_progress').length,
            critical: filtered.filter((wo: any) => wo.priority === 'critical').length,
            high: filtered.filter((wo: any) => wo.priority === 'high').length,
            bySource: {} as any,
            bySite: {} as any,
          }

          filtered.forEach((wo: any) => {
            stats.bySource[wo.source] = (stats.bySource[wo.source] || 0) + 1
            stats.bySite[wo.site_name] = (stats.bySite[wo.site_name] || 0) + 1
          })

          data = { workOrders: filtered, stats }
          break

        case 'assets_by_site':
          // Generate asset report by site
          const assetsParams: any = { limit: 1000 }
          if (selectedSite) assetsParams.site_id = selectedSite
          
          const assetsRes: any = await apiService.getAssets(assetsParams)
          const assets = assetsRes.data.assets || []

          const assetsBySite: any = {}
          const assetsByType: any = {}

          assets.forEach((asset: any) => {
            if (!assetsBySite[asset.site_name]) {
              assetsBySite[asset.site_name] = []
            }
            assetsBySite[asset.site_name].push(asset)
            assetsByType[asset.type] = (assetsByType[asset.type] || 0) + 1
          })

          data = { assets, assetsBySite, assetsByType, total: assets.length }
          break

        case 'client_summary':
          // Generate client summary
          const clientId = selectedClient
          let clientData: any = {}

          if (clientId) {
            const client: any = await apiService.getClientById(clientId)
            const projects: any = await apiService.getProjects({ client_id: clientId })
            const projectIds = projects.data.projects.map((p: any) => p.id)
            
            let allSites: any[] = []
            for (const projId of projectIds) {
              const sitesRes: any = await apiService.getSites({ project_id: projId })
              allSites = [...allSites, ...(sitesRes.data.sites || [])]
            }

            let allAssets: any[] = []
            for (const site of allSites) {
              const assetsRes: any = await apiService.getAssets({ site_id: site.id })
              allAssets = [...allAssets, ...(assetsRes.data.assets || [])]
            }

            let allWorkOrders: any[] = []
            for (const site of allSites) {
              const woRes: any = await apiService.getWorkOrders({ site_id: site.id })
              allWorkOrders = [...allWorkOrders, ...(woRes.data.work_orders || [])]
            }

            clientData = {
              client: client.data.client,
              projects: projects.data.projects,
              sites: allSites,
              assets: allAssets,
              workOrders: allWorkOrders,
              stats: {
                totalProjects: projects.data.projects.length,
                totalSites: allSites.length,
                totalAssets: allAssets.length,
                totalWorkOrders: allWorkOrders.length,
                completedWorkOrders: allWorkOrders.filter((wo: any) => wo.status === 'completed').length,
              }
            }

            data = clientData
          }
          break
      }

      setReportData(data)
    } catch (error: any) {
      alert(error.message || 'Failed to generate report')
    } finally {
      setGenerating(false)
    }
  }

  const exportToCSV = () => {
    if (!reportData) return

    let csvContent = ''
    let filename = 'report.csv'

    switch (reportType) {
      case 'work_orders':
        csvContent = 'Work Order Number,Title,Status,Priority,Site,Client,Created,Completed,Technician\n'
        reportData.workOrders.forEach((wo: any) => {
          csvContent += `${wo.work_order_number},"${wo.title}",${wo.status},${wo.priority},${wo.site_name},${wo.client_name},${wo.created_at},${wo.completed_at || ''},${wo.assigned_technician_name || ''}\n`
        })
        filename = `work_orders_${dateFrom}_to_${dateTo}.csv`
        break

      case 'assets_by_site':
        csvContent = 'Site,Asset Tag,Name,Type,Manufacturer,Model,Capacity,Status\n'
        reportData.assets.forEach((asset: any) => {
          csvContent += `${asset.site_name},${asset.asset_tag},"${asset.name}",${asset.type},${asset.manufacturer || ''},${asset.model || ''},${asset.capacity || ''} ${asset.capacity_unit || ''},${asset.status}\n`
        })
        filename = 'assets_report.csv'
        break

      case 'client_summary':
        csvContent = 'Client Summary Report\n\n'
        csvContent += `Client: ${reportData.client?.name}\n`
        csvContent += `Projects: ${reportData.stats.totalProjects}\n`
        csvContent += `Sites: ${reportData.stats.totalSites}\n`
        csvContent += `Assets: ${reportData.stats.totalAssets}\n`
        csvContent += `Work Orders: ${reportData.stats.totalWorkOrders}\n\n`
        csvContent += 'Projects\n'
        csvContent += 'Name,Contract Number,Start Date,End Date,Value\n'
        reportData.projects.forEach((p: any) => {
          csvContent += `"${p.name}",${p.contract_number || ''},${p.contract_start_date || ''},${p.contract_end_date || ''},${p.contract_value || ''}\n`
        })
        filename = `client_${reportData.client?.name.replace(/\s/g, '_')}_summary.csv`
        break
    }

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-gray-600">Generate and export reports for analysis</p>
      </div>

      {/* Report Configuration */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>Select report type and parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Report Type */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="reportType">Report Type</Label>
                <select
                  id="reportType"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                >
                  <option value="work_orders">Work Orders Summary</option>
                  <option value="assets_by_site">Assets by Site</option>
                  <option value="client_summary">Client Summary</option>
                </select>
              </div>

              {reportType === 'client_summary' && (
                <div>
                  <Label htmlFor="client">Select Client</Label>
                  <select
                    id="client"
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                  >
                    <option value="">Select a client...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {(reportType === 'work_orders' || reportType === 'assets_by_site') && (
                <div>
                  <Label htmlFor="site">Site (Optional)</Label>
                  <select
                    id="site"
                    value={selectedSite}
                    onChange={(e) => setSelectedSite(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                  >
                    <option value="">All Sites</option>
                    {sites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name} ({site.project_name})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Date Range (for work orders) */}
            {reportType === 'work_orders' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dateFrom">From Date</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="dateTo">To Date</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-2 mt-6">
            <Button onClick={generateReport} disabled={generating} className="flex-1">
              <FileText className="h-4 w-4 mr-2" />
              {generating ? 'Generating...' : 'Generate Report'}
            </Button>
            {reportData && (
              <Button onClick={exportToCSV} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export to CSV
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Display */}
      {reportData && (
        <>
          {reportType === 'work_orders' && (
            <div className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Total Work Orders</p>
                      <p className="text-3xl font-bold mt-2">{reportData.stats.total}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Completed</p>
                      <p className="text-3xl font-bold text-green-600 mt-2">{reportData.stats.completed}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">In Progress</p>
                      <p className="text-3xl font-bold text-yellow-600 mt-2">{reportData.stats.in_progress}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Critical</p>
                      <p className="text-3xl font-bold text-red-600 mt-2">{reportData.stats.critical}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Work Orders Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Work Orders ({reportData.workOrders.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2">WO Number</th>
                          <th className="text-left py-2 px-2">Title</th>
                          <th className="text-left py-2 px-2">Site</th>
                          <th className="text-left py-2 px-2">Status</th>
                          <th className="text-left py-2 px-2">Priority</th>
                          <th className="text-left py-2 px-2">Created</th>
                          <th className="text-left py-2 px-2">Technician</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.workOrders.map((wo: any) => (
                          <tr key={wo.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-2 font-medium">{wo.work_order_number}</td>
                            <td className="py-2 px-2">{wo.title}</td>
                            <td className="py-2 px-2">{wo.site_name}</td>
                            <td className="py-2 px-2">
                              <span className="px-2 py-1 bg-gray-100 rounded text-xs">{wo.status}</span>
                            </td>
                            <td className="py-2 px-2">
                              <span className="px-2 py-1 bg-yellow-100 rounded text-xs">{wo.priority}</span>
                            </td>
                            <td className="py-2 px-2">{formatDate(wo.created_at)}</td>
                            <td className="py-2 px-2">{wo.assigned_technician_name || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Distribution Charts */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>By Source</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Object.entries(reportData.stats.bySource).map(([source, count]: any) => (
                      <div key={source} className="flex justify-between items-center mb-2">
                        <span className="text-sm">{source.replace('_', ' ')}</span>
                        <span className="font-bold">{count}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>By Site</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Object.entries(reportData.stats.bySite).map(([site, count]: any) => (
                      <div key={site} className="flex justify-between items-center mb-2">
                        <span className="text-sm">{site}</span>
                        <span className="font-bold">{count}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {reportType === 'assets_by_site' && (
            <Card>
              <CardHeader>
                <CardTitle>Assets Report ({reportData.total} total)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">By Type</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {Object.entries(reportData.assetsByType).map(([type, count]: any) => (
                      <div key={type} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">{type.toUpperCase()}</p>
                        <p className="text-2xl font-bold">{count}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">Asset Tag</th>
                        <th className="text-left py-2 px-2">Name</th>
                        <th className="text-left py-2 px-2">Type</th>
                        <th className="text-left py-2 px-2">Site</th>
                        <th className="text-left py-2 px-2">Manufacturer</th>
                        <th className="text-left py-2 px-2">Model</th>
                        <th className="text-left py-2 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.assets.map((asset: any) => (
                        <tr key={asset.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-2 font-medium">{asset.asset_tag}</td>
                          <td className="py-2 px-2">{asset.name}</td>
                          <td className="py-2 px-2">{asset.type}</td>
                          <td className="py-2 px-2">{asset.site_name}</td>
                          <td className="py-2 px-2">{asset.manufacturer || '-'}</td>
                          <td className="py-2 px-2">{asset.model || '-'}</td>
                          <td className="py-2 px-2">
                            <span className={`px-2 py-1 rounded text-xs ${asset.status === 'operational' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {asset.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {reportType === 'client_summary' && reportData.client && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{reportData.client.name} - Summary Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Projects</p>
                      <p className="text-2xl font-bold">{reportData.stats.totalProjects}</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Sites</p>
                      <p className="text-2xl font-bold">{reportData.stats.totalSites}</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600">Assets</p>
                      <p className="text-2xl font-bold">{reportData.stats.totalAssets}</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-gray-600">Work Orders</p>
                      <p className="text-2xl font-bold">{reportData.stats.totalWorkOrders}</p>
                    </div>
                    <div className="text-center p-4 bg-emerald-50 rounded-lg">
                      <p className="text-sm text-gray-600">Completed</p>
                      <p className="text-2xl font-bold">{reportData.stats.completedWorkOrders}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Projects ({reportData.projects.length})</h3>
                      <div className="space-y-2">
                        {reportData.projects.map((project: any) => (
                          <div key={project.id} className="p-3 bg-gray-50 rounded-lg">
                            <p className="font-medium">{project.name}</p>
                            <p className="text-sm text-gray-600">
                              {project.contract_number} • Value: ${project.contract_value?.toLocaleString() || 'N/A'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}

