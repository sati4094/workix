'use client';

import { useState } from 'react';
import { 
  useDashboardStats, 
  useRealTimeMetrics,
  useAnalyticsTrends,
  useAssetReliability,
  useTechnicianPerformance 
} from '@/hooks/useApi';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Users, 
  Wrench,
  Activity,
  DollarSign,
  Target,
} from 'lucide-react';

// Color palette for AI-age impressive visualizations
const COLORS = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
  purple: '#A855F7',
  pink: '#EC4899',
  gradient: ['#3B82F6', '#8B5CF6', '#A855F7', '#EC4899'],
};

const CHART_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'];

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon: React.ReactNode;
  gradient: string;
}

function KPICard({ title, value, subtitle, trend, trendValue, icon, gradient }: KPICardProps) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${gradient} p-6 text-white shadow-lg transition-all hover:shadow-2xl hover:scale-105`}>
      <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
        <div className="text-9xl">{icon}</div>
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium opacity-90">{title}</p>
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            {icon}
          </div>
        </div>
        <h3 className="text-3xl font-bold mb-1">{value}</h3>
        {subtitle && <p className="text-sm opacity-80">{subtitle}</p>}
        {trend && trendValue && (
          <div className="flex items-center mt-2 text-sm">
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4 mr-1" />
            ) : trend === 'down' ? (
              <TrendingDown className="w-4 h-4 mr-1" />
            ) : null}
            <span className="font-medium">{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30');
  
  const { data: dashboardData, isLoading: dashboardLoading } = useDashboardStats(timeRange);
  const { data: realTimeData, isLoading: realTimeLoading } = useRealTimeMetrics();
  const { data: trendsData, isLoading: trendsLoading } = useAnalyticsTrends(timeRange);
  const { data: assetData, isLoading: assetLoading } = useAssetReliability();
  const { data: techData, isLoading: techLoading } = useTechnicianPerformance();

  const dashboard = dashboardData?.data?.data;
  const realTime = realTimeData?.data?.data;
  const trends = trendsData?.data?.data;
  const assets = assetData?.data?.data;
  const technicians = techData?.data?.data;

  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const kpis = dashboard?.kpis;
  const slaCompliance = dashboard?.slaCompliance;
  const topTechnicians = dashboard?.topTechnicians || [];
  const assetPerformance = dashboard?.assetPerformance || [];
  const costAnalysis = dashboard?.costAnalysis || [];
  const responseTimes = dashboard?.responseTimes;

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time insights and performance metrics</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="180">Last 6 months</option>
        </select>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Work Orders"
          value={kpis?.total_work_orders || 0}
          subtitle={`${kpis?.completed || 0} completed`}
          trend="up"
          trendValue={`${kpis?.completion_rate || 0}% completion`}
          icon={<Wrench className="w-6 h-6" />}
          gradient="from-blue-500 to-blue-600"
        />
        <KPICard
          title="SLA Compliance"
          value={`${slaCompliance?.compliance_rate || 0}%`}
          subtitle={`${slaCompliance?.violations || 0} violations`}
          trend={Number(slaCompliance?.compliance_rate) >= 95 ? 'up' : 'down'}
          trendValue={`${slaCompliance?.compliant || 0} compliant`}
          icon={<Target className="w-6 h-6" />}
          gradient="from-green-500 to-emerald-600"
        />
        <KPICard
          title="Avg Completion Time"
          value={`${kpis?.avg_completion_hours || 0}h`}
          subtitle="Response time"
          trend="neutral"
          icon={<Clock className="w-6 h-6" />}
          gradient="from-purple-500 to-purple-600"
        />
        <KPICard
          title="Active Technicians"
          value={kpis?.active_technicians || 0}
          subtitle={`${kpis?.completed_this_week || 0} completed this week`}
          trend="up"
          icon={<Users className="w-6 h-6" />}
          gradient="from-pink-500 to-rose-600"
        />
      </div>

      {/* Real-time Metrics Banner */}
      {realTime && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-4 bg-white rounded-xl shadow-md border border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-2xl font-bold text-orange-600">{realTime.pending_count || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Active</p>
            <p className="text-2xl font-bold text-blue-600">{realTime.active_count || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Critical Open</p>
            <p className="text-2xl font-bold text-red-600">{realTime.critical_open || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">SLA Today</p>
            <p className="text-2xl font-bold text-purple-600">{realTime.sla_violations_today || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Low Stock</p>
            <p className="text-2xl font-bold text-yellow-600">{realTime.low_stock_items || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Unread</p>
            <p className="text-2xl font-bold text-green-600">{realTime.unread_notifications || 0}</p>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work Order Trends */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-500" />
            Work Order Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dashboard?.trends || []}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke={COLORS.primary} 
                fillOpacity={1} 
                fill="url(#colorTotal)" 
                name="Total Work Orders"
              />
              <Area 
                type="monotone" 
                dataKey="completed" 
                stroke={COLORS.success} 
                fillOpacity={1} 
                fill="url(#colorCompleted)" 
                name="Completed"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2 text-green-500" />
            Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dashboard?.statusDistribution || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.status}: ${entry.percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
                nameKey="status"
              >
                {(dashboard?.statusDistribution || []).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
            Priority Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboard?.priorityDistribution || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="priority" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
              <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Bar dataKey="count" fill={COLORS.primary} radius={[8, 8, 0, 0]}>
                {(dashboard?.priorityDistribution || []).map((entry: any, index: number) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={
                      entry.priority === 'critical' ? COLORS.danger :
                      entry.priority === 'high' ? COLORS.warning :
                      entry.priority === 'medium' ? COLORS.info :
                      COLORS.success
                    } 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Analysis */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-green-500" />
            Parts Cost Analysis
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={costAnalysis}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="week" 
                stroke="#9CA3AF"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value: any) => `$${parseFloat(value).toFixed(2)}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="total_parts_cost" 
                stroke={COLORS.success} 
                strokeWidth={3}
                dot={{ fill: COLORS.success, r: 5 }}
                name="Total Cost"
              />
              <Line 
                type="monotone" 
                dataKey="avg_cost_per_wo" 
                stroke={COLORS.secondary} 
                strokeWidth={2}
                dot={{ fill: COLORS.secondary, r: 4 }}
                name="Avg Cost per WO"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Technicians */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-500" />
            Top Performing Technicians
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Hours</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Critical</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topTechnicians.slice(0, 5).map((tech: any, index: number) => (
                  <tr key={tech.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{tech.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {tech.completed_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {tech.avg_completion_hours}h
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        {tech.critical_completed}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Asset Performance */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Wrench className="w-5 h-5 mr-2 text-purple-500" />
            Assets Requiring Attention
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Orders</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Repair</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assetPerformance.slice(0, 5).map((asset: any) => (
                  <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {asset.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        asset.work_order_count > 5 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {asset.work_order_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {asset.avg_repair_hours}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Response Time Metrics */}
      {responseTimes && (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
          <h3 className="text-xl font-semibold mb-4">Response & Resolution Times</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
              <p className="text-sm opacity-90 mb-1">Avg Response</p>
              <p className="text-2xl font-bold">{responseTimes.avg_response_hours}h</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
              <p className="text-sm opacity-90 mb-1">Median Response</p>
              <p className="text-2xl font-bold">{responseTimes.median_response_hours}h</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
              <p className="text-sm opacity-90 mb-1">Avg Resolution</p>
              <p className="text-2xl font-bold">{responseTimes.avg_resolution_hours}h</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
              <p className="text-sm opacity-90 mb-1">Median Resolution</p>
              <p className="text-2xl font-bold">{responseTimes.median_resolution_hours}h</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
