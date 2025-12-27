'use client'

import { useEffect, useState } from 'react'
import { Users, UserCheck, Clock, CheckCircle } from 'lucide-react'
import AdminLayout from '@/components/AdminLayout'
import { api } from '@/lib/api'
import { auth } from '@/lib/auth'

interface Stats {
  total_registrations: number
  pending_assignments: number
  teachers_assigned: number
  completed_demos: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    total_registrations: 0,
    pending_assignments: 0,
    teachers_assigned: 0,
    completed_demos: 0,
  })
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState<string>('')
  const [currentTime, setCurrentTime] = useState<string>('')

  useEffect(() => {
    loadStats()
    loadUserInfo()
    setCurrentTime(new Date().toLocaleString())
  }, [])

  const loadUserInfo = async () => {
    try {
      const session = await auth.getSession()
      const idToken = session.getIdToken()
      const payload = idToken.payload
      setUserName(payload.name || payload.email || 'Admin')
    } catch (error) {
      console.error('Failed to load user info:', error)
      setUserName('Admin')
    }
  }

  const loadStats = async () => {
    try {
      const response = await api.getStats()
      setStats(response.data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      name: 'Total Registrations',
      value: stats.total_registrations,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      name: 'Pending Assignments',
      value: stats.pending_assignments,
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      name: 'Teachers Assigned',
      value: stats.teachers_assigned,
      icon: UserCheck,
      color: 'bg-green-500',
    },
    {
      name: 'Completed Demos',
      value: stats.completed_demos,
      icon: CheckCircle,
      color: 'bg-purple-500',
    },
  ]

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {userName || 'Admin'}! Here's an overview of your registrations.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 card-shadow animate-pulse"
              >
                <div className="h-12 w-12 bg-gray-200 rounded-xl mb-4"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <div
                key={stat.name}
                className="bg-white rounded-2xl p-6 card-shadow hover:card-shadow-hover transition-all"
              >
                <div className="flex items-center">
                  <div className={`${stat.color} p-3 rounded-xl`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="mt-1 text-sm text-gray-600">{stat.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-white rounded-2xl p-6 card-shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <a
                href="/admin/registrations"
                className="block p-4 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      View All Registrations
                    </h3>
                    <p className="text-sm text-gray-600">
                      Manage student registrations
                    </p>
                  </div>
                  <Users className="w-5 h-5 text-primary-600" />
                </div>
              </a>
              <a
                href="/admin/teachers"
                className="block p-4 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Manage Teachers</h3>
                    <p className="text-sm text-gray-600">
                      Add or edit teacher profiles
                    </p>
                  </div>
                  <UserCheck className="w-5 h-5 text-primary-600" />
                </div>
              </a>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
            <h2 className="text-lg font-semibold mb-4">System Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>All Systems Operational</span>
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="border-t border-primary-500 pt-4">
                <p className="text-sm opacity-90">
                  Last updated: {currentTime || 'Loading...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
