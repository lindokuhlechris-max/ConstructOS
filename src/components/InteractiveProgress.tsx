import React from 'react';
import { ActivityStatus } from '../types';

interface InteractiveProgressProps {
  progress: number;
  status: ActivityStatus;
  isEditing?: boolean;
  onProgressChange?: (newProgress: number, newStatus: ActivityStatus) => void;
}

export function InteractiveProgress({ progress, status, isEditing = false, onProgressChange }: InteractiveProgressProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onProgressChange) return;
    
    const newProgress = Number(e.target.value);
    let newStatus = status;
    
    if (newProgress === 100) newStatus = 'Completed';
    else if (newProgress === 0) newStatus = 'Not Started';
    else if (status === 'Completed' || status === 'Not Started') newStatus = 'In Progress';
    
    onProgressChange(newProgress, newStatus);
  };

  const barColor = progress === 100 ? 'bg-[#2E7D32]' : progress === 0 ? 'bg-slate-400' : 'bg-[#0B5FFF]';

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">Completion</span>
        <span className={`text-base font-black ${progress === 100 ? 'text-[#2E7D32]' : 'text-[#0B5FFF]'}`}>
          {progress}%
        </span>
      </div>
      
      <div className="relative h-5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 shadow-inner">
        <div 
          className={`h-full flex-1 transition-all duration-300 ease-out ${barColor}`}
          style={{ width: `${progress}%` }} 
        />
        {isEditing && (
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={progress}
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Adjust progress percentage"
          />
        )}
      </div>
      {isEditing && (
        <p className="text-[10px] text-slate-500 mt-1 text-center">
          Drag to update progress. Automatically updates status.
        </p>
      )}
    </div>
  );
}
