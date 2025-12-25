'use client'

import Link from 'next/link'
import { CheckCircle, Home, Mail } from 'lucide-react'

export default function SuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-3xl card-shadow-hover p-8 sm:p-12 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 mb-4">
            Registration Successful!
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            Thank you for registering with Ashish Patel Atelier. We've received your information 
            and will assign a teacher shortly.
          </p>

          <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">What happens next?</h3>
            <div className="space-y-3 text-left">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  1
                </div>
                <p className="text-gray-700">
                  Our team will review your registration and assign the best teacher for your child
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  2
                </div>
                <p className="text-gray-700">
                  You'll receive an email with your teacher details and demo class link
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  3
                </div>
                <p className="text-gray-700">
                  Join your free demo class and start your art journey!
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-3 text-sm text-gray-600 mb-8">
            <Mail className="w-5 h-5" />
            <span>Check your email for confirmation and next steps</span>
          </div>

          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Home className="w-5 h-5 mr-2" />
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
