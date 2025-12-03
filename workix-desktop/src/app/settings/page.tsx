'use client';

import { useState, useEffect } from 'react';
import { useAuthStore, useSettingsStore, useConnectionStore } from '@/store';
import { DesktopLayout } from '@/components/desktop-layout';
import { Save, RotateCcw, Check, Wifi, WifiOff, Globe, Bell, Moon, Server } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'ar', name: 'Arabic (العربية)' },
  { code: 'zh', name: 'Chinese (中文)' },
];

const timezones = [
  { code: 'UTC', name: 'UTC (Coordinated Universal Time)' },
  { code: 'America/New_York', name: 'EST (UTC-5) - New York' },
  { code: 'America/Chicago', name: 'CST (UTC-6) - Chicago' },
  { code: 'America/Denver', name: 'MST (UTC-7) - Denver' },
  { code: 'America/Los_Angeles', name: 'PST (UTC-8) - Los Angeles' },
  { code: 'Europe/London', name: 'GMT (UTC+0) - London' },
  { code: 'Europe/Paris', name: 'CET (UTC+1) - Paris' },
  { code: 'Asia/Dubai', name: 'GST (UTC+4) - Dubai' },
  { code: 'Asia/Singapore', name: 'SGT (UTC+8) - Singapore' },
  { code: 'Asia/Tokyo', name: 'JST (UTC+9) - Tokyo' },
];

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const {
    language,
    timezone,
    emailNotifications,
    pushNotifications,
    darkMode,
    apiUrl,
    setLanguage,
    setTimezone,
    setEmailNotifications,
    setPushNotifications,
    setDarkMode,
    setApiUrl,
    resetSettings,
  } = useSettingsStore();
  
  const { isOnline, isBackendReachable } = useConnectionStore();
  
  const [saved, setSaved] = useState(false);
  const [localApiUrl, setLocalApiUrl] = useState(apiUrl);

  useEffect(() => {
    setLocalApiUrl(apiUrl);
  }, [apiUrl]);

  const handleSaveApiUrl = () => {
    setApiUrl(localApiUrl);
    showSavedMessage();
  };

  const showSavedMessage = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      resetSettings();
      setLocalApiUrl(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');
      showSavedMessage();
    }
  };

  return (
    <DesktopLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2">Configure your application preferences</p>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
              isOnline && isBackendReachable 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {isOnline && isBackendReachable ? (
                <>
                  <Wifi className="w-4 h-4" />
                  <span>Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span>{!isOnline ? 'Offline' : 'Backend Unavailable'}</span>
                </>
              )}
            </div>
            
            {saved && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm animate-pulse">
                <Check className="w-4 h-4" />
                <span>Settings Saved!</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Settings */}
          <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 text-sm">👤</span>
                </div>
                Profile
              </h2>
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-3xl shadow-lg mx-auto">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Logged in as</p>
                <p className="font-semibold text-lg">{user?.name || 'Guest'}</p>
                <p className="text-sm text-gray-600">{user?.email || 'No email'}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium capitalize">
                  {user?.role || 'User'}
                </span>
              </div>
              <button
                onClick={logout}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Logout
              </button>
            </div>
          </div>

          {/* App Settings */}
          <div className="md:col-span-2 space-y-6">
            {/* General Settings */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                General Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    id="language"
                    value={language}
                    onChange={(e) => { setLanguage(e.target.value); showSavedMessage(); }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
                    Time Zone
                  </label>
                  <select
                    id="timezone"
                    value={timezone}
                    onChange={(e) => { setTimezone(e.target.value); showSavedMessage(); }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {timezones.map((tz) => (
                      <option key={tz.code} value={tz.code}>
                        {tz.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-yellow-600" />
                Notifications
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <label htmlFor="emailNotifications" className="text-sm font-medium text-gray-700">
                      Email Notifications
                    </label>
                    <p className="text-xs text-gray-500">Receive updates via email</p>
                  </div>
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    checked={emailNotifications}
                    onChange={(e) => { setEmailNotifications(e.target.checked); showSavedMessage(); }}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <label htmlFor="pushNotifications" className="text-sm font-medium text-gray-700">
                      Push Notifications
                    </label>
                    <p className="text-xs text-gray-500">Receive desktop notifications</p>
                  </div>
                  <input
                    type="checkbox"
                    id="pushNotifications"
                    checked={pushNotifications}
                    onChange={(e) => { setPushNotifications(e.target.checked); showSavedMessage(); }}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Appearance Settings */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Moon className="w-5 h-5 text-indigo-600" />
                Appearance
              </h2>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <label htmlFor="darkMode" className="text-sm font-medium text-gray-700">
                    Dark Mode
                  </label>
                  <p className="text-xs text-gray-500">Use dark theme (coming soon)</p>
                </div>
                <input
                  type="checkbox"
                  id="darkMode"
                  checked={darkMode}
                  onChange={(e) => { setDarkMode(e.target.checked); showSavedMessage(); }}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  disabled
                />
              </div>
            </div>

            {/* API Settings */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Server className="w-5 h-5 text-green-600" />
                API Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="apiUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    Backend URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="apiUrl"
                      value={localApiUrl}
                      onChange={(e) => setLocalApiUrl(e.target.value)}
                      className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="http://localhost:5000"
                    />
                    <button 
                      onClick={handleSaveApiUrl}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 shadow-md flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Current: {apiUrl}
                  </p>
                </div>
              </div>
            </div>

            {/* Reset Settings */}
            <div className="flex justify-end">
              <button
                onClick={handleResetSettings}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      </div>
    </DesktopLayout>
  );
}
