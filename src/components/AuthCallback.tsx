import React, { useEffect } from 'react';
import { getAccessToken } from '../services/clickup';

export default function AuthCallback() {
  useEffect(() => {
    const handleAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code) {
        try {
          const accessToken = await getAccessToken(code);
          // Store the access token securely
          localStorage.setItem('clickup_token', accessToken);
          // Redirect to dashboard
          window.location.href = '/';
        } catch (error) {
          console.error('Authentication failed:', error);
        }
      }
    };

    handleAuth();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900">Authenticating...</h2>
        <p className="text-gray-600 mt-2">Please wait while we connect your ClickUp account.</p>
      </div>
    </div>
  );
}