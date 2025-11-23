'use client';

import { DesktopLayout } from '@/components/desktop-layout';

export default function OnboardingPage() {
  return (
    <DesktopLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Getting Started</h1>
          <p className="text-gray-600 mt-2">Complete your Workix setup</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { title: 'Profile Setup', desc: 'Complete your profile information', icon: '👤', done: false },
            { title: 'Company Info', desc: 'Add your company details', icon: '🏢', done: false },
            { title: 'Invite Team', desc: 'Add team members', icon: '👥', done: false },
            { title: 'Create Assets', desc: 'Add your first assets', icon: '🔧', done: false }
          ].map((step, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow">
              <div className="text-4xl mb-4">{step.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{step.desc}</p>
              <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded hover:from-purple-700 hover:to-pink-700 shadow-md">
                {step.done ? 'Completed' : 'Get Started'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </DesktopLayout>
  );
}
