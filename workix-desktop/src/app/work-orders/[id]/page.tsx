'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store';
import { useRouter, useParams } from 'next/navigation';
import { DesktopLayout } from '@/components/desktop-layout';
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
  
  const { token, user } = useAuthStore();

  useEffect(() => {
    fetchWorkOrderDetails();
    fetchActivities();
    fetchChatMessages();
    fetchTasks();
    fetchStatusHistory();
  }, [token, workOrderId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchWorkOrderDetails = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/work-orders/${workOrderId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      setWorkOrder(data.data);
    } catch (error) {
      console.error('Error fetching work order:', error);
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
      await fetch(
        `http://localhost:5000/api/v1/work-orders/${workOrderId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus, notes: statusNote }),
        }
      );

      setShowStatusMenu(false);
      setStatusNote('');
      fetchWorkOrderDetails();
      fetchStatusHistory();
      
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
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleToggleTask = async (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
    // TODO: Update via API
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      acknowledged: 'bg-blue-100 text-blue-800 border-blue-300',
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

  if (loading) {
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
              <div className="relative">
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-semibold transition-all hover:shadow-md ${getStatusColor(workOrder?.status)}`}
                >
                  {getStatusIcon(workOrder?.status)}
                  {workOrder?.status?.replace('_', ' ').toUpperCase()}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showStatusMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border z-20">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold text-gray-900">Change Status</h3>
                    </div>
                    <div className="p-2">
                      {['pending', 'acknowledged', 'in_progress', 'on_hold', 'completed', 'cancelled'].map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded flex items-center gap-2"
                        >
                          {getStatusIcon(status)}
                          <span className="capitalize">{status.replace('_', ' ')}</span>
                        </button>
                      ))}
                    </div>
                    <div className="p-3 border-t">
                      <input
                        type="text"
                        placeholder="Add a note (optional)"
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
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
                <h3 className="text-lg font-semibold mb-4">Work Order Info</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Site</p>
                      <p className="font-medium">{workOrder?.site_name || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Building</p>
                      <p className="font-medium">{workOrder?.building_id || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Layers className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Floor</p>
                      <p className="font-medium">{workOrder?.floor_id || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Box className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Space</p>
                      <p className="font-medium">{workOrder?.space_id || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Reported By</p>
                      <p className="font-medium">{workOrder?.reported_by_name || 'System'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Source</p>
                      <p className="font-medium capitalize">{workOrder?.source?.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                    <Edit3 className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Edit Work Order</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                    <Download className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Download Report</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">AI Enhance</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 rounded-lg transition-colors text-red-600">
                    <Trash2 className="w-5 h-5" />
                    <span className="font-medium">Delete</span>
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
    </DesktopLayout>
  );
}
