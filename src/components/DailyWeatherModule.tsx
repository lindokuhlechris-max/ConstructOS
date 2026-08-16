import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from './ui';
import { 
  Sun, Cloud, CloudRain, CloudLightning, Wind, Thermometer, Droplets, 
  AlertTriangle, CheckCircle2, ShieldAlert, Plus, History, Calendar, 
  Clock, X, Umbrella, ArrowUpRight, Activity as ActivityIcon, Edit2, Trash2, FileText, Download
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { WeatherCondition, WeatherImpactLevel, WeatherLog, Activity, canManage } from '../types';
import { DailyPdfSummaryModal } from './DailyPdfSummaryModal';

export function DailyWeatherModule() {
  const { 
    weatherLogs, 
    activities, 
    addWeatherLog, 
    updateWeatherLog, 
    deleteWeatherLog, 
    updateActivity, 
    units, 
    userRole,
    currentUserProfile 
  } = useAppContext();

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<WeatherLog | null>(null);

  // Live Weather API Fetch State
  const [isFetchingLive, setIsFetchingLive] = useState(false);
  const [liveLocationInput, setLiveLocationInput] = useState('Johannesburg');
  const [liveWeatherSourceInfo, setLiveWeatherSourceInfo] = useState<{
    source: string;
    cachedAt?: string;
    nextUpdateInMinutes?: number;
    location?: string;
  } | null>(null);

  // Form State
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(new Date().toTimeString().slice(0, 5));
  const [condition, setCondition] = useState<WeatherCondition>('Sunny');
  const [temperature, setTemperature] = useState<number>(24);
  const [humidity, setHumidity] = useState<number>(55);
  const [windSpeed, setWindSpeed] = useState<number>(12);
  const [windDirection, setWindDirection] = useState<string>('SE');
  const [rainfall, setRainfall] = useState<number>(0);
  const [impactLevel, setImpactLevel] = useState<WeatherImpactLevel>('Normal Operations');
  const [safetyAdvisories, setSafetyAdvisories] = useState<string[]>([]);
  const [customAdvisory, setCustomAdvisory] = useState<string>('');
  const [affectedActivityIds, setAffectedActivityIds] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');

  // Latest Weather Log (or default fallback)
  const latestLog: WeatherLog = useMemo(() => {
    if (weatherLogs && weatherLogs.length > 0) {
      return weatherLogs[0];
    }
    return {
      id: 'WTR-DEFAULT',
      projectId: 'PRJ-9348',
      date: new Date().toISOString().split('T')[0],
      time: '08:00',
      condition: 'Sunny',
      temperature: 25,
      humidity: 50,
      windSpeed: 14,
      windDirection: 'E',
      rainfall: 0,
      impactLevel: 'Normal Operations',
      safetyAdvisories: ['Standard PPE required', 'Hydration station open'],
      notes: 'Initial morning weather check. Clear skies and optimal site conditions.',
      loggedBy: 'Site Manager',
      createdAt: new Date().toISOString()
    };
  }, [weatherLogs]);

  // Display temperature conversion helper
  const formatTemp = (celsius: number) => {
    if (units === 'imperial') {
      const fahrenheit = Math.round((celsius * 9) / 5 + 32);
      return `${fahrenheit}°F`;
    }
    return `${celsius}°C`;
  };

  const formatWind = (speedKm: number) => {
    if (units === 'imperial') {
      const mph = Math.round(speedKm * 0.621371);
      return `${mph} mph`;
    }
    return `${speedKm} km/h`;
  };

  // Condition Visual Icon Helper
  const getWeatherIcon = (cond: WeatherCondition, className = "h-6 w-6") => {
    switch (cond) {
      case 'Sunny':
      case 'Clear':
        return <Sun className={`${className} text-amber-500`} />;
      case 'Partly Cloudy':
        return <Cloud className={`${className} text-amber-400`} />;
      case 'Overcast':
      case 'Fog':
      case 'Dust / Haze':
        return <Cloud className={`${className} text-slate-400`} />;
      case 'Light Rain':
        return <CloudRain className={`${className} text-blue-400`} />;
      case 'Heavy Rain':
        return <CloudRain className={`${className} text-blue-600`} />;
      case 'Thunderstorm':
        return <CloudLightning className={`${className} text-purple-600`} />;
      case 'High Winds':
        return <Wind className={`${className} text-teal-500`} />;
      case 'Extreme Heat':
        return <Thermometer className={`${className} text-red-500`} />;
      case 'Freezing':
        return <Thermometer className={`${className} text-cyan-500`} />;
      default:
        return <Sun className={`${className} text-amber-500`} />;
    }
  };

  const getImpactBadge = (level: WeatherImpactLevel) => {
    switch (level) {
      case 'Normal Operations':
        return <Badge variant="success" className="px-2.5 py-1 text-xs">Normal Operations</Badge>;
      case 'Caution / Monitoring':
        return <Badge variant="warning" className="px-2.5 py-1 text-xs">Caution / Monitoring</Badge>;
      case 'Work Package Delay':
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 px-2.5 py-1 text-xs">Work Package Delay</Badge>;
      case 'Site Suspension':
        return <Badge variant="danger" className="px-2.5 py-1 text-xs">Site Work Suspended</Badge>;
    }
  };

  // Automatic Safety Protocol Advisory Generator based on weather parameters
  const calculatedAdvisories = useMemo(() => {
    const alerts: { title: string; desc: string; icon: any; severity: 'high' | 'medium' | 'info' }[] = [];

    if (latestLog.windSpeed && latestLog.windSpeed >= 30) {
      alerts.push({
        title: 'High Wind Alert - Crane Operations',
        desc: `Wind speed (${formatWind(latestLog.windSpeed)}) exceeds 30 km/h safe limit. Lower crane booms and suspend overhead lifting.`,
        icon: Wind,
        severity: 'high'
      });
    }

    if (latestLog.condition === 'Heavy Rain' || latestLog.condition === 'Thunderstorm' || (latestLog.rainfall && latestLog.rainfall > 5)) {
      alerts.push({
        title: 'Rain & Flood Hazard',
        desc: 'Ground saturation risk. De-water trench excavations before worker entry and pause concrete curing/pouring.',
        icon: CloudRain,
        severity: 'high'
      });
    }

    if (latestLog.temperature >= 32 || latestLog.condition === 'Extreme Heat') {
      alerts.push({
        title: 'Heat Illness Prevention Protocol',
        desc: 'Temperature exceeds threshold. Enforce mandatory 15-min hydration breaks every hour in designated shaded areas.',
        icon: Thermometer,
        severity: 'medium'
      });
    }

    if (latestLog.temperature <= 2 || latestLog.condition === 'Freezing') {
      alerts.push({
        title: 'Freezing Walkway Inspection',
        desc: 'Sub-freezing conditions present. Inspect scaffolding, ladders, and walkways for ice accumulation before high work.',
        icon: ShieldAlert,
        severity: 'medium'
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        title: 'Standard Safety Protocol Active',
        desc: 'Weather parameters are within safe operational limits. Mandatory PPE required across all active zones.',
        icon: CheckCircle2,
        severity: 'info'
      });
    }

    return alerts;
  }, [latestLog, units]);

  // Handle open log modal
  const handleOpenLogModal = (logToEdit?: WeatherLog) => {
    if (logToEdit) {
      setEditingLog(logToEdit);
      setDate(logToEdit.date);
      setTime(logToEdit.time || '08:00');
      setCondition(logToEdit.condition);
      setTemperature(logToEdit.temperature);
      setHumidity(logToEdit.humidity || 50);
      setWindSpeed(logToEdit.windSpeed || 10);
      setWindDirection(logToEdit.windDirection || 'SE');
      setRainfall(logToEdit.rainfall || 0);
      setImpactLevel(logToEdit.impactLevel);
      setSafetyAdvisories(logToEdit.safetyAdvisories || []);
      setAffectedActivityIds(logToEdit.affectedActivityIds || []);
      setNotes(logToEdit.notes || '');
    } else {
      setEditingLog(null);
      setDate(new Date().toISOString().split('T')[0]);
      setTime(new Date().toTimeString().slice(0, 5));
      setCondition('Sunny');
      setTemperature(24);
      setHumidity(55);
      setWindSpeed(12);
      setWindDirection('SE');
      setRainfall(0);
      setImpactLevel('Normal Operations');
      setSafetyAdvisories(['Crane operations clear', 'Hydration station open']);
      setAffectedActivityIds([]);
      setNotes('');
    }
    setIsLogModalOpen(true);
  };

  // Preset safety advisories checklist
  const presetAdvisories = [
    'Crane & boom lift operations suspended (>30 km/h wind)',
    'Trench de-watering required prior to excavation entry',
    'Mandatory 15-min shaded hydration break every hour (Heat Stress)',
    'Concrete pour delayed due to rainfall / moisture limits',
    'Scaffolding & high work anti-slip inspection completed',
    'Lightning hazard warning: Evacuate exposed elevated structures',
    'High dust mask / respiratory PPE mandatory on earthworks'
  ];

  const toggleAdvisory = (advisory: string) => {
    if (safetyAdvisories.includes(advisory)) {
      setSafetyAdvisories(safetyAdvisories.filter(a => a !== advisory));
    } else {
      setSafetyAdvisories([...safetyAdvisories, advisory]);
    }
  };

  const handleAddCustomAdvisory = () => {
    if (customAdvisory.trim() && !safetyAdvisories.includes(customAdvisory.trim())) {
      setSafetyAdvisories([...safetyAdvisories, customAdvisory.trim()]);
      setCustomAdvisory('');
    }
  };

  const toggleActivity = (id: string) => {
    if (affectedActivityIds.includes(id)) {
      setAffectedActivityIds(affectedActivityIds.filter(aId => aId !== id));
    } else {
      setAffectedActivityIds([...affectedActivityIds, id]);
    }
  };

  const handleFetchLiveWeather = async (targetLocation?: string, autoSaveLog = false) => {
    setIsFetchingLive(true);
    const queryLoc = targetLocation || liveLocationInput || 'Johannesburg';

    try {
      const res = await fetch(`/api/weather/live?location=${encodeURIComponent(queryLoc)}`);
      if (!res.ok) {
        throw new Error('Failed to connect to weather service');
      }

      const json = await res.json();
      const wData = json.data;

      if (wData) {
        setCondition(wData.condition as WeatherCondition);
        setTemperature(wData.temperature);
        setHumidity(wData.humidity);
        setWindSpeed(wData.windSpeed);
        setWindDirection(wData.windDirection);
        setRainfall(wData.rainfall);
        setImpactLevel(wData.impactLevel as WeatherImpactLevel);
        setDate(wData.date);
        setTime(wData.time);

        const autoNote = `Live conditions auto-fetched from Open-Meteo for ${wData.location} (${json.source === 'cache' ? 'Hourly Cached' : 'Fresh API Request'}).`;
        setNotes(prev => prev ? `${prev}\n${autoNote}` : autoNote);

        setLiveWeatherSourceInfo({
          source: json.source === 'cache' ? 'Open-Meteo (1-Hour Cached)' : 'Open-Meteo (Live API Call)',
          cachedAt: json.cachedAt,
          nextUpdateInMinutes: json.nextUpdateInMinutes,
          location: wData.location
        });

        if (autoSaveLog) {
          const liveLog: WeatherLog = {
            id: `WTR-LIVE-${Date.now()}`,
            projectId: 'PRJ-9348',
            date: wData.date,
            time: wData.time,
            condition: wData.condition as WeatherCondition,
            temperature: wData.temperature,
            humidity: wData.humidity,
            windSpeed: wData.windSpeed,
            windDirection: wData.windDirection,
            rainfall: wData.rainfall,
            impactLevel: wData.impactLevel as WeatherImpactLevel,
            safetyAdvisories: ['Verify crane wind limits', 'Hydration & site safety check'],
            notes: autoNote,
            loggedBy: `${currentUserProfile?.name || 'Supervisor'} (Live API Sync)`,
            createdAt: new Date().toISOString()
          };
          addWeatherLog(liveLog);
        }
      }
    } catch (err) {
      console.error('Error fetching live weather:', err);
    } finally {
      setIsFetchingLive(false);
    }
  };

  const handleSaveWeatherLog = (e: React.FormEvent) => {
    e.preventDefault();

    const newLog: WeatherLog = {
      id: editingLog ? editingLog.id : `WTR-${Math.random().toString(36).substr(2, 9)}`,
      projectId: 'PRJ-9348',
      date,
      time,
      condition,
      temperature: Number(temperature),
      humidity: Number(humidity),
      windSpeed: Number(windSpeed),
      windDirection,
      rainfall: Number(rainfall),
      impactLevel,
      safetyAdvisories,
      affectedActivityIds,
      notes,
      loggedBy: currentUserProfile?.name || 'Site Manager',
      createdAt: new Date().toISOString()
    };

    if (editingLog) {
      updateWeatherLog(newLog);
    } else {
      addWeatherLog(newLog);
    }

    // If impact level is Work Package Delay or Site Suspension, option to update linked activities to Blocked
    if ((impactLevel === 'Work Package Delay' || impactLevel === 'Site Suspension') && affectedActivityIds.length > 0) {
      affectedActivityIds.forEach(actId => {
        const act = activities.find(a => a.id === actId);
        if (act && act.status !== 'Blocked' && act.status !== 'Completed') {
          updateActivity({
            ...act,
            status: 'Blocked',
            remarks: `Blocked due to weather condition (${condition}): ${notes || 'Weather impact'}`
          });
        }
      });
    }

    setIsLogModalOpen(false);
  };

  const handleDeleteLog = (id: string) => {
    if (confirm('Are you sure you want to delete this weather log entry?')) {
      deleteWeatherLog(id);
    }
  };

  const conditionsList: WeatherCondition[] = [
    'Sunny', 'Clear', 'Partly Cloudy', 'Overcast', 
    'Light Rain', 'Heavy Rain', 'Thunderstorm', 'High Winds', 
    'Extreme Heat', 'Freezing', 'Dust / Haze', 'Fog'
  ];

  return (
    <Card className="w-full overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-slate-50 via-blue-50/40 to-slate-50 dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-900 pb-3 border-b border-slate-200/80 dark:border-slate-800 flex flex-row items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
              {getWeatherIcon(latestLog.condition, "h-5 w-5")}
            </div>
            <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100">
              Daily Weather & Safety Protocol Tracking
            </CardTitle>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time weather logging impacting site operations, machinery limits, and safety advisories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            size="sm"
            disabled={isFetchingLive}
            onClick={() => handleFetchLiveWeather('Johannesburg', true)}
            className="text-xs h-8 gap-1.5 border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
          >
            <Sun className={`h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 ${isFetchingLive ? 'animate-spin' : ''}`} />
            {isFetchingLive ? 'Fetching Live...' : 'Fetch Live Weather (1-Hr Cache)'}
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsPdfModalOpen(true)}
            className="text-xs h-8 gap-1.5 border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/60"
          >
            <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            PDF Summary / Email
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsHistoryModalOpen(true)}
            className="text-xs h-8 gap-1.5 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <History className="h-3.5 w-3.5 text-slate-500" />
            Weather History
          </Button>

          {canManage(userRole) && (
            <Button 
              size="sm" 
              onClick={() => handleOpenLogModal()}
              className="text-xs h-8 gap-1.5 bg-[#0B5FFF] text-white hover:bg-[#0B5FFF]/90 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Log Weather Condition
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Main Weather Metric Banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800">
          {/* Current Condition & Temp */}
          <div className="flex items-center gap-3.5 md:col-span-1 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 pb-3 md:pb-0 pr-2">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0">
              {getWeatherIcon(latestLog.condition, "h-9 w-9")}
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-50">
                  {formatTemp(latestLog.temperature)}
                </span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {latestLog.condition}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                {getImpactBadge(latestLog.impactLevel)}
              </div>
            </div>
          </div>

          {/* Environmental Metrics */}
          <div className="grid grid-cols-3 gap-2 md:col-span-2 text-center border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 pb-3 md:pb-0 px-2">
            <div className="flex flex-col items-center justify-center p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 uppercase">
                <Wind className="h-3.5 w-3.5 text-teal-500" />
                Wind
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                {formatWind(latestLog.windSpeed || 0)} {latestLog.windDirection || ''}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 uppercase">
                <Droplets className="h-3.5 w-3.5 text-blue-500" />
                Humidity
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                {latestLog.humidity || 0}%
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 uppercase">
                <Umbrella className="h-3.5 w-3.5 text-indigo-500" />
                Rainfall
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                {latestLog.rainfall || 0} mm
              </span>
            </div>
          </div>

          {/* Log Details & Supervisor Notes */}
          <div className="flex flex-col justify-between md:col-span-1 pl-1">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {latestLog.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {latestLog.time || '08:00'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-2 italic">
                "{latestLog.notes || 'No specific supervisor observations noted.'}"
              </p>
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 text-right mt-2">
              Logged by: <span className="font-semibold text-slate-600 dark:text-slate-300">{latestLog.loggedBy}</span>
            </div>
          </div>
        </div>

        {/* Safety Advisories & Protocol Warnings */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
            Active Safety Protocol Advisories
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {calculatedAdvisories.map((alert, idx) => {
              const IconComp = alert.icon;
              const severityBg = 
                alert.severity === 'high' ? 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/30 dark:border-red-800 dark:text-red-200' :
                alert.severity === 'medium' ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200' :
                'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-200';

              const iconColor = 
                alert.severity === 'high' ? 'text-red-600 dark:text-red-400' :
                alert.severity === 'medium' ? 'text-amber-600 dark:text-amber-400' :
                'text-blue-600 dark:text-blue-400';

              return (
                <div key={idx} className={`p-3 rounded-lg border ${severityBg} flex items-start gap-2.5`}>
                  <IconComp className={`h-4 w-4 shrink-0 mt-0.5 ${iconColor}`} />
                  <div>
                    <h5 className="text-xs font-bold">{alert.title}</h5>
                    <p className="text-[11px] opacity-90 mt-0.5 leading-snug">{alert.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Specific Checklisted Advisories */}
          {latestLog.safetyAdvisories && latestLog.safetyAdvisories.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {latestLog.safetyAdvisories.map((adv, idx) => (
                <span 
                  key={idx} 
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-[11px] font-medium border border-slate-200/80 dark:border-slate-700"
                >
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  {adv}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Activity Impact Assessment Table */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <ActivityIcon className="h-3.5 w-3.5 text-[#0B5FFF]" />
              Site Activity Impact Status
            </h4>
            <span className="text-[11px] text-slate-400">
              {activities.length} total activities tracked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {activities.slice(0, 6).map((act) => {
              // Calculate risk based on discipline and current weather
              let isRisk = false;
              let riskReason = '';

              if (latestLog.windSpeed >= 25 && (act.discipline === 'Electrical' || act.name.toLowerCase().includes('ohl') || act.name.toLowerCase().includes('crane'))) {
                isRisk = true;
                riskReason = 'High Wind Hazard';
              } else if ((latestLog.condition === 'Heavy Rain' || latestLog.rainfall > 3) && (act.discipline === 'Civil' || act.name.toLowerCase().includes('earth') || act.name.toLowerCase().includes('excavation'))) {
                isRisk = true;
                riskReason = 'Rain / Mud Risk';
              } else if (latestLog.temperature >= 32 && act.status === 'In Progress') {
                isRisk = true;
                riskReason = 'Heat Rest Protocol';
              }

              const isAffectedByLog = latestLog.affectedActivityIds?.includes(act.id);

              return (
                <div 
                  key={act.id} 
                  className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between transition-colors ${
                    act.status === 'Blocked' || isAffectedByLog
                      ? 'bg-red-50/60 border-red-200 dark:bg-red-950/20 dark:border-red-900/50'
                      : isRisk 
                      ? 'bg-amber-50/60 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <span className="font-mono text-[10px] text-slate-400">{act.id}</span>
                      <h5 className="font-bold text-slate-800 dark:text-slate-100 leading-snug line-clamp-1">{act.name}</h5>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {act.discipline}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      act.status === 'Blocked' || isAffectedByLog
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                        : isRisk
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                    }`}>
                      {act.status === 'Blocked' || isAffectedByLog ? 'Delayed / Weather Hold' : isRisk ? `Caution (${riskReason})` : 'Normal Execution'}
                    </span>

                    <span className="text-[11px] font-semibold text-slate-500">
                      {act.progress}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>

      {/* MODAL 1: LOG WEATHER CONDITION */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                  <Sun className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                    {editingLog ? 'Edit Weather Condition Log' : 'Log Daily Weather Condition'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Record field observations, site impact, and active safety advisories.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsLogModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveWeatherLog} className="p-5 space-y-4 overflow-y-auto flex-1">
              
              {/* Live API Quick Sync Box */}
              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    <Sun className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Auto-Fetch Live Weather (Free Open-Meteo API)
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                    Hourly cached API integration. Enter project site location to auto-fill metrics.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="text"
                    value={liveLocationInput}
                    onChange={(e) => setLiveLocationInput(e.target.value)}
                    placeholder="City / Site Location"
                    className="px-2.5 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs w-36 focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={isFetchingLive}
                    onClick={() => handleFetchLiveWeather(liveLocationInput)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1 shrink-0"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    {isFetchingLive ? 'Fetching...' : 'Auto-Fill'}
                  </button>
                </div>
              </div>

              {/* Date & Time Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date
                  </label>
                  <input 
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Time
                  </label>
                  <input 
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none"
                  />
                </div>
              </div>

              {/* Weather Condition Grid Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Weather Condition
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {conditionsList.map((cond) => {
                    const isSelected = condition === cond;
                    return (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => setCondition(cond)}
                        className={`p-2.5 rounded-xl border text-left flex flex-col items-center justify-center gap-1 transition-all ${
                          isSelected 
                            ? 'border-[#0B5FFF] bg-blue-50/80 dark:bg-blue-900/30 text-[#0B5FFF] font-bold shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        {getWeatherIcon(cond, "h-5 w-5")}
                        <span className="text-[11px] text-center leading-tight">{cond}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Numerical Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Temperature (°C)
                  </label>
                  <input 
                    type="number"
                    step="1"
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Wind Speed (km/h)
                  </label>
                  <input 
                    type="number"
                    step="1"
                    value={windSpeed}
                    onChange={(e) => setWindSpeed(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Humidity (%)
                  </label>
                  <input 
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={humidity}
                    onChange={(e) => setHumidity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Rainfall (mm)
                  </label>
                  <input 
                    type="number"
                    step="0.1"
                    min="0"
                    value={rainfall}
                    onChange={(e) => setRainfall(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none"
                  />
                </div>
              </div>

              {/* Site Impact Level Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Operational Site Impact Level
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Normal Operations', 'Caution / Monitoring', 'Work Package Delay', 'Site Suspension'] as WeatherImpactLevel[]).map((level) => {
                    const isSel = impactLevel === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setImpactLevel(level)}
                        className={`p-2 rounded-lg border text-xs font-semibold text-center transition-all ${
                          isSel
                            ? level === 'Normal Operations' ? 'bg-emerald-100 border-emerald-500 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : level === 'Caution / Monitoring' ? 'bg-amber-100 border-amber-500 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : level === 'Work Package Delay' ? 'bg-orange-100 border-orange-500 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300'
                            : 'bg-red-100 border-red-500 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800'
                        }`}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Safety Protocol Advisories Checklist */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Active Safety Protocols & Directives
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                  {presetAdvisories.map((adv, i) => (
                    <label key={i} className="flex items-start gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700/50">
                      <input 
                        type="checkbox"
                        checked={safetyAdvisories.includes(adv)}
                        onChange={() => toggleAdvisory(adv)}
                        className="mt-0.5 rounded border-slate-300 text-[#0B5FFF] focus:ring-[#0B5FFF]"
                      />
                      <span>{adv}</span>
                    </label>
                  ))}
                </div>

                {/* Add Custom Advisory */}
                <div className="flex gap-2 mt-2">
                  <input 
                    type="text"
                    placeholder="Add custom safety directive..."
                    value={customAdvisory}
                    onChange={(e) => setCustomAdvisory(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleAddCustomAdvisory}
                    className="text-xs h-8"
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Affected Activities */}
              {activities.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Select Affected Construction Activities (Optional)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-28 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                    {activities.map((act) => (
                      <label key={act.id} className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                        <input 
                          type="checkbox"
                          checked={affectedActivityIds.includes(act.id)}
                          onChange={() => toggleActivity(act.id)}
                          className="rounded border-slate-300 text-[#0B5FFF] focus:ring-[#0B5FFF]"
                        />
                        <span className="truncate">{act.name} ({act.discipline})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Supervisor Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Supervisor Observations & Remarks
                </label>
                <textarea 
                  rows={2}
                  placeholder="Record additional site notes regarding wind gusts, ground conditions, visibility, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-[#0B5FFF] focus:outline-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsLogModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="text-xs bg-[#0B5FFF] text-white hover:bg-[#0B5FFF]/90 shadow-sm"
                >
                  {editingLog ? 'Update Weather Log' : 'Save Weather Log'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: WEATHER HISTORY & LOGS */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                    Daily Weather Log History
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Historical weather conditions logged by site managers.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content List */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {weatherLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                  <Sun className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold">No weather logs recorded yet.</p>
                  <p className="text-xs mt-1">Click "Log Weather Condition" to record site weather observations.</p>
                </div>
              ) : (
                weatherLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
                        {getWeatherIcon(log.condition, "h-6 w-6")}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                            {log.condition} ({formatTemp(log.temperature)})
                          </span>
                          {getImpactBadge(log.impactLevel)}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span>Date: <strong className="text-slate-700 dark:text-slate-200">{log.date} {log.time}</strong></span>
                          <span>Wind: <strong className="text-slate-700 dark:text-slate-200">{formatWind(log.windSpeed || 0)} {log.windDirection}</strong></span>
                          <span>Humidity: <strong className="text-slate-700 dark:text-slate-200">{log.humidity}%</strong></span>
                          <span>Rain: <strong className="text-slate-700 dark:text-slate-200">{log.rainfall}mm</strong></span>
                        </div>
                        {log.notes && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 italic">
                            "{log.notes}"
                          </p>
                        )}
                        {log.safetyAdvisories && log.safetyAdvisories.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {log.safetyAdvisories.map((adv, i) => (
                              <span key={i} className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                • {adv}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {canManage(userRole) && (
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setIsHistoryModalOpen(false);
                            handleOpenLogModal(log);
                          }}
                          className="h-8 w-8 p-0"
                          title="Edit log"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteLog(log.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                          title="Delete log"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PDF SUMMARY & EMAIL EXPORT MODAL */}
      <DailyPdfSummaryModal 
        isOpen={isPdfModalOpen} 
        onClose={() => setIsPdfModalOpen(false)} 
        defaultDate={latestLog.date}
        defaultProjectId={latestLog.projectId}
      />
    </Card>
  );
}
