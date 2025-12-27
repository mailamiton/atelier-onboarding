'use client'

import { useEffect, useState } from 'react'
import { Search, Filter, UserPlus, Send, Loader2, Copy, ExternalLink, CheckCircle, Edit } from 'lucide-react'
import { toast } from 'sonner'
import AdminLayout from '@/components/AdminLayout'
import { api } from '@/lib/api'

interface Registration {
  id: string
  student_name: string
  student_age: number
  grade: string
  parent_name: string
  email: string
  phone: string
  status: 'pending' | 'teacher_assigned' | 'link_sent' | 'completed'
  created_at: string
  teacher_name?: string
  demo_link?: string
}

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)

  useEffect(() => {
    loadRegistrations()
  }, [statusFilter])

  const loadRegistrations = async () => {
    try {
      const params: any = {}
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }
      const response = await api.getRegistrations(params)
      setRegistrations(response.data)
    } catch (error) {
      toast.error('Failed to load registrations')
    } finally {
      setLoading(false)
    }
  }

  const filteredRegistrations = registrations.filter((reg) =>
    reg.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.parent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      teacher_assigned: 'bg-blue-100 text-blue-800',
      link_sent: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
    }
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
  }

  const handleAssignTeacher = (registration: Registration) => {
    setSelectedRegistration(registration)
    setShowAssignModal(true)
  }

  const handleSendLink = async (registrationId: string) => {
    try {
      await api.sendDemoLink(registrationId)
      toast.success('Demo link sent successfully!')
      loadRegistrations()
    } catch (error) {
      toast.error('Failed to send demo link')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Link copied to clipboard!')
  }

  const markAsCompleted = async (registrationId: string) => {
    try {
      await api.updateRegistration(registrationId, { status: 'completed' })
      toast.success('Demo marked as completed!')
      loadRegistrations()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900">
            Student Registrations
          </h1>
          <p className="mt-2 text-gray-600">
            Manage all student registrations and teacher assignments
          </p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Search by name, email..."
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="teacher_assigned">Teacher Assigned</option>
              <option value="link_sent">Link Sent</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl card-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parent
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teacher
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRegistrations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No registrations found
                      </td>
                    </tr>
                  ) : (
                    filteredRegistrations.map((registration) => (
                      <tr key={registration.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {registration.student_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Age {registration.student_age} • Grade {registration.grade}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {registration.parent_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{registration.email}</div>
                          <div className="text-sm text-gray-500">{registration.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                              registration.status
                            )}`}
                          >
                            {registration.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {registration.teacher_name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          {registration.status === 'pending' && (
                            <button
                              onClick={() => handleAssignTeacher(registration)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                            >
                              <UserPlus className="w-3 h-3 mr-1" />
                              Assign
                            </button>
                          )}
                          {registration.status === 'teacher_assigned' && (
                            <button
                              onClick={() => handleSendLink(registration.id)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors"
                            >
                              <Send className="w-3 h-3 mr-1" />
                              Send Link
                            </button>
                          )}
                          {registration.status === 'link_sent' && registration.demo_link && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => copyToClipboard(registration.demo_link!)}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                title="Copy demo link"
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Copy
                              </button>
                              <a
                                href={registration.demo_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                title="Open demo link"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              <button
                                onClick={() => markAsCompleted(registration.id)}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                                title="Mark as completed"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Complete
                              </button>
                            </div>
                          )}
                          {registration.status === 'completed' && registration.demo_link && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => copyToClipboard(registration.demo_link!)}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                title="Copy demo link"
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Copy
                              </button>
                              <a
                                href={registration.demo_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                title="Open demo link"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Completed
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showAssignModal && selectedRegistration && (
        <AssignTeacherModal
          registration={selectedRegistration}
          onClose={() => {
            setShowAssignModal(false)
            setSelectedRegistration(null)
          }}
          onSuccess={() => {
            loadRegistrations()
            setShowAssignModal(false)
            setSelectedRegistration(null)
          }}
        />
      )}
    </AdminLayout>
  )
}

function AssignTeacherModal({
  registration,
  onClose,
  onSuccess,
}: {
  registration: Registration
  onClose: () => void
  onSuccess: () => void
}) {
  const [teachers, setTeachers] = useState<any[]>([])
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadTeachers()
  }, [])

  const loadTeachers = async () => {
    try {
      const response = await api.getTeachers()
      setTeachers(response.data)
    } catch (error) {
      toast.error('Failed to load teachers')
    }
  }

  const handleAssign = async () => {
    if (!selectedTeacher) {
      toast.error('Please select a teacher')
      return
    }

    setLoading(true)
    try {
      await api.assignTeacher(registration.id, selectedTeacher)
      toast.success('Teacher assigned successfully!')
      onSuccess()
    } catch (error) {
      toast.error('Failed to assign teacher')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Assign Teacher to {registration.student_name}
        </h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Teacher
          </label>
          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Choose a teacher...</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name} - {teacher.specialization}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Assigning...' : 'Assign Teacher'}
          </button>
        </div>
      </div>
    </div>
  )
}
