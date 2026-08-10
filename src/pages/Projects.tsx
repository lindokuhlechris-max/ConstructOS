import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, ProgressBar, Button, cn } from '../components/ui';
import { 
  Building2, 
  Calendar, 
  MapPin, 
  Users, 
  PieChart as PieChartIcon, 
  ArrowLeft, 
  TrendingUp, 
  CalendarDays, 
  Plus, 
  Trash2, 
  Edit3, 
  Clock, 
  ShieldAlert, 
  Truck, 
  CheckCircle2, 
  X, 
  Save, 
  FileCheck
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useAppContext } from '../context/AppContext';
import { LabourTracking } from '../components/LabourTracking';
import { GanttChart } from '../components/GanttChart';
import { AuditHistory } from '../components/AuditHistory';
import { ProjectForm } from '../components/ProjectForm';
import { LabourAllocationView } from '../components/LabourAllocationView';
import { ResourceAllocationView } from '../components/ResourceAllocation';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { Project } from '../types';

const COLORS = ['#0B5FFF', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF3366', '#33CC99'];

export function Projects() {
  const { 
    projects, 
    activities, 
    labourLogs, 
    workerCheckIns, 
    safetyIncidents, 
    equipment, 
    userRole, 
    addProject, 
    updateProject, 
    deleteProject 
  } = useAppContext();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  const handleAddProject = (project: Project) => {
    addProject(project);
    setIsAddingProject(false);
  };

  const handleSaveEditProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    updateProject(editingProject);
    setEditingProject(null);
  };

  const phaseDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    activities.forEach(activity => {
      distribution[activity.workPackage] = (distribution[activity.workPackage] || 0) + 1;
    });
    return Object.entries(distribution)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [activities]);

  const progressOverTime = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyStats: Record<string, { planned: number, actual: number, count: number, monthIndex: number }> = {};
    const now = new Date().getTime();

    activities.forEach(activity => {
      const d = new Date(activity.startDate);
      const monthName = months[d.getMonth()];
      
      if (!monthlyStats[monthName]) {
        monthlyStats[monthName] = { planned: 0, actual: 0, count: 0, monthIndex: d.getMonth() };
      }
      
      monthlyStats[monthName].actual += activity.progress;
      const start = d.getTime();
      const finish = new Date(activity.finishDate).getTime();
      
      let plannedProg = 0;
      if (now >= finish) {
        plannedProg = 100;
      } else if (now <= start) {
        plannedProg = 0;
      } else {
        plannedProg = Math.round(((now - start) / (finish - start)) * 100);
      }
      
      monthlyStats[monthName].planned += plannedProg;
      monthlyStats[monthName].count += 1;
    });

    return Object.entries(monthlyStats)
      .map(([month, stats]) => ({
        month,
        monthIndex: stats.monthIndex,
        Planned: stats.count > 0 ? Math.round(stats.planned / stats.count) : 0,
        Actual: stats.count > 0 ? Math.round(stats.actual / stats.count) : 0
      }))
      .sort((a, b) => a.monthIndex - b.monthIndex);
  }, [activities]);

  if (isAddingProject) {
    return (
      <div className="p-4 md:p-6 w-full h-full overflow-y-auto">
        <ProjectForm onClose={() => setIsAddingProject(false)} onSubmit={handleAddProject} />
      </div>
    );
  }

  // SELECTED PROJECT DETAIL VIEW
  if (selectedProjectId) {
    const project = projects.find(p => p.id === selectedProjectId);
    if (!project) return null;

    // Real-Time Calculated Metrics based on actual user data
    const projActivities = activities.filter(a => a.projectId === project.id);
    const calculatedProgress = projActivities.length > 0
      ? Math.round(projActivities.reduce((sum, a) => sum + a.progress, 0) / projActivities.length)
      : project.progress || 0;

    const projLabourLogs = labourLogs.filter(l => l.projectId === project.id);
    const totalLabourHours = projLabourLogs.reduce((sum, l) => sum + l.hours, 0);

    const projSafetyIncidents = safetyIncidents.filter(s => s.projectId === project.id);
    const activeIncidents = projSafetyIncidents.filter(s => s.status !== 'Resolved' && s.status !== 'Closed').length;

    const activeEquipmentCount = equipment.filter(e => e.status === 'Operating').length;
    const completedActivitiesCount = projActivities.filter(a => a.status === 'Completed').length;

    return (
      <div className="flex flex-col gap-6 p-4 md:p-6 w-full h-full overflow-y-auto">
        {/* Top Header Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-full">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedProjectId(null)} className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-mono font-bold tracking-wider text-[#0B5FFF]">{project.id}</span>
                <Badge variant={project.status === 'Completed' ? 'success' : 'default'}>{project.status}</Badge>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{project.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {userRole === 'Manager' && (
              <button
                onClick={() => setEditingProject({ ...project })}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
              >
                <Edit3 className="h-4 w-4 text-[#0B5FFF]" /> Edit Project
              </button>
            )}

            {userRole === 'Manager' && (
              <button
                onClick={() => setDeletingProjectId(project.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition-colors"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            )}
          </div>
        </div>

        {/* Real-time Calculated Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          <Card className="p-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-slate-900 dark:to-slate-800/80 border-blue-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Live Calculated Progress</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#0B5FFF]">{calculatedProgress}%</span>
              <span className="text-xs text-slate-500">({completedActivitiesCount}/{projActivities.length} Tasks Done)</span>
            </div>
            <ProgressBar value={calculatedProgress} className="h-2 mt-2" />
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-50/50 to-indigo-50/30 dark:from-slate-900 dark:to-slate-800/80 border-purple-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Labour Hours</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-purple-600">{totalLabourHours} hrs</span>
              <span className="text-xs text-slate-500">({projLabourLogs.length} Entries)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
              <Clock className="h-3 w-3 text-purple-500" /> Logged across site trades
            </p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-slate-900 dark:to-slate-800/80 border-emerald-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Active Machinery</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600">{activeEquipmentCount} Units</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
              <Truck className="h-3 w-3 text-emerald-500" /> Operational site fleet
            </p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-red-50/50 to-orange-50/30 dark:from-slate-900 dark:to-slate-800/80 border-red-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Active HSE Incidents</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${activeIncidents > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {activeIncidents} Open
              </span>
              <span className="text-xs text-slate-500">({projSafetyIncidents.length} Total)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
              <ShieldAlert className="h-3 w-3 text-red-500" /> Safety hazard status
            </p>
          </Card>
        </div>

        {/* Main Details & Labour Tracking */}
        <div className="grid gap-6 lg:grid-cols-2 w-full">
          <Card className={cn("flex flex-col border-slate-200 dark:border-slate-800", userRole === 'Worker' ? "lg:col-span-2" : "")}>
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#0B5FFF]" /> Project Specifications & Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 p-6 flex-1">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase"><Building2 className="h-4 w-4" /> Client</span>
                  <span className="font-bold text-slate-900 dark:text-white">{project.client}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase"><MapPin className="h-4 w-4" /> Location</span>
                  <span className="font-bold text-slate-900 dark:text-white">{project.location}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase"><Calendar className="h-4 w-4" /> Duration</span>
                  <span className="font-bold text-slate-900 dark:text-white">{project.startDate} to {project.finishDate}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase"><Users className="h-4 w-4" /> Lead Engineer</span>
                  <span className="font-bold text-slate-900 dark:text-white">{project.engineer}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Live Calculated Completion Rate</span>
                  <span className="font-bold text-[#0B5FFF]">{calculatedProgress}%</span>
                </div>
                <ProgressBar value={calculatedProgress} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {userRole === 'Manager' && <LabourTracking projectId={project.id} />}
        </div>

        {/* Resource and Labour Allocation Views */}
        {userRole === 'Manager' && (
          <div className="grid gap-6 lg:grid-cols-2 w-full">
            <LabourAllocationView projectId={project.id} />
            <ResourceAllocationView projectId={project.id} />
          </div>
        )}

        {/* Project Timeline */}
        <Card className="flex flex-col flex-1 border-slate-200 dark:border-slate-800 w-full">
          <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[#0B5FFF]" />
              Interactive Project Gantt Schedule & Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 min-h-[400px]">
            <GanttChart activities={activities.filter(a => a.projectId === project.id)} />
          </CardContent>
        </Card>

        {/* Audit History */}
        <AuditHistory projectId={project.id} />

        {/* EDIT PROJECT MODAL */}
        {editingProject && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg shadow-2xl border-slate-200 dark:border-slate-800">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-[#0B5FFF]" /> Edit Project Specifications
                </h3>
                <button onClick={() => setEditingProject(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEditProject} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={editingProject.name}
                    onChange={e => setEditingProject({ ...editingProject, name: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Client Name</label>
                    <input
                      type="text"
                      value={editingProject.client}
                      onChange={e => setEditingProject({ ...editingProject, client: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Lead Engineer</label>
                    <input
                      type="text"
                      value={editingProject.engineer}
                      onChange={e => setEditingProject({ ...editingProject, engineer: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Start Date</label>
                    <input
                      type="date"
                      value={editingProject.startDate}
                      onChange={e => setEditingProject({ ...editingProject, startDate: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Finish Date</label>
                    <input
                      type="date"
                      value={editingProject.finishDate}
                      onChange={e => setEditingProject({ ...editingProject, finishDate: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Site Location</label>
                  <input
                    type="text"
                    value={editingProject.location}
                    onChange={e => setEditingProject({ ...editingProject, location: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                  />
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                  <button type="button" onClick={() => setEditingProject(null)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#0B5FFF] text-white shadow-sm">Save Project</button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // PROJECTS DIRECTORY GRID VIEW
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 w-full h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Active Projects Directory</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage construction sites, progress schedules, and resource allocations.</p>
        </div>
        {userRole === 'Manager' && (
          <Button onClick={() => setIsAddingProject(true)} className="gap-2 rounded-xl bg-[#0B5FFF] hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4" /> Add Project
          </Button>
        )}
      </div>

      {/* Overview Analytics */}
      <div className="grid gap-6 md:grid-cols-2 w-full">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-[#0B5FFF]" />
              Activities by Project Phase
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={phaseDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {phaseDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#0B5FFF]" />
              Progress Over Time (Planned vs Actual)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressOverTime} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '14px', fontWeight: 500 }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Line type="monotone" dataKey="Planned" stroke="#94a3b8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="Actual" stroke="#0B5FFF" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Projects Cards Directory */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 w-full">
        {projects.map(project => {
          const projActivities = activities.filter(a => a.projectId === project.id);
          const liveProgress = projActivities.length > 0
            ? Math.round(projActivities.reduce((sum, a) => sum + a.progress, 0) / projActivities.length)
            : project.progress || 0;

          return (
            <Card 
              key={project.id} 
              className="flex flex-col cursor-pointer hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-800 transition-all border-slate-200 dark:border-slate-800" 
              onClick={() => setSelectedProjectId(project.id)}
            >
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-mono font-bold tracking-wider text-[#0B5FFF]">{project.id}</span>
                    <CardTitle className="text-xl group-hover:text-[#0B5FFF] transition-colors">{project.name}</CardTitle>
                  </div>
                  <Badge variant={project.status === 'Completed' ? 'success' : 'default'}>{project.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-6 flex-1">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5 text-slate-500 text-xs uppercase font-semibold"><Building2 className="h-4 w-4" /> Client</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{project.client}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5 text-slate-500 text-xs uppercase font-semibold"><MapPin className="h-4 w-4" /> Location</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{project.location}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5 text-slate-500 text-xs uppercase font-semibold"><Calendar className="h-4 w-4" /> Duration</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{project.startDate} to {project.finishDate}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5 text-slate-500 text-xs uppercase font-semibold"><Users className="h-4 w-4" /> Lead Engineer</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{project.engineer}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Live Calculated Completion</span>
                    <span className="font-bold text-[#0B5FFF]">{liveProgress}%</span>
                  </div>
                  <ProgressBar value={liveProgress} className="h-3" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Delete Project Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingProjectId)}
        title="Delete Project"
        itemName={projects.find(p => p.id === deletingProjectId)?.name || deletingProjectId || ''}
        message="Are you sure you want to delete this project? All associated activities, reports, and data will be permanently removed."
        onConfirm={() => {
          if (deletingProjectId) {
            deleteProject(deletingProjectId);
            if (selectedProjectId === deletingProjectId) setSelectedProjectId(null);
          }
          setDeletingProjectId(null);
        }}
        onCancel={() => setDeletingProjectId(null)}
        confirmLabel="Delete Project"
      />
    </div>
  );
}
