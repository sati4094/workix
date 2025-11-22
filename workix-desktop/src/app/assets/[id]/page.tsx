'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store';
import { useRouter, useParams } from 'next/navigation';
import { DesktopLayout } from '@/components/desktop-layout';
import { 
  ArrowLeft,
  Camera,
  FileText,
  Download,
  Upload,
  Wrench,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Zap,
  Gauge,
  Thermometer,
  Wind,
  Droplets,
  Settings,
  Calendar,
  MapPin,
  Package,
  FileCheck,
  History,
  Edit3,
  Trash2,
  Image as ImageIcon,
  File,
  Plus,
  X,
  ExternalLink
} from 'lucide-react';

interface AssetDetail {
  id: string;
  name: string;
  asset_tag: string;
  type: string;
  model?: string;
  manufacturer?: string;
  serial_number?: string;
  status: string;
  location?: string;
  site_id?: string;
  site_name?: string;
  building_id?: number;
  floor_id?: number;
  space_id?: number;
  purchase_date?: string;
  warranty_expiry?: string;
  installation_date?: string;
  capacity?: string;
  specifications?: any;
  qr_code_url?: string;
  created_at: string;
  updated_at: string;
}

interface WorkOrder {
  id: string;
  work_order_number: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  completed_at?: string;
}

interface Document {
  id: string;
  name: string;
  type: 'datasheet' | 'manual' | 'warranty' | 'drawing' | 'photo' | 'other';
  url: string;
  uploaded_at: string;
  size?: number;
}

interface MeterReading {
  id: string;
  meter_type: string;
  reading_value: number;
  unit: string;
  recorded_at: string;
  recorded_by?: string;
  notes?: string;
}

interface PerformanceMetric {
  date: string;
  availability: number;
  efficiency: number;
  runtime_hours: number;
}

export default function AssetDetailPage() {
  const router = useRouter();
  const params = useParams();
  const assetId = params.id as string;

  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [meterReadings, setMeterReadings] = useState<MeterReading[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'workorders' | 'documents' | 'readings' | 'performance'>('overview');
  
  // Upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<'photo' | 'document'>('document');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Reading state
  const [showReadingModal, setShowReadingModal] = useState(false);
  const [newReading, setNewReading] = useState({
    meter_type: 'runtime_hours',
    reading_value: '',
    unit: 'hours',
    notes: ''
  });

  const { token } = useAuthStore();

  useEffect(() => {
    fetchAssetDetails();
    fetchWorkOrders();
    fetchDocuments();
    fetchMeterReadings();
    fetchPerformanceData();
  }, [token, assetId]);

  const fetchAssetDetails = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/assets/${assetId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      setAsset(data.data);
    } catch (error) {
      console.error('Error fetching asset:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkOrders = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/work-orders?asset_id=${assetId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      setWorkOrders(data.data?.workOrders || []);
    } catch (error) {
      console.error('Error fetching work orders:', error);
    }
  };

  const fetchDocuments = async () => {
    // Mock data - replace with actual API call
    setDocuments([
      {
        id: '1',
        name: 'Equipment Datasheet.pdf',
        type: 'datasheet',
        url: '/docs/datasheet.pdf',
        uploaded_at: new Date().toISOString(),
        size: 2048000
      },
      {
        id: '2',
        name: 'Installation Manual.pdf',
        type: 'manual',
        url: '/docs/manual.pdf',
        uploaded_at: new Date().toISOString(),
        size: 5120000
      }
    ]);
  };

  const fetchMeterReadings = async () => {
    // Mock data - replace with actual API call
    const mockReadings: MeterReading[] = [];
    for (let i = 0; i < 10; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i * 7);
      mockReadings.push({
        id: `${i}`,
        meter_type: i % 2 === 0 ? 'runtime_hours' : 'temperature',
        reading_value: i % 2 === 0 ? 1000 + i * 100 : 20 + Math.random() * 5,
        unit: i % 2 === 0 ? 'hours' : '°C',
        recorded_at: date.toISOString(),
        recorded_by: 'John Doe',
        notes: i === 0 ? 'Regular weekly reading' : undefined
      });
    }
    setMeterReadings(mockReadings);
  };

  const fetchPerformanceData = async () => {
    // Mock data - replace with actual API call
    const mockData: PerformanceMetric[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      mockData.push({
        date: date.toISOString().split('T')[0],
        availability: 85 + Math.random() * 15,
        efficiency: 75 + Math.random() * 20,
        runtime_hours: 18 + Math.random() * 6
      });
    }
    setPerformanceData(mockData.reverse());
  };

  const handleAddReading = async () => {
    if (!newReading.reading_value) return;

    const reading: MeterReading = {
      id: Date.now().toString(),
      meter_type: newReading.meter_type,
      reading_value: parseFloat(newReading.reading_value),
      unit: newReading.unit,
      recorded_at: new Date().toISOString(),
      recorded_by: 'Current User',
      notes: newReading.notes || undefined
    };

    setMeterReadings([reading, ...meterReadings]);
    setShowReadingModal(false);
    setNewReading({
      meter_type: 'runtime_hours',
      reading_value: '',
      unit: 'hours',
      notes: ''
    });

    // TODO: Send to API
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    // TODO: Upload to server
    
    const newDoc: Document = {
      id: Date.now().toString(),
      name: file.name,
      type: uploadType === 'photo' ? 'photo' : 'other',
      url: URL.createObjectURL(file),
      uploaded_at: new Date().toISOString(),
      size: file.size
    };

    setDocuments([newDoc, ...documents]);
    setShowUploadModal(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Active: 'bg-green-100 text-green-800 border-green-300',
      Inactive: 'bg-gray-100 text-gray-800 border-gray-300',
      Maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Out of Service': 'bg-red-100 text-red-800 border-red-300',
      operational: 'bg-green-100 text-green-800 border-green-300',
      down: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getWorkOrderStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const calculateKPIs = () => {
    const completedWOs = workOrders.filter(wo => wo.status === 'completed').length;
    const totalWOs = workOrders.length;
    const avgAvailability = performanceData.length > 0
      ? performanceData.reduce((sum, m) => sum + m.availability, 0) / performanceData.length
      : 0;
    
    const last30DaysData = performanceData.slice(-30);
    const avgPerformance = last30DaysData.length > 0
      ? last30DaysData.reduce((sum, m) => sum + m.efficiency, 0) / last30DaysData.length
      : 0;

    return {
      availability: avgAvailability,
      performance: avgPerformance,
      totalWorkOrders: totalWOs,
      completedWorkOrders: completedWOs,
      completionRate: totalWOs > 0 ? (completedWOs / totalWOs) * 100 : 0
    };
  };

  const kpis = calculateKPIs();

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'datasheet': return <FileCheck className="w-5 h-5 text-blue-600" />;
      case 'manual': return <FileText className="w-5 h-5 text-purple-600" />;
      case 'photo': return <ImageIcon className="w-5 h-5 text-green-600" />;
      case 'drawing': return <Settings className="w-5 h-5 text-orange-600" />;
      default: return <File className="w-5 h-5 text-gray-600" />;
    }
  };

  const getMeterIcon = (type: string) => {
    switch (type) {
      case 'runtime_hours': return <Clock className="w-5 h-5 text-blue-600" />;
      case 'temperature': return <Thermometer className="w-5 h-5 text-red-600" />;
      case 'pressure': return <Gauge className="w-5 h-5 text-purple-600" />;
      case 'flow_rate': return <Wind className="w-5 h-5 text-cyan-600" />;
      case 'humidity': return <Droplets className="w-5 h-5 text-blue-400" />;
      default: return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <DesktopLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Activity className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading asset details...</p>
          </div>
        </div>
      </DesktopLayout>
    );
  }

  if (!asset) {
    return (
      <DesktopLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-600">Asset not found</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </DesktopLayout>
    );
  }

  return (
    <DesktopLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header Section */}
        <div className="bg-white border-b shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">{asset.name}</h1>
                    <span className="font-mono text-sm bg-gray-100 px-3 py-1 rounded-lg">
                      {asset.asset_tag}
                    </span>
                    <span className={`flex items-center gap-1 px-3 py-1 rounded-lg border-2 font-semibold text-sm ${getStatusColor(asset.status)}`}>
                      <CheckCircle2 className="w-4 h-4" />
                      {asset.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      {asset.type}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {asset.location || 'No location'}
                    </span>
                    {asset.manufacturer && (
                      <span>{asset.manufacturer} {asset.model}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <span className={`text-sm font-medium ${kpis.availability >= 95 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {kpis.availability >= 95 ? '↑' : '↓'} {(kpis.availability - 90).toFixed(1)}%
                </span>
              </div>
              <p className="text-sm text-gray-600">Availability</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.availability.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-1">Last 30 days average</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <span className={`text-sm font-medium ${kpis.performance >= 85 ? 'text-green-600' : 'text-red-600'}`}>
                  {kpis.performance >= 85 ? '↑' : '↓'} {(kpis.performance - 80).toFixed(1)}%
                </span>
              </div>
              <p className="text-sm text-gray-600">Performance</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.performance.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-1">Efficiency rating</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Wrench className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-blue-600">
                  {kpis.completionRate.toFixed(0)}%
                </span>
              </div>
              <p className="text-sm text-gray-600">Work Orders</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.completedWorkOrders}/{kpis.totalWorkOrders}</p>
              <p className="text-xs text-gray-500 mt-1">Completed / Total</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Gauge className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Live</span>
              </div>
              <p className="text-sm text-gray-600">Runtime Hours</p>
              <p className="text-2xl font-bold text-gray-900">
                {meterReadings.find(r => r.meter_type === 'runtime_hours')?.reading_value.toFixed(0) || '0'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total operating hours</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - 2/3 width */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tabs */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="border-b">
                  <div className="flex gap-1 p-2">
                    {[
                      { id: 'overview', label: 'Overview', icon: FileText },
                      { id: 'workorders', label: 'Work Orders', icon: Wrench, badge: workOrders.length },
                      { id: 'documents', label: 'Documents', icon: File, badge: documents.length },
                      { id: 'readings', label: 'Meter Readings', icon: Gauge, badge: meterReadings.length },
                      { id: 'performance', label: 'Performance', icon: TrendingUp },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                          activeTab === tab.id
                            ? 'bg-blue-50 text-blue-700 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                        {tab.badge !== undefined && (
                          <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6">
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          Asset Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-600">Serial Number</p>
                            <p className="font-mono font-medium mt-1">{asset.serial_number || 'N/A'}</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-600">Manufacturer</p>
                            <p className="font-medium mt-1">{asset.manufacturer || 'N/A'}</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-600">Model</p>
                            <p className="font-medium mt-1">{asset.model || 'N/A'}</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-600">Capacity</p>
                            <p className="font-medium mt-1">{asset.capacity || 'N/A'}</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-600">Purchase Date</p>
                            <p className="font-medium mt-1">
                              {asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-600">Warranty Expiry</p>
                            <p className="font-medium mt-1">
                              {asset.warranty_expiry ? new Date(asset.warranty_expiry).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {asset.specifications && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-purple-600" />
                            Specifications
                          </h3>
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                              {JSON.stringify(asset.specifications, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Work Orders Tab */}
                  {activeTab === 'workorders' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Related Work Orders</h3>
                        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                          View All
                        </button>
                      </div>
                      {workOrders.length === 0 ? (
                        <div className="text-center py-12">
                          <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600">No work orders found for this asset</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {workOrders.map((wo) => (
                            <a
                              key={wo.id}
                              href={`/work-orders/${wo.id}`}
                              className="block p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    <span className="font-mono text-sm text-blue-600 font-semibold">
                                      {wo.work_order_number}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getWorkOrderStatusColor(wo.status)}`}>
                                      {wo.status}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      wo.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                      wo.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                      wo.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-green-100 text-green-800'
                                    }`}>
                                      {wo.priority}
                                    </span>
                                  </div>
                                  <p className="font-medium mt-2">{wo.title}</p>
                                  <p className="text-sm text-gray-600 mt-1">
                                    Created: {new Date(wo.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <ExternalLink className="w-5 h-5 text-gray-400" />
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Documents Tab */}
                  {activeTab === 'documents' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Asset Documents</h3>
                        <button
                          onClick={() => setShowUploadModal(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <Upload className="w-4 h-4" />
                          Upload
                        </button>
                      </div>

                      {/* Datasheet Section */}
                      <div>
                        <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-blue-600" />
                          Datasheet (Technical Specifications)
                        </h4>
                        {documents.filter(d => d.type === 'datasheet').length === 0 ? (
                          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                            <FileCheck className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">No datasheet uploaded</p>
                            <button className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
                              Upload Datasheet
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {documents.filter(d => d.type === 'datasheet').map((doc) => (
                              <div key={doc.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-3">
                                  {getDocumentIcon(doc.type)}
                                  <div>
                                    <p className="font-medium text-sm">{doc.name}</p>
                                    <p className="text-xs text-gray-600">
                                      {formatFileSize(doc.size)} • {new Date(doc.uploaded_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button className="p-2 hover:bg-blue-100 rounded-lg">
                                    <Download className="w-4 h-4 text-blue-600" />
                                  </button>
                                  <button className="p-2 hover:bg-red-100 rounded-lg">
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Other Documents */}
                      <div>
                        <h4 className="font-semibold text-sm text-gray-700 mb-2">Other Documents</h4>
                        <div className="space-y-2">
                          {documents.filter(d => d.type !== 'datasheet').map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100">
                              <div className="flex items-center gap-3">
                                {getDocumentIcon(doc.type)}
                                <div>
                                  <p className="font-medium text-sm">{doc.name}</p>
                                  <p className="text-xs text-gray-600">
                                    {doc.type} • {formatFileSize(doc.size)} • {new Date(doc.uploaded_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button className="p-2 hover:bg-gray-200 rounded-lg">
                                  <Download className="w-4 h-4 text-gray-600" />
                                </button>
                                <button className="p-2 hover:bg-red-100 rounded-lg">
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Meter Readings Tab */}
                  {activeTab === 'readings' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Meter & Sensor Readings</h3>
                        <button
                          onClick={() => setShowReadingModal(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4" />
                          Add Reading
                        </button>
                      </div>

                      <div className="space-y-3">
                        {meterReadings.map((reading) => (
                          <div key={reading.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {getMeterIcon(reading.meter_type)}
                                <div>
                                  <p className="font-medium capitalize">
                                    {reading.meter_type.replace('_', ' ')}
                                  </p>
                                  <p className="text-2xl font-bold text-blue-600 mt-1">
                                    {reading.reading_value.toFixed(2)} {reading.unit}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-600">
                                  {new Date(reading.recorded_at).toLocaleString()}
                                </p>
                                {reading.recorded_by && (
                                  <p className="text-xs text-gray-500">By: {reading.recorded_by}</p>
                                )}
                              </div>
                            </div>
                            {reading.notes && (
                              <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-200">
                                {reading.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Performance Tab */}
                  {activeTab === 'performance' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold">Performance Metrics (Last 30 Days)</h3>
                      
                      {/* Simple Chart */}
                      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                        <div className="h-64 flex items-end justify-between gap-1">
                          {performanceData.slice(-30).map((data, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                              <div className="w-full bg-green-500 rounded-t" style={{ height: `${data.availability}%` }}></div>
                              <div className="w-full bg-blue-500 rounded-t" style={{ height: `${data.efficiency}%` }}></div>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-center gap-6 mt-4">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-500 rounded"></div>
                            <span className="text-sm">Availability</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-blue-500 rounded"></div>
                            <span className="text-sm">Efficiency</span>
                          </div>
                        </div>
                      </div>

                      {/* Performance Table */}
                      <div>
                        <h4 className="font-semibold mb-3">Detailed Metrics</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-100 border-b-2 border-gray-200">
                              <tr>
                                <th className="text-left p-3 font-semibold">Date</th>
                                <th className="text-right p-3 font-semibold">Availability</th>
                                <th className="text-right p-3 font-semibold">Efficiency</th>
                                <th className="text-right p-3 font-semibold">Runtime (hrs)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {performanceData.slice(-7).reverse().map((data, idx) => (
                                <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                                  <td className="p-3">{new Date(data.date).toLocaleDateString()}</td>
                                  <td className="p-3 text-right font-medium">{data.availability.toFixed(1)}%</td>
                                  <td className="p-3 text-right font-medium">{data.efficiency.toFixed(1)}%</td>
                                  <td className="p-3 text-right font-medium">{data.runtime_hours.toFixed(1)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar - 1/3 width */}
            <div className="space-y-6">
              {/* Asset Image */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-blue-600" />
                  Asset Photo
                </h3>
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No photo uploaded</p>
                    <button className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
                      Upload Photo
                    </button>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              {asset.qr_code_url && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="font-semibold mb-4">QR Code</h3>
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                    <img src={asset.qr_code_url} alt="QR Code" className="w-full h-full object-contain" />
                  </div>
                </div>
              )}

              {/* Location Details */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Location Details
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Site</p>
                      <p className="font-medium">{asset.site_name || 'N/A'}</p>
                    </div>
                  </div>
                  {asset.building_id && (
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Building</p>
                        <p className="font-medium">Building {asset.building_id}</p>
                      </div>
                    </div>
                  )}
                  {asset.floor_id && (
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Floor</p>
                        <p className="font-medium">Floor {asset.floor_id}</p>
                      </div>
                    </div>
                  )}
                  {asset.space_id && (
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Space</p>
                        <p className="font-medium">Space {asset.space_id}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-600" />
                  Timeline
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium text-sm">Asset Created</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(asset.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {asset.installation_date && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Settings className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium text-sm">Installed</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {new Date(asset.installation_date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-gray-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Last Updated</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(asset.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-xl font-semibold">Upload Document</h3>
                <button onClick={() => setShowUploadModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
                  <select
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="document">Document</option>
                    <option value="photo">Photo</option>
                  </select>
                </div>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700">Click to select file</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Reading Modal */}
        {showReadingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-xl font-semibold">Add Meter Reading</h3>
                <button onClick={() => setShowReadingModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meter Type</label>
                  <select
                    value={newReading.meter_type}
                    onChange={(e) => setNewReading({ ...newReading, meter_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="runtime_hours">Runtime Hours</option>
                    <option value="temperature">Temperature</option>
                    <option value="pressure">Pressure</option>
                    <option value="flow_rate">Flow Rate</option>
                    <option value="humidity">Humidity</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reading Value</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newReading.reading_value}
                    onChange={(e) => setNewReading({ ...newReading, reading_value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter value"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                  <input
                    type="text"
                    value={newReading.unit}
                    onChange={(e) => setNewReading({ ...newReading, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., hours, °C, psi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea
                    value={newReading.notes}
                    onChange={(e) => setNewReading({ ...newReading, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => setShowReadingModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddReading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Reading
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DesktopLayout>
  );
}
