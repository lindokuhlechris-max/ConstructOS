import React from 'react';
import { Materials } from '../../pages/Materials';

interface MaterialModuleProps {
  onBack: () => void;
}

export function MaterialModule({ onBack }: MaterialModuleProps) {
  return <Materials onBack={onBack} />;
}
