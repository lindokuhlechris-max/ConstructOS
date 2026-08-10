import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from './ui';
import { MapPin, Navigation, Clock, CheckCircle2, User } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function SiteCheckIn() {
  const { projects, workerCheckIns, addWorkerCheckIn } = useAppContext();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');

  const currentProject = projects[0]; // Default project for now

  const userCheckIns = workerCheckIns.filter(c => c.workerName === 'Current User');
  const todaysCheckIns = userCheckIns.filter(c => new Date(c.timestamp).toDateString() === new Date().toDateString());
  const lastCheckIn = todaysCheckIns.length > 0 ? todaysCheckIns[0] : null;

  const getLocation = () => {
    setIsLocating(true);
    setError(null);
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
      },
      (err) => {
        setError('Unable to retrieve your location. Please ensure location services are enabled.');
        setIsLocating(false);
      }
    );
  };

  const handleCheckIn = () => {
    if (!location) {
      setError('Location is required to check in.');
      return;
    }

    addWorkerCheckIn({
      id: `CI-${Math.random().toString(36).substr(2, 9)}`,
      projectId: selectedProject || currentProject.id,
      workerName: 'Current User', // Mocked user
      timestamp: new Date().toISOString(),
      action: lastCheckIn?.action === 'Check-In' ? 'Check-Out' : 'Check-In',
      location: location,
    });
    
    // Clear location after action
    setLocation(null);
  };

  const isCheckedIn = lastCheckIn?.action === 'Check-In';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-indigo-600" />
          Site Check-In
        </CardTitle>
        <p className="text-sm text-slate-500">Log your arrival and departure times</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <User className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100">Current User</h4>
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  Status: 
                  {isCheckedIn ? (
                    <Badge className="bg-green-100 text-green-700 ml-1">On Site</Badge>
                  ) : (
                    <Badge className="bg-slate-200 text-slate-700 ml-1">Off Site</Badge>
                  )}
                </p>
              </div>
            </div>
            {lastCheckIn && (
              <div className="text-right">
                <p className="text-xs text-slate-400">Last Action</p>
                <p className="text-sm font-medium flex items-center justify-end gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(lastCheckIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Select Project Site</label>
            <select
              value={selectedProject || currentProject.id}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full h-12 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name} - {p.location}</option>
              ))}
            </select>
          </div>

          {!location && !isLocating && (
            <Button 
              onClick={getLocation} 
              variant="outline"
              className="w-full h-12 border-dashed border-2 flex items-center justify-center gap-2"
            >
              <Navigation className="h-4 w-4" /> Get Current Location
            </Button>
          )}

          {isLocating && (
            <div className="w-full h-12 flex items-center justify-center text-slate-500 text-sm gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
              Locating...
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          {location && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-sm rounded-lg border border-blue-100 dark:border-blue-800/30 flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Location Verified</p>
                <p className="text-xs opacity-80 mt-1">Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}</p>
              </div>
            </div>
          )}

          <Button
            disabled={!location}
            onClick={handleCheckIn}
            className={`w-full h-14 text-lg font-bold ${
              isCheckedIn 
                ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isCheckedIn ? 'Check Out' : 'Check In'}
          </Button>

        </div>
      </CardContent>
    </Card>
  );
}
