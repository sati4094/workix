'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store';
import { useRouter, useParams } from 'next/navigation';
import { DesktopLayout } from '@/components/desktop-layout';
import { Breadcrumb } from '@/components/Breadcrumb';
import { 
  Clock, 
  User, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  Paperclip, 
  Send,
  FileText,
  History,
  ListTodo,
  ArrowLeft,
  Edit3,
  Download,
  Trash2,
  MapPin,
  Building,
  Layers,
  Box,
  TrendingUp,
  PlayCircle,
  PauseCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface Activity {
  id: string;
  workOrderId: string;
  description: string;
  timestamp: string;
  createdBy: string;
  activity_type?: string;
}

interface ChatMessage {
  id: string;
  message: string;
  sender: string;
  timestamp: string;
  attachments?: string[];
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  assignee?: string;
}

interface StatusHistory {
  id: string;
  from_status: string;
  to_status: string;
  changed_by: string;
  changed_at: string;
  notes?: string;
}

export default function WorkOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const workOrderId = params.id as string;

  const [workOrder, setWorkOrder] = useState<any>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Chat state
  const [newMessage, setNewMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'tasks' | 'history' | 'files'>('overview');
  
  // Status change state
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: '',
    status: '',
    assigned_to: '',
    due_date: '',
  });
  
  const { token, user, hydrated, isAuthenticated } = useAuthStore();

  // Redirect to login if not authenticated after hydration
  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [hydrated, isAuthenticated, router]);

  useEffect(() => {
    // Only fetch when token is available and hydrated
    if (hydrated && token && workOrderId) {
      fetchWorkOrderDetails();
      fetchActivities();
      fetchChatMessages();
      fetchTasks();
      fetchStatusHistory();
    }
  }, [hydrated, token, workOrderId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Close status menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showStatusMenu && !target.closest('.status-menu-container')) {
        setShowStatusMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showStatusMenu]);

  const fetchWorkOrderDetails = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/work-orders/${workOrderId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch work order');
      }
      
      // Backend returns: { success: true, data: { work_order: {...} } }
      const workOrderData = data.data?.work_order || data.data;
      
      if (!workOrderData) {
        throw new Error('No work order data received');
      }
      
      setWorkOrder(workOrderData);
    } catch (error: any) {
      console.error('Error fetching work order:', error);
      alert(`Failed to load work order details: ${error.message}`);
      router.push('/work-orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/work-orders/${workOrderId}/activities`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      
      if (data.data) {
        if (Array.isArray(data.data.activities)) {
          setActivities(data.data.activities);
        } else if (Array.isArray(data.data)) {
          setActivities(data.data);
        } else {
          setActivities([]);
        }
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    }
  };

  const fetchChatMessages = async () => {
    // Mock chat messages - replace with actual API call
    setChatMessages([
      {
        id: '1',
        message: 'Work order created and assigned',
        sender: 'System',
        timestamp: new Date().toISOString(),
      }
    ]);
  };

  const fetchTasks = async () => {
    // Mock tasks - replace with actual API call
    setTasks([
      { id: '1', title: 'Initial inspection', completed: true, assignee: 'John Doe' },
      { id: '2', title: 'Order replacement parts', completed: false, assignee: 'John Doe' },
      { id: '3', title: 'Schedule repair', completed: false },
    ]);
  };

  const fetchStatusHistory = async () => {
    // Mock status history - replace with actual API call
    setStatusHistory([
      {
        id: '1',
        from_status: 'pending',
        to_status: 'acknowledged',
        changed_by: 'John Doe',
        changed_at: new Date().toISOString(),
        notes: 'Work order received and reviewed'
      }
    ]);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && selectedFiles.length === 0) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      message: newMessage,
      sender: user?.name || 'Current User',
      timestamp: new Date().toISOString(),
      attachments: selectedFiles.map(f => f.name),
    };

    setChatMessages([...chatMessages, newMsg]);
    setNewMessage('');
    setSelectedFiles([]);

    // TODO: Send to actual API
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/work-orders/${workOrderId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            status: newStatus,
          }),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to update status');
      }

      // Add to status history
      const newHistory: StatusHistory = {
        id: Date.now().toString(),
        from_status: workOrder?.status || 'unknown',
        to_status: newStatus,
        changed_by: user?.name || 'Current User',
        changed_at: new Date().toISOString(),
        notes: statusNote,
      };
      setStatusHistory([newHistory, ...statusHistory]);

      // Update local state
      setWorkOrder({ ...workOrder, status: newStatus });
      setShowStatusMenu(false);
      setStatusNote('');
      
      alert(`Status updated successfully to ${newStatus.replace('_', ' ').toUpperCase()}`);
      
      // Refresh data
      await fetchWorkOrderDetails();
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert(`Failed to update status: ${error.message}`);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
    // TODO: Update via API
  };

  const handleEditWorkOrder = () => {
    if (!workOrder) return;
    
    // Populate form with current work order data
    setEditForm({
      title: workOrder.title || '',
      description: workOrder.description || '',
      priority: workOrder.priority || 'medium',
      status: workOrder.status || 'pending',
      assigned_to: workOrder.assigned_to || '',
      due_date: workOrder.due_date ? new Date(workOrder.due_date).toISOString().split('T')[0] : '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/work-orders/${workOrderId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editForm),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update work order');
      }

      alert('Work order updated successfully!');
      setShowEditModal(false);
      
      // Refresh work order data
      await fetchWorkOrderDetails();
    } catch (error: any) {
      console.error('Error updating work order:', error);
      alert(`Failed to update work order: ${error.message}`);
    }
  };

  const handleDownloadReport = async () => {
    try {
      // Create PDF content
      const pdfContent = generateWorkOrderPDF(workOrder, tasks, activities);
      
      // Create blob and download
      const blob = new Blob([pdfContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `WorkOrder_${workOrder?.work_order_number}_Report.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    }
  };

  const handleAIEnhance = async () => {
    if (!workOrder?.description) {
      alert('No description available to enhance');
      return;
    }

    if (!workOrder.description.trim()) {
      alert('Description is empty. Please add a description first.');
      return;
    }

    try {
      // Enhance the work order description using AI
      const response = await fetch(
        `http://localhost:5000/api/v1/ai/enhance-text`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: workOrder.description,
            context: 'observation', // Use observation context for work order descriptions
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.message || data.error || 'AI enhancement request failed';
        throw new Error(errorMsg);
      }
      
      if (!data.success) {
        throw new Error(data.message || 'AI service returned unsuccessful response');
      }

      const enhancedText = data.data?.enhanced || data.data?.enhanced_text;
      
      if (!enhancedText) {
        throw new Error('No enhanced text received from AI service');
      }
      
      // Update work order with enhanced description
      const updateResponse = await fetch(
        `http://localhost:5000/api/v1/work-orders/${workOrderId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            description: enhancedText,
          }),
        }
      );

      const updateData = await updateResponse.json();

      if (!updateResponse.ok) {
        throw new Error(updateData.message || 'Failed to update work order with enhanced text');
      }

      alert('✅ Work order description enhanced successfully!\n\n' + 
            'AI has improved the description with:\n' +
            '• Professional language\n' +
            '• Technical terminology\n' +
            '• Better structure and clarity');
      
      // Refresh work order to show enhanced data
      await fetchWorkOrderDetails();
    } catch (error: any) {
      console.error('AI Enhancement Error:', error);
      
      let errorMessage = 'AI enhancement failed';
      if (error.message.includes('GEMINI') || error.message.includes('API key')) {
        errorMessage = 'AI service configuration error. Please contact administrator.';
      } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
        errorMessage = 'AI service quota exceeded. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`❌ AI Enhancement Failed\n\n${errorMessage}\n\nPlease try again or contact support if the issue persists.`);
    }
  };

  const handleDeleteWorkOrder = async () => {
    if (!confirm('Are you sure you want to delete this work order? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/work-orders/${workOrderId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete work order');
      }

      alert('Work order deleted successfully');
      router.push('/work-orders');
    } catch (error) {
      console.error('Error deleting work order:', error);
      alert('Failed to delete work order. Please try again.');
    }
  };

  const generateWorkOrderPDF = (wo: any, tasksList: Task[], activitiesList: Activity[]) => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Work Order Report - ${wo?.work_order_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; line-height: 1.6; color: #333; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
    .header h1 { font-size: 28px; margin-bottom: 10px; }
    .header .wo-number { font-size: 18px; opacity: 0.9; }
    .section { background: white; padding: 25px; margin-bottom: 20px; border-radius: 8px; border: 1px solid #e0e0e0; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .section-title { font-size: 20px; color: #667eea; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #667eea; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; }
    .info-item { padding: 10px; background: #f8f9fa; border-left: 3px solid #667eea; }
    .info-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-value { font-size: 16px; font-weight: 600; color: #333; margin-top: 5px; }
    .status-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-top: 5px; }
    .status-pending { background: #fff3cd; color: #856404; }
    .status-in_progress { background: #e7d4ff; color: #6b21a8; }
    .status-completed { background: #d4edda; color: #155724; }
    .status-cancelled { background: #f8d7da; color: #721c24; }
    .priority-critical { background: #f8d7da; color: #721c24; }
    .priority-high { background: #fff3cd; color: #856404; }
    .priority-medium { background: #d1ecf1; color: #0c5460; }
    .priority-low { background: #d4edda; color: #155724; }
    .description-box { background: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 4px solid #667eea; margin-top: 10px; }
    .task-list { list-style: none; }
    .task-item { padding: 12px; margin-bottom: 8px; background: #f8f9fa; border-radius: 6px; display: flex; align-items: center; gap: 10px; }
    .task-checkbox { width: 20px; height: 20px; }
    .task-completed { text-decoration: line-through; color: #999; }
    .activity-item { padding: 15px; margin-bottom: 10px; background: #f8f9fa; border-left: 3px solid #667eea; border-radius: 6px; }
    .activity-time { font-size: 12px; color: #666; margin-top: 5px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; margin-top: 40px; border-top: 1px solid #e0e0e0; }
    @media print {
      body { padding: 20px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${wo?.title || 'Work Order'}</h1>
    <div class="wo-number">Work Order #${wo?.work_order_number}</div>
    <div style="margin-top: 15px; font-size: 14px;">
      Generated on ${new Date().toLocaleString()} | Workix EPC Management System
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Work Order Information</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Status</div>
        <div class="info-value">
          <span class="status-badge status-${wo?.status?.toLowerCase()}">${wo?.status?.replace('_', ' ').toUpperCase()}</span>
        </div>
      </div>
      <div class="info-item">
        <div class="info-label">Priority</div>
        <div class="info-value">
          <span class="status-badge priority-${wo?.priority?.toLowerCase()}">${wo?.priority?.toUpperCase()}</span>
        </div>
      </div>
      <div class="info-item">
        <div class="info-label">Created Date</div>
        <div class="info-value">${new Date(wo?.created_at).toLocaleString()}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Due Date</div>
        <div class="info-value">${wo?.due_date ? new Date(wo.due_date).toLocaleString() : 'Not set'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Assigned To</div>
        <div class="info-value">${wo?.assigned_technician_name || 'Unassigned'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Reported By</div>
        <div class="info-value">${wo?.reported_by_name || 'System'}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Description</h2>
    <div class="description-box">
      ${wo?.description || 'No description provided'}
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Location Details</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Site</div>
        <div class="info-value">${wo?.site_name || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Building</div>
        <div class="info-value">${wo?.building_name || wo?.building_id || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Floor</div>
        <div class="info-value">${wo?.floor_name || wo?.floor_id || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Space</div>
        <div class="info-value">${wo?.space_name || wo?.space_id || 'N/A'}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Time Tracking</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Estimated Hours</div>
        <div class="info-value">${wo?.estimated_hours || 0} hours</div>
      </div>
      <div class="info-item">
        <div class="info-label">Actual Hours</div>
        <div class="info-value">${wo?.actual_hours || 0} hours</div>
      </div>
      <div class="info-item">
        <div class="info-label">Scheduled Start</div>
        <div class="info-value">${wo?.scheduled_start ? new Date(wo.scheduled_start).toLocaleString() : 'Not scheduled'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Scheduled End</div>
        <div class="info-value">${wo?.scheduled_end ? new Date(wo.scheduled_end).toLocaleString() : 'Not scheduled'}</div>
      </div>
    </div>
  </div>

  ${tasksList.length > 0 ? `
  <div class="section">
    <h2 class="section-title">Tasks (${tasksList.filter(t => t.completed).length}/${tasksList.length} Completed)</h2>
    <ul class="task-list">
      ${tasksList.map(task => `
        <li class="task-item">
          <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} disabled>
          <span class="${task.completed ? 'task-completed' : ''}">${task.title}</span>
          ${task.assignee ? `<span style="margin-left: auto; color: #666; font-size: 13px;">${task.assignee}</span>` : ''}
        </li>
      `).join('')}
    </ul>
  </div>
  ` : ''}

  ${activitiesList.length > 0 ? `
  <div class="section">
    <h2 class="section-title">Activity Log</h2>
    ${activitiesList.map(activity => `
      <div class="activity-item">
        <div style="font-weight: 600; color: #333;">${activity.description}</div>
        <div class="activity-time">
          ${activity.createdBy} • ${new Date(activity.timestamp).toLocaleString()}
        </div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="footer">
    <p><strong>Workix EPC Service Management System</strong></p>
    <p>This is an official work order report. For questions, please contact your system administrator.</p>
    <p style="margin-top: 10px;">Report ID: WO-${wo?.work_order_number}-${Date.now()}</p>
  </div>
</body>
</html>`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      acknowledged: 'bg-purple-100 text-purple-800 border-purple-300',
      in_progress: 'bg-purple-100 text-purple-800 border-purple-300',
      on_hold: 'bg-orange-100 text-orange-800 border-orange-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
      closed: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-800 border-red-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-green-100 text-green-800 border-green-300',
    };
    return colors[priority?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return <CheckCircle2 className="w-5 h-5" />;
      case 'cancelled': return <XCircle className="w-5 h-5" />;
      case 'in_progress': return <RefreshCw className="w-5 h-5" />;
      case 'on_hold': return <PauseCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  // Show loading while hydrating or loading data
  if (!hydrated || loading) {
    return (
      <DesktopLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading work order details...</p>
          </div>
        </div>
      </DesktopLayout>
    );
  }

  return (
    <DesktopLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Breadcrumb Navigation */}
        <div className="bg-white border-b px-6 py-2">
          <Breadcrumb 
            items={[
              { label: 'Work Orders', href: '/work-orders' },
              { label: workOrder?.work_order_number || 'Details' }
            ]} 
          />
        </div>

        {/* Header Section */}
        <div className="bg-white border-b shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">{workOrder?.title || 'Work Order'}</h1>
                    <span className="text-sm text-gray-500">#{workOrder?.work_order_number}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Created {new Date(workOrder?.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {workOrder?.assigned_technician_name || 'Unassigned'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Change Button */}
              <div className="relative status-menu-container">
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 font-semibold transition-all hover:shadow-md ${getStatusColor(workOrder?.status)}`}
                >
                  {getStatusIcon(workOrder?.status)}
                  <span className="hidden sm:inline">{workOrder?.status?.replace('_', ' ').toUpperCase()}</span>
                  <svg className={`w-4 h-4 transition-transform ${showStatusMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showStatusMenu && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border-2 border-gray-200 z-20 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
                      <h3 className="font-semibold text-white text-lg">Change Status</h3>
                      <p className="text-blue-100 text-sm mt-1">Select a new status for this work order</p>
                    </div>
                    <div className="p-2 max-h-96 overflow-y-auto">
                      {[
                        { value: 'pending', label: 'Pending', desc: 'Awaiting action' },
                        { value: 'acknowledged', label: 'Acknowledged', desc: 'Work order reviewed' },
                        { value: 'in_progress', label: 'In Progress', desc: 'Currently working' },
                        { value: 'on_hold', label: 'On Hold', desc: 'Temporarily paused' },
                        { value: 'completed', label: 'Completed', desc: 'Work finished' },
                        { value: 'cancelled', label: 'Cancelled', desc: 'Work order cancelled' }
                      ].map((status) => (
                        <button
                          key={status.value}
                          onClick={() => handleStatusChange(status.value)}
                          disabled={workOrder?.status === status.value}
                          className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${
                            workOrder?.status === status.value 
                              ? 'bg-blue-50 border-2 border-blue-300 cursor-not-allowed opacity-75' 
                              : 'hover:bg-gray-50 border-2 border-transparent hover:border-gray-200'
                          }`}
                        >
                          <div className={`p-2 rounded-lg ${getStatusColor(status.value)}`}>
                            {getStatusIcon(status.value)}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{status.label}</div>
                            <div className="text-xs text-gray-500">{status.desc}</div>
                          </div>
                          {workOrder?.status === status.value && (
                            <CheckCircle2 className="w-5 h-5 text-blue-600" />
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="p-4 border-t bg-gray-50">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Add Note (Optional)
                      </label>
                      <textarea
                        placeholder="Enter a reason for status change..."
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - 2/3 width */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${getPriorityColor(workOrder?.priority)}`}>
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Priority</p>
                      <p className="font-semibold capitalize">{workOrder?.priority}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-blue-100 text-blue-800">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Due Date</p>
                      <p className="font-semibold text-sm">
                        {workOrder?.due_date ? new Date(workOrder.due_date).toLocaleDateString() : 'Not set'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-purple-100 text-purple-800">
                      <ListTodo className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Tasks</p>
                      <p className="font-semibold">{tasks.filter(t => t.completed).length}/{tasks.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-green-100 text-green-800">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Messages</p>
                      <p className="font-semibold">{chatMessages.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="border-b">
                  <div className="flex gap-1 p-2">
                    {[
                      { id: 'overview', label: 'Overview', icon: FileText },
                      { id: 'chat', label: 'Chat', icon: MessageSquare, badge: chatMessages.length },
                      { id: 'tasks', label: 'Tasks', icon: ListTodo, badge: tasks.filter(t => !t.completed).length },
                      { id: 'history', label: 'History', icon: History },
                      { id: 'files', label: 'Files', icon: Paperclip },
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
                        {tab.badge !== undefined && tab.badge > 0 && (
                          <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
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
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          Description
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <p className="text-gray-700 leading-relaxed">{workOrder?.description}</p>
                        </div>
                      </div>

                      {activities.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            Recent Activities
                          </h3>
                          <div className="space-y-3">
                            {activities.slice(0, 3).map((activity) => (
                              <div key={activity.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                <div className="flex-1">
                                  <p className="text-gray-900 font-medium">{activity.description}</p>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {activity.createdBy} • {new Date(activity.timestamp).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Chat Tab */}
                  {activeTab === 'chat' && (
                    <div className="space-y-4">
                      <div className="h-96 overflow-y-auto space-y-3 p-4 bg-gray-50 rounded-lg">
                        {chatMessages.map((msg) => (
                          <div key={msg.id} className={`flex ${msg.sender === user?.name ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] ${msg.sender === user?.name ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'} rounded-xl p-3 shadow-sm`}>
                              <p className="font-semibold text-sm mb-1">{msg.sender}</p>
                              <p className="text-sm">{msg.message}</p>
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {msg.attachments.map((file, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs opacity-90">
                                      <Paperclip className="w-3 h-3" />
                                      {file}
                                    </div>
                                  ))}
                                </div>
                              )}
                              <p className="text-xs opacity-75 mt-1">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={chatEndRef} />
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          multiple
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Paperclip className="w-5 h-5 text-gray-600" />
                        </button>
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Type a message..."
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={handleSendMessage}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <Send className="w-5 h-5" />
                          Send
                        </button>
                      </div>

                      {selectedFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                              <Paperclip className="w-3 h-3" />
                              {file.name}
                              <button
                                onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))}
                                className="hover:text-blue-900"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tasks Tab */}
                  {activeTab === 'tasks' && (
                    <div className="space-y-3">
                      {tasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => handleToggleTask(task.id)}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <p className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              {task.title}
                            </p>
                            {task.assignee && (
                              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                <User className="w-3 h-3" />
                                {task.assignee}
                              </p>
                            )}
                          </div>
                          {task.completed && (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* History Tab */}
                  {activeTab === 'history' && (
                    <div className="space-y-4">
                      {statusHistory.map((history) => (
                        <div key={history.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <RefreshCw className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="w-0.5 h-full bg-gray-300 mt-2"></div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(history.from_status)}`}>
                                {history.from_status}
                              </span>
                              →
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(history.to_status)}`}>
                                {history.to_status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{history.notes}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {history.changed_by} • {new Date(history.changed_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Files Tab */}
                  {activeTab === 'files' && (
                    <div className="text-center py-12">
                      <Paperclip className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No files uploaded yet</p>
                      <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Upload Files
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar - 1/3 width */}
            <div className="space-y-6">
              {/* Work Order Info Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Work Order Details
                </h3>
                <div className="space-y-3">
                  <div className="pb-3 border-b border-gray-100">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Site</p>
                        <p className="font-semibold text-gray-900 truncate">{workOrder?.site_name || workOrder?.site_id || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pb-3 border-b border-gray-100">
                    <div className="flex items-start gap-3">
                      <Building className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Building</p>
                        <p className="font-semibold text-gray-900 truncate">{workOrder?.building_name || workOrder?.building_id || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pb-3 border-b border-gray-100">
                    <div className="flex items-start gap-3">
                      <Layers className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Floor</p>
                        <p className="font-semibold text-gray-900 truncate">{workOrder?.floor_name || workOrder?.floor_id || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pb-3 border-b border-gray-100">
                    <div className="flex items-start gap-3">
                      <Box className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Space</p>
                        <p className="font-semibold text-gray-900 truncate">{workOrder?.space_name || workOrder?.space_id || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pb-3 border-b border-gray-100">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Assigned To</p>
                        <p className="font-semibold text-gray-900 truncate">{workOrder?.assigned_technician_name || workOrder?.assigned_to || 'Unassigned'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pb-3 border-b border-gray-100">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-pink-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Reported By</p>
                        <p className="font-semibold text-gray-900 truncate">{workOrder?.reported_by_name || workOrder?.reported_by || 'System'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pb-3 border-b border-gray-100">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Source</p>
                        <p className="font-semibold text-gray-900 capitalize">{workOrder?.source?.replace('_', ' ') || 'Manual'}</p>
                      </div>
                    </div>
                  </div>

                  {workOrder?.category && (
                    <div className="pb-3 border-b border-gray-100">
                      <div className="flex items-start gap-3">
                        <ListTodo className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Category</p>
                          <p className="font-semibold text-gray-900 capitalize">{workOrder?.category}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {workOrder?.type && (
                    <div>
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-cyan-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Type</p>
                          <p className="font-semibold text-gray-900 capitalize">{workOrder?.type}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button 
                    onClick={handleEditWorkOrder}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-purple-50 rounded-lg transition-colors group"
                  >
                    <Edit3 className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-gray-700 group-hover:text-purple-700">Edit Work Order</span>
                  </button>
                  <button 
                    onClick={handleDownloadReport}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-green-50 rounded-lg transition-colors group"
                  >
                    <Download className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-gray-700 group-hover:text-green-700">Download Report (PDF)</span>
                  </button>
                  <button 
                    onClick={handleAIEnhance}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-purple-50 rounded-lg transition-colors group"
                  >
                    <Sparkles className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-gray-700 group-hover:text-purple-700">AI Enhance</span>
                  </button>
                  <button 
                    onClick={handleDeleteWorkOrder}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 rounded-lg transition-colors text-red-600 group"
                  >
                    <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium group-hover:text-red-700">Delete</span>
                  </button>
                </div>
              </div>

              {/* Progress Tracker */}
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                <h3 className="text-lg font-semibold mb-4">Progress</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Tasks Completed</span>
                      <span className="font-bold">{Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-white rounded-full h-2 transition-all"
                        style={{ width: `${(tasks.filter(t => t.completed).length / tasks.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                      <p className="text-xs opacity-90">Estimated</p>
                      <p className="font-bold text-lg">{workOrder?.estimated_hours || 0}h</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                      <p className="text-xs opacity-90">Actual</p>
                      <p className="font-bold text-lg">{workOrder?.actual_hours || 0}h</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Edit Work Order</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter work order title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter detailed description"
                />
              </div>

              {/* Priority and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="in_progress">In Progress</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={editForm.due_date}
                  onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Assigned To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned To (User ID)
                </label>
                <input
                  type="text"
                  value={editForm.assigned_to}
                  onChange={(e) => setEditForm({ ...editForm, assigned_to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter technician user ID"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty to unassign, or enter a valid user ID
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </DesktopLayout>
  );
}
