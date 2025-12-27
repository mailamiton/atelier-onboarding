'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Loader2, Check, ChevronRight, ChevronLeft, Phone, Mail, User, Calendar, Clock } from 'lucide-react'
import { api } from '@/lib/api'

const grades = ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '12+']

const generateTimeSlots = () => {
  const morningSlots = [
    { time: '10:00 AM - 11:00 AM', value: '10-11' },
    { time: '11:00 AM - 12:00 PM', value: '11-12' },
  ]
  const eveningSlots = [
    { time: '2:00 PM - 3:00 PM', value: '14-15' },
    { time: '3:00 PM - 4:00 PM', value: '15-16' },
    { time: '4:00 PM - 5:00 PM', value: '16-17' },
    { time: '5:00 PM - 6:00 PM', value: '17-18' },
    { time: '6:00 PM - 7:00 PM', value: '18-19' },
    { time: '7:00 PM - 8:00 PM', value: '19-20' },
  ]
  return { morning: morningSlots, evening: eveningSlots }
}

const getNextThreeDays = () => {
  const days = []
  for (let i = 0; i < 3; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)
    days.push({
      date: date.toISOString().split('T')[0],
      displayDate: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    })
  }
  return days
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  
  // Step 1: Parent Info
  const [parentName, setParentName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  
  // Step 2: Phone Verification
  const [otp, setOtp] = useState('')
  const [isPhoneVerified, setIsPhoneVerified] = useState(false)
  
  // Step 3: Booking Details
  const [studentName, setStudentName] = useState('')
  const [studentAge, setStudentAge] = useState('')
  const [grade, setGrade] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')
  
  const timeSlots = generateTimeSlots()
  const availableDays = getNextThreeDays()

  const sendOTP = async () => {
    if (!phone || !/^[\d\s\-\+\(\)]+$/.test(phone)) {
      toast.error('Please enter a valid phone number')
      return
    }
    setIsVerifying(true)
    // Simulate OTP sending
    setTimeout(() => {
      toast.success('OTP sent to your phone number')
      setIsVerifying(false)
      setStep(2)
    }, 1000)
  }

  const verifyOTP = () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP')
      return
    }
    // Simulate OTP verification
    if (otp === '123456') {
      setIsPhoneVerified(true)
      toast.success('Phone verified successfully!')
      // Pre-fill student name with parent name
      if (!studentName) {
        setStudentName(parentName)
      }
      setStep(3)
    } else {
      toast.error('Invalid OTP. Try 123456 for demo')
    }
  }

  const handleStep1Next = () => {
    if (!parentName || parentName.length < 2) {
      toast.error('Please enter parent/guardian name')
      return
    }
    if (!phone || !/^[\d\s\-\+\(\)]+$/.test(phone)) {
      toast.error('Please enter a valid phone number')
      return
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }
    sendOTP()
  }

  const onSubmit = async () => {
    if (!selectedDate) {
      toast.error('Please select a date')
      return
    }
    if (!selectedTimeSlot) {
      toast.error('Please select a time slot')
      return
    }

    setIsSubmitting(true)
    try {
      await api.registerStudent({
        student_name: studentName || parentName,
        student_age: 10,
        grade,
        parent_name: parentName,
        email,
        phone,
        preferred_time: `${selectedDate} ${selectedTimeSlot}`,
        experience_level: experienceLevel as any,
        additional_notes: additionalNotes,
      })
      toast.success('Registration successful! We will contact you shortly.')
      router.push('/register/success')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-3xl card-shadow-hover p-8 sm:p-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-50 to-accent-50 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              <span>Limited Slots Available - 50% Off Today!</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 mb-3">
              Book Your <span className="text-gradient">Free Demo Class</span>
            </h1>
            <p className="text-lg text-gray-600">
              Join thousands of students learning Renaissance art techniques
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-10">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <div className={`w-12 h-1 ${
                step >= 2 ? 'bg-primary-600' : 'bg-gray-200'
              }`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <div className={`w-12 h-1 ${
                step >= 3 ? 'bg-primary-600' : 'bg-gray-200'
              }`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                step >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
            </div>
          </div>

          {/* Step 1: Parent Information */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Individual Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="parent@example.com"
                />
              </div>

              <button
                type="button"
                onClick={handleStep1Next}
                disabled={isVerifying}
                className="w-full flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 2: Phone Verification */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Verify Your Phone</h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-blue-800">
                  We've sent a 6-digit OTP to <strong>{phone}</strong>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  (For demo, use OTP: <strong>123456</strong>)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 6-Digit OTP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-gray-400 transition-all"
                >
                  <ChevronLeft className="w-5 h-5 inline mr-2" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={verifyOTP}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg"
                >
                  Verify & Continue
                  <ChevronRight className="w-5 h-5 inline ml-2" />
                </button>
              </div>

              <button
                type="button"
                onClick={sendOTP}
                className="w-full text-sm text-primary-600 hover:text-primary-700 underline"
              >
                Resend OTP
              </button>
            </div>
          )}

          {/* Step 3: Booking Details */}
          {step === 3 && (
            <div className="space-y-8">
              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  <Calendar className="w-5 h-5 inline mr-2" />
                  Select Date & Time
                </h3>
              
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Date <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {availableDays.map((day) => (
                      <button
                        key={day.date}
                        type="button"
                        onClick={() => setSelectedDate(day.date)}
                        className={`px-4 py-3 border-2 rounded-xl transition-all ${
                          selectedDate === day.date
                            ? 'border-primary-600 bg-primary-50 text-primary-700'
                            : 'border-gray-300 hover:border-primary-300'
                        }`}
                      >
                        <div className="text-sm font-medium">{day.displayDate}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Select Time Slot <span className="text-red-500">*</span>
                  </label>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Morning</p>
                      <div className="grid grid-cols-2 gap-3">
                        {timeSlots.morning.map((slot) => (
                          <button
                            key={slot.value}
                            type="button"
                            onClick={() => setSelectedTimeSlot(slot.time)}
                            className={`px-4 py-3 border-2 rounded-xl transition-all text-sm ${
                              selectedTimeSlot === slot.time
                                ? 'border-primary-600 bg-primary-50 text-primary-700 font-medium'
                                : 'border-gray-300 hover:border-primary-300'
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Evening</p>
                      <div className="grid grid-cols-2 gap-3">
                        {timeSlots.evening.map((slot) => (
                          <button
                            key={slot.value}
                            type="button"
                            onClick={() => setSelectedTimeSlot(slot.time)}
                            className={`px-4 py-3 border-2 rounded-xl transition-all text-sm ${
                              selectedTimeSlot === slot.time
                                ? 'border-primary-600 bg-primary-50 text-primary-700 font-medium'
                                : 'border-gray-300 hover:border-primary-300'
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h3>
                
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Student Name
                      </label>
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="Enter student's full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Grade
                      </label>
                      <select
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      >
                        <option value="">Select grade</option>
                        {grades.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience Level
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['beginner', 'intermediate', 'advanced'].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setExperienceLevel(level)}
                          className={`px-4 py-3 border-2 rounded-xl transition-all capitalize ${
                            experienceLevel === level
                              ? 'border-primary-600 bg-primary-50 text-primary-700 font-medium'
                              : 'border-gray-300 hover:border-primary-300'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes or Questions
                    </label>
                    <textarea
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                      placeholder="Any specific requirements or questions you have..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-xl">
                <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  <strong>Special Offer:</strong> Register today and get 50% scholarship on your enrollment! 
                  Limited slots available.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-gray-400 transition-all"
                >
                  <ChevronLeft className="w-5 h-5 inline mr-2" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Book My Free Demo Class'
                  )}
                </button>
              </div>

              <p className="text-center text-sm text-gray-600">
                By submitting this form, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
