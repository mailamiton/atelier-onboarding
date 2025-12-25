import axios, { AxiosInstance } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('accessToken')
          window.location.href = '/admin/login'
        }
        return Promise.reject(error)
      }
    )
  }

  async registerStudent(data: StudentRegistrationData) {
    return this.client.post('/api/registrations', data)
  }

  async getRegistrations(params?: RegistrationFilters) {
    return this.client.get('/api/registrations', { params })
  }

  async getRegistration(id: string) {
    return this.client.get(`/api/registrations/${id}`)
  }

  async updateRegistration(id: string, data: Partial<StudentRegistrationData>) {
    return this.client.put(`/api/registrations/${id}`, data)
  }

  async assignTeacher(registrationId: string, teacherId: string) {
    return this.client.post(`/api/registrations/${registrationId}/assign`, {
      teacher_id: teacherId,
    })
  }

  async getTeachers() {
    return this.client.get('/api/teachers')
  }

  async sendDemoLink(registrationId: string) {
    return this.client.post(`/api/registrations/${registrationId}/send-link`)
  }

  async getStats() {
    return this.client.get('/api/admin/stats')
  }
}

export interface StudentRegistrationData {
  student_name: string
  student_age: number
  grade: string
  parent_name: string
  email: string
  phone: string
  preferred_time?: string
  interests?: string[]
  experience_level?: 'beginner' | 'intermediate' | 'advanced'
  additional_notes?: string
}

export interface RegistrationFilters {
  status?: 'pending' | 'teacher_assigned' | 'link_sent' | 'completed'
  search?: string
  page?: number
  limit?: number
}

export const api = new ApiClient()
