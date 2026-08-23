import React from 'react';
import { SettingsModule } from '../components/modules/SettingsModule';
import { useNavigate } from 'react-router-dom';
import { navigateToPreviousRoute } from '../lib/navigationHistory';

export function SettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-full flex flex-col flex-1">
      <SettingsModule onBack={() => navigateToPreviousRoute(navigate, '/')} />
    </div>
  );
}
