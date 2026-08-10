import React from 'react';
import { SettingsModule } from '../components/modules/SettingsModule';
import { useNavigate } from 'react-router-dom';

export function SettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto">
      <SettingsModule onBack={() => navigate('/')} />
    </div>
  );
}
