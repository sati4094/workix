'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';
import { useRouter, useParams } from 'next/navigation';
import { DesktopLayout } from '@/components/desktop-layout';
import { Modal } from '@/components/modal';

interface Activity {
  id: string;
  workOrderId: string;
  description: string;
  timestamp: string;
  createdBy: string;
}

export default function WorkOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const workOrderId = params.id as string;

  const [workOrder, setWorkOrder] = useState<any>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityFormData, setActivityFormData] = useState('');
  const [isEnhanceModalOpen, setIsEnhanceModalOpen] = useState(false);
  const [enhancedDescription, setEnhancedDescription] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const { token } = useAuthStore();

  useEffect(() => {
    fetchWorkOrderDetails();
    fetchActivities();
  }, [token, workOrderId]);

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
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/work-orders/${workOrderId}/activities`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      
      // Handle different response structures
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
    } finally {
      setLoading(false);
    }
  };

  const handleAddActivity = async () => {
    if (!activityFormData.trim()) return;

    try {
      await fetch(
        `http://localhost:5000/api/v1/work-orders/${workOrderId}/activities`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ description: activityFormData }),
        }
      );

      setActivityFormData('');
      setIsActivityModalOpen(false);
      fetchActivities();
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (confirm('Delete this activity?')) {
      try {
        await fetch(
          `http://localhost:5000/api/v1/work-orders/${workOrderId}/activities/${activityId}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        fetchActivities();
      } catch (error) {
        console.error('Error deleting activity:', error);
      }
    }
  };

  const handleEnhanceDescription = async () => {
    if (!workOrder?.description) return;
    
    setIsEnhancing(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/work-orders/${workOrderId}/enhance-description`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ description: workOrder.description }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to enhance description');
      }

      const data = await response.json();
      setEnhancedDescription(data.enhancedDescription || '');
      setIsEnhanceModalOpen(true);
    } catch (error) {
      console.error('Error enhancing description:', error);
      alert('Failed to enhance description. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleAcceptEnhancement = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/work-orders/${workOrderId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ description: enhancedDescription }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update description');
      }

      setIsEnhanceModalOpen(false);
      fetchWorkOrderDetails();
      alert('Description updated successfully!');
    } catch (error) {
      console.error('Error updating description:', error);
      alert('Failed to update description');
    }
  };

  return (
    <DesktopLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{workOrder?.title}</h1>
            <p className="text-gray-600 mt-1">Work Order Details & Activities</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <>
            {/* Work Order Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Details</h2>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-600 text-sm">Description</p>
                        <p className="font-medium">{workOrder?.description}</p>
                      </div>
                      <button
                        onClick={handleEnhanceDescription}
                        disabled={isEnhancing}
                        className="ml-2 px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
                      >
                        {isEnhancing ? 'Enhancing...' : '✨ Enhance'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Site</p>
                    <p className="font-medium">{workOrder?.siteName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-600 text-sm">Priority</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        workOrder?.priority === 'High' ? 'bg-red-100 text-red-800' :
                        workOrder?.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {workOrder?.priority}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        workOrder?.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        workOrder?.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {workOrder?.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Assigned To</p>
                    <p className="font-medium">{workOrder?.assignedTo}</p>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Activity Summary</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <span className="text-gray-700">Total Activities</span>
                    <span className="text-2xl font-bold text-blue-600">{activities.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                    <span className="text-gray-700">Last Updated</span>
                    <span className="text-sm font-medium">{activities.length > 0 ? new Date(activities[0].timestamp).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <button
                    onClick={() => setIsActivityModalOpen(true)}
                    className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    + Add Activity
                  </button>
                </div>
              </div>
            </div>

            {/* Activities Timeline */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Activity Timeline</h2>
              {!Array.isArray(activities) || activities.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No activities yet</p>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="border-l-4 border-blue-400 pl-4 py-2 hover:bg-gray-50 p-3 rounded transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{activity.description}</p>
                          <div className="flex gap-4 mt-2 text-sm text-gray-600">
                            <span>By: {activity.createdBy}</span>
                            <span>{new Date(activity.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteActivity(activity.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={isActivityModalOpen}
        title="Add Activity"
        onClose={() => setIsActivityModalOpen(false)}
        onSubmit={handleAddActivity}
      >
        <div>
          <textarea
            value={activityFormData}
            onChange={(e) => setActivityFormData(e.target.value)}
            placeholder="Describe what happened on this work order..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
          />
        </div>
      </Modal>

      {/* Enhance Description Modal */}
      {isEnhanceModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold">AI-Enhanced Description</h2>
              <button
                onClick={() => setIsEnhanceModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Original</h3>
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <p className="text-gray-700">{workOrder?.description}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Enhanced</h3>
                <div className="bg-blue-50 p-4 rounded border border-blue-200">
                  <p className="text-gray-700">{enhancedDescription}</p>
                </div>
              </div>
            </div>

            <div className="border-t p-6 flex gap-3 justify-end">
              <button
                onClick={() => setIsEnhanceModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Reject
              </button>
              <button
                onClick={handleAcceptEnhancement}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Accept & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </DesktopLayout>
  );
}
