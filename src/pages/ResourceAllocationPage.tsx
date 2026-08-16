import React, { useState } from 'react';
import { ResourceAllocationModule } from '../components/modules/ResourceAllocationModule';
import { ActivityDetail } from '../components/ActivityDetail';
import { useAppContext } from '../context/AppContext';
import { ErrorBoundary } from '../components/ErrorBoundary';

export function ResourceAllocationPage() {
  const { activities } = useAppContext();
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  const selectedActivity = activities.find(a => a.id === selectedActivityId);

  return (
    <div className="p-4 md:p-6 w-full">
      {selectedActivity ? (
        <ErrorBoundary moduleName="Activity Detail">
          <ActivityDetail
            activity={selectedActivity}
            onClose={() => setSelectedActivityId(null)}
          />
        </ErrorBoundary>
      ) : (
        <ErrorBoundary moduleName="Resource Allocation">
          <ResourceAllocationModule
            onSelectActivity={(actId) => setSelectedActivityId(actId)}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}
