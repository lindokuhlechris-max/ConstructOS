import React, { useState } from 'react';
import { Card, CardContent, Badge, ProgressBar, Button } from '../components/ui';
import { Activity } from '../types';
import { ActivityDetail } from '../components/ActivityDetail';
import { ActivityForm } from '../components/ActivityForm';
import { CameraCapture } from '../components/CameraCapture';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { Search, Filter, CalendarClock, AlertCircle, PlayCircle, CheckCircle, Plus, Camera, Image as ImageIcon, LayoutGrid, List as ListIcon, Trash2, MoreVertical, Layers, ChevronRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function Activities() {
  const { activities, updateActivity, addActivity, deleteActivity, addAuditLog, userRole } = useAppContext();
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [capturingActivityId, setCapturingActivityId] = useState<string | null>(null);
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
  const [deletingActivityId, setDeletingActivityId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const filtered = activities.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.workPackage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteActivity = (id: string) => {
    setDeletingActivityId(id);
  };

  const handleConfirmDelete = () => {
    if (deletingActivityId && deleteActivity) {
      deleteActivity(deletingActivityId);
    }
    if (selectedActivity && selectedActivity.id === deletingActivityId) {
      setSelectedActivity(null);
    }
    setDeletingActivityId(null);
  };

  const handleSaveActivity = (updated: Activity) => {
    if (updateActivity) {
      updateActivity(updated);
    }
    setSelectedActivity(updated);
  };

  const handleAddActivity = (newActivity: Activity) => {
    addActivity(newActivity);
    setIsAdding(false);
  };

  const handleQuickCapturePhoto = (targetActivity: Activity, photoDataUrl: string) => {
    const updatedPhotos = [photoDataUrl, ...(targetActivity.photos || [])];
    const updated = { ...targetActivity, photos: updatedPhotos };
    if (updateActivity) {
      updateActivity(updated);
    }
    if (selectedActivity && selectedActivity.id === targetActivity.id) {
      setSelectedActivity(updated);
    }
    setCapturingActivityId(null);
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'In Progress': return <PlayCircle className="h-4 w-4 text-[#0B5FFF]" />;
      case 'Completed': return <CheckCircle className="h-4 w-4 text-[#2E7D32]" />;
      case 'Blocked': return <AlertCircle className="h-4 w-4 text-[#D32F2F]" />;
      default: return <CalendarClock className="h-4 w-4 text-[#F9A825]" />;
    }
  };

  if (isAdding) {
    return (
      <div className="p-4 md:p-8">
        <ActivityForm onClose={() => setIsAdding(false)} onSubmit={handleAddActivity} />
      </div>
    );
  }

  if (selectedActivity) {
    return (
      <div className="p-4 md:p-8">
        <ActivityDetail
          activity={selectedActivity}
          onSave={handleSaveActivity}
          onClose={() => setSelectedActivity(null)}
          onDelete={userRole === 'Manager' ? handleDeleteActivity : undefined}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex justify-between items-center w-full md:w-auto">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Activity Tracker</h1>
            <p className="text-slate-500 dark:text-slate-400">Manage and monitor all construction activities.</p>
          </div>
          <Button onClick={() => setIsAdding(true)} className="md:hidden gap-2 rounded-xl bg-[#0B5FFF]">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsAdding(true)} className="hidden md:flex gap-2 rounded-xl bg-[#0B5FFF]">
            <Plus className="h-4 w-4" /> Add Activity
          </Button>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search activities..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm focus:border-[#0B5FFF] focus:outline-none focus:ring-1 focus:ring-[#0B5FFF] dark:border-slate-800 dark:bg-slate-900"
            />
          </div>
          <Button variant="outline" size="icon" className="shrink-0 rounded-xl">
            <Filter className="h-4 w-4" />
          </Button>
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              title="List view"
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "flex flex-col gap-4"}>
        {filtered.map((activity) => (
          <Card 
            key={activity.id} 
            onClick={() => setExpandedActivityId(expandedActivityId === activity.id ? null : activity.id)}
            className="hover:border-[#0B5FFF]/40 dark:hover:border-blue-500/40 hover:shadow-md transition-all cursor-pointer overflow-hidden group relative"
          >

            <div className={`flex ${viewMode === 'grid' ? 'flex-col h-full' : 'flex-col md:flex-row'}`}>
              {/* Status Color Bar */}
              <div className={`${viewMode === 'grid' ? 'h-1 w-full' : 'w-1 h-auto md:w-1'} ${
                activity.status === 'In Progress' ? 'bg-[#0B5FFF]' :
                activity.status === 'Blocked' ? 'bg-[#D32F2F]' :
                activity.status === 'Completed' ? 'bg-[#2E7D32]' : 'bg-[#F9A825]'
              }`} />
              
              <CardContent className={`flex-1 p-4 flex ${viewMode === 'grid' ? 'flex-col gap-4' : 'flex-col md:flex-row md:items-center justify-between gap-4'}`}>
                <div className="flex flex-col gap-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold tracking-wider text-slate-500">{activity.id}</span>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold">{activity.workPackage}</Badge>
                    {activity.priority === 'Critical' && <Badge variant="danger" className="text-[10px] uppercase font-bold">Critical</Badge>}
                    {activity.photos && activity.photos.length > 0 && (
                      <Badge variant="default" className="text-[10px] bg-blue-50 text-[#0B5FFF] border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 font-bold gap-1">
                        <ImageIcon className="h-3 w-3" /> {activity.photos.length} {activity.photos.length === 1 ? 'Photo' : 'Photos'}
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{activity.name}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> {activity.startDate}</span>
                    <span>Area: {activity.area}</span>
                    <span>Team: {activity.assignedTo}</span>
                  </div>

                  {/* Thumbnail Preview strip if photos exist */}
                  {activity.photos && activity.photos.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1">
                      {activity.photos.slice(0, 4).map((photo, pIdx) => (
                        <img 
                          key={pIdx} 
                          src={photo} 
                          alt="Thumbnail" 
                          className="w-9 h-9 rounded-md object-cover border border-slate-200 dark:border-slate-700 shadow-xs" 
                        />
                      ))}
                      {activity.photos.length > 4 && (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-2 rounded-md">
                          +{activity.photos.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className={`flex ${viewMode === 'grid' ? 'flex-row items-center justify-between mt-auto pt-4' : 'flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 w-full md:w-56 pt-3 md:pt-0'} border-t md:border-t-0 border-slate-100 dark:border-slate-800`}>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(activity.status)}
                      <span className="text-sm font-bold">{activity.status}</span>
                    </div>

                    {/* Quick Camera Capture Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCapturingActivityId(activity.id);
                      }}
                      className="h-8 rounded-xl px-2.5 gap-1.5 text-xs text-[#0B5FFF] border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 dark:border-blue-900"
                      title="Capture Site Progress Photo"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline font-semibold">Photo</span>
                    </Button>
                  </div>
                  
                  <div className={`flex flex-col gap-1 ${viewMode === 'grid' ? 'w-24' : 'w-1/2 md:w-full'}`}>
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase text-gray-500">
                      <span>Progress</span>
                      <span className="text-[#1A1C1E] dark:text-slate-50">{activity.progress}%</span>
                    </div>
                    <ProgressBar value={activity.progress} />
                  </div>
                </div>
              </CardContent>
            </div>

            {expandedActivityId === activity.id && (
              <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mt-3">
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 mb-1">Start Date</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{activity.startDate}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 mb-1">Finish Date</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{activity.finishDate}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 mb-1">Supervisor</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{activity.supervisor}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 mb-1">Assigned Personnel</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{activity.assignedTo}</span>
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  {userRole === 'Manager' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteActivity(activity.id);
                      }}
                      className="gap-2 rounded-xl text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/30 dark:border-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Activity
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedActivity(activity);
                    }}
                    className="gap-2 rounded-xl text-[#0B5FFF] border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 dark:border-blue-900"
                  >
                    View Full Details
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Direct Camera Capture Overlay for list view */}
      {capturingActivityId && (
        <CameraCapture
          onCapture={(dataUrl) => {
            const targetAct = activities.find(a => a.id === capturingActivityId);
            if (targetAct) {
              handleQuickCapturePhoto(targetAct, dataUrl);
            }
          }}
          onCancel={() => setCapturingActivityId(null)}
        />
      )}

      {/* Delete Activity Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingActivityId)}
        title="Delete Construction Activity"
        itemName={activities.find(a => a.id === deletingActivityId)?.name || deletingActivityId || ''}
        message="Are you sure you want to delete this activity? This will remove all associated subtasks, photos, and resource allocations."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingActivityId(null)}
        confirmLabel="Delete Activity"
      />
    </div>
  );
}

