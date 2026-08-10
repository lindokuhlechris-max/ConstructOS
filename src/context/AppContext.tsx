import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Project, Activity, DailyReport, LabourLog, UserRole, AuditLog, ResourceAllocation, SafetyIncident, LabourAllocation, WorkerCheckIn, MaterialInventory, MaterialReceipt, MaterialUsage, CustomFieldDefinition, Employee, Equipment, EquipmentLog, Team, SafetyRequirement, SafetyPolicy, ActivitySafetyInspection, PPEMaterialItem, QAInspectionItem, UserProfile, Reminder } from '../types';

interface AppContextType {
  projects: Project[];
  activities: Activity[];
  reports: DailyReport[];
  labourLogs: LabourLog[];
  labourAllocations: LabourAllocation[];
  workerCheckIns: WorkerCheckIn[];
  auditLogs: AuditLog[];
  allocations: ResourceAllocation[];
  safetyIncidents: SafetyIncident[];
  materials: MaterialInventory[];
  materialReceipts: MaterialReceipt[];
  materialUsages: MaterialUsage[];
  customFieldDefinitions: CustomFieldDefinition[];
  employees: Employee[];
  teams: Team[];
  equipment: Equipment[];
  equipmentLogs: EquipmentLog[];
  safetyRequirements: SafetyRequirement[];
  safetyPolicies: SafetyPolicy[];
  activityInspections: ActivitySafetyInspection[];
  ppeItems: PPEMaterialItem[];
  qaInspections: QAInspectionItem[];
  userProfiles: UserProfile[];
  currentUserProfile: UserProfile;
  reminders: Reminder[];
  theme: 'light' | 'dark';
  units: 'metric' | 'imperial';
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setUnits: (units: 'metric' | 'imperial') => void;
  setCurrentUserProfile: (profile: UserProfile) => void;
  addProfile: (profile: UserProfile) => void;
  updateProfile: (profile: UserProfile) => void;
  deleteProfile: (id: string) => void;
  updateActivity: (updatedActivity: Activity) => void;
  addActivity: (newActivity: Activity) => void;
  deleteActivity: (id: string) => void;
  addReport: (newReport: DailyReport) => void;
  updateReport: (updatedReport: DailyReport) => void;
  deleteReport: (id: string) => void;
  updateProject: (updatedProject: Project) => void;
  addProject: (newProject: Project) => void;
  deleteProject: (id: string) => void;
  addLabourLog: (newLog: LabourLog) => void;
  addLabourAllocation: (newAllocation: LabourAllocation) => void;
  updateLabourAllocation: (updatedAllocation: LabourAllocation) => void;
  deleteLabourAllocation: (id: string) => void;
  addWorkerCheckIn: (newCheckIn: WorkerCheckIn) => void;
  addAuditLog: (newLog: AuditLog) => void;
  addAllocation: (newAllocation: ResourceAllocation) => void;
  updateAllocation: (updatedAllocation: ResourceAllocation) => void;
  deleteAllocation: (id: string) => void;
  addSafetyIncident: (newIncident: SafetyIncident) => void;
  updateSafetyIncident: (updatedIncident: SafetyIncident) => void;
  deleteSafetyIncident: (id: string) => void;
  addMaterialReceipt: (receipt: MaterialReceipt) => void;
  addMaterialUsage: (usage: MaterialUsage) => void;
  addMaterial: (material: MaterialInventory) => void;
  updateMaterial: (material: MaterialInventory) => void;
  deleteMaterial: (id: string) => void;
  addCustomFieldDefinition: (definition: CustomFieldDefinition) => void;
  updateCustomFieldDefinition: (definition: CustomFieldDefinition) => void;
  addEmployee: (employee: Employee) => void;
  updateEmployee: (employee: Employee) => void;
  deleteEmployee: (id: string) => void;
  addTeam: (team: Team) => void;
  updateTeam: (team: Team) => void;
  deleteTeam: (id: string) => void;
  addEquipment: (equipment: Equipment) => void;
  updateEquipment: (equipment: Equipment) => void;
  deleteEquipment: (id: string) => void;
  addEquipmentLog: (log: EquipmentLog) => void;
  addSafetyRequirement: (req: SafetyRequirement) => void;
  updateSafetyRequirement: (req: SafetyRequirement) => void;
  deleteSafetyRequirement: (id: string) => void;
  addSafetyPolicy: (policy: SafetyPolicy) => void;
  updateSafetyPolicy: (policy: SafetyPolicy) => void;
  deleteSafetyPolicy: (id: string) => void;
  addActivityInspection: (inspection: ActivitySafetyInspection) => void;
  updateActivityInspection: (inspection: ActivitySafetyInspection) => void;
  deleteActivityInspection: (id: string) => void;
  addPPEItem: (item: PPEMaterialItem) => void;
  updatePPEItem: (item: PPEMaterialItem) => void;
  deletePPEItem: (id: string) => void;
  addQAInspection: (inspection: QAInspectionItem) => void;
  updateQAInspection: (inspection: QAInspectionItem) => void;
  deleteQAInspection: (id: string) => void;
  addReminder: (reminder: Reminder) => void;
  updateReminder: (reminder: Reminder) => void;
  deleteReminder: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [labourLogs, setLabourLogs] = useState<LabourLog[]>([]);
  const [labourAllocations, setLabourAllocations] = useState<LabourAllocation[]>([]);
  const [workerCheckIns, setWorkerCheckIns] = useState<WorkerCheckIn[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [safetyIncidents, setSafetyIncidents] = useState<SafetyIncident[]>([]);
  const [allocations, setAllocations] = useState<ResourceAllocation[]>([]);
  const [userRole, setUserRole] = useState<UserRole>('Manager');
  const [materials, setMaterials] = useState<MaterialInventory[]>([]);
  const [materialReceipts, setMaterialReceipts] = useState<MaterialReceipt[]>([]);
  const [materialUsages, setMaterialUsages] = useState<MaterialUsage[]>([]);
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [equipmentLogs, setEquipmentLogs] = useState<EquipmentLog[]>([]);
  const [safetyRequirements, setSafetyRequirements] = useState<SafetyRequirement[]>([]);
  const [safetyPolicies, setSafetyPolicies] = useState<SafetyPolicy[]>([]);
  const [activityInspections, setActivityInspections] = useState<ActivitySafetyInspection[]>([]);
  const [ppeItems, setPPEItems] = useState<PPEMaterialItem[]>([]);
  const [qaInspections, setQAInspections] = useState<QAInspectionItem[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [currentUserProfile, setCurrentUserProfileState] = useState<UserProfile>({
    id: 'USR-001',
    name: 'Current User',
    role: 'Manager',
    title: 'Site Supervisor',
    email: 'user@constructos.io',
    phone: '',
    company: 'ConstructOS Engineering',
    department: 'Site Management',
    initials: 'CU',
    certifications: []
  });
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [units, setUnitsState] = useState<'metric' | 'imperial'>('metric');

  React.useEffect(() => {
    // Clear legacy browser localStorage cache containing old mock data
    try {
      localStorage.removeItem('projects');
      localStorage.removeItem('activities');
      localStorage.removeItem('reports');
      localStorage.removeItem('employees');
      localStorage.removeItem('equipment');
      localStorage.removeItem('materials');
      localStorage.removeItem('teams');
      localStorage.removeItem('safetyIncidents');
      localStorage.removeItem('safetyRequirements');
      localStorage.removeItem('safetyPolicies');
      localStorage.removeItem('qaInspections');
      localStorage.removeItem('reminders');
    } catch (e) {}

    fetch('/api/state')
      .then(res => res.json())
      .then(data => {
        setProjects(data.projects || []);
        setActivities(data.activities || []);
        setReports(data.reports || []);
        setLabourLogs(data.labourLogs || []);
        setLabourAllocations(data.labourAllocations || []);
        setWorkerCheckIns(data.workerCheckIns || []);
        setAuditLogs(data.auditLogs || []);
        setSafetyIncidents(data.safetyIncidents || []);
        setAllocations(data.allocations || []);
        setMaterials(data.materials || []);
        setMaterialReceipts(data.materialReceipts || []);
        setMaterialUsages(data.materialUsages || []);
        setCustomFieldDefinitions(data.customFieldDefinitions || []);
        setEmployees(data.employees || []);
        setEquipment(data.equipment || []);
        setEquipmentLogs(data.equipmentLogs || []);
        setSafetyRequirements(data.safetyRequirements || []);
        setSafetyPolicies(data.safetyPolicies || []);
        setActivityInspections(data.activityInspections || []);
        setPPEItems(data.ppeItems || []);
        setQAInspections(data.qaInspections || []);
        setReminders(data.reminders || []);
        setIsLoaded(true);
      })
      .catch(err => {
        console.log('Backend offline, initialized with clean state:', err);
        setIsLoaded(true);
      });
  }, []);

  React.useEffect(() => {
    localStorage.setItem('teams', JSON.stringify(teams));
  }, [teams]);

  React.useEffect(() => {
    localStorage.setItem('reminders', JSON.stringify(reminders));
  }, [reminders]);

  React.useEffect(() => {
    localStorage.setItem('materials', JSON.stringify(materials));
  }, [materials]);
  React.useEffect(() => {
    localStorage.setItem('materialReceipts', JSON.stringify(materialReceipts));
  }, [materialReceipts]);
  React.useEffect(() => {
    localStorage.setItem('materialUsages', JSON.stringify(materialUsages));
  }, [materialUsages]);
  React.useEffect(() => {
    localStorage.setItem('customFieldDefinitions', JSON.stringify(customFieldDefinitions));
  }, [customFieldDefinitions]);

  React.useEffect(() => {
    localStorage.setItem('projects', JSON.stringify(projects));
  }, [projects]);
  React.useEffect(() => {
    localStorage.setItem('activities', JSON.stringify(activities));
  }, [activities]);
  React.useEffect(() => {
    localStorage.setItem('equipment', JSON.stringify(equipment));
  }, [equipment]);
  React.useEffect(() => {
    localStorage.setItem('equipmentLogs', JSON.stringify(equipmentLogs));
  }, [equipmentLogs]);
  React.useEffect(() => {
    localStorage.setItem('safetyRequirements', JSON.stringify(safetyRequirements));
  }, [safetyRequirements]);
  React.useEffect(() => {
    localStorage.setItem('safetyPolicies', JSON.stringify(safetyPolicies));
  }, [safetyPolicies]);
  React.useEffect(() => {
    localStorage.setItem('activityInspections', JSON.stringify(activityInspections));
  }, [activityInspections]);
  React.useEffect(() => {
    localStorage.setItem('ppeItems', JSON.stringify(ppeItems));
  }, [ppeItems]);
  React.useEffect(() => {
    localStorage.setItem('qaInspections', JSON.stringify(qaInspections));
  }, [qaInspections]);
  React.useEffect(() => {
    localStorage.setItem('reports', JSON.stringify(reports));
  }, [reports]);
  React.useEffect(() => {
    localStorage.setItem('labourLogs', JSON.stringify(labourLogs));
  }, [labourLogs]);
  React.useEffect(() => {
    localStorage.setItem('labourAllocations', JSON.stringify(labourAllocations));
  }, [labourAllocations]);
  React.useEffect(() => {
    localStorage.setItem('workerCheckIns', JSON.stringify(workerCheckIns));
  }, [workerCheckIns]);
  React.useEffect(() => {
    localStorage.setItem('auditLogs', JSON.stringify(auditLogs));
  }, [auditLogs]);
  React.useEffect(() => {
    localStorage.setItem('safetyIncidents', JSON.stringify(safetyIncidents));
  }, [safetyIncidents]);
  React.useEffect(() => {
    localStorage.setItem('allocations', JSON.stringify(allocations));
  }, [allocations]);

  const syncToServer = (type: string, data: any) => {
    // This fetch request will be intercepted by the Service Worker if offline
    // and queued using workbox-background-sync to be sent when online.
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data, timestamp: new Date().toISOString() })
    }).catch(err => {
      console.log('Request queued for background sync:', err);
    });
  };

  const addAuditLog = (newLog: AuditLog) => {
    setAuditLogs(prev => [newLog, ...prev]);
    syncToServer('add_audit_log', newLog);
  };

  const updateActivity = (updatedActivity: Activity) => {
    let auditLogToAdd: AuditLog | null = null;
    
    setActivities(prev => {
      const oldActivity = prev.find(a => a.id === updatedActivity.id);
      if (oldActivity) {
        if (oldActivity.status !== updatedActivity.status) {
          auditLogToAdd = {
            id: `AL-${Math.random().toString(36).substr(2, 9)}`,
            projectId: updatedActivity.projectId,
            userId: userRole === 'Manager' ? 'Current User' : 'Current User', // Mocked user
            action: 'Status Change',
            details: `Activity "${updatedActivity.name}" status changed from ${oldActivity.status} to ${updatedActivity.status}`,
            timestamp: new Date().toISOString()
          };
        }
      }
      
      const newActivities = prev.map(a => a.id === updatedActivity.id ? updatedActivity : a);
      
      // Also update project progress
      setProjects(currentProjects => 
        currentProjects.map(p => {
          const projectActivities = newActivities.filter(a => a.projectId === p.id);
          if (projectActivities.length === 0) return p;
          
          const totalProgress = projectActivities.reduce((sum, a) => sum + a.progress, 0);
          const averageProgress = Math.round(totalProgress / projectActivities.length);
          
          return { ...p, progress: averageProgress };
        })
      );
      
      return newActivities;
    });
    
    // Side effects outside updater
    syncToServer('update_activity', updatedActivity);
    if (auditLogToAdd) {
      addAuditLog(auditLogToAdd);
    }
  };

  const addActivity = (newActivity: Activity) => {
    setActivities(prev => {
      // Prevent duplicates by checking id
      if (prev.some(a => a.id === newActivity.id)) {
        return prev.map(a => a.id === newActivity.id ? newActivity : a);
      }
      
      const newActivities = [newActivity, ...prev];
      
      // Also update project progress
      setProjects(currentProjects => 
        currentProjects.map(p => {
          const projectActivities = newActivities.filter(a => a.projectId === p.id);
          if (projectActivities.length === 0) return p;
          
          const totalProgress = projectActivities.reduce((sum, a) => sum + a.progress, 0);
          const averageProgress = Math.round(totalProgress / projectActivities.length);
          
          return { ...p, progress: averageProgress };
        })
      );
      
      return newActivities;
    });
    
    // Move side effect outside of setState updater to prevent React StrictMode double-fire
    syncToServer('add_activity', newActivity);
  };

  const deleteActivity = (id: string) => {
    syncToServer('delete_activity', { id });
    setActivities(prev => {
      const newActivities = prev.filter(a => a.id !== id);
      
      // Update project progress after deletion
      setProjects(currentProjects => 
        currentProjects.map(p => {
          const projectActivities = newActivities.filter(a => a.projectId === p.id);
          if (projectActivities.length === 0) return p;
          
          const totalProgress = projectActivities.reduce((sum, a) => sum + a.progress, 0);
          const averageProgress = Math.round(totalProgress / projectActivities.length);
          
          return { ...p, progress: averageProgress };
        })
      );
      
      return newActivities;
    });
  };

  const addReport = (newReport: DailyReport) => {
    setReports(prev => [newReport, ...prev]);
    syncToServer('add_report', newReport);
  };

  const updateReport = (updatedReport: DailyReport) => {
    setReports(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));
    syncToServer('update_report', updatedReport);
  };

  const deleteReport = (id: string) => {
    setReports(prev => prev.filter(r => r.id !== id));
    syncToServer('delete_report', { id });
  };

  const updateProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    syncToServer('update_project', updatedProject);
  };

  const addProject = (newProject: Project) => {
    setProjects(prev => [newProject, ...prev]);
    syncToServer('add_project', newProject);
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    syncToServer('delete_project', { id });
  };

  const addLabourLog = (newLog: LabourLog) => {
    setLabourLogs(prev => [newLog, ...prev]);
    syncToServer('add_labour_log', newLog);
    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: newLog.projectId,
      userId: userRole === 'Manager' ? 'Current User' : 'Current User', // Mocked user
      action: 'Labour Logged',
      details: `${newLog.hours} hours logged (${newLog.workerType}) for Activity ${newLog.activityId}`,
      timestamp: new Date().toISOString()
    });
  };

  const addLabourAllocation = (newAllocation: LabourAllocation) => {
    setLabourAllocations(prev => [newAllocation, ...prev]);
    syncToServer('add_labour_allocation', newAllocation);
  };

  const updateLabourAllocation = (updatedAllocation: LabourAllocation) => {
    setLabourAllocations(prev => prev.map(a => a.id === updatedAllocation.id ? updatedAllocation : a));
    syncToServer('update_labour_allocation', updatedAllocation);
  };

  const deleteLabourAllocation = (id: string) => {
    setLabourAllocations(prev => prev.filter(a => a.id !== id));
    syncToServer('delete_labour_allocation', { id });
  };

  const addWorkerCheckIn = (newCheckIn: WorkerCheckIn) => {
    setWorkerCheckIns(prev => [newCheckIn, ...prev]);
    syncToServer('add_worker_checkin', newCheckIn);
  };

  const addAllocation = (newAllocation: ResourceAllocation) => {
    setAllocations(prev => [newAllocation, ...prev]);
    syncToServer('add_allocation', newAllocation);
  };

  const updateAllocation = (updatedAllocation: ResourceAllocation) => {
    setAllocations(prev => prev.map(a => a.id === updatedAllocation.id ? updatedAllocation : a));
    syncToServer('update_allocation', updatedAllocation);
  };

  const deleteAllocation = (id: string) => {
    setAllocations(prev => prev.filter(a => a.id !== id));
    syncToServer('delete_allocation', { id });
  };

  const addSafetyIncident = (newIncident: SafetyIncident) => {
    setSafetyIncidents(prev => [newIncident, ...prev]);
    syncToServer('add_safety_incident', newIncident);
  };

  const updateSafetyIncident = (updatedIncident: SafetyIncident) => {
    setSafetyIncidents(prev => prev.map(i => i.id === updatedIncident.id ? updatedIncident : i));
    syncToServer('update_safety_incident', updatedIncident);
  };

  const deleteSafetyIncident = (id: string) => {
    setSafetyIncidents(prev => prev.filter(i => i.id !== id));
    syncToServer('delete_safety_incident', { id });
  };

  const addMaterialReceipt = (receipt: MaterialReceipt) => {
    setMaterialReceipts(prev => [receipt, ...prev]);
    setMaterials(prev => prev.map(m => {
      if (m.id === receipt.materialId) {
        return { ...m, receivedQuantity: m.receivedQuantity + receipt.quantity };
      }
      return m;
    }));
    syncToServer('add_material_receipt', receipt);
  };

  const addMaterialUsage = (usage: MaterialUsage) => {
    setMaterialUsages(prev => [usage, ...prev]);
    setMaterials(prev => prev.map(m => {
      if (m.id === usage.materialId) {
        return { ...m, usedQuantity: m.usedQuantity + usage.quantity };
      }
      return m;
    }));
    syncToServer('add_material_usage', usage);
  };

  const addMaterial = (material: MaterialInventory) => {
    setMaterials(prev => [material, ...prev]);
    syncToServer('add_material', material);
    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: material.projectId || projects[0]?.id || '',
      userId: userRole === 'Manager' ? 'Current User' : 'Current User',
      action: 'Material Added',
      details: `Added new material "${material.name}" (${material.id})`,
      timestamp: new Date().toISOString()
    });
  };

  const updateMaterial = (material: MaterialInventory) => {
    setMaterials(prev => prev.map(m => m.id === material.id ? material : m));
    syncToServer('update_material', material);
    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: material.projectId || projects[0]?.id || '',
      userId: userRole === 'Manager' ? 'Current User' : 'Current User',
      action: 'Material Updated',
      details: `Updated material details for "${material.name}" (${material.id})`,
      timestamp: new Date().toISOString()
    });
  };

  const deleteMaterial = (id: string) => {
    const matToDelete = materials.find(m => m.id === id);
    setMaterials(prev => prev.filter(m => m.id !== id));
    syncToServer('delete_material', { id });
    if (matToDelete) {
      addAuditLog({
        id: `AL-${Math.random().toString(36).substr(2, 9)}`,
        projectId: matToDelete.projectId || projects[0]?.id || '',
        userId: userRole === 'Manager' ? 'Current User' : 'Current User',
        action: 'Material Deleted',
        details: `Deleted material "${matToDelete.name}" (${id})`,
        timestamp: new Date().toISOString()
      });
    }
  };

  const addCustomFieldDefinition = (definition: CustomFieldDefinition) => {
    setCustomFieldDefinitions(prev => [...prev, definition]);
    syncToServer('add_custom_field', definition);
  };

  const updateCustomFieldDefinition = (definition: CustomFieldDefinition) => {
    setCustomFieldDefinitions(prev => prev.map(d => d.id === definition.id ? definition : d));
    syncToServer('update_custom_field', definition);
  };

  const addEmployee = (employee: Employee) => {
    setEmployees(prev => [employee, ...prev]);
    syncToServer('add_employee', employee);
  };

  const updateEmployee = (employee: Employee) => {
    setEmployees(prev => prev.map(e => e.id === employee.id ? employee : e));
    syncToServer('update_employee', employee);
  };

  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
    syncToServer('delete_employee', { id });
  };

  const addTeam = (newTeam: Team) => {
    setTeams(prev => [newTeam, ...prev]);
    syncToServer('add_team', newTeam);
    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: projects[0]?.id || '',
      userId: userRole === 'Manager' ? 'Current User' : 'Current User',
      action: 'Team Created',
      details: `Created team "${newTeam.name}" (${newTeam.id}) with ${newTeam.memberIds.length} members`,
      timestamp: new Date().toISOString()
    });
  };

  const updateTeam = (updatedTeam: Team) => {
    setTeams(prev => prev.map(t => t.id === updatedTeam.id ? updatedTeam : t));
    syncToServer('update_team', updatedTeam);
    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: projects[0]?.id || '',
      userId: userRole === 'Manager' ? 'Current User' : 'Current User',
      action: 'Team Updated',
      details: `Updated team "${updatedTeam.name}" (${updatedTeam.id})`,
      timestamp: new Date().toISOString()
    });
  };

  const deleteTeam = (id: string) => {
    const teamToDelete = teams.find(t => t.id === id);
    setTeams(prev => prev.filter(t => t.id !== id));
    syncToServer('delete_team', { id });
    if (teamToDelete) {
      addAuditLog({
        id: `AL-${Math.random().toString(36).substr(2, 9)}`,
        projectId: projects[0]?.id || '',
        userId: userRole === 'Manager' ? 'Current User' : 'Current User',
        action: 'Team Deleted',
        details: `Deleted team "${teamToDelete.name}" (${id})`,
        timestamp: new Date().toISOString()
      });
    }
  };

  const addEquipment = (newEq: Equipment) => {
    setEquipment(prev => [newEq, ...prev]);
    syncToServer('add_equipment', newEq);
    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: projects[0]?.id || '',
      userId: userRole === 'Manager' ? 'Current User' : 'Current User',
      action: 'Equipment Added',
      details: `Added equipment "${newEq.name}" (${newEq.id})`,
      timestamp: new Date().toISOString()
    });
  };

  const updateEquipment = (updatedEq: Equipment) => {
    setEquipment(prev => prev.map(e => e.id === updatedEq.id ? updatedEq : e));
    syncToServer('update_equipment', updatedEq);
    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: projects[0]?.id || '',
      userId: userRole === 'Manager' ? 'Current User' : 'Current User',
      action: 'Equipment Updated',
      details: `Updated equipment "${updatedEq.name}" (${updatedEq.id})`,
      timestamp: new Date().toISOString()
    });
  };

  const deleteEquipment = (id: string) => {
    const eqToDelete = equipment.find(e => e.id === id);
    setEquipment(prev => prev.filter(e => e.id !== id));
    syncToServer('delete_equipment', { id });
    if (eqToDelete) {
      addAuditLog({
        id: `AL-${Math.random().toString(36).substr(2, 9)}`,
        projectId: projects[0]?.id || '',
        userId: userRole === 'Manager' ? 'Current User' : 'Current User',
        action: 'Equipment Deleted',
        details: `Deleted equipment "${eqToDelete.name}" (${id})`,
        timestamp: new Date().toISOString()
      });
    }
  };

  const addEquipmentLog = (log: EquipmentLog) => {
    setEquipmentLogs(prev => [log, ...prev]);
    syncToServer('add_equipment_log', log);

    // Automatically update equipment details based on the log entry
    setEquipment(prev => prev.map(eq => {
      if (eq.id !== log.equipmentId) return eq;

      let updated = { ...eq };
      if (log.type === 'Hours' && log.hoursAdded) {
        const currentHours = typeof eq.engineHours === 'number' ? eq.engineHours : (parseInt(String(eq.engineHours)) || 0);
        updated.engineHours = currentHours + log.hoursAdded;
      } else if (log.type === 'Refuel' && log.fuelLevelAfter !== undefined) {
        updated.fuelLevel = log.fuelLevelAfter;
        updated.fuelColor = log.fuelLevelAfter < 25 ? 'bg-red-500' : log.fuelLevelAfter < 50 ? 'bg-amber-500' : 'bg-emerald-500';
      } else if (log.type === 'Maintenance') {
        updated.lastService = log.date.split(' ')[0] || new Date().toISOString().split('T')[0];
        if (log.setStatus) {
          updated.status = log.setStatus;
        } else if (log.notes?.toLowerCase().includes('maintenance') || log.maintenanceType?.toLowerCase().includes('repair')) {
          updated.status = 'Maintenance';
        }
      }
      syncToServer('update_equipment', updated);
      return updated;
    }));

    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: projects[0]?.id || '',
      userId: log.loggedBy || (userRole === 'Manager' ? 'Current User' : 'Current User'),
      action: `Equipment Log (${log.type})`,
      details: `${log.type} logged for equipment ${log.equipmentId}: ${log.notes || ''}`,
      timestamp: new Date().toISOString()
    });
  };

  const addSafetyRequirement = (req: SafetyRequirement) => {
    setSafetyRequirements(prev => [req, ...prev]);
    syncToServer('add_safety_requirement', req);
  };
  const updateSafetyRequirement = (req: SafetyRequirement) => {
    setSafetyRequirements(prev => prev.map(r => r.id === req.id ? req : r));
    syncToServer('update_safety_requirement', req);
  };
  const deleteSafetyRequirement = (id: string) => {
    setSafetyRequirements(prev => prev.filter(r => r.id !== id));
    syncToServer('delete_safety_requirement', { id });
  };

  const addSafetyPolicy = (policy: SafetyPolicy) => {
    setSafetyPolicies(prev => [policy, ...prev]);
    syncToServer('add_safety_policy', policy);
  };
  const updateSafetyPolicy = (policy: SafetyPolicy) => {
    setSafetyPolicies(prev => prev.map(p => p.id === policy.id ? policy : p));
    syncToServer('update_safety_policy', policy);
  };
  const deleteSafetyPolicy = (id: string) => {
    setSafetyPolicies(prev => prev.filter(p => p.id !== id));
    syncToServer('delete_safety_policy', { id });
  };

  const addActivityInspection = (inspection: ActivitySafetyInspection) => {
    setActivityInspections(prev => [inspection, ...prev]);
    syncToServer('add_activity_inspection', inspection);
  };
  const updateActivityInspection = (inspection: ActivitySafetyInspection) => {
    setActivityInspections(prev => prev.map(i => i.id === inspection.id ? inspection : i));
    syncToServer('update_activity_inspection', inspection);
  };
  const deleteActivityInspection = (id: string) => {
    setActivityInspections(prev => prev.filter(i => i.id !== id));
    syncToServer('delete_activity_inspection', { id });
  };

  const addPPEItem = (item: PPEMaterialItem) => {
    setPPEItems(prev => [item, ...prev]);
    syncToServer('add_ppe_item', item);
  };
  const updatePPEItem = (item: PPEMaterialItem) => {
    setPPEItems(prev => prev.map(i => i.id === item.id ? item : i));
    syncToServer('update_ppe_item', item);
  };
  const deletePPEItem = (id: string) => {
    setPPEItems(prev => prev.filter(i => i.id !== id));
    syncToServer('delete_ppe_item', { id });
  };

  const addQAInspection = (inspection: QAInspectionItem) => {
    setQAInspections(prev => [inspection, ...prev]);
    syncToServer('add_qa_inspection', inspection);
  };
  const updateQAInspection = (inspection: QAInspectionItem) => {
    setQAInspections(prev => prev.map(i => i.id === inspection.id ? inspection : i));
    syncToServer('update_qa_inspection', inspection);
  };
  const deleteQAInspection = (id: string) => {
    setQAInspections(prev => prev.filter(i => i.id !== id));
    syncToServer('delete_qa_inspection', { id });
  };

  const addReminder = (reminder: Reminder) => {
    setReminders(prev => [reminder, ...prev]);
  };

  const updateReminder = (reminder: Reminder) => {
    setReminders(prev => prev.map(r => r.id === reminder.id ? reminder : r));
  };

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const setUnits = (newUnits: 'metric' | 'imperial') => {
    setUnitsState(newUnits);
    localStorage.setItem('units', newUnits);
  };

  const setCurrentUserProfile = (profile: UserProfile) => {
    setCurrentUserProfileState(profile);
    setUserRole(profile.role);
    localStorage.setItem('currentUserProfile', JSON.stringify(profile));
  };

  const addProfile = (profile: UserProfile) => {
    setUserProfiles(prev => [profile, ...prev]);
    localStorage.setItem('userProfiles', JSON.stringify([profile, ...userProfiles]));
  };

  const updateProfile = (profile: UserProfile) => {
    setUserProfiles(prev => prev.map(p => p.id === profile.id ? profile : p));
    if (currentUserProfile.id === profile.id) {
      setCurrentUserProfileState(profile);
      setUserRole(profile.role);
    }
  };

  const deleteProfile = (id: string) => {
    setUserProfiles(prev => prev.filter(p => p.id !== id));
  };

  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  if (!isLoaded) {
    return <div className="flex h-screen items-center justify-center text-slate-500">Loading backend...</div>;
  }

  return (
    <AppContext.Provider value={{ 
      projects, activities, reports, labourLogs, labourAllocations, workerCheckIns, auditLogs, allocations, safetyIncidents, materials, materialReceipts, materialUsages, customFieldDefinitions, employees, teams, equipment, equipmentLogs, 
      safetyRequirements, safetyPolicies, activityInspections, ppeItems, qaInspections, reminders, userProfiles, currentUserProfile, theme, units, userRole, 
      setUserRole, setTheme, setUnits, setCurrentUserProfile, addProfile, updateProfile, deleteProfile,
      updateActivity, addActivity, deleteActivity, addReport, updateReport, deleteReport, updateProject, addProject, deleteProject,
      addLabourLog, addLabourAllocation, updateLabourAllocation, deleteLabourAllocation, addWorkerCheckIn, addAuditLog, addAllocation, updateAllocation, deleteAllocation,
      addSafetyIncident, updateSafetyIncident, deleteSafetyIncident, addMaterialReceipt, addMaterialUsage, addMaterial, updateMaterial, deleteMaterial,
      addCustomFieldDefinition, updateCustomFieldDefinition, addEmployee, updateEmployee, deleteEmployee, addTeam, updateTeam, deleteTeam,
      addEquipment, updateEquipment, deleteEquipment, addEquipmentLog,
      addSafetyRequirement, updateSafetyRequirement, deleteSafetyRequirement,
      addSafetyPolicy, updateSafetyPolicy, deleteSafetyPolicy,
      addActivityInspection, updateActivityInspection, deleteActivityInspection,
      addPPEItem, updatePPEItem, deletePPEItem,
      addQAInspection, updateQAInspection, deleteQAInspection,
      addReminder, updateReminder, deleteReminder
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
