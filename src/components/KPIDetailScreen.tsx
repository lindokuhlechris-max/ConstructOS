import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { KPIMetric } from './KPIGrid';
import { Card, CardContent, Badge, Button } from './ui';
import { X, Users, HardHat, TrendingUp, AlertTriangle, Truck, CheckCircle2, ChevronRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Activity } from '../types';

interface KPIDetailScreenProps {
  metric: KPIMetric;
  onClose: () => void;
  onSelectActivity?: (activity: Activity) => void;
}

export function KPIDetailScreen({ metric, onClose, onSelectActivity }: KPIDetailScreenProps) {
  const { activities, equipment, employees, teams } = useAppContext();
  const navigate = useNavigate();
  
  // Real Discipline Progress Data
  const disciplineProgress = useMemo(() => {
    const discMap: Record<string, { total: number; count: number }> = {};
    activities.forEach(a => {
      const disc = a.discipline || 'General';
      if (!discMap[disc]) discMap[disc] = { total: 0, count: 0 };
      discMap[disc].total += (a.progress || 0);
      discMap[disc].count += 1;
    });
    return Object.entries(discMap).map(([name, stat]) => ({
      name,
      progress: Math.round(stat.total / stat.count)
    }));
  }, [activities]);

  // Real Trade Distribution Data
  const tradeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    employees.forEach(emp => {
      const role = emp.role || 'General Labour';
      counts[role] = (counts[role] || 0) + 1;
    });
    return Object.entries(counts).map(([trade, count]) => ({ trade, count }));
  }, [employees]);

  const handleActivityClick = (act: Activity) => {
    onClose();
    if (onSelectActivity) {
      onSelectActivity(act);
    } else {
      navigate('/activities');
    }
  };

  const handleEquipmentClick = () => {
    onClose();
    navigate('/equipment');
  };

  const handleEmployeeClick = () => {
    onClose();
    navigate('/employees');
  };

  const handleDisciplineClick = () => {
    onClose();
    navigate('/activities');
  };

  const renderDetailContent = () => {
    switch (metric.id) {
      case 'overall-progress':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600 dark:text-slate-300">Detailed breakdown of overall project progress across disciplines.</p>
              <button 
                onClick={handleDisciplineClick} 
                className="text-xs font-semibold text-[#0B5FFF] hover:underline flex items-center gap-1 shrink-0"
              >
                View All Activities <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            {disciplineProgress.length === 0 ? (
              <div className="text-center py-12 text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                No active activities or disciplines found.
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={disciplineProgress} onClick={handleDisciplineClick} className="cursor-pointer">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="progress" fill="#0B5FFF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        );

      case 'activities-complete':
        const completed = activities.filter(a => a.status === 'Completed');
        return (
          <div className="space-y-6">
            <p className="text-sm text-slate-600 dark:text-slate-300">Recently completed tasks on site. Click any task to inspect details.</p>
            <div className="space-y-2">
              {completed.map(act => (
                <div 
                  key={act.id} 
                  onClick={() => handleActivityClick(act)}
                  className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-[#0B5FFF] dark:hover:border-[#0B5FFF] hover:shadow-md cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[#0B5FFF] transition-colors">{act.name}</p>
                      <p className="text-xs text-slate-500">{act.id} • {act.discipline}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-900/30 dark:border-green-800">Done</Badge>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#0B5FFF] transition-colors" />
                  </div>
                </div>
              ))}
              {completed.length === 0 && (
                <div className="text-center py-8 text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  No completed activities yet.
                </div>
              )}
            </div>
          </div>
        );

      case 'workers-on-site':
        return (
          <div className="space-y-6">
            <p className="text-sm text-slate-600 dark:text-slate-300">Current personnel actively checked in on site today. Click to manage site directory.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card 
                onClick={handleEmployeeClick}
                className="shadow-none border-slate-200 dark:border-slate-700 hover:border-[#0B5FFF] hover:shadow-md cursor-pointer transition-all group"
              >
                <CardContent className="p-4 flex flex-col items-center justify-center py-8">
                  <HardHat className="h-8 w-8 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="text-2xl font-bold">{metric.value}</h3>
                  <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Total Active Workers</p>
                </CardContent>
              </Card>
              <Card 
                onClick={handleEmployeeClick}
                className="shadow-none border-slate-200 dark:border-slate-700 hover:border-[#0B5FFF] hover:shadow-md cursor-pointer transition-all group"
              >
                <CardContent className="p-4 flex flex-col items-center justify-center py-8">
                  <Users className="h-8 w-8 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="text-2xl font-bold">{teams ? teams.length : 0}</h3>
                  <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Active Teams / Crews</p>
                </CardContent>
              </Card>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">Labour Distribution</h4>
                <button 
                  onClick={handleEmployeeClick}
                  className="text-xs font-semibold text-[#0B5FFF] hover:underline flex items-center gap-1"
                >
                  Open Personnel Directory <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
              {tradeDistribution.length === 0 ? (
                <div className="text-center py-6 text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs">
                  No personnel or team members registered.
                </div>
              ) : (
                <div className="space-y-2">
                  {tradeDistribution.map(trade => (
                    <div 
                      key={trade.trade} 
                      onClick={handleEmployeeClick}
                      className="flex justify-between items-center text-sm p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/80 cursor-pointer transition-colors"
                    >
                      <span className="font-medium text-slate-700 dark:text-slate-300">{trade.trade}</span>
                      <span className="font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">{trade.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'equipment-running':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600 dark:text-slate-300">Live heavy machinery status. Click any machinery item to view full tracking details.</p>
              <button 
                onClick={handleEquipmentClick}
                className="text-xs font-semibold text-[#0B5FFF] hover:underline flex items-center gap-1 shrink-0"
              >
                Open Equipment Module <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            {equipment.length === 0 ? (
              <div className="text-center py-8 text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                No heavy machinery or equipment registered.
              </div>
            ) : (
              <div className="space-y-2">
                {equipment.map(eq => (
                  <div 
                    key={eq.id} 
                    onClick={handleEquipmentClick}
                    className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-[#0B5FFF] dark:hover:border-[#0B5FFF] hover:shadow-md cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Truck className="h-5 w-5 text-slate-400 group-hover:text-[#0B5FFF] transition-colors" />
                      <div>
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[#0B5FFF] transition-colors">{eq.name}</span>
                        <p className="text-xs text-slate-500">{eq.type || eq.category || eq.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={eq.status === 'Operating' ? 'default' : 'secondary'} className={eq.status === 'Operating' ? 'bg-blue-100 text-blue-700' : ''}>
                        {eq.status}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#0B5FFF] transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'activities-delayed':
        const delayed = activities.filter(a => a.status === 'Blocked' || a.status === 'Delayed');
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-900/30">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm font-semibold">Immediate attention required to resolve blockers. Click a task to open details.</span>
            </div>
            <div className="space-y-3">
              {delayed.map(act => (
                <div 
                  key={act.id} 
                  onClick={() => handleActivityClick(act)}
                  className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900 shadow-sm flex flex-col gap-3 hover:border-red-400 cursor-pointer transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-red-600 transition-colors">{act.name}</h4>
                      <p className="text-xs text-slate-500">{act.id}</p>
                    </div>
                    <Badge variant="danger" className="uppercase text-[10px] font-bold">Blocked</Badge>
                  </div>
                  <div className="text-sm text-slate-700 dark:text-slate-300 bg-red-50/50 dark:bg-red-950/20 p-2 rounded-md border border-red-100 dark:border-red-900/50">
                    <span className="font-bold">Constraint:</span> {act.constraints?.[0] || 'Unknown blocker'}
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" className="text-xs h-7 bg-red-600 hover:bg-red-700 text-white gap-1">
                      Inspect & Resolve <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {delayed.length === 0 && (
                <div className="text-center py-8 text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  No delayed or blocked activities.
                </div>
              )}
            </div>
          </div>
        );

      default:
        return <p className="text-sm text-slate-500">More details coming soon.</p>;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl rounded-2xl overflow-hidden border-0 flex flex-col max-h-[90vh]">
        <div className="bg-slate-50 dark:bg-slate-800/80 p-6 flex justify-between items-start border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${metric.iconBgColor || 'bg-blue-100'}`}>
              {metric.icon && React.isValidElement(metric.icon) 
                ? metric.icon 
                : metric.icon && React.createElement(metric.icon as any, { className: `h-6 w-6 ${metric.iconColor || 'text-blue-600'}` })}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">{metric.value}</h2>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{metric.label}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <CardContent className="p-6 overflow-y-auto min-h-0">
          {renderDetailContent()}
        </CardContent>
      </Card>
    </div>
  );
}
