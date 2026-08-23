import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '../ui';
import { AlertTriangle, Plus, ShieldCheck, CheckCircle2, ArrowLeft, HeartPulse, FileText } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { SafetyIncident } from '../../types';

interface SafetyModuleProps {
  onBack: () => void;
}

export function SafetyModule({ onBack }: SafetyModuleProps) {
  const navigate = useNavigate();
  const { safetyIncidents, addSafetyIncident, updateSafetyIncident, projects } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);

  const [formData, setFormData] = useState<{
    description: string;
    location: string;
    reportedBy: string;
    type: SafetyIncident['type'];
    priority: SafetyIncident['priority'];
  }>(() => {
    const draft = localStorage.getItem('safetyDraft');
    if (draft) {
      try {
        return JSON.parse(draft);
      } catch (e) {
        console.error('Failed to parse draft', e);
      }
    }
    return {
      description: '',
      location: '',
      reportedBy: '',
      type: 'Near Miss',
      priority: 'Low',
    };
  });

  React.useEffect(() => {
    localStorage.setItem('safetyDraft', JSON.stringify(formData));
  }, [formData]);

  const handleAddIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description) return;

    const newItem: SafetyIncident = {
      id: `HSE-${Math.floor(300 + Math.random() * 700)}`,
      projectId: projects[0]?.id || 'PRJ-001',
      title: formData.description.length > 40 ? formData.description.slice(0, 40) + '...' : formData.description,
      type: formData.type,
      description: formData.description,
      location: formData.location || 'General Site',
      reportedBy: formData.reportedBy || 'Safety Officer',
      dateReported: new Date().toISOString().split('T')[0],
      priority: formData.priority,
      status: 'Open',
    };

    addSafetyIncident(newItem);
    setIsAdding(false);
    setFormData({
      description: '',
      location: '',
      reportedBy: '',
      type: 'Near Miss',
      priority: 'Low',
    });
    localStorage.removeItem('safetyDraft');
  };

  const handleStatusChange = (id: string, newStatus: SafetyIncident['status']) => {
    const target = safetyIncidents.find(item => item.id === id);
    if (target) {
      updateSafetyIncident({ ...target, status: newStatus });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => onBack ? onBack() : (window.history.length > 1 ? navigate(-1) : navigate('/'))} className="rounded-xl" title="Go back to previous page">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Safety & HSE Management</h1>
            <p className="text-slate-500 text-sm">Report site incidents, track near misses, and monitor safety compliance.</p>
          </div>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} className="gap-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl">
          <Plus className="h-4 w-4" /> Report Incident
        </Button>
      </div>

      {isAdding && (
        <Card className="p-4 border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20">
          <form onSubmit={handleAddIncident} className="flex flex-col gap-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Submit HSE Incident / Near Miss Report</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as SafetyIncident['type'] })}
                className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
              >
                <option value="Near Miss">Near Miss</option>
                <option value="First Aid">First Aid</option>
                <option value="Property Damage">Property Damage</option>
                <option value="Lost Time Injury">Lost Time Injury</option>
              </select>

              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value as SafetyIncident['priority'] })}
                className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
              >
                <option value="Low">Severity: Low</option>
                <option value="Medium">Severity: Medium</option>
                <option value="High">Severity: High</option>
                <option value="Critical">Severity: Critical</option>
              </select>

              <input
                type="text"
                placeholder="Incident Location (e.g. Scaffolding Tower B)"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
              />

              <input
                type="text"
                placeholder="Reporter Name / ID"
                value={formData.reportedBy}
                onChange={e => setFormData({ ...formData, reportedBy: e.target.value })}
                className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
              />
            </div>

            <textarea
              placeholder="Detailed description of what occurred and corrective actions taken..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              required
              rows={3}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
            />

            <div className="flex justify-end gap-2 mt-2">
              <Button type="button" variant="outline" onClick={() => setIsAdding(false)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs">
                File Report
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Safety Scorecard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold">142 Days</div>
            <div className="text-xs text-slate-500">Zero Lost Time Days</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold">{safetyIncidents.filter(i => i.status !== 'Closed').length}</div>
            <div className="text-xs text-slate-500">Active Investigations</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30">
            <HeartPulse className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold">98.5%</div>
            <div className="text-xs text-slate-500">Toolbox Talk Attendance</div>
          </div>
        </Card>
      </div>

      {/* Incident Log */}
      <div className="flex flex-col gap-3">
        {safetyIncidents.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">
            No safety incidents reported yet.
          </Card>
        ) : (
          safetyIncidents.map(item => (
          <Card key={item.id} className="p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">{item.id}</span>
                <Badge variant={item.type === 'Near Miss' ? 'outline' : 'danger'} className="text-[10px]">
                  {item.type}
                </Badge>
                <Badge className={
                  item.priority === 'Critical' ? 'bg-rose-500 text-white' :
                  item.priority === 'High' ? 'bg-orange-500 text-white' :
                  item.priority === 'Medium' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'
                }>
                  {item.priority} Severity
                </Badge>
              </div>

              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                item.status === 'Closed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40' :
                item.status === 'Under Investigation' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40' :
                'bg-rose-100 text-rose-800 dark:bg-rose-950/40'
              }`}>
                {item.status}
              </span>
            </div>

            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.description}</p>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span>Location: {item.location}</span>
                <span>Reported by: {item.reportedBy}</span>
                <span>Date: {item.dateReported}</span>
              </div>

              {item.status !== 'Closed' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(item.id, 'Under Investigation')}
                    className="text-xs h-7 px-2"
                  >
                    Investigate
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleStatusChange(item.id, 'Closed')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-2"
                  >
                    Close Incident
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )))}
      </div>
    </div>
  );
}
