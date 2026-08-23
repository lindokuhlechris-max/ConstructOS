import React from 'react';
import { QualityModule } from '../components/modules/QualityModule';
import { useNavigate } from 'react-router-dom';
import { navigateToPreviousRoute } from '../lib/navigationHistory';

export function QualityPage() {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-full flex flex-col flex-1">
      <QualityModule onBack={() => navigateToPreviousRoute(navigate, '/')} />
    </div>
  );
}
