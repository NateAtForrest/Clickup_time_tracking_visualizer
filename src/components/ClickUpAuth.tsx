import React from 'react';
import { ArrowRight } from 'lucide-react';

const CLIENT_ID = 'MKZ7HGU6CMM6GIYUIGS98R4442ZTPP79';
const REDIRECT_URI = `https://www.${window.location.host}/auth/callback`;
const OAUTH_URL = `https://app.clickup.com/api/v2/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=team`;

export default function ClickUpAuth() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Connect to ClickUp</h1>
          <p className="text-gray-600">
            To visualize your time tracking data, we need to connect to your ClickUp account
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 text-sm">
            <p className="font-medium text-gray-700">Important:</p>
            <ul className="mt-2 list-disc list-inside text-gray-600 space-y-1">
              <li>Add this exact URL to your ClickUp OAuth settings:</li>
            </ul>
            <code className="block mt-2 bg-gray-100 p-3 rounded text-gray-800 break-all">
              {REDIRECT_URI}
            </code>
            <p className="mt-3 text-gray-600">Make sure to:</p>
            <ul className="mt-1 list-disc list-inside text-gray-600 space-y-1">
              <li>Be logged into ClickUp before connecting</li>
              <li>Have time tracking enabled in your workspace</li>
            </ul>
          </div>
          
          <a
            href={OAUTH_URL}
            className="w-full flex items-center justify-center space-x-2 bg-[#7B68EE] text-white py-3 px-4 rounded-lg hover:bg-[#6C5CE7] transition-colors"
          >
            <span>Connect ClickUp Account</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}