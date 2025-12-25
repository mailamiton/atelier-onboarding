import Link from 'next/link'
import { ArrowRight, Palette, Users, Award, Calendar } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Palette className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-heading font-bold text-gray-900">
                Ashish Patel Atelier
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/register"
                className="text-gray-700 hover:text-primary-600 transition-colors"
              >
                Register
              </Link>
              <Link
                href="/admin/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
              >
                Admin Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative py-20 sm:py-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Award className="w-4 h-4" />
                <span>World-Class Art Education from Florence, Italy</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-gray-900 mb-6">
                Unlock Your Child's{' '}
                <span className="text-gradient">Creative Potential</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Master the Classical Florentine Foundations with live, interactive 1:1 online classes 
                taught by Renaissance art expert Ashish Patel, ex-faculty of Angel Academy of Art, Florence.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <Link
                  href="/register"
                  className="group inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Book FREE Demo Class
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-primary-600">50% scholarship</span> on registration today
                </div>
              </div>

              <div className="flex items-center justify-center space-x-8 text-center">
                <div>
                  <div className="text-3xl font-bold text-gray-900">30K+</div>
                  <div className="text-sm text-gray-600">Happy Students</div>
                </div>
                <div className="h-12 w-px bg-gray-300"></div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">4.5+</div>
                  <div className="text-sm text-gray-600">Rating on Google</div>
                </div>
                <div className="h-12 w-px bg-gray-300"></div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">15+</div>
                  <div className="text-sm text-gray-600">Countries</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 mb-4">
                Why Choose Our <span className="text-gradient">Art Program</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                The world's only art institute igniting children's creativity through 
                the timeless brilliance of Renaissance ART
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl card-shadow hover:card-shadow-hover transition-all"
                >
                  <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mb-6">
                    <feature.icon className="w-7 h-7 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-heading font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-primary-600 to-accent-600 rounded-3xl p-12 text-center text-white">
              <h2 className="text-3xl sm:text-4xl font-heading font-bold mb-4">
                Ready to Start Your Child's Art Journey?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Book a free demo class today and experience world-class art education
              </p>
              <Link
                href="/register"
                className="inline-flex items-center px-8 py-4 text-lg font-medium text-primary-600 bg-white rounded-xl hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Register Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Palette className="w-6 h-6" />
              <span className="text-lg font-heading font-bold">
                Ashish Patel Atelier
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2024 Ashish Patel Atelier. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: Users,
    title: 'Live 1:1 Classes',
    description: 'Personalized attention with expert instructors in interactive one-on-one sessions.',
  },
  {
    icon: Palette,
    title: 'Renaissance Techniques',
    description: 'Learn authentic Classical Florentine art methods used by the masters.',
  },
  {
    icon: Calendar,
    title: 'Flexible Scheduling',
    description: 'Choose class times that work best for your family\'s schedule.',
  },
]
