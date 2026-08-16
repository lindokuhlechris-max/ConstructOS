import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Project, Activity, DailyReport, LabourLog, UserRole, AuditLog, ResourceAllocation, SafetyIncident, LabourAllocation, WorkerCheckIn, MaterialInventory, MaterialReceipt, MaterialUsage, CustomFieldDefinition, Employee, Equipment, EquipmentLog, Team, SafetyRequirement, SafetyPolicy, ActivitySafetyInspection, PPEMaterialItem, QAInspectionItem, UserProfile, Reminder, WeatherLog, SyncConflict, AccessRequest, SiteInspectionPhoto, DocumentItem, DEFAULT_SECTION_PERMISSIONS, ProjectSectionPermissions, canUserEditSection } from '../types';
import { subscribeToFirestoreState, saveFirestoreKey, onSyncStatusChange, saveFullFirestoreState } from '../lib/firestoreService';
import { triggerNotification } from '../lib/reminderNotificationService';
import { SyncNotificationToast, SyncToastState } from '../components/SyncNotificationToast';
import { sanitizeDocumentMetadata, deleteDocumentFile } from '../lib/documentStorage';

interface AppContextType {
  projects: Project[];
  activities: Activity[];
  reports: DailyReport[];
  weatherLogs: WeatherLog[];
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
  siteInspectionPhotos: SiteInspectionPhoto[];
  ppeItems: PPEMaterialItem[];
  qaInspections: QAInspectionItem[];
  userProfiles: UserProfile[];
  currentUserProfile: UserProfile;
  hasPermission: (section: keyof ProjectSectionPermissions) => boolean;
  reminders: Reminder[];
  theme: 'light' | 'dark';
  units: 'metric' | 'imperial';
  currency: import('../types').CurrencyCode;
  userRole: UserRole;

  // Authentication & Admission Control State
  isAuthenticated: boolean;
  login: (email: string, password?: string) => { success: boolean; message?: string };
  loginWithProfile: (profileId: string) => { success: boolean; message?: string };
  logout: () => void;
  accessRequests: AccessRequest[];
  addAccessRequest: (req: Omit<AccessRequest, 'id' | 'timestamp' | 'status'>) => void;
  approveAccessRequest: (reqId: string) => void;
  rejectAccessRequest: (reqId: string) => void;

  isSyncing: boolean;
  isOffline: boolean;
  lastSyncedAt: Date | null;
  syncToast: SyncToastState;
  syncConflict: SyncConflict | null;
  isManualSyncMode: boolean;
  setIsManualSyncMode: (manual: boolean) => void;
  hasPendingChanges: boolean;
  pendingChangesCount: number;
  setSyncConflict: (conflict: SyncConflict | null) => void;
  resolveSyncConflict: (resolution: 'local' | 'server') => void;
  triggerSyncToast: (message?: string, type?: 'syncing' | 'warning' | 'success' | 'offline') => void;
  hideSyncToast: () => void;
  forceSyncAll: () => Promise<void>;

  setUserRole: (role: UserRole) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setUnits: (units: 'metric' | 'imperial') => void;
  setCurrency: (curr: import('../types').CurrencyCode) => void;
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
  updateLabourLog: (log: LabourLog) => void;
  deleteLabourLog: (id: string) => void;
  addLabourAllocation: (newAllocation: LabourAllocation) => void;
  updateLabourAllocation: (updatedAllocation: LabourAllocation) => void;
  deleteLabourAllocation: (id: string) => void;
  addWorkerCheckIn: (newCheckIn: WorkerCheckIn) => void;
  deleteWorkerCheckIn: (id: string) => void;
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
  addMaterials: (materials: MaterialInventory[]) => void;
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
  deleteEquipmentLog: (id: string) => void;
  addSafetyRequirement: (req: SafetyRequirement) => void;
  updateSafetyRequirement: (req: SafetyRequirement) => void;
  deleteSafetyRequirement: (id: string) => void;
  addSafetyPolicy: (policy: SafetyPolicy) => void;
  updateSafetyPolicy: (policy: SafetyPolicy) => void;
  deleteSafetyPolicy: (id: string) => void;
  addActivityInspection: (inspection: ActivitySafetyInspection) => void;
  updateActivityInspection: (inspection: ActivitySafetyInspection) => void;
  deleteActivityInspection: (id: string) => void;
  addSiteInspectionPhoto: (photo: SiteInspectionPhoto) => void;
  deleteSiteInspectionPhoto: (id: string) => void;
  addPPEItem: (item: PPEMaterialItem) => void;
  updatePPEItem: (item: PPEMaterialItem) => void;
  deletePPEItem: (id: string) => void;
  addQAInspection: (inspection: QAInspectionItem) => void;
  updateQAInspection: (inspection: QAInspectionItem) => void;
  deleteQAInspection: (id: string) => void;
  addReminder: (reminder: Reminder) => void;
  updateReminder: (reminder: Reminder) => void;
  deleteReminder: (id: string) => void;
  addWeatherLog: (weatherLog: WeatherLog) => void;
  updateWeatherLog: (weatherLog: WeatherLog) => void;
  deleteWeatherLog: (id: string) => void;
  documents: DocumentItem[];
  addDocument: (doc: DocumentItem) => void;
  updateDocument: (doc: DocumentItem) => void;
  deleteDocument: (id: string) => void;
  assignDocumentToActivity: (docId: string, activityId?: string, activityName?: string) => void;
}

const DEFAULT_INITIAL_PROFILES: UserProfile[] = [
  {
    id: 'USR-ADMIN-01',
    name: 'Lindokuhle Chris (Admin)',
    role: 'Admin',
    title: 'Lead Administrator & Project Director',
    email: 'Lindokuhlechris@gmail.com',
    phone: '+1 (555) 019-2831',
    company: 'Constructfield Engineering',
    department: 'Executive Office',
    initials: 'LC',
    accessAllowed: true,
    permissions: {
      activities: true,
      reports: true,
      labour: true,
      materials: true,
      safety: true,
      quality: true,
      equipment: true,
      settings: true
    },
    allowedProjectIds: ['all']
  },
  {
    id: 'USR-001',
    name: 'Site Manager',
    role: 'Manager',
    title: 'Senior Site Operations Manager',
    email: 'manager@constructfield.io',
    phone: '+1 (555) 018-9201',
    company: 'Constructfield Engineering',
    department: 'Site Operations',
    initials: 'SM',
    accessAllowed: true,
    permissions: {
      activities: true,
      reports: true,
      labour: true,
      materials: true,
      safety: true,
      quality: true,
      equipment: true,
      settings: false
    },
    allowedProjectIds: ['all']
  },
  {
    id: 'USR-002',
    name: 'Field Engineer',
    role: 'Engineer',
    title: 'Civil & Structural Field Engineer',
    email: 'engineer@constructfield.io',
    phone: '+1 (555) 017-4491',
    company: 'Constructfield Engineering',
    department: 'Engineering',
    initials: 'FE',
    accessAllowed: true,
    permissions: {
      activities: true,
      reports: true,
      labour: false,
      materials: true,
      safety: true,
      quality: true,
      equipment: false,
      settings: false
    },
    allowedProjectIds: ['all']
  },
  {
    id: 'USR-003',
    name: 'QA Inspector',
    role: 'Inspector',
    title: 'Quality & Safety Lead Inspector',
    email: 'inspector@constructfield.io',
    phone: '+1 (555) 016-3382',
    company: 'Constructfield Quality Assurance',
    department: 'Quality Control',
    initials: 'QI',
    accessAllowed: true,
    permissions: {
      activities: false,
      reports: true,
      labour: false,
      materials: false,
      safety: true,
      quality: true,
      equipment: false,
      settings: false
    },
    allowedProjectIds: ['all']
  },
  {
    id: 'USR-004',
    name: 'Guest Viewer',
    role: 'Viewer',
    title: 'Client Stakeholder Representative',
    email: 'viewer@constructfield.io',
    phone: '+1 (555) 015-8821',
    company: 'Client Oversight Org',
    department: 'Supervision',
    initials: 'GV',
    accessAllowed: true,
    permissions: {
      activities: false,
      reports: true,
      labour: false,
      materials: false,
      safety: false,
      quality: false,
      equipment: false,
      settings: false
    },
    allowedProjectIds: ['all']
  }
];

const DEFAULT_SITE_INSPECTION_PHOTOS: SiteInspectionPhoto[] = [];

const DEFAULT_INITIAL_AUDIT_LOGS: AuditLog[] = [];

const DEFAULT_INITIAL_EQUIPMENT: Equipment[] = [];

const DEFAULT_INITIAL_EQUIPMENT_LOGS: EquipmentLog[] = [];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);

  React.useEffect(() => {
    import('../lib/firebase').then(({ auth }) => {
      import('firebase/auth').then(({ onAuthStateChanged }) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setFirebaseUser(user);
        });
        return () => unsubscribe();
      });
    }).catch(console.error);
  }, []);

  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [weatherLogs, setWeatherLogs] = useState<WeatherLog[]>([]);
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
  const [siteInspectionPhotos, setSiteInspectionPhotos] = useState<SiteInspectionPhoto[]>([]);
  const [ppeItems, setPPEItems] = useState<PPEMaterialItem[]>([]);
  const [qaInspections, setQAInspections] = useState<QAInspectionItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [currentUserProfile, setCurrentUserProfileState] = useState<UserProfile>({
    id: 'USR-001',
    name: 'Current User',
    role: 'Manager',
    title: 'Site Supervisor',
    email: 'user@constructfield.io',
    phone: '',
    company: 'Constructfield Engineering',
    department: 'Site Management',
    initials: 'CU',
    certifications: []
  });
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [units, setUnitsState] = useState<'metric' | 'imperial'>('metric');
  const [currency, setCurrencyState] = useState<import('../types').CurrencyCode>('ZAR');

  // Authentication & Admission State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('isAuthenticated') === 'true';
    } catch {
      return false;
    }
  });

  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>(() => {
    try {
      const saved = localStorage.getItem('accessRequests');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(new Date());
  const [syncToast, setSyncToast] = useState<SyncToastState>({ visible: false });
  const [syncConflict, setSyncConflict] = useState<SyncConflict | null>(null);
  const [isManualSyncMode, setIsManualSyncModeState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('isManualSyncMode');
      return saved !== null ? JSON.parse(saved) : false;
    } catch (_) {
      return false;
    }
  });

  const setIsManualSyncMode = (manual: boolean) => {
    setIsManualSyncModeState(manual);
    localStorage.setItem('isManualSyncMode', JSON.stringify(manual));
  };

  const [hasPendingChanges, setHasPendingChanges] = useState<boolean>(() => {
    return localStorage.getItem('hasPendingChanges') === 'true';
  });
  const [pendingChangesCount, setPendingChangesCount] = useState<number>(() => {
    const saved = localStorage.getItem('pendingChangesCount');
    return saved ? parseInt(saved, 10) : 0;
  });
  const isRemoteUpdateRef = React.useRef<boolean>(false);
  const initialMountDoneRef = React.useRef<boolean>(false);

  const resolveSyncConflict = (resolution: 'local' | 'server') => {
    if (!syncConflict) return;

    const { entityType, entityId, localVersion, serverVersion } = syncConflict;

    if (resolution === 'local') {
      if (entityType === 'Activity' || entityType === 'Activities') {
        syncToServer('update_activity', localVersion);
      } else if (entityType === 'Project' || entityType === 'Projects') {
        syncToServer('update_project', localVersion);
      } else if (entityType === 'Daily Report' || entityType === 'Reports') {
        syncToServer('update_report', localVersion);
      } else if (entityType === 'Material') {
        syncToServer('update_material', localVersion);
      }
      triggerSyncToast('Resolved sync conflict: Preserved Local Version', 'success');
    } else {
      if (entityType === 'Activity' || entityType === 'Activities') {
        setActivities(prev => prev.map(a => a.id === entityId ? (serverVersion as Activity) : a));
      } else if (entityType === 'Project' || entityType === 'Projects') {
        setProjects(prev => prev.map(p => p.id === entityId ? (serverVersion as Project) : p));
      } else if (entityType === 'Daily Report' || entityType === 'Reports') {
        setReports(prev => prev.map(r => r.id === entityId ? (serverVersion as DailyReport) : r));
      } else if (entityType === 'Material') {
        setMaterials(prev => prev.map(m => m.id === entityId ? (serverVersion as MaterialInventory) : m));
      }
      triggerSyncToast('Resolved sync conflict: Applied Server Version', 'success');
    }

    setSyncConflict(null);
  };

  const triggerSyncToast = (message?: string, type?: 'syncing' | 'warning' | 'success' | 'offline') => {
    setSyncToast({
      visible: true,
      message,
      type: type || (isSyncing ? 'syncing' : isOffline ? 'offline' : 'warning')
    });
  };

  const hideSyncToast = () => {
    setSyncToast(prev => ({ ...prev, visible: false }));
  };

  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubSync = onSyncStatusChange((status) => {
      setIsSyncing(status.isSyncing);
      if (status.lastSyncedAt) {
        setLastSyncedAt(status.lastSyncedAt);
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubSync();
    };
  }, []);

  // Warn user before navigating away or reloading if sync is active or pending
  React.useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isSyncing || (syncToast.visible && syncToast.type === 'syncing')) {
        event.preventDefault();
        event.returnValue = 'Data synchronization is currently in progress. Navigating away now may lead to un-saved changes.';
        return event.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isSyncing, syncToast]);

  const forceSyncAll = async () => {
    setIsSyncing(true);
    try {
      const fullState = {
        projects,
        activities,
        reports,
        weatherLogs,
        labourLogs,
        labourAllocations,
        workerCheckIns,
        auditLogs,
        allocations,
        safetyIncidents,
        materials,
        materialReceipts,
        materialUsages,
        customFieldDefinitions,
        employees,
        teams,
        equipment,
        equipmentLogs,
        safetyRequirements,
        safetyPolicies,
        activityInspections,
        siteInspectionPhotos,
        ppeItems,
        qaInspections,
        documents,
        userProfiles,
        reminders
      };
      await saveFullFirestoreState(fullState);
      syncToServer('sync_full_state', fullState);
      setHasPendingChanges(false);
      localStorage.setItem('hasPendingChanges', 'false');
      setPendingChangesCount(0);
      localStorage.setItem('pendingChangesCount', '0');
      setLastSyncedAt(new Date());
      triggerSyncToast('Manual Sync Complete: All changes synchronized to Cloud', 'success');
    } catch (err) {
      console.error('Manual sync failed:', err);
      triggerSyncToast('Sync Failed: Check network connection', 'warning');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const syncOrMergeCollection = React.useCallback((
    remoteData: any[] | undefined,
    setLocal: React.Dispatch<React.SetStateAction<any[]>>,
    _keyName: string
  ) => {
    if (!remoteData) return;
    setLocal(prevLocal => {
      if (Array.isArray(remoteData)) {
        const cleanRemote = remoteData.filter(Boolean);
        if (cleanRemote.length > 0) {
          return cleanRemote;
        }
        // Only keep prevLocal if we are cold booting before initial mount completes
        if (!initialMountDoneRef.current && prevLocal.length > 0) {
          return prevLocal.filter(Boolean);
        }
        return cleanRemote;
      }
      return remoteData;
    });
  }, []);

  React.useEffect(() => {
    // 1. Restore from local cache for instant zero-latency render
    try {
      const getLocal = (k: string) => {
        const val = localStorage.getItem(k);
        if (!val) return null;
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : parsed;
      };
      if (getLocal('projects')) setProjects(getLocal('projects'));
      if (getLocal('activities')) setActivities(getLocal('activities'));
      if (getLocal('reports')) setReports(getLocal('reports'));
      if (getLocal('weatherLogs')) setWeatherLogs(getLocal('weatherLogs'));
      if (getLocal('labourLogs')) setLabourLogs(getLocal('labourLogs'));
      if (getLocal('labourAllocations')) setLabourAllocations(getLocal('labourAllocations'));
      if (getLocal('workerCheckIns')) setWorkerCheckIns(getLocal('workerCheckIns'));
      const localAudit = getLocal('auditLogs');
      const cleanAudit = Array.isArray(localAudit) ? localAudit.filter((a: any) => !['AL-1001', 'AL-1002', 'AL-1003', 'AL-1004', 'AL-1005', 'AL-1006'].includes(a.id)) : [];
      setAuditLogs(cleanAudit);
      localStorage.setItem('auditLogs', JSON.stringify(cleanAudit));

      if (getLocal('safetyIncidents')) setSafetyIncidents(getLocal('safetyIncidents'));
      if (getLocal('allocations')) setAllocations(getLocal('allocations'));
      if (getLocal('materials')) setMaterials(getLocal('materials'));
      if (getLocal('materialReceipts')) setMaterialReceipts(getLocal('materialReceipts'));
      if (getLocal('materialUsages')) setMaterialUsages(getLocal('materialUsages'));
      if (getLocal('customFieldDefinitions')) setCustomFieldDefinitions(getLocal('customFieldDefinitions'));
      if (getLocal('employees')) setEmployees(getLocal('employees'));
      if (getLocal('teams')) setTeams(getLocal('teams'));

      const localEq = getLocal('equipment');
      const cleanEq = Array.isArray(localEq) ? localEq.filter((e: any) => !['EQ-101', 'EQ-102', 'EQ-103', 'EQ-104', 'EQ-105', 'EQ-106'].includes(e.id)) : [];
      setEquipment(cleanEq);
      localStorage.setItem('equipment', JSON.stringify(cleanEq));

      const localEqLogs = getLocal('equipmentLogs');
      const cleanEqLogs = Array.isArray(localEqLogs) ? localEqLogs.filter((l: any) => !['EQL-001', 'EQL-002', 'EQL-003', 'EQL-004', 'EQL-005'].includes(l.id)) : [];
      setEquipmentLogs(cleanEqLogs);
      localStorage.setItem('equipmentLogs', JSON.stringify(cleanEqLogs));

      if (getLocal('safetyRequirements')) setSafetyRequirements(getLocal('safetyRequirements'));
      if (getLocal('safetyPolicies')) setSafetyPolicies(getLocal('safetyPolicies'));
      if (getLocal('activityInspections')) setActivityInspections(getLocal('activityInspections'));

      const localPhotos = getLocal('siteInspectionPhotos');
      const cleanPhotos = Array.isArray(localPhotos) ? localPhotos.filter((p: any) => !['INSP-IMG-001', 'INSP-IMG-002', 'INSP-IMG-003'].includes(p.id)) : [];
      setSiteInspectionPhotos(cleanPhotos);
      localStorage.setItem('siteInspectionPhotos', JSON.stringify(cleanPhotos));
      if (getLocal('ppeItems')) setPPEItems(getLocal('ppeItems'));
      if (getLocal('qaInspections')) setQAInspections(getLocal('qaInspections'));
      const localDocs = getLocal('documents');
      const cleanDocs = Array.isArray(localDocs) ? localDocs.filter((d: any) => !['DOC-101', 'DOC-102', 'DOC-103', 'DOC-104', 'DOC-105', 'DOC-106', 'DOC-107', 'DOC-108', 'DOC-109', 'DOC-110'].includes(d.id)) : [];
      setDocuments(cleanDocs);
      localStorage.setItem('documents', JSON.stringify(cleanDocs));
      const localProfiles = getLocal('userProfiles');
      if (localProfiles && Array.isArray(localProfiles) && localProfiles.length > 0) {
        setUserProfiles(localProfiles);
      } else {
        setUserProfiles(DEFAULT_INITIAL_PROFILES);
        localStorage.setItem('userProfiles', JSON.stringify(DEFAULT_INITIAL_PROFILES));
      }
      if (getLocal('reminders')) setReminders(getLocal('reminders'));

      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark' || savedTheme === 'light') setThemeState(savedTheme);
      const savedUnits = localStorage.getItem('units');
      if (savedUnits === 'metric' || savedUnits === 'imperial') setUnitsState(savedUnits);
      const savedCurrency = localStorage.getItem('currency') as import('../types').CurrencyCode;
      if (savedCurrency) setCurrencyState(savedCurrency);
      const savedProfile = localStorage.getItem('currentUserProfile');
      if (savedProfile) {
        const prof = JSON.parse(savedProfile);
        setCurrentUserProfileState(prof);
        setUserRole(prof.role || 'Admin');
      } else {
        const adminProf = DEFAULT_INITIAL_PROFILES[0];
        setCurrentUserProfileState(adminProf);
        setUserRole(adminProf.role);
        localStorage.setItem('currentUserProfile', JSON.stringify(adminProf));
      }
    } catch (e) {
      console.error('Error restoring cached state:', e);
    }

    // 2. Fetch server Express database state as additional backup
    fetch('/api/state')
      .then(res => res.ok ? res.json() : null)
      .then(serverDb => {
        if (!serverDb) return;
        const mergeServer = (key: string, setter: React.Dispatch<React.SetStateAction<any[]>>) => {
          if (Array.isArray(serverDb[key]) && serverDb[key].length > 0) {
            setter(prev => prev.length === 0 ? serverDb[key] : prev);
          }
        };
        mergeServer('projects', setProjects);
        mergeServer('activities', setActivities);
        mergeServer('reports', setReports);
        mergeServer('weatherLogs', setWeatherLogs);
        mergeServer('labourLogs', setLabourLogs);
        mergeServer('labourAllocations', setLabourAllocations);
        mergeServer('workerCheckIns', setWorkerCheckIns);
        mergeServer('auditLogs', setAuditLogs);
        mergeServer('safetyIncidents', setSafetyIncidents);
        mergeServer('allocations', setAllocations);
        mergeServer('materials', setMaterials);
        mergeServer('materialReceipts', setMaterialReceipts);
        mergeServer('materialUsages', setMaterialUsages);
        mergeServer('customFieldDefinitions', setCustomFieldDefinitions);
        mergeServer('employees', setEmployees);
        mergeServer('teams', setTeams);
        mergeServer('equipment', setEquipment);
        mergeServer('equipmentLogs', setEquipmentLogs);
        mergeServer('safetyRequirements', setSafetyRequirements);
        mergeServer('safetyPolicies', setSafetyPolicies);
        mergeServer('activityInspections', setActivityInspections);
        mergeServer('ppeItems', setPPEItems);
        mergeServer('qaInspections', setQAInspections);
        mergeServer('documents', setDocuments);
        mergeServer('userProfiles', setUserProfiles);
        mergeServer('reminders', setReminders);
      })
      .catch(err => console.warn('Could not fetch server db state:', err))
      .finally(() => {
        setIsLoaded(true);
        setTimeout(() => {
          initialMountDoneRef.current = true;
        }, 800);
      });
  }, []);

  // 3. Subscribe to Firestore database ONLY IF Auto Sync mode is enabled
  React.useEffect(() => {
    if (isManualSyncMode) {
      return; // DO NOT connect or subscribe to Firestore automatically when in Manual Sync Mode
    }

    const unsubscribe = subscribeToFirestoreState((data) => {
      isRemoteUpdateRef.current = true;
      syncOrMergeCollection(data.projects, setProjects, 'projects');
      syncOrMergeCollection(data.activities, setActivities, 'activities');
      syncOrMergeCollection(data.reports, setReports, 'reports');
      syncOrMergeCollection(data.weatherLogs, setWeatherLogs, 'weatherLogs');
      syncOrMergeCollection(data.labourLogs, setLabourLogs, 'labourLogs');
      syncOrMergeCollection(data.labourAllocations, setLabourAllocations, 'labourAllocations');
      syncOrMergeCollection(data.workerCheckIns, setWorkerCheckIns, 'workerCheckIns');
      syncOrMergeCollection(data.auditLogs, setAuditLogs, 'auditLogs');
      syncOrMergeCollection(data.safetyIncidents, setSafetyIncidents, 'safetyIncidents');
      syncOrMergeCollection(data.allocations, setAllocations, 'allocations');
      syncOrMergeCollection(data.materials, setMaterials, 'materials');
      syncOrMergeCollection(data.materialReceipts, setMaterialReceipts, 'materialReceipts');
      syncOrMergeCollection(data.materialUsages, setMaterialUsages, 'materialUsages');
      syncOrMergeCollection(data.customFieldDefinitions, setCustomFieldDefinitions, 'customFieldDefinitions');
      syncOrMergeCollection(data.employees, setEmployees, 'employees');
      syncOrMergeCollection(data.teams, setTeams, 'teams');
      syncOrMergeCollection(data.equipment, setEquipment, 'equipment');
      syncOrMergeCollection(data.equipmentLogs, setEquipmentLogs, 'equipmentLogs');
      syncOrMergeCollection(data.safetyRequirements, setSafetyRequirements, 'safetyRequirements');
      syncOrMergeCollection(data.safetyPolicies, setSafetyPolicies, 'safetyPolicies');
      syncOrMergeCollection(data.activityInspections, setActivityInspections, 'activityInspections');
      syncOrMergeCollection(data.siteInspectionPhotos, setSiteInspectionPhotos, 'siteInspectionPhotos');
      syncOrMergeCollection(data.ppeItems, setPPEItems, 'ppeItems');
      syncOrMergeCollection(data.qaInspections, setQAInspections, 'qaInspections');
      syncOrMergeCollection(data.documents, setDocuments, 'documents');
      syncOrMergeCollection(data.userProfiles, setUserProfiles, 'userProfiles');
      syncOrMergeCollection(data.reminders, setReminders, 'reminders');
    });

    return () => unsubscribe();
  }, [isManualSyncMode, syncOrMergeCollection]);

  const handleLocalChange = React.useCallback((key: string, data: any) => {
    if (!isLoaded) return;
    
    // Sanitize document items to ensure no heavy base64 strings bloat localStorage or Firestore
    const dataToSave = key === 'documents' && Array.isArray(data) 
      ? data.map(item => sanitizeDocumentMetadata(item)) 
      : data;

    try {
      localStorage.setItem(key, JSON.stringify(dataToSave));
    } catch (storageErr) {
      console.warn(`localStorage save warning for key ${key}:`, storageErr);
    }

    if (!isRemoteUpdateRef.current && initialMountDoneRef.current) {
      if (isManualSyncMode) {
        setHasPendingChanges(true);
        try { localStorage.setItem('hasPendingChanges', 'true'); } catch (_) {}
        setPendingChangesCount(prev => {
          const next = prev + 1;
          try { localStorage.setItem('pendingChangesCount', String(next)); } catch (_) {}
          return next;
        });
      } else {
        saveFirestoreKey(key, dataToSave);
      }
    }
  }, [isLoaded, isManualSyncMode]);

  React.useEffect(() => { handleLocalChange('teams', teams); }, [teams, handleLocalChange]);
  React.useEffect(() => { handleLocalChange('reminders', reminders); }, [reminders, handleLocalChange]);
  React.useEffect(() => { handleLocalChange('materials', materials); }, [materials, handleLocalChange]);
  React.useEffect(() => { handleLocalChange('materialReceipts', materialReceipts); }, [materialReceipts, handleLocalChange]);
  React.useEffect(() => { handleLocalChange('materialUsages', materialUsages); }, [materialUsages, handleLocalChange]);
  React.useEffect(() => { handleLocalChange('customFieldDefinitions', customFieldDefinitions); }, [customFieldDefinitions, handleLocalChange]);
  React.useEffect(() => { handleLocalChange('projects', projects); }, [projects, handleLocalChange]);
  React.useEffect(() => { handleLocalChange('activities', activities); }, [activities, handleLocalChange]);
  React.useEffect(() => { handleLocalChange('equipment', equipment); }, [equipment, handleLocalChange]);
  React.useEffect(() => { handleLocalChange('equipmentLogs', equipmentLogs); }, [equipmentLogs, handleLocalChange]);
  React.useEffect(() => { handleLocalChange('employees', employees); }, [employees, handleLocalChange]);
  React.useEffect(() => { handleLocalChange('safetyRequirements', safetyRequirements); }, [safetyRequirements, handleLocalChange]);
  React.useEffect(() => { handleLocalChange('safetyPolicies', safetyPolicies); }, [safetyPolicies, handleLocalChange]);
  React.useEffect(() => { handleLocalChange('activityInspections', activityInspections); }, [activityInspections, handleLocalChange]);
  React.useEffect(() => { handleLocalChange('siteInspectionPhotos', siteInspectionPhotos); }, [siteInspectionPhotos, handleLocalChange]);
  React.useEffect(() => { handleLocalChange('ppeItems', ppeItems); }, [ppeItems, handleLocalChange]);
  React.useEffect(() => { handleLocalChange('qaInspections', qaInspections); }, [qaInspections, handleLocalChange]);
  React.useEffect(() => { handleLocalChange('documents', documents); }, [documents, handleLocalChange]);
  React.useEffect(() => { handleLocalChange('reports', reports); }, [reports, handleLocalChange]);
  React.useEffect(() => { handleLocalChange('weatherLogs', weatherLogs); }, [weatherLogs, handleLocalChange]);
  React.useEffect(() => { handleLocalChange('labourLogs', labourLogs); }, [labourLogs, handleLocalChange]);
  React.useEffect(() => { handleLocalChange('labourAllocations', labourAllocations); }, [labourAllocations, handleLocalChange]);
  React.useEffect(() => { handleLocalChange('workerCheckIns', workerCheckIns); }, [workerCheckIns, handleLocalChange]);
  React.useEffect(() => { handleLocalChange('auditLogs', auditLogs); }, [auditLogs, handleLocalChange]);
  React.useEffect(() => { handleLocalChange('safetyIncidents', safetyIncidents); }, [safetyIncidents, handleLocalChange]);
  React.useEffect(() => { handleLocalChange('allocations', allocations); }, [allocations, handleLocalChange]);
  React.useEffect(() => { handleLocalChange('userProfiles', userProfiles); }, [userProfiles, handleLocalChange]);

  // Reset remote update flag after render cycle completes
  React.useEffect(() => {
    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
    }
  });

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
    const today = new Date().toISOString().split('T')[0];
    
    let activityWithDates: Activity = {
      ...updatedActivity,
      updatedAt: today
    };

    setActivities(prev => {
      const oldActivity = prev.find(a => a.id === updatedActivity.id);
      if (oldActivity) {
        activityWithDates = {
          ...activityWithDates,
          createdAt: oldActivity.createdAt || activityWithDates.createdAt || oldActivity.startDate || today
        };
        if (oldActivity.status !== updatedActivity.status) {
          auditLogToAdd = {
            id: `AL-${Math.random().toString(36).substr(2, 9)}`,
            projectId: updatedActivity.projectId,
            userId: userRole === 'Manager' ? 'Site Manager' : 'Current User',
            action: 'Activity Status Change',
            details: `Activity "${updatedActivity.name}" (${updatedActivity.id}) status changed from ${oldActivity.status} to ${updatedActivity.status}`,
            entityType: 'Activity',
            entityId: updatedActivity.id,
            actionType: 'status_change',
            activityName: updatedActivity.name,
            previousValue: oldActivity.status,
            newValue: updatedActivity.status,
            timestamp: new Date().toISOString()
          };
        } else if (oldActivity.progress !== updatedActivity.progress && Math.abs((oldActivity.progress || 0) - (updatedActivity.progress || 0)) >= 5) {
          auditLogToAdd = {
            id: `AL-${Math.random().toString(36).substr(2, 9)}`,
            projectId: updatedActivity.projectId,
            userId: userRole === 'Manager' ? 'Site Manager' : 'Current User',
            action: 'Activity Progress Updated',
            details: `Activity "${updatedActivity.name}" progress updated from ${oldActivity.progress || 0}% to ${updatedActivity.progress || 0}%`,
            entityType: 'Activity',
            entityId: updatedActivity.id,
            actionType: 'update',
            activityName: updatedActivity.name,
            previousValue: `${oldActivity.progress || 0}%`,
            newValue: `${updatedActivity.progress || 0}%`,
            timestamp: new Date().toISOString()
          };
        }
      } else if (!activityWithDates.createdAt) {
        activityWithDates.createdAt = activityWithDates.startDate || today;
      }
      
      const newActivities = prev.map(a => a.id === activityWithDates.id ? activityWithDates : a);
      
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
    syncToServer('update_activity', activityWithDates);
    if (auditLogToAdd) {
      addAuditLog(auditLogToAdd);
    }
  };

  const addActivity = (newActivity: Activity) => {
    const today = new Date().toISOString().split('T')[0];
    const activityWithDates: Activity = {
      ...newActivity,
      createdAt: newActivity.createdAt || today,
      updatedAt: newActivity.updatedAt || today
    };

    setActivities(prev => {
      // Prevent duplicates by checking id
      if (prev.some(a => a.id === activityWithDates.id)) {
        return prev.map(a => a.id === activityWithDates.id ? activityWithDates : a);
      }
      
      const newActivities = [activityWithDates, ...prev];
      
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
    
    syncToServer('add_activity', activityWithDates);

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: activityWithDates.projectId || projects[0]?.id || 'PRJ-001',
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: 'Activity Created',
      details: `Created activity "${activityWithDates.name}" (${activityWithDates.id})`,
      timestamp: new Date().toISOString(),
      entityType: 'Activity',
      entityId: activityWithDates.id,
      actionType: 'create',
      newValue: `Name: ${activityWithDates.name} | Status: ${activityWithDates.status} | Progress: ${activityWithDates.progress}%`
    });
  };

  const deleteActivity = (id: string) => {
    const actToDelete = activities.find(a => a.id === id);
    syncToServer('delete_activity', { id });
    setActivities(prev => {
      const newActivities = prev.filter(a => a.id !== id);
      
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

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: actToDelete?.projectId || projects[0]?.id || 'PRJ-001',
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: 'Activity Deleted',
      details: actToDelete ? `Deleted activity "${actToDelete.name}" (${id})` : `Deleted activity #${id}`,
      timestamp: new Date().toISOString(),
      entityType: 'Activity',
      entityId: id,
      actionType: 'delete',
      previousValue: actToDelete ? `Name: ${actToDelete.name} | Status: ${actToDelete.status} | Progress: ${actToDelete.progress}%` : undefined,
      newValue: 'Activity Record Removed'
    });
  };

  const addReport = (newReport: DailyReport) => {
    setReports(prev => [newReport, ...prev]);
    syncToServer('add_report', newReport);

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: newReport.projectId || projects[0]?.id || 'PRJ-001',
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: 'Daily Report Created',
      details: `Created Daily Site Report for ${newReport.date}`,
      timestamp: new Date().toISOString(),
      entityType: 'Report',
      entityId: newReport.id,
      actionType: 'create',
      newValue: `Date: ${newReport.date} | Weather: ${newReport.weather}`
    });
  };

  const updateReport = (updatedReport: DailyReport) => {
    setReports(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));
    syncToServer('update_report', updatedReport);

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: updatedReport.projectId || projects[0]?.id || 'PRJ-001',
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: 'Daily Report Updated',
      details: `Updated Daily Site Report for ${updatedReport.date}`,
      timestamp: new Date().toISOString(),
      entityType: 'Report',
      entityId: updatedReport.id,
      actionType: 'update'
    });
  };

  const deleteReport = (id: string) => {
    const reportToDelete = reports.find(r => r.id === id);
    setReports(prev => prev.filter(r => r.id !== id));
    syncToServer('delete_report', { id });

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: reportToDelete?.projectId || projects[0]?.id || 'PRJ-001',
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: 'Daily Report Deleted',
      details: reportToDelete ? `Deleted Daily Report for ${reportToDelete.date}` : `Deleted Daily Report #${id}`,
      timestamp: new Date().toISOString(),
      entityType: 'Report',
      entityId: id,
      actionType: 'delete',
      previousValue: reportToDelete ? `Date: ${reportToDelete.date} | Weather: ${reportToDelete.weather}` : undefined,
      newValue: 'Report Removed'
    });
  };

  const updateProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    syncToServer('update_project', updatedProject);

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: updatedProject.id,
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: 'Project Updated',
      details: `Updated construction project "${updatedProject.name}"`,
      timestamp: new Date().toISOString(),
      entityType: 'Project',
      entityId: updatedProject.id,
      actionType: 'update'
    });
  };

  const addProject = (newProject: Project) => {
    setProjects(prev => [newProject, ...prev]);
    syncToServer('add_project', newProject);

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: newProject.id,
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: 'Project Created',
      details: `Created new project "${newProject.name}" (${newProject.id})`,
      timestamp: new Date().toISOString(),
      entityType: 'Project',
      entityId: newProject.id,
      actionType: 'create'
    });
  };

  const deleteProject = (id: string) => {
    const prjToDelete = projects.find(p => p.id === id);
    setProjects(prev => prev.filter(p => p.id !== id));
    syncToServer('delete_project', { id });

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: id,
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: 'Project Deleted',
      details: prjToDelete ? `Deleted construction project "${prjToDelete.name}" (${id})` : `Deleted project #${id}`,
      timestamp: new Date().toISOString(),
      entityType: 'Project',
      entityId: id,
      actionType: 'delete',
      previousValue: prjToDelete ? `Name: ${prjToDelete.name} | Location: ${prjToDelete.location}` : undefined,
      newValue: 'Project Record Removed'
    });
  };

  const addLabourLog = (newLog: LabourLog) => {
    isRemoteUpdateRef.current = false;
    setLabourLogs(prev => {
      const updated = [newLog, ...prev];
      localStorage.setItem('labourLogs', JSON.stringify(updated));
      if (isManualSyncMode) {
        setHasPendingChanges(true);
        localStorage.setItem('hasPendingChanges', 'true');
        setPendingChangesCount(c => c + 1);
      } else {
        saveFirestoreKey('labourLogs', updated);
      }
      return updated;
    });
    syncToServer('add_labour_log', newLog);

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: newLog.projectId,
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: 'Labour Log Created',
      details: `${newLog.hours || newLog.hoursWorked || 0} hours logged for ${newLog.workerName || newLog.trade || 'Worker'} on Activity ${newLog?.activityId || 'N/A'}`,
      timestamp: new Date().toISOString(),
      entityType: 'LabourLog',
      entityId: newLog.id,
      actionType: 'create',
      newValue: `Worker: ${newLog.workerName || newLog.trade || 'N/A'} | Hours: ${newLog.hours || newLog.hoursWorked || 0}`
    });
  };

  const updateLabourLog = (updatedLog: LabourLog) => {
    isRemoteUpdateRef.current = false;
    setLabourLogs(prev => {
      const updated = prev.map(l => l.id === updatedLog.id ? updatedLog : l);
      localStorage.setItem('labourLogs', JSON.stringify(updated));
      if (isManualSyncMode) {
        setHasPendingChanges(true);
        localStorage.setItem('hasPendingChanges', 'true');
        setPendingChangesCount(c => c + 1);
      } else {
        saveFirestoreKey('labourLogs', updated);
      }
      return updated;
    });
    syncToServer('update_labour_log', updatedLog);

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: updatedLog.projectId,
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: 'Labour Log Updated',
      details: `Updated labour log entry for ${updatedLog.workerName || updatedLog.trade || 'Worker'} (${updatedLog.hours || updatedLog.hoursWorked || 0} hrs)`,
      timestamp: new Date().toISOString(),
      entityType: 'LabourLog',
      entityId: updatedLog.id,
      actionType: 'update'
    });
  };

  const deleteLabourLog = (id: string) => {
    isRemoteUpdateRef.current = false;
    const logToDelete = labourLogs.find(l => l.id === id);
    setLabourLogs(prev => {
      const updated = prev.filter(l => l.id !== id);
      localStorage.setItem('labourLogs', JSON.stringify(updated));
      if (isManualSyncMode) {
        setHasPendingChanges(true);
        localStorage.setItem('hasPendingChanges', 'true');
        setPendingChangesCount(c => c + 1);
      } else {
        saveFirestoreKey('labourLogs', updated);
      }
      return updated;
    });
    syncToServer('delete_labour_log', { id });

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: logToDelete?.projectId || projects[0]?.id || 'PRJ-001',
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: 'Labour Log Deleted',
      details: logToDelete 
        ? `Deleted ${logToDelete.hours || logToDelete.hoursWorked || 0} hrs labor log entry for ${logToDelete.workerName || logToDelete.trade || 'Worker'} on Activity ${logToDelete?.activityId || 'N/A'}`
        : `Deleted labour log #${id}`,
      timestamp: new Date().toISOString(),
      entityType: 'LabourLog',
      entityId: id,
      actionType: 'delete',
      previousValue: logToDelete ? `Worker: ${logToDelete.workerName || logToDelete.trade || 'N/A'} | Hours: ${logToDelete.hours || logToDelete.hoursWorked || 0}` : undefined,
      newValue: 'Record Deleted'
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
    isRemoteUpdateRef.current = false;
    setWorkerCheckIns(prev => {
      const updated = [newCheckIn, ...prev];
      localStorage.setItem('workerCheckIns', JSON.stringify(updated));
      if (!isManualSyncMode) {
        saveFirestoreKey('workerCheckIns', updated);
      }
      return updated;
    });
    syncToServer('add_worker_checkin', newCheckIn);
  };

  const deleteWorkerCheckIn = (id: string) => {
    isRemoteUpdateRef.current = false;
    setWorkerCheckIns(prev => {
      const updated = prev.filter(c => c.id !== id);
      localStorage.setItem('workerCheckIns', JSON.stringify(updated));
      if (!isManualSyncMode) {
        saveFirestoreKey('workerCheckIns', updated);
      }
      return updated;
    });
    syncToServer('delete_worker_checkin', { id });
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

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: newIncident.projectId || projects[0]?.id || 'PRJ-001',
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: 'Safety Incident Logged',
      details: `Logged safety incident (${newIncident.priority || 'Notice'}): ${newIncident.title || newIncident.type || newIncident.description || 'Incident'}`,
      timestamp: new Date().toISOString(),
      entityType: 'Safety',
      entityId: newIncident.id,
      actionType: 'create'
    });
  };

  const updateSafetyIncident = (updatedIncident: SafetyIncident) => {
    setSafetyIncidents(prev => prev.map(i => i.id === updatedIncident.id ? updatedIncident : i));
    syncToServer('update_safety_incident', updatedIncident);

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: updatedIncident.projectId || projects[0]?.id || 'PRJ-001',
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: 'Safety Incident Updated',
      details: `Updated safety record (${updatedIncident.status || 'Active'}): ${updatedIncident.title || updatedIncident.type || updatedIncident.id}`,
      timestamp: new Date().toISOString(),
      entityType: 'Safety',
      entityId: updatedIncident.id,
      actionType: 'update'
    });
  };

  const deleteSafetyIncident = (id: string) => {
    const incidentToDelete = safetyIncidents.find(i => i.id === id);
    setSafetyIncidents(prev => prev.filter(i => i.id !== id));
    syncToServer('delete_safety_incident', { id });

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: incidentToDelete?.projectId || projects[0]?.id || 'PRJ-001',
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: 'Safety Incident Deleted',
      details: incidentToDelete ? `Deleted safety incident "${incidentToDelete.title || incidentToDelete.type || id}"` : `Deleted safety incident #${id}`,
      timestamp: new Date().toISOString(),
      entityType: 'Safety',
      entityId: id,
      actionType: 'delete',
      previousValue: incidentToDelete ? `Type: ${incidentToDelete.type} | Severity: ${incidentToDelete.priority}` : undefined,
      newValue: 'Safety Record Removed'
    });
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
        const updatedUsed = m.usedQuantity + usage.quantity;
        const newBalance = m.receivedQuantity - updatedUsed;
        const threshold = m.reorderLevel !== undefined && m.reorderLevel > 0 
          ? m.reorderLevel 
          : (m.estimatedQuantity * 0.1);

        if (newBalance <= threshold) {
          // Trigger Service Worker notification for low stock reorder alert
          triggerNotification({
            title: `Low Stock Alert: ${m.name}`,
            description: `Stock level fell to ${newBalance} ${m.unit} (Threshold: ${threshold} ${m.unit}). Immediate reorder recommended.`,
            priority: newBalance <= 0 ? 'Critical' : 'High',
            reminderId: `mat-alert-${m.id}`,
            link: '/materials'
          });
        }

        return { ...m, usedQuantity: updatedUsed };
      }
      return m;
    }));
    syncToServer('add_material_usage', usage);
  };

  const addMaterials = (newMaterials: MaterialInventory[]) => {
    setMaterials(prev => [...newMaterials, ...prev]);
    newMaterials.forEach(m => syncToServer('add_material', m));
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

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    const empFullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.id;
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: projects[0]?.id || 'PRJ-001',
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: 'Employee Added',
      details: `Added new employee "${empFullName}" (${employee.position || employee.department || 'Worker'})`,
      timestamp: new Date().toISOString(),
      entityType: 'Employee',
      entityId: employee.id,
      actionType: 'create'
    });
  };

  const updateEmployee = (employee: Employee) => {
    setEmployees(prev => prev.map(e => e.id === employee.id ? employee : e));
    syncToServer('update_employee', employee);

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    const empFullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.id;
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: projects[0]?.id || 'PRJ-001',
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: 'Employee Profile Updated',
      details: `Updated employee details for "${empFullName}" (${employee.id})`,
      timestamp: new Date().toISOString(),
      entityType: 'Employee',
      entityId: employee.id,
      actionType: 'update'
    });
  };

  const deleteEmployee = (id: string) => {
    const empToDelete = employees.find(e => e.id === id);
    setEmployees(prev => prev.filter(e => e.id !== id));
    syncToServer('delete_employee', { id });

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    const empFullName = empToDelete ? `${empToDelete.firstName || ''} ${empToDelete.lastName || ''}`.trim() : id;
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: projects[0]?.id || 'PRJ-001',
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: 'Employee Record Deleted',
      details: empToDelete ? `Deleted employee profile "${empFullName}" (${id})` : `Deleted employee #${id}`,
      timestamp: new Date().toISOString(),
      entityType: 'Employee',
      entityId: id,
      actionType: 'delete',
      previousValue: empToDelete ? `Name: ${empFullName} | Position: ${empToDelete.position}` : undefined,
      newValue: 'Employee Record Removed'
    });
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
    const targetEq = equipment.find(e => e.id === log.equipmentId);
    const enrichedLog: EquipmentLog = { ...log };
    if (log.type === 'Hours' && log.hoursAdded) {
      if (enrichedLog.hourlyRateApplied === undefined && targetEq?.hourlyRate) {
        enrichedLog.hourlyRateApplied = targetEq.hourlyRate;
      }
      if (enrichedLog.calculatedOperatingCost === undefined && enrichedLog.hourlyRateApplied) {
        enrichedLog.calculatedOperatingCost = log.hoursAdded * enrichedLog.hourlyRateApplied;
      }
    }

    setEquipmentLogs(prev => [enrichedLog, ...prev]);
    syncToServer('add_equipment_log', enrichedLog);

    // Automatically update equipment details based on the log entry
    setEquipment(prev => prev.map(eq => {
      if (eq.id !== enrichedLog.equipmentId) return eq;

      let updated = { ...eq };
      if (enrichedLog.type === 'Hours' && enrichedLog.hoursAdded) {
        const currentHours = typeof eq.engineHours === 'number' ? eq.engineHours : (parseInt(String(eq.engineHours)) || 0);
        updated.engineHours = currentHours + enrichedLog.hoursAdded;
      } else if (enrichedLog.type === 'Mileage') {
        const currentMileage = eq.mileage || 0;
        if (enrichedLog.odometerReading) {
          updated.mileage = enrichedLog.odometerReading;
        } else if (enrichedLog.mileageAdded) {
          updated.mileage = currentMileage + enrichedLog.mileageAdded;
        }
        if (enrichedLog.hoursAdded) {
          updated.engineHours = (eq.engineHours || 0) + enrichedLog.hoursAdded;
        }
      } else if (enrichedLog.type === 'Loads & Trips') {
        if (enrichedLog.loadsAdded) {
          updated.totalLoads = (eq.totalLoads || 0) + enrichedLog.loadsAdded;
        }
        if (enrichedLog.mileageAdded) {
          updated.mileage = (eq.mileage || 0) + enrichedLog.mileageAdded;
        }
        if (enrichedLog.hoursAdded) {
          updated.engineHours = (eq.engineHours || 0) + enrichedLog.hoursAdded;
        }
      } else if (enrichedLog.type === 'Power Output') {
        if (enrichedLog.powerKWhAdded) {
          updated.totalPowerKWh = (eq.totalPowerKWh || 0) + enrichedLog.powerKWhAdded;
        }
        if (enrichedLog.hoursAdded) {
          updated.engineHours = (eq.engineHours || 0) + enrichedLog.hoursAdded;
        }
      } else if (enrichedLog.type === 'Refuel' && enrichedLog.fuelLevelAfter !== undefined) {
        updated.fuelLevel = enrichedLog.fuelLevelAfter;
        updated.fuelColor = enrichedLog.fuelLevelAfter < 25 ? 'bg-red-500' : enrichedLog.fuelLevelAfter < 50 ? 'bg-amber-500' : 'bg-emerald-500';
      } else if (enrichedLog.type === 'Maintenance') {
        updated.lastService = enrichedLog.date.split(' ')[0] || new Date().toISOString().split('T')[0];
        if (eq.mileage && enrichedLog.odometerReading) {
          updated.lastServiceKm = enrichedLog.odometerReading;
        }
        if (enrichedLog.setStatus) {
          updated.status = enrichedLog.setStatus;
        } else if (enrichedLog.notes?.toLowerCase().includes('maintenance') || enrichedLog.maintenanceType?.toLowerCase().includes('repair')) {
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

  const deleteEquipmentLog = (id: string) => {
    const logToDelete = equipmentLogs.find(l => l.id === id);
    setEquipmentLogs(prev => prev.filter(l => l.id !== id));
    syncToServer('delete_equipment_log', { id });

    // If it added engine hours, subtract them
    if (logToDelete && logToDelete.type === 'Hours' && logToDelete.hoursAdded) {
      setEquipment(prev => prev.map(eq => {
        if (eq.id !== logToDelete.equipmentId) return eq;
        const currentHours = typeof eq.engineHours === 'number' ? eq.engineHours : (parseInt(String(eq.engineHours)) || 0);
        const updatedHours = Math.max(0, currentHours - (logToDelete.hoursAdded || 0));
        const updated = { ...eq, engineHours: updatedHours };
        syncToServer('update_equipment', updated);
        return updated;
      }));
    }

    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: projects[0]?.id || '',
      userId: userRole === 'Manager' ? 'Current User' : 'Current User',
      action: 'Equipment Log Deleted',
      details: `Deleted ${logToDelete?.type || 'activity'} log for equipment ${logToDelete?.equipmentId || ''}`,
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

  const addSiteInspectionPhoto = (photo: SiteInspectionPhoto) => {
    setSiteInspectionPhotos(prev => {
      const updated = [photo, ...prev];
      localStorage.setItem('siteInspectionPhotos', JSON.stringify(updated));
      return updated;
    });
    syncToServer('add_site_inspection_photo', photo);
  };
  const deleteSiteInspectionPhoto = (id: string) => {
    setSiteInspectionPhotos(prev => {
      const updated = prev.filter(p => p.id !== id);
      localStorage.setItem('siteInspectionPhotos', JSON.stringify(updated));
      return updated;
    });
    syncToServer('delete_site_inspection_photo', { id });
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

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: inspection.projectId || projects[0]?.id || 'PRJ-001',
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: 'QA Inspection Item Created',
      details: `Created QA inspection "${inspection.title}" (${inspection.category || 'Quality'})`,
      timestamp: new Date().toISOString(),
      entityType: 'QA',
      entityId: inspection.id,
      actionType: 'create'
    });
  };

  const updateQAInspection = (inspection: QAInspectionItem) => {
    setQAInspections(prev => prev.map(i => i.id === inspection.id ? inspection : i));
    syncToServer('update_qa_inspection', inspection);

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: inspection.projectId || projects[0]?.id || 'PRJ-001',
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: 'QA Inspection Updated',
      details: `Updated QA inspection status to "${inspection.status || 'Updated'}" for ${inspection.title}`,
      timestamp: new Date().toISOString(),
      entityType: 'QA',
      entityId: inspection.id,
      actionType: 'update'
    });
  };

  const deleteQAInspection = (id: string) => {
    const qaToDelete = qaInspections.find(q => q.id === id);
    setQAInspections(prev => prev.filter(i => i.id !== id));
    syncToServer('delete_qa_inspection', { id });

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: qaToDelete?.projectId || projects[0]?.id || 'PRJ-001',
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: 'QA Inspection Deleted',
      details: qaToDelete ? `Deleted QA inspection "${qaToDelete.title}" (${id})` : `Deleted QA inspection #${id}`,
      timestamp: new Date().toISOString(),
      entityType: 'QA',
      entityId: id,
      actionType: 'delete',
      previousValue: qaToDelete ? `Title: ${qaToDelete.title}` : undefined,
      newValue: 'Inspection Record Removed'
    });
  };

  const addReminder = (reminder: Reminder) => {
    setReminders(prev => [reminder, ...prev]);
    syncToServer('add_reminder', reminder);
  };

  const updateReminder = (reminder: Reminder) => {
    setReminders(prev => prev.map(r => r.id === reminder.id ? reminder : r));
    syncToServer('update_reminder', reminder);
  };

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    syncToServer('delete_reminder', { id });
  };

  const addWeatherLog = (newLog: WeatherLog) => {
    setWeatherLogs(prev => [newLog, ...prev]);
    syncToServer('add_weather_log', newLog);
    
    // Add audit log entry
    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: newLog.projectId || projects[0]?.id || '',
      userId: newLog.loggedBy || 'Current User',
      action: 'Weather Logged',
      details: `Logged weather condition: ${newLog.condition}, ${newLog.temperature}°C (${newLog.impactLevel})`,
      timestamp: new Date().toISOString()
    });

    // Sync or create matching DailyReport for the same date/project
    setReports(prev => {
      const existing = prev.find(r => r.date === newLog.date && (r.projectId === newLog.projectId || !r.projectId));
      if (existing) {
        const updated = {
          ...existing,
          weather: newLog.condition,
          temperature: `${newLog.temperature}°C`,
          siteConditions: newLog.notes || existing.siteConditions || `Impact level: ${newLog.impactLevel}`
        };
        syncToServer('update_report', updated);
        return prev.map(r => r.id === existing.id ? updated : r);
      } else {
        const newReport: DailyReport = {
          id: `REP-${Math.random().toString(36).substr(2, 9)}`,
          date: newLog.date,
          projectId: newLog.projectId || projects[0]?.id || 'PRJ-9348',
          weather: newLog.condition,
          temperature: `${newLog.temperature}°C`,
          siteConditions: newLog.notes || `Impact level: ${newLog.impactLevel}`,
          workersOnSite: 0,
          equipmentRunning: 0,
          incidents: 0,
          ncr: 0
        };
        syncToServer('add_report', newReport);
        return [newReport, ...prev];
      }
    });
  };

  const updateWeatherLog = (updatedLog: WeatherLog) => {
    setWeatherLogs(prev => prev.map(w => w.id === updatedLog.id ? updatedLog : w));
    syncToServer('update_weather_log', updatedLog);
  };

  const deleteWeatherLog = (id: string) => {
    setWeatherLogs(prev => prev.filter(w => w.id !== id));
    syncToServer('delete_weather_log', { id });
  };

  const addDocument = (doc: DocumentItem) => {
    const cleanDoc = sanitizeDocumentMetadata(doc);
    setDocuments(prev => [cleanDoc, ...prev]);
    syncToServer('add_document', cleanDoc);
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: cleanDoc.projectId || projects[0]?.id || 'PRJ-9348',
      userId: currentUserProfile?.name || 'Current User',
      userRole: currentUserProfile?.role || userRole,
      action: 'Document Uploaded',
      details: `Uploaded document "${cleanDoc.title}" (${cleanDoc.category}, ${cleanDoc.version})`,
      timestamp: new Date().toISOString(),
      entityType: 'Report',
      entityId: cleanDoc.id,
      actionType: 'create',
      newValue: `File: ${cleanDoc.fileName} | Size: ${cleanDoc.fileSizeFormatted || cleanDoc.fileSize}`
    });
  };

  const updateDocument = (doc: DocumentItem) => {
    const cleanDoc = sanitizeDocumentMetadata(doc);
    setDocuments(prev => prev.map(d => d.id === cleanDoc.id ? cleanDoc : d));
    syncToServer('update_document', cleanDoc);
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: cleanDoc.projectId || projects[0]?.id || 'PRJ-9348',
      userId: currentUserProfile?.name || 'Current User',
      userRole: currentUserProfile?.role || userRole,
      action: 'Document Updated',
      details: `Updated document "${cleanDoc.title}" (${cleanDoc.status})`,
      timestamp: new Date().toISOString(),
      entityType: 'Report',
      entityId: cleanDoc.id,
      actionType: 'update'
    });
  };

  const deleteDocument = (id: string) => {
    const docToDelete = documents.find(d => d.id === id);
    setDocuments(prev => prev.filter(d => d.id !== id));
    deleteDocumentFile(id).catch(console.warn);
    syncToServer('delete_document', { id });
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: docToDelete?.projectId || projects[0]?.id || 'PRJ-9348',
      userId: currentUserProfile?.name || 'Current User',
      userRole: currentUserProfile?.role || userRole,
      action: 'Document Deleted',
      details: `Removed document "${docToDelete?.title || id}"`,
      timestamp: new Date().toISOString(),
      entityType: 'Report',
      entityId: id,
      actionType: 'delete'
    });
  };

  const assignDocumentToActivity = (docId: string, activityId?: string, activityName?: string) => {
    setDocuments(prev => prev.map(d => {
      if (d.id === docId) {
        const updated = {
          ...d,
          linkedActivityId: activityId || undefined,
          linkedActivityName: activityName || undefined,
          lastModified: new Date().toISOString()
        };
        syncToServer('update_document', updated);
        return updated;
      }
      return d;
    }));
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const setCurrency = (newCurrency: import('../types').CurrencyCode) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('currency', newCurrency);
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

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: projects[0]?.id || 'PRJ-001',
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: 'User Whitelist Added',
      details: `Added new user profile "${profile.name}" (${profile.role})`,
      timestamp: new Date().toISOString(),
      entityType: 'Profile',
      entityId: profile.id,
      actionType: 'security_permission',
      newValue: `Role: ${profile.role} | Email: ${profile.email}`
    });
  };

  const updateProfile = (profile: UserProfile) => {
    const oldProfile = userProfiles.find(p => p.id === profile.id);
    setUserProfiles(prev => prev.map(p => p.id === profile.id ? profile : p));
    if (currentUserProfile.id === profile.id) {
      setCurrentUserProfileState(profile);
      setUserRole(profile.role);
    }

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: projects[0]?.id || 'PRJ-001',
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: 'User Role/Permissions Updated',
      details: `Updated role or permissions for "${profile.name}" (${profile.role})`,
      timestamp: new Date().toISOString(),
      entityType: 'Profile',
      entityId: profile.id,
      actionType: 'security_permission',
      previousValue: oldProfile ? `Role: ${oldProfile.role} | Access: ${oldProfile.accessAllowed ? 'Allowed' : 'Blocked'}` : undefined,
      newValue: `Role: ${profile.role} | Access: ${profile.accessAllowed ? 'Allowed' : 'Blocked'}`
    });
  };

  const deleteProfile = (id: string) => {
    const profToDelete = userProfiles.find(p => p.id === id);
    setUserProfiles(prev => prev.filter(p => p.id !== id));

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: projects[0]?.id || 'PRJ-001',
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: 'User Profile Removed',
      details: profToDelete ? `Revoked access & deleted profile "${profToDelete.name}" (${id})` : `Deleted profile #${id}`,
      timestamp: new Date().toISOString(),
      entityType: 'Profile',
      entityId: id,
      actionType: 'security_permission',
      previousValue: profToDelete ? `Name: ${profToDelete.name} | Role: ${profToDelete.role}` : undefined,
      newValue: 'Access Revoked'
    });
  };

  const login = (email: string, _password?: string): { success: boolean; message?: string } => {
    const trimmedEmail = email.trim().toLowerCase();
    
    // Auto-create Admin for the owner
    if (trimmedEmail === 'lindokuhlechris@gmail.com' && !userProfiles.find(p => p.email.toLowerCase() === trimmedEmail)) {
      const newAdmin: UserProfile = {
        id: `USR-ADMIN-${Math.floor(Math.random()*1000)}`,
        name: 'Lindokuhle Chris',
        role: 'Admin',
        title: 'Lead Administrator',
        email: trimmedEmail,
        phone: '',
        company: 'Constructfield',
        department: 'Executive',
        initials: 'LC',
        accessAllowed: true,
        permissions: DEFAULT_SECTION_PERMISSIONS['Admin'],
        allowedProjectIds: ['all']
      };
      addProfile(newAdmin);
      setCurrentUserProfileState(newAdmin);
      setUserRole('Admin');
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
      triggerSyncToast(`Authenticated as Owner`, 'success');
      return { success: true };
    }

    const foundProfile = userProfiles.find(p => p.email.toLowerCase() === trimmedEmail);

    if (!foundProfile) {
      return {
        success: false,
        message: `Access Denied: Email '${email}' is not whitelisted on this system. Please submit an admission request or ask an Admin to invite you.`
      };
    }

    if (foundProfile.accessAllowed === false) {
      return {
        success: false,
        message: `Admission Revoked: Account access for '${foundProfile.name}' (${foundProfile.email}) has been disabled by an Administrator.`
      };
    }

    setCurrentUserProfileState(foundProfile);
    setUserRole(foundProfile.role);
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
    triggerSyncToast(`Authenticated: Welcome back, ${foundProfile.name}`, 'success');
    return { success: true };
  };

  const loginWithProfile = (profileId: string): { success: boolean; message?: string } => {
    const foundProfile = userProfiles.find(p => p.id === profileId);
    if (!foundProfile) {
      return { success: false, message: 'Profile not found.' };
    }
    if (foundProfile.accessAllowed === false) {
      return {
        success: false,
        message: `Admission Blocked: Access for '${foundProfile.name}' has been disabled by an Administrator.`
      };
    }
    setCurrentUserProfile(foundProfile);
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
    triggerSyncToast(`Welcome back, ${foundProfile.name} (${foundProfile.role})`, 'success');
    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.setItem('isAuthenticated', 'false');
    triggerSyncToast('Session locked. Signed out successfully.', 'warning');
  };

  const addAccessRequest = (reqData: Omit<AccessRequest, 'id' | 'timestamp' | 'status'>) => {
    const newReq: AccessRequest = {
      id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      ...reqData,
      timestamp: new Date().toISOString(),
      status: 'Pending'
    };
    setAccessRequests(prev => {
      const updated = [newReq, ...prev];
      localStorage.setItem('accessRequests', JSON.stringify(updated));
      return updated;
    });
    triggerSyncToast('Admission request submitted to System Administrators', 'success');
  };

  const approveAccessRequest = (reqId: string) => {
    const req = accessRequests.find(r => r.id === reqId);
    if (!req) return;

    const names = req.name.trim().split(' ');
    const initials = names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : names[0].substring(0, 2).toUpperCase();

    const newProfile: UserProfile = {
      id: `USR-${Math.floor(100 + Math.random() * 900)}`,
      name: req.name,
      role: req.requestedRole,
      title: req.requestedRole,
      email: req.email,
      phone: '+1 (555) 000-0000',
      company: req.company,
      department: 'Field Operations',
      initials,
      accessAllowed: true,
      permissions: DEFAULT_SECTION_PERMISSIONS[req.requestedRole],
      allowedProjectIds: ['all']
    };

    addProfile(newProfile);
    setAccessRequests(prev => {
      const updated = prev.map(r => r.id === reqId ? { ...r, status: 'Approved' as const } : r);
      localStorage.setItem('accessRequests', JSON.stringify(updated));
      return updated;
    });
    triggerSyncToast(`Approved access request for ${req.name} (${req.email})`, 'success');
  };

  const rejectAccessRequest = (reqId: string) => {
    setAccessRequests(prev => {
      const updated = prev.map(r => r.id === reqId ? { ...r, status: 'Rejected' as const } : r);
      localStorage.setItem('accessRequests', JSON.stringify(updated));
      return updated;
    });
    triggerSyncToast(`Rejected admission request`, 'warning');
  };

  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const hasPermission = React.useCallback((section: keyof ProjectSectionPermissions) => {
    return canUserEditSection(currentUserProfile, section);
  }, [currentUserProfile]);

  if (!isLoaded) {
    return <div className="flex h-screen items-center justify-center text-slate-500">Loading backend...</div>;
  }

  return (
    <AppContext.Provider value={{ 
      projects, activities, reports, weatherLogs, labourLogs, labourAllocations, workerCheckIns, auditLogs, allocations, safetyIncidents, materials, materialReceipts, materialUsages, customFieldDefinitions, employees, teams, equipment, equipmentLogs, 
      safetyRequirements, safetyPolicies, activityInspections, siteInspectionPhotos, ppeItems, qaInspections, documents, reminders, userProfiles, currentUserProfile, hasPermission, theme, units, currency, userRole, 
      isAuthenticated, login, loginWithProfile, logout, accessRequests, addAccessRequest, approveAccessRequest, rejectAccessRequest,
      isSyncing, isOffline, lastSyncedAt, syncToast, syncConflict, isManualSyncMode, setIsManualSyncMode, hasPendingChanges, pendingChangesCount, setSyncConflict, resolveSyncConflict, triggerSyncToast, hideSyncToast, forceSyncAll,
      setUserRole, setTheme, setUnits, setCurrency, setCurrentUserProfile, addProfile, updateProfile, deleteProfile,
      updateActivity, addActivity, deleteActivity, addReport, updateReport, deleteReport, updateProject, addProject, deleteProject,
      addLabourLog, updateLabourLog, deleteLabourLog, addLabourAllocation, updateLabourAllocation, deleteLabourAllocation, addWorkerCheckIn, deleteWorkerCheckIn, addAuditLog, addAllocation, updateAllocation, deleteAllocation,
      addSafetyIncident, updateSafetyIncident, deleteSafetyIncident, addMaterialReceipt, addMaterialUsage, addMaterial, addMaterials, updateMaterial, deleteMaterial,
      addCustomFieldDefinition, updateCustomFieldDefinition, addEmployee, updateEmployee, deleteEmployee, addTeam, updateTeam, deleteTeam,
      addEquipment, updateEquipment, deleteEquipment, addEquipmentLog, deleteEquipmentLog,
      addSafetyRequirement, updateSafetyRequirement, deleteSafetyRequirement,
      addSafetyPolicy, updateSafetyPolicy, deleteSafetyPolicy,
      addActivityInspection, updateActivityInspection, deleteActivityInspection, addSiteInspectionPhoto, deleteSiteInspectionPhoto,
      addPPEItem, updatePPEItem, deletePPEItem,
      addQAInspection, updateQAInspection, deleteQAInspection,
      addReminder, updateReminder, deleteReminder,
      addWeatherLog, updateWeatherLog, deleteWeatherLog,
      addDocument, updateDocument, deleteDocument, assignDocumentToActivity
    }}>
      {children}
      <SyncNotificationToast />
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
