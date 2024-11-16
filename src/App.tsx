import React from 'react';
import ClickUpAuth from './components/ClickUpAuth';
import TimeTrackingDashboard from './components/TimeTrackingDashboard';
import AuthCallback from './components/AuthCallback';

function App() {
  const isCallback = window.location.pathname === '/auth/callback';
  const token = localStorage.getItem('clickup_token');

  if (isCallback) {
    return <AuthCallback />;
  }

  return (
    <div className="bg-gray-50">
      {token ? <TimeTrackingDashboard /> : <ClickUpAuth />}
    </div>
  );
}

export default App;