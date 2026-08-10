import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, ProgressBar, Badge } from '../components/ui';
import { KPIGrid, KPIMetric } from '../components/KPIGrid';
import { Activity, AlertTriangle, CheckCircle2, Clock, HardHat, TrendingUp, Truck } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import { useAppContext } from '../context/AppContext';
import { ResourceDemandForecast } from '../components/ResourceDemandForecast';

import { SiteCheckIn } from '../components/SiteCheckIn';
import { Activity as ActivityType } from '../types';
import { ActivityDetail } from '../components/ActivityDetail';
import { KPIDetailScreen } from '../components/KPIDetailScreen';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

export function Dashboard() {
  const { projects, activities, reports, equipment, workerCheckIns, labourLogs, userRole, updateActivity, deleteActivity } = useAppContext();
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null);
  const [selectedKpi, setSelectedKpi] = useState<KPIMetric | null>(null);
  const [deletingActivityId, setDeletingActivityId] = useState<string | null>(null);
  
  const currentProject = projects[0];
  const activeActivities = activities.filter(a => a.status === 'In Progress');
  const delayedActivities = activities.filter(a => a.status === 'Blocked' || a.status === 'Delayed');
  const completedActivitiesCount = activities.filter(a => a.status === 'Completed').length;
  
  // Calculate dynamic metrics
  const overallProgressVal = currentProject?.progress !== undefined 
    ? currentProject.progress 
    : (activities.length > 0 ? Math.round(activities.reduce((acc, a) => acc + (a.progress || 0), 0) / activities.length) : 0);

  const activeWorkersCount = reports[0]?.workersOnSite !== undefined 
    ? reports[0].workersOnSite 
    : (workerCheckIns ? workerCheckIns.filter(w => w.status === 'Checked In').length : 0);
  
  const yesterdayWorkersCount = reports[1]?.workersOnSite || 0;
  const workerDiff = activeWorkersCount - yesterdayWorkersCount;
  const workerSubtext = workerDiff > 0 ? `+${workerDiff} vs yesterday` : workerDiff < 0 ? `${workerDiff} vs yesterday` : `0 vs yesterday`;

  const totalEquip = equipment ? equipment.length : 0;
  const operatingEquip = equipment ? equipment.filter(e => e.status === 'Operating').length : 0;
  const runningEquipCount = reports[0]?.equipmentRunning !== undefined ? reports[0].equipmentRunning : operatingEquip;
  const utilRate = totalEquip > 0 ? Math.round((operatingEquip / totalEquip) * 100) : 0;

  const criticalDelayedCount = delayedActivities.filter(a => a.priority === 'Critical' || a.priority === 'High').length;

  // Dynamic Weekly Progress Chart Data
  const chartData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    if (activities.length === 0 && reports.length === 0) {
      return days.map(d => ({ name: d, progress: 0, planned: 0 }));
    }

    const overallAvg = activities.length > 0
      ? Math.round(activities.reduce((acc, a) => acc + (a.progress || 0), 0) / activities.length)
      : (reports[0]?.overallProgress || 0);

    return days.map((d, index) => {
      const scale = (index + 1) / 7;
      const prog = Math.round(overallAvg * scale);
      return {
        name: d,
        progress: prog,
        planned: Math.min(100, Math.round(prog * 1.05))
      };
    });
  }, [activities, reports]);

  // Dynamic Labor Hour Distribution Data
  const laborData = useMemo(() => {
    const hoursByDisc: Record<string, number> = {};

    if (labourLogs && labourLogs.length > 0) {
      labourLogs.forEach(log => {
        const act = activities.find(a => a.id === log.activityId);
        const disc = act?.discipline || log.workerType || 'General';
        hoursByDisc[disc] = (hoursByDisc[disc] || 0) + (log.hours || 0);
      });
    } else if (activities.length > 0) {
      activities.forEach(act => {
        const disc = act.discipline || 'Civil';
        const hours = (act.progress || 10) * 4;
        hoursByDisc[disc] = (hoursByDisc[disc] || 0) + hours;
      });
    }

    const result = Object.entries(hoursByDisc).map(([name, hours]) => ({ name, hours }));
    if (result.length === 0) {
      return [{ name: 'No Labor Data', hours: 0 }];
    }
    return result;
  }, [labourLogs, activities]);
  
  const COLORS = ['#0B5FFF', '#F9A825', '#2E7D32', '#D32F2F'];

  const kpiMetrics: KPIMetric[] = [
    {
      id: 'overall-progress',
      label: 'Overall Progress',
      value: `${overallProgressVal}%`,
      icon: TrendingUp,
      iconColor: 'text-[#0B5FFF]',
      iconBgColor: 'bg-blue-50 dark:bg-blue-900/30',
      trend: {
        value: currentProject?.finishDate ? `Target: ${currentProject.finishDate}` : 'Tracked Live',
        color: 'text-[#0B5FFF]',
      },
    },
    {
      id: 'activities-complete',
      label: 'Activities Complete',
      value: completedActivitiesCount,
      subtext: `${activities.length} Total Tasks`,
      subtextColor: 'text-[#2E7D32] font-semibold',
      icon: CheckCircle2,
      iconColor: 'text-[#2E7D32]',
      iconBgColor: 'bg-green-50 dark:bg-green-900/30',
    },
    {
      id: 'workers-on-site',
      label: 'Workers on Site',
      value: activeWorkersCount,
      subtext: workerSubtext,
      subtextColor: 'text-[#2E7D32] font-semibold',
      icon: HardHat,
      iconColor: 'text-[#F9A825]',
      iconBgColor: 'bg-amber-50 dark:bg-amber-900/30',
    },
    {
      id: 'equipment-running',
      label: 'Equipment Running',
      value: `${runningEquipCount} units`,
      subtext: `${utilRate}% Utilization`,
      subtextColor: 'text-[#0B5FFF] font-semibold',
      icon: Truck,
      iconColor: 'text-[#0B5FFF]',
      iconBgColor: 'bg-blue-50 dark:bg-blue-900/30',
    },
    {
      id: 'activities-delayed',
      label: 'Activities Delayed',
      value: delayedActivities.length,
      subtext: `${criticalDelayedCount} Critical Path`,
      subtextColor: 'text-[#D32F2F] font-semibold',
      icon: AlertTriangle,
      iconColor: 'text-[#D32F2F]',
      iconBgColor: 'bg-red-50 dark:bg-red-900/30',
    },
  ];

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

  const handleSaveActivity = (updated: ActivityType) => {
    if (updateActivity) {
        updateActivity(updated);
    }
    setSelectedActivity(updated);
  };

  if (selectedActivity) {
    return (
      <div className="p-4 h-full overflow-y-auto">
        <ActivityDetail
          activity={selectedActivity}
          onSave={handleSaveActivity}
          onClose={() => setSelectedActivity(null)}
          onDelete={userRole === 'Manager' ? handleDeleteActivity : undefined}
        />
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

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4 min-h-0 w-full h-full relative">
      {selectedKpi && (
        <KPIDetailScreen 
          metric={selectedKpi} 
          onClose={() => setSelectedKpi(null)} 
          onSelectActivity={(act) => setSelectedActivity(act)}
        />
      )}
      {/* Left Column: Dashboards & Activities */}
      <div className="flex-[3] flex flex-col gap-4 min-h-0 overflow-y-auto lg:overflow-hidden">
        {/* KPI Row */}
        <KPIGrid metrics={kpiMetrics} onMetricClick={(metric) => setSelectedKpi(metric)} />

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 shrink-0">
          {/* Weekly Progress Chart */}
          <Card className="flex flex-col h-[300px]">
            <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <CardTitle className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Weekly Activity Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-4 pb-0 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0B5FFF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0B5FFF" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                  <Area type="monotone" dataKey="planned" name="Planned" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#colorPlanned)" />
                  <Area type="monotone" dataKey="progress" name="Actual Progress" stroke="#0B5FFF" strokeWidth={2} fillOpacity={1} fill="url(#colorProgress)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Labor Hour Distribution */}
          <Card className="flex flex-col h-[300px]">
            <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <CardTitle className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Labor Hour Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-4 pb-0 min-h-0 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={laborData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="hours"
                  >
                    {laborData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} hrs`, 'Labor']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Activity Tracker Table Section */}
        <Card className="flex flex-col min-h-[300px] flex-1 overflow-hidden">
          <div className="p-3 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center shrink-0">
            <h2 className="font-bold text-gray-700 dark:text-slate-200">Current Activities</h2>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-[#F5F7FA] dark:bg-slate-800 rounded-md text-xs font-bold border border-gray-200 dark:border-slate-700 cursor-pointer">Filter</span>
              <span className="px-3 py-1 bg-[#F5F7FA] dark:bg-slate-800 rounded-md text-xs font-bold border border-gray-200 dark:border-slate-700 cursor-pointer">Sort</span>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[600px]">
              <thead className="bg-gray-50 dark:bg-slate-800/50 sticky top-0 z-10">
                <tr className="text-[11px] uppercase text-gray-500 font-bold">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Activity Name</th>
                  <th className="px-4 py-3">Discipline</th>
                  <th className="px-4 py-3">Qty / Unit</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                {activities.map(activity => {
                  const getStatusColor = (status: string) => {
                    if (status === 'Completed') return 'text-[#2E7D32]';
                    if (status === 'In Progress') return 'text-[#0B5FFF]';
                    if (status === 'Blocked') return 'text-[#D32F2F]';
                    return 'text-[#F9A825]';
                  };
                  const getStatusBgColor = (status: string) => {
                    if (status === 'Completed') return 'bg-[#2E7D32]';
                    if (status === 'In Progress') return 'bg-[#0B5FFF]';
                    if (status === 'Blocked') return 'bg-[#D32F2F]';
                    return 'bg-[#F9A825]';
                  };
                  
                  return (
                    <tr 
                      key={activity.id} 
                      className="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedActivity(activity)}
                    >
                      <td className="px-4 py-3 font-mono text-xs">{activity.id}</td>
                      <td className="px-4 py-3 font-semibold">{activity.name}</td>
                      <td className="px-4 py-3">
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{activity.discipline}</span>
                      </td>
                      <td className="px-4 py-3 text-xs">{activity.actualQuantity} / {activity.targetQuantity} {activity.unit}</td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1.5 font-bold ${getStatusColor(activity.status)}`}>
                          <div className={`w-2 h-2 rounded-full ${getStatusBgColor(activity.status)}`}></div>
                          {activity.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold">{activity.progress}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Right Column: Health & AI */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        {userRole === 'Worker' && (
          <SiteCheckIn />
        )}

        {/* Project Health Circle */}
        <Card className="p-5 text-center shrink-0">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Project Health</h3>
          <div className="relative inline-flex items-center justify-center mb-2">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="58" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="10" fill="transparent" />
              <circle cx="64" cy="64" r="58" stroke="#0B5FFF" strokeWidth="10" fill="transparent" strokeDasharray="364" strokeDashoffset={364 - (364 * (currentProject?.progress || 0)) / 100} strokeLinecap="round" />
            </svg>
            <div className="absolute flex flex-col">
              <span className="text-3xl font-black">{currentProject?.progress || 0}%</span>
              <span className="text-[10px] font-bold text-gray-400">TOTAL</span>
            </div>
          </div>
          <p className="text-sm font-bold text-[#2E7D32]">On Schedule</p>
        </Card>

        {/* Resource Demand Forecast */}
        <ResourceDemandForecast />
      </div>
    </div>
  );
}
