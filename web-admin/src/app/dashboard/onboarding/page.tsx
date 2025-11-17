'use client'

import { useState } from 'react'
import { apiService } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Download, Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react'

export default function OnboardingPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const downloadTemplate = (type: 'clients' | 'sites' | 'assets') => {
    let csvContent = ''
    
    switch (type) {
      case 'clients':
        csvContent = `name,contact_person,contact_email,contact_phone,address,city,state,postal_code,country,notes
Green Energy Corp,Michael Johnson,michael.j@greenenergy.com,+1-555-2000,123 Business Ave,New York,NY,10001,USA,Important client
Tech Solutions Inc,Sarah Smith,sarah@techsolutions.com,+1-555-3000,456 Tech Street,Boston,MA,02101,USA,New partnership`
        break
      
      case 'sites':
        csvContent = `project_name,name,address,city,state,postal_code,contact_person,contact_phone,contact_email,operating_hours
Main Campus Energy Optimization,Building A - Main Office,456 Green Street,New York,NY,10002,Building Manager,+1-555-3000,manager@site.com,24/7
Main Campus Energy Optimization,Building B - Warehouse,789 Storage Ave,New York,NY,10003,Site Supervisor,+1-555-3001,supervisor@site.com,Mon-Fri 8AM-6PM`
        break
      
      case 'assets':
        csvContent = `site_name,asset_tag,name,type,manufacturer,model,serial_number,capacity,capacity_unit,commissioning_date
Building A - Main Office,CH-001,Main Chiller Unit 1,chiller,Carrier,30XA-502,SN12345,500,Tons,2020-06-15
Building A - Main Office,AHU-001,Air Handling Unit - Floor 1,ahu,Trane,CGAM-140,SN67890,14000,CFM,2020-06-15
Building A - Main Office,PUMP-001,Primary Chilled Water Pump,pump,Grundfos,NBG-125,SN11111,125,HP,2020-07-01`
        break
    }

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workix_${type}_template.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleFileUpload = async (type: 'clients' | 'sites' | 'assets') => {
    if (!selectedFile) {
      alert('Please select a file first')
      return
    }

    try {
      setUploading(true)
      setResults(null)

      const text = await selectedFile.text()
      const lines = text.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim())
      
      const items = []
      const errors = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        const item: any = {}
        
        headers.forEach((header, index) => {
          item[header] = values[index] || ''
        })

        items.push(item)
      }

      // Process items based on type
      let successCount = 0
      let failCount = 0

      for (const item of items) {
        try {
          if (type === 'clients') {
            await apiService.createClient(item)
          } else if (type === 'sites') {
            // Find project ID by name
            const projectsRes: any = await apiService.getProjects({ limit: 100 })
            const project = projectsRes.data.projects.find((p: any) => p.name === item.project_name)
            
            if (!project) {
              errors.push(`Project "${item.project_name}" not found for site "${item.name}"`)
              failCount++
              continue
            }

            await apiService.createSite({ ...item, project_id: project.id })
          } else if (type === 'assets') {
            // Find site ID by name
            const sitesRes: any = await apiService.getSites({ limit: 100 })
            const site = sitesRes.data.sites.find((s: any) => s.name === item.site_name)
            
            if (!site) {
              errors.push(`Site "${item.site_name}" not found for asset "${item.name}"`)
              failCount++
              continue
            }

            await apiService.createAsset({ ...item, site_id: site.id })
          }
          
          successCount++
        } catch (error: any) {
          errors.push(`Failed to create ${item.name || 'item'}: ${error.message}`)
          failCount++
        }
      }

      setResults({
        total: items.length,
        success: successCount,
        failed: failCount,
        errors
      })

      if (successCount > 0) {
        alert(`Successfully imported ${successCount} ${type}!`)
      }
    } catch (error: any) {
      alert('Failed to process file: ' + error.message)
    } finally {
      setUploading(false)
      setSelectedFile(null)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Bulk Onboarding</h1>
        <p className="text-gray-600">Import clients, sites, and assets from Excel/CSV files</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Clients Bulk Import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileSpreadsheet className="h-5 w-5 mr-2 text-blue-600" />
              Clients
            </CardTitle>
            <CardDescription>Import multiple clients at once</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => downloadTemplate('clients')}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>

            <div>
              <Label htmlFor="clients-file">Upload File</Label>
              <Input
                id="clients-file"
                type="file"
                accept=".csv,.xlsx"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="mt-1"
              />
            </div>

            <Button 
              className="w-full"
              onClick={() => handleFileUpload('clients')}
              disabled={!selectedFile || uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Import Clients'}
            </Button>

            <div className="text-xs text-gray-600 space-y-1">
              <p>📝 Template includes:</p>
              <ul className="list-disc list-inside pl-2">
                <li>Company name</li>
                <li>Contact person</li>
                <li>Email & phone</li>
                <li>Address details</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Sites Bulk Import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileSpreadsheet className="h-5 w-5 mr-2 text-green-600" />
              Sites
            </CardTitle>
            <CardDescription>Import multiple sites at once</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => downloadTemplate('sites')}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>

            <div>
              <Label htmlFor="sites-file">Upload File</Label>
              <Input
                id="sites-file"
                type="file"
                accept=".csv,.xlsx"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="mt-1"
              />
            </div>

            <Button 
              className="w-full"
              onClick={() => handleFileUpload('sites')}
              disabled={!selectedFile || uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Import Sites'}
            </Button>

            <div className="text-xs text-gray-600 space-y-1">
              <p>📝 Template includes:</p>
              <ul className="list-disc list-inside pl-2">
                <li>Project name (must exist)</li>
                <li>Site name & address</li>
                <li>Contact details</li>
                <li>Operating hours</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Assets Bulk Import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileSpreadsheet className="h-5 w-5 mr-2 text-purple-600" />
              Assets
            </CardTitle>
            <CardDescription>Import multiple assets at once</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => downloadTemplate('assets')}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>

            <div>
              <Label htmlFor="assets-file">Upload File</Label>
              <Input
                id="assets-file"
                type="file"
                accept=".csv,.xlsx"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="mt-1"
              />
            </div>

            <Button 
              className="w-full"
              onClick={() => handleFileUpload('assets')}
              disabled={!selectedFile || uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Import Assets'}
            </Button>

            <div className="text-xs text-gray-600 space-y-1">
              <p>📝 Template includes:</p>
              <ul className="list-disc list-inside pl-2">
                <li>Site name (must exist)</li>
                <li>Asset tag & name</li>
                <li>Type & manufacturer</li>
                <li>Capacity & specs</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {results && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Import Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-medium">Successful</span>
                </div>
                <span className="text-2xl font-bold text-green-600">{results.success}</span>
              </div>

              {results.failed > 0 && (
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    <span className="font-medium">Failed</span>
                  </div>
                  <span className="text-2xl font-bold text-red-600">{results.failed}</span>
                </div>
              )}

              {results.errors.length > 0 && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="font-medium mb-2">Errors:</p>
                  <ul className="text-sm space-y-1">
                    {results.errors.map((error: string, index: number) => (
                      <li key={index} className="text-yellow-800">• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How to Use Bulk Import</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">Step 1: Download Template</h3>
              <p className="text-gray-600">Click the "Download Template" button for the type of data you want to import (Clients, Sites, or Assets).</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Step 2: Fill in Data</h3>
              <p className="text-gray-600">Open the CSV file in Excel or Google Sheets. Fill in your data following the example rows provided. Don't modify the header row!</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Step 3: Upload File</h3>
              <p className="text-gray-600">Save your file as CSV, then upload it using the file input and click the Import button.</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">⚠️ Important Notes:</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1 pl-2">
                <li><strong>Sites:</strong> The project must exist before importing sites</li>
                <li><strong>Assets:</strong> The site must exist before importing assets</li>
                <li><strong>Order:</strong> Import in sequence: Clients → Projects → Sites → Assets</li>
                <li><strong>Format:</strong> Keep the CSV format, don't add extra columns</li>
                <li><strong>Duplicates:</strong> Duplicate asset tags will be rejected</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

