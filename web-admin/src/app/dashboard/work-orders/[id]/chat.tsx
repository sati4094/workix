'use client'

import { useState, useEffect, useRef } from 'react'
import { apiService } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDateTime } from '@/lib/utils'
import { Send, Paperclip, Image, FileText, X } from 'lucide-react'

export function WorkOrderChat({ workOrderId }: { workOrderId: string }) {
  const { user } = useAuthStore()
  const [activities, setActivities] = useState<any[]>([])
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchActivities()
    // Poll for new messages every 10 seconds
    const interval = setInterval(fetchActivities, 10000)
    return () => clearInterval(interval)
  }, [workOrderId])

  useEffect(() => {
    scrollToBottom()
  }, [activities])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchActivities = async () => {
    try {
      const response: any = await apiService.getActivities(workOrderId)
      setActivities(response.data.activities || [])
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachments([...attachments, ...files])
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const handleSendMessage = async () => {
    if (!message.trim() && attachments.length === 0) {
      return
    }

    try {
      setSending(true)

      // For now, we'll just send the comment
      // In production, you'd upload files to S3 first and get URLs
      const pictures = attachments.filter(f => f.type.startsWith('image/')).map(f => f.name)
      
      await apiService.addActivity(workOrderId, {
        activity_type: 'comment',
        description: message || 'Shared files',
        pictures: pictures.length > 0 ? pictures : undefined,
      })

      setMessage('')
      setAttachments([])
      fetchActivities()
    } catch (error: any) {
      alert(error.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'observation': return '👁️'
      case 'action_taken': return '🔧'
      case 'recommendation': return '💡'
      case 'status_change': return '🔄'
      case 'comment': return '💬'
      case 'parts_used': return '🔩'
      default: return '📝'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Stream & Chat</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Messages Area */}
        <div className="h-96 overflow-y-auto mb-4 space-y-4 p-4 bg-gray-50 rounded-lg">
          {activities.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No activities yet. Start the conversation!</p>
            </div>
          ) : (
            activities.map((activity) => {
              const userName = activity.created_by_name || activity.created_by || 'Unknown User'
              const isCurrentUser = userName === user?.name
              
              return (
                <div
                  key={activity.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${isCurrentUser ? 'bg-blue-600 text-white' : 'bg-white'} rounded-lg p-3 shadow`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-semibold">
                        {getActivityIcon(activity.activity_type)} {userName}
                      </span>
                      {activity.ai_enhanced && (
                        <span className="px-2 py-0.5 bg-purple-500 text-white rounded text-xs">
                          ✨ AI
                        </span>
                      )}
                    </div>
                    
                    <div className={`text-xs mb-1 ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'}`}>
                      {activity.activity_type?.replace('_', ' ').toUpperCase()}
                    </div>
                    
                    <p className="text-sm whitespace-pre-wrap">{activity.description}</p>
                    
                    {/* Image Previews */}
                    {activity.pictures && Array.isArray(activity.pictures) && activity.pictures.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {activity.pictures.map((pic: string, idx: number) => {
                          // Check if it's a URL or just a filename
                          const isUrl = pic.startsWith('http://') || pic.startsWith('https://') || pic.startsWith('data:')
                          
                          return (
                            <div key={idx} className="rounded overflow-hidden">
                              {isUrl ? (
                                <img 
                                  src={pic} 
                                  alt={`Attachment ${idx + 1}`}
                                  className="max-w-full h-auto rounded cursor-pointer hover:opacity-90"
                                  onClick={() => window.open(pic, '_blank')}
                                />
                              ) : (
                                <div className="px-3 py-2 bg-black bg-opacity-20 rounded flex items-center">
                                  <Image className="h-4 w-4 mr-2" />
                                  <span className="text-xs">{pic}</span>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                    
                    <p className={`text-xs mt-2 ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'}`}>
                      {formatDateTime(activity.created_at)}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
                {file.type.startsWith('image/') ? (
                  <Image className="h-4 w-4 text-blue-600" />
                ) : (
                  <FileText className="h-4 w-4 text-gray-600" />
                )}
                <span className="text-sm">{file.name}</span>
                <button onClick={() => removeAttachment(index)} className="text-red-600 hover:text-red-800">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="flex space-x-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            title="Attach files"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
            className="flex-1"
          />

          <Button onClick={handleSendMessage} disabled={sending || (!message.trim() && attachments.length === 0)}>
            <Send className="h-4 w-4 mr-2" />
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          💡 Attach images, PDFs, or documents. Messages are shared with technicians in real-time.
        </p>
      </CardContent>
    </Card>
  )
}

