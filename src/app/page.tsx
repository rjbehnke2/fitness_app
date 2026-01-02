'use client';

import Link from 'next/link';
import { Dumbbell, Target, TrendingUp, Bot, ChefHat, Calendar } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';

const features = [
  {
    icon: Target,
    title: 'Set & Track Goals',
    description: 'Define your fitness goals with target weights and dates. Track your progress on benchmark lifts.',
  },
  {
    icon: TrendingUp,
    title: 'Progress Dashboard',
    description: 'Visualize your gains with detailed charts and analytics for all your exercises.',
  },
  {
    icon: Bot,
    title: 'AI Coach',
    description: 'Get personalized workout suggestions based on your progress and muscle recovery needs.',
  },
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'Workouts adapt to your location - gym or home - with appropriate exercises and duration.',
  },
  {
    icon: ChefHat,
    title: 'Nutrition Advice',
    description: 'Get personalized pre and post-workout nutrition recommendations.',
  },
  {
    icon: Dumbbell,
    title: 'Progressive Overload',
    description: 'Workouts automatically get harder over time to ensure continuous improvement.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Dumbbell className="h-8 w-8 text-blue-500" />
              <span className="ml-2 text-xl font-bold text-white">FitCoach</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-300 hover:text-white">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Your Personal
            <span className="text-blue-500"> AI Fitness Coach</span>
          </h1>
          <p className="mt-6 text-xl text-gray-400 max-w-2xl mx-auto">
            Track your workouts, set goals, and get personalized training advice.
            Whether you&apos;re at home or the gym, FitCoach helps you get stronger every day.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Start Your Journey
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-white border-gray-600 hover:bg-gray-800">
                I Already Have an Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Everything You Need to Get Stronger
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              Comprehensive tools for tracking, planning, and optimizing your workouts
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="bg-gray-800/50 border border-gray-700 hover:border-blue-500/50 transition-colors">
                  <CardContent className="pt-6">
                    <div className="p-3 bg-blue-500/10 rounded-lg w-fit mb-4">
                      <Icon className="h-6 w-6 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benchmark Exercises Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-800/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Track Your Benchmark Lifts
          </h2>
          <p className="text-lg text-gray-400 mb-10">
            Focus on the lifts that matter most. Track your progress on key compound movements.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {['Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row', 'Barbell Curl'].map((exercise) => (
              <div
                key={exercise}
                className="bg-gray-700/50 rounded-lg py-4 px-6 text-white font-medium"
              >
                {exercise}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Training?
          </h2>
          <p className="text-lg text-gray-400 mb-10">
            Join FitCoach today and start your journey to becoming stronger.
          </p>
          <Link href="/signup">
            <Button size="lg">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-800">
        <div className="max-w-7xl mx-auto text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} FitCoach. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
