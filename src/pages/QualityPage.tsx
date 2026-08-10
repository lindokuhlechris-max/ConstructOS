import React from 'react';
import { QualityModule } from '../components/modules/QualityModule';
import { useNavigate } from 'react-router-dom';

export function QualityPage() {
  const navigate = useNavigate();

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto">
      <QualityModule onBack={() => navigate('/')} />
    </div>
  );
}
