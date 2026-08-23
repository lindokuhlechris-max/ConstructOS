import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Project, Activity, DailyReport, LabourLog, UserRole, AuditLog, ResourceAllocation, SafetyIncident, LabourAllocation, WorkerCheckIn, MaterialInventory, MaterialReceipt, MaterialUsage, CustomFieldDefinition, Employee, Equipment, EquipmentLog, Team, SafetyRequirement, SafetyPolicy, ActivitySafetyInspection, PPEMaterialItem, QAInspectionItem, QARFIItem, UserProfile, Reminder, WeatherLog, SyncConflict, AccessRequest, SiteInspectionPhoto, DocumentItem, DocumentFolder, WorkPackageBinder, DocumentTransmittal, DEFAULT_SECTION_PERMISSIONS, ProjectSectionPermissions, canUserEditSection, AccommodationUnit, AccommodationUtilityLog, AccommodationPaymentLog, SurveySectionRecord, ActivityNote, SubTask, Priority, UniversalReportItem, SurveyReportData, WeeklyProgressReportData, MonthlyProgressReportData, ReportCategory, ReportStatus, ReportSignoff, SurveyPointRecord, WeeklyActivitySnapshot, FinanceReportData, FleetReportData, MaterialsReportData, AccommodationReportData, CustomReportData, ReportTemplateDefinition } from '../types';
import { subscribeToFirestoreState, saveFirestoreKey, onSyncStatusChange, saveFullFirestoreState } from '../lib/firestoreService';
import { triggerNotification } from '../lib/reminderNotificationService';
import { SyncNotificationToast, SyncToastState } from '../components/SyncNotificationToast';
import { sanitizeDocumentMetadata, deleteDocumentFile } from '../lib/documentStorage';

interface AppContextType {
  projects: Project[];
  activities: Activity[];
  reports: DailyReport[];
  universalReports: UniversalReportItem[];
  addUniversalReport: (report: UniversalReportItem) => void;
  updateUniversalReport: (report: UniversalReportItem) => void;
  deleteUniversalReport: (id: string) => void;
  compileWeeklyProgressReport: (projectId: string, startDate: string, endDate: string) => UniversalReportItem<WeeklyProgressReportData>;
  reportTemplates: ReportTemplateDefinition[];
  addReportTemplate: (tpl: ReportTemplateDefinition) => void;
  updateReportTemplate: (tpl: ReportTemplateDefinition) => void;
  deleteReportTemplate: (id: string) => void;
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
  rfis: QARFIItem[];
  addRFI: (rfi: QARFIItem) => void;
  updateRFI: (rfi: QARFIItem) => void;
  deleteRFI: (id: string) => void;
  userProfiles: UserProfile[];
  currentUserProfile: UserProfile;
  hasPermission: (section: keyof ProjectSectionPermissions) => boolean;
  reminders: Reminder[];
  accommodations: AccommodationUnit[];
  accommodationUtilities: AccommodationUtilityLog[];
  accommodationPayments: AccommodationPaymentLog[];
  surveyRecords: SurveySectionRecord[];
  addSurveyRecord: (record: SurveySectionRecord) => void;
  updateSurveyRecord: (record: SurveySectionRecord) => void;
  deleteSurveyRecord: (id: string) => void;
  batchGenerateSurveySections: (records: SurveySectionRecord[]) => void;
  linkSurveyRecordToActivity: (surveyRecordId: string, activityId: string, subtaskId?: string) => void;
  unlinkSurveyRecordFromActivity: (surveyRecordId: string) => void;
  notes: ActivityNote[];
  addNote: (note: ActivityNote) => void;
  updateNote: (note: ActivityNote) => void;
  deleteNote: (id: string) => void;
  togglePinNote: (id: string) => void;
  toggleArchiveNote: (id: string) => void;
  convertNoteToReminder: (note: ActivityNote, dueDate: string, dueTime?: string, priority?: Priority) => void;
  theme: 'light' | 'dark';
  units: 'metric' | 'imperial';
  currency: import('../types').CurrencyCode;
  userRole: UserRole;

  // Authentication & Admission Control State
  isAuthenticated: boolean;
  login: (email: string, password?: string) => { success: boolean; message?: string };
  loginWithProfile: (profileId: string, password?: string) => { success: boolean; message?: string };
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
  triggerSyncToast: (message?: string, type?: 'syncing' | 'warning' | 'success' | 'offline' | 'info' | 'error', autoDismissMs?: number) => void;
  hideSyncToast: () => void;
  forceSyncAll: () => Promise<void>;
  restoreFromArchivePackage: (plainPackage: any, sectionsToRestore: any[], strategy?: 'merge' | 'replace') => Promise<any>;
  clearDataSections: (sectionsToClear: string[], resetToDefaults?: boolean) => Promise<any>;

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
  updateEquipmentLog: (log: EquipmentLog) => void;
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
  deletePPEItem: (idOrItem: string | PPEMaterialItem) => void;
  addQAInspection: (inspection: QAInspectionItem) => void;
  updateQAInspection: (inspection: QAInspectionItem, oldId?: string) => void;
  deleteQAInspection: (id: string) => void;
  addReminder: (reminder: Reminder) => void;
  updateReminder: (reminder: Reminder) => void;
  deleteReminder: (id: string) => void;
  addWeatherLog: (weatherLog: WeatherLog) => void;
  updateWeatherLog: (weatherLog: WeatherLog) => void;
  deleteWeatherLog: (id: string) => void;
  documents: DocumentItem[];
  documentFolders: DocumentFolder[];
  addDocument: (doc: DocumentItem) => void;
  updateDocument: (doc: DocumentItem) => void;
  deleteDocument: (id: string) => void;
  assignDocumentToActivity: (docId: string, activityId?: string, activityName?: string) => void;
  addDocumentFolder: (folder: DocumentFolder) => void;
  updateDocumentFolder: (folder: DocumentFolder) => void;
  deleteDocumentFolder: (id: string) => void;
  moveDocumentsToFolder: (docIds: string[], folderId: string, folderPath?: string) => void;
  bulkUpdateDocuments: (docIds: string[], updates: Partial<DocumentItem>) => void;
  bulkDeleteDocuments: (docIds: string[]) => void;
  workPackageBinders: WorkPackageBinder[];
  addWorkPackageBinder: (binder: WorkPackageBinder) => void;
  updateWorkPackageBinder: (binder: WorkPackageBinder) => void;
  deleteWorkPackageBinder: (id: string) => void;
  toggleDocInWorkPackage: (binderId: string, docId: string) => void;
  documentTransmittals: DocumentTransmittal[];
  addDocumentTransmittal: (transmittal: DocumentTransmittal) => void;
  updateDocumentTransmittal: (transmittal: DocumentTransmittal) => void;
  deleteDocumentTransmittal: (id: string) => void;
  addAccommodation: (acc: AccommodationUnit) => void;
  updateAccommodation: (acc: AccommodationUnit) => void;
  deleteAccommodation: (id: string) => void;
  assignEmployeeToAccommodation: (accId: string, empId: string, roomNumber?: string) => void;
  removeEmployeeFromAccommodation: (accId: string, empId: string) => void;
  addAccommodationUtility: (log: AccommodationUtilityLog) => void;
  deleteAccommodationUtility: (id: string) => void;
  addAccommodationPayment: (payment: AccommodationPaymentLog) => void;
  updateAccommodationPayment: (payment: AccommodationPaymentLog) => void;
  deleteAccommodationPayment: (id: string) => void;
}

const DEFAULT_INITIAL_PROFILES: UserProfile[] = [
  {
    id: 'USR-ADMIN-01',
    name: 'Lindokuhle Chris (Admin)',
    role: 'Admin',
    title: 'Lead Administrator & Project Director',
    email: 'Lindokuhlechris@gmail.com',
    phone: '+1 (555) 019-2831',
    company: 'Scedih Engineering',
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
    email: 'manager@scedih.io',
    phone: '+1 (555) 018-9201',
    company: 'Scedih Engineering',
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
    email: 'engineer@scedih.io',
    phone: '+1 (555) 017-4491',
    company: 'Scedih Engineering',
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
    email: 'inspector@scedih.io',
    phone: '+1 (555) 016-3382',
    company: 'Scedih Quality Assurance',
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
    email: 'viewer@scedih.io',
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

const DEFAULT_INITIAL_ACCOMMODATIONS: AccommodationUnit[] = [];

const DEFAULT_INITIAL_UTILITIES: AccommodationUtilityLog[] = [];

const DEFAULT_INITIAL_SURVEY_RECORDS: SurveySectionRecord[] = Array.from({ length: 20 }, (_, i) => {
  const startNum = i + 1;
  const endNum = i + 2;
  const dist = 433;
  const chainStart = `CH ${(i * 0.433).toFixed(3).replace('.', '+')}`;
  const chainEnd = `CH ${((i + 1) * 0.433).toFixed(3).replace('.', '+')}`;
  const isDone = i < 4; // PTS 1-2, 2-3, 3-4, 4-5 are completed
  const isProg = i === 4; // PTS 5-6 in progress
  const status: SurveySectionRecord['status'] = isDone ? 'Completed' : isProg ? 'In Progress' : 'Not Started';
  const completedMeters = isDone ? dist : isProg ? 250 : 0;
  
  return {
    id: `SRV-${String(startNum).padStart(3, '0')}-${String(endNum).padStart(3, '0')}`,
    projectId: 'PRJ-001',
    spanName: `PTS ${startNum} - PTS ${endNum}`,
    startPoint: `PTS ${startNum}`,
    endPoint: `PTS ${endNum}`,
    chainageStart: chainStart,
    chainageEnd: chainEnd,
    distanceMeters: dist,
    completedMeters: completedMeters,
    status: status,
    surveyDate: isDone ? '2026-08-15' : isProg ? '2026-08-16' : undefined,
    surveyors: ['Dimi Maphanga', 'Refumuni Malungane', 'Matume Mathebula', 'Phineas Ngomane'],
    peggingNotes: isDone ? 'Centerline pegs established at 20m intervals. Offset pegs placed left and right.' : undefined,
    benchmarkRef: `BM-PTS-${startNum}`,
    coordinates: `-25.746${startNum}, 28.188${endNum}`,
    elevation: `${1420 + i * 2}m AMSL`,
    linkedActivityId: startNum === 1 ? 'ACT-PTS-1-2' : undefined,
    linkedActivityName: startNum === 1 ? 'PTS 1 - PTS 2 Trench Excavation & Laying' : undefined,
    updatedAt: '2026-08-16'
  };
});

const DEFAULT_INITIAL_NOTES: ActivityNote[] = [
  {
    id: 'NOTE-101',
    activityId: 'ACT-1179',
    activityName: 'PTS08 TO PTS15',
    subtaskId: 'ST-001',
    subtaskTitle: 'Trench set-out',
    subtaskSeq: '1.0',
    title: 'Topographic setting-out & benchmark verification',
    content: 'Surveyor team confirmed pegging coordinates from PTS08 to PTS12. Verified benchmark elevation at BM-4 (433m). Minor offset detected on western boundary; adjusted alignment accordingly.',
    category: 'Technical Memo',
    priority: 'High',
    tags: ['Survey', 'Benchmark', 'PTS08-15'],
    isPinned: true,
    isResolved: false,
    author: 'Dimi Maphanga',
    authorRole: 'Lead Surveyor',
    authorInitials: 'DM',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    checklists: [
      { id: 'c1', text: 'Verify benchmark BM-4 elevation (433m)', completed: true },
      { id: 'c2', text: 'Confirm pegging coordinates on western bend', completed: true },
      { id: 'c3', text: 'Issue revised setting-out sheet to civil foreman', completed: false }
    ],
    color: 'blue'
  },
  {
    id: 'NOTE-102',
    activityId: 'ACT-1179',
    activityName: 'PTS08 TO PTS15',
    subtaskId: 'ST-003',
    subtaskTitle: 'Trench marking inspection',
    subtaskSeq: '3.0',
    title: 'QA Bedding Sand Compaction Hold Point',
    content: 'Mandatory Hold Point 3.0 cleared. Nuclear density gauge test confirmed compaction rate of 98.4% Mod AASHTO. Approved to proceed with cable laying.',
    category: 'QA & Inspection',
    priority: 'Urgent',
    tags: ['QA', 'Compaction', 'HoldPoint'],
    isPinned: true,
    isResolved: true,
    author: 'Lindokuhle Chris',
    authorRole: 'QA/QC Engineer',
    authorInitials: 'LC',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    checklists: [
      { id: 'c4', text: 'Compaction test > 98% Mod AASHTO', completed: true },
      { id: 'c5', text: 'Verify trench depth 1.2m minimum', completed: true }
    ],
    color: 'rose'
  },
  {
    id: 'NOTE-103',
    title: 'Heavy Plant Routine Maintenance Schedule',
    content: 'All plant operators to complete daily 10-point machine inspection pre-shift. CAT 320 excavator hydraulic fluid top-up scheduled for Friday afternoon.',
    category: 'Site Observation',
    priority: 'Medium',
    tags: ['Plant', 'Maintenance', 'DailyCheck'],
    isPinned: false,
    isResolved: false,
    author: 'Site Supervisor',
    authorRole: 'Site Operations',
    authorInitials: 'SS',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    color: 'amber'
  }
];

export const DEFAULT_INITIAL_UNIVERSAL_REPORTS: UniversalReportItem[] = [];

export const DEFAULT_REPORT_TEMPLATES: ReportTemplateDefinition[] = [
  {
    id: 'tpl-srv-asbuilt',
    name: 'As-Built Coordinate Tolerance & Setting-Out',
    category: 'Survey',
    description: 'Setting-out pegs, benchmark calibration, and live Easting, Northing & Elevation tolerance checking in millimeters.',
    icon: 'Compass',
    defaultTitle: 'As-Built Setting-Out & Coordinate Tolerance Check',
    docNumberPrefix: 'SRV-ASB',
    disciplineType: 'As-Built Tolerance Verification',
    isSystemPreset: true,
    defaultDataPreset: {
      surveyType: 'As-Built',
      instrument: 'Leica TS16 Total Station (1" PinPoint Accuracy)',
      coordinateSystem: 'Lo29 / WGS84 Universal Grid',
      verticalDatum: 'Mean Sea Level (MSL) Benchmark BM-04',
      maxAllowedHorizontalToleranceMm: 15,
      maxAllowedVerticalToleranceMm: 10
    }
  },
  {
    id: 'tpl-srv-cutfill',
    name: 'Earthworks Cut & Fill Volumetric Summary',
    category: 'Survey',
    description: 'Volumetric earthwork computation, design vs actual cut/fill comparisons, compaction factors, and net balance.',
    icon: 'Scale',
    defaultTitle: 'Earthworks Cut & Fill Volumetric Quantity Report',
    docNumberPrefix: 'SRV-VOL',
    disciplineType: 'Cut & Fill Earthwork Volumetrics',
    isSystemPreset: true,
    defaultDataPreset: {
      surveyType: 'Cut & Fill Volume',
      instrument: 'Trimble R12 GNSS RTK Base & Rover',
      compactionFactor: 1.15,
      maxAllowedHorizontalToleranceMm: 25,
      maxAllowedVerticalToleranceMm: 20
    }
  },
  {
    id: 'tpl-fin-claim',
    name: 'Interim Payment Certificate (IPC) & Progress Claim',
    category: 'Finance',
    description: 'Contract valuation claim with BOQ item lines, previous/current quantities, retention deduction, VAT, and net payable certificate.',
    icon: 'DollarSign',
    defaultTitle: 'Interim Payment Certificate & Valuation Claim',
    docNumberPrefix: 'FIN-IPC',
    isSystemPreset: true,
    defaultDataPreset: {
      valuationType: 'Interim Progress Claim',
      currency: 'ZAR (R)',
      retentionPercentage: 10,
      vatPercentage: 15
    }
  },
  {
    id: 'tpl-fin-variation',
    name: 'Variation Order & Commercial Valuation',
    category: 'Finance',
    description: 'Contract variation order, scope adjustment, rate analysis, and net financial impact on contractual baseline.',
    icon: 'DollarSign',
    defaultTitle: 'Contract Variation Order & Budget Valuation',
    docNumberPrefix: 'FIN-VO',
    isSystemPreset: true,
    defaultDataPreset: {
      valuationType: 'Variation Order Report',
      currency: 'ZAR (R)',
      retentionPercentage: 10,
      vatPercentage: 15
    }
  },
  {
    id: 'tpl-flt-daily',
    name: 'Daily Plant, Fleet Utilization & Fuel Log',
    category: 'Fleet',
    description: 'Heavy machinery tracking, start/end hour meters, fuel liters dispensed, operating vs idle hours, and availability %.',
    icon: 'Truck',
    defaultTitle: 'Daily Heavy Plant Utilization, Fuel & Availability Log',
    docNumberPrefix: 'FLT-LOG',
    isSystemPreset: true,
    defaultDataPreset: {
      shift: 'Day Shift'
    }
  },
  {
    id: 'tpl-mat-delivery',
    name: 'Material Delivery & Quality Conformance',
    category: 'Materials',
    description: 'Delivery notes, mill test certificate attachment, quality pass/fail checks, batch tracking, and warehouse storage locations.',
    icon: 'Package',
    defaultTitle: 'Materials Receiving, Mill Test & Quality Conformance Certificate',
    docNumberPrefix: 'MAT-QA',
    isSystemPreset: true,
    defaultDataPreset: {
      discipline: 'Civil / Structural Steel'
    }
  },
  {
    id: 'tpl-camp-audit',
    name: 'Camp Accommodation & Facility Health Audit',
    category: 'Accommodation',
    description: 'Living quarters occupancy %, bed capacity, room hygiene scorecards, and daily water, power & generator utility logs.',
    icon: 'Home',
    defaultTitle: 'Site Village & Accommodation Camp Facility & Utility Audit',
    docNumberPrefix: 'CMP-AUD',
    isSystemPreset: true,
    defaultDataPreset: {}
  },
  {
    id: 'tpl-qa-ncr',
    name: 'Site Quality Audit & NCR Resolution',
    category: 'Quality',
    description: 'Quality surveillance, non-conformance root cause, corrective actions, and QA engineer sign-off endorsements.',
    icon: 'ShieldCheck',
    defaultTitle: 'Site Quality Surveillance & NCR Resolution Report',
    docNumberPrefix: 'QA-REP',
    isSystemPreset: true,
    defaultDataPreset: {}
  },
  {
    id: 'tpl-prg-wpr',
    name: 'Weekly Executive Progress Report (WPR)',
    category: 'WeeklyProgress',
    description: 'Automated 1-click aggregation of safe man-hours, active work packages, S-curve variances, and lookahead schedules.',
    icon: 'FileBarChart',
    defaultTitle: 'Weekly Progress Report (WPR)',
    docNumberPrefix: 'PRG-WPR',
    isSystemPreset: true,
    defaultDataPreset: {}
  },
  {
    id: 'tpl-custom-matrix',
    name: 'Custom Dynamic Table & Matrix Template',
    category: 'DailySite',
    description: 'Fully customizable blank template with dynamic column headers, auto-calculating numerical fields, and custom sections.',
    icon: 'Sparkles',
    defaultTitle: 'Technical Operations & Specialized Report',
    docNumberPrefix: 'RPT-CUS',
    isSystemPreset: true,
    defaultDataPreset: {}
  }
];

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
  const [rfis, setRFIs] = useState<QARFIItem[]>(() => {
    try {
      const saved = localStorage.getItem('constructos_rfis');
      return saved ? JSON.parse(saved) : [
        {
          id: 'RFI-001',
          rfiNumber: 'WIR-2026-041',
          projectId: 'PRJ-001',
          activityId: 'ACT-001',
          title: 'Work Inspection Request: Trench Depth & Bedding for MV Cable Block 20-21',
          rfiType: 'Request For Inspection (WIR)',
          discipline: 'Earthworks',
          location: 'Block 20 to 21, Chainage 0+000 to 0+150',
          requestedBy: 'Advocate (Site Engineer)',
          assignedReviewer: 'David Smith (Lead QA Consultant)',
          dateSubmitted: '2026-08-20',
          targetResponseDate: '2026-08-22',
          status: 'Approved',
          priority: 'High',
          measurementType: 'Length',
          unit: 'm',
          quantity: 150,
          toleranceSpec: '±10mm / SANS 1200',
          description: 'Formal inspection request for MV Cable trench excavation, level survey, and bedding sand layer thickness prior to cable laying.',
          responseClarification: 'Levels and bedding sand thickness verified on site. Cleared to proceed with cable pull.'
        },
        {
          id: 'RFI-002',
          rfiNumber: 'WIR-2026-042',
          projectId: 'PRJ-001',
          activityId: 'ACT-002',
          title: 'Hold Point Clearance: Substation Foundation Rebar & Pre-Pour Embedment',
          rfiType: 'Hold Point Clearance',
          discipline: 'Concrete',
          location: 'Substation Building Grid A1-D4 Level 0',
          requestedBy: 'Michael Moyo (Civil Foreman)',
          assignedReviewer: 'David Smith (Lead QA Consultant)',
          dateSubmitted: '2026-08-21',
          targetResponseDate: '2026-08-23',
          status: 'Under Review',
          priority: 'Critical',
          measurementType: 'Volume',
          unit: 'm³',
          quantity: 85,
          toleranceSpec: 'Min 35 MPa / BS EN 12390',
          description: 'Mandatory Quality Hold Point: Inspection of bottom & top reinforcement mats, starter bars, and earth bonding before 85 m³ pour.',
          responseClarification: 'Cover blocks and tie wire inspected. Awaiting final earth bar continuity test certificate.'
        },
        {
          id: 'RFI-003',
          rfiNumber: 'RFI-2026-018',
          projectId: 'PRJ-001',
          title: 'Technical Query: Conflict between Trench Route & Existing Water Main at Ch 0+320',
          rfiType: 'Request For Information (Technical Query)',
          discipline: 'Civil Utilities',
          location: 'Access Road Ch 0+320',
          requestedBy: 'Thabo Ndlovu (Site Engineer)',
          assignedReviewer: 'Sipho Zulu (Consulting Civil Engineer)',
          dateSubmitted: '2026-08-22',
          targetResponseDate: '2026-08-24',
          status: 'Submitted',
          priority: 'High',
          measurementType: 'Length',
          unit: 'm',
          quantity: 40,
          toleranceSpec: 'Min 500mm vertical clearance',
          description: 'Discovered an unmapped 150mm municipal water pipe crossing the proposed trench alignment at 1.1m depth. Requesting engineered sleeve detail or detour route.'
        },
        {
          id: 'RFI-004',
          rfiNumber: 'WIR-2026-043',
          projectId: 'PRJ-001',
          title: 'Material Approval: Structural Steel Girders & Anchor Bolts Batch #4',
          rfiType: 'Material Approval Request',
          discipline: 'Structural Steel',
          location: 'Fabrication Yard / Laydown Area B',
          requestedBy: 'Lerato Khumalo (QC Inspector)',
          assignedReviewer: 'David Smith (Lead QA Consultant)',
          dateSubmitted: '2026-08-19',
          targetResponseDate: '2026-08-21',
          dateClosed: '2026-08-21',
          status: 'Approved',
          priority: 'Medium',
          measurementType: 'Weight',
          unit: 'tonnes',
          quantity: 28.5,
          toleranceSpec: 'S355JR / ISO 9001 Mill Certificate',
          description: 'Verification of mill test certificates, galvanizing thickness (min 85 microns), and ultrasonic test reports for 28.5 tonnes of steel girders.'
        }
      ];
    } catch {
      return [];
    }
  });
  const DEFAULT_ISO_DOCUMENT_FOLDERS: DocumentFolder[] = [
    { id: 'FLD-01', projectId: 'PRJ-001', name: '01 - Contracts & Commercial Agreements', code: '01-COM', parentId: null, color: '#0B5FFF' },
    { id: 'FLD-02', projectId: 'PRJ-001', name: '02 - Drawings & Blueprints', code: '02-DWG', parentId: null, color: '#10b981' },
    { id: 'FLD-02-1', projectId: 'PRJ-001', name: '02.1 - Civil & Earthworks', code: '02-CIV', parentId: 'FLD-02' },
    { id: 'FLD-02-2', projectId: 'PRJ-001', name: '02.2 - Structural & Concrete', code: '02-STR', parentId: 'FLD-02' },
    { id: 'FLD-02-3', projectId: 'PRJ-001', name: '02.3 - Electrical & MV Cabling', code: '02-ELE', parentId: 'FLD-02' },
    { id: 'FLD-02-4', projectId: 'PRJ-001', name: '02.4 - Mechanical & Piping', code: '02-MEC', parentId: 'FLD-02' },
    { id: 'FLD-02-5', projectId: 'PRJ-001', name: '02.5 - Geotechnical & Topo Survey', code: '02-GEO', parentId: 'FLD-02' },
    { id: 'FLD-03', projectId: 'PRJ-001', name: '03 - Technical Specifications & Data Sheets', code: '03-SPC', parentId: null, color: '#f59e0b' },
    { id: 'FLD-04', projectId: 'PRJ-001', name: '04 - Method Statements & SWMS', code: '04-MS', parentId: null, color: '#8b5cf6' },
    { id: 'FLD-05', projectId: 'PRJ-001', name: '05 - QA/QC Inspection Test Plans (ITPs)', code: '05-QA', parentId: null, color: '#06b6d4' },
    { id: 'FLD-06', projectId: 'PRJ-001', name: '06 - HSE, Safety & Environmental Compliance', code: '06-HSE', parentId: null, color: '#ec4899' },
    { id: 'FLD-07', projectId: 'PRJ-001', name: '07 - Vendor & Subcontractor Submittals', code: '07-SUB', parentId: null, color: '#6366f1' },
    { id: 'FLD-08', projectId: 'PRJ-001', name: '08 - Site Photos & Field Evidence', code: '08-PHO', parentId: null, color: '#64748b' }
  ];

  const [documentFolders, setDocumentFolders] = useState<DocumentFolder[]>(() => {
    try {
      const saved = localStorage.getItem('constructos_document_folders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_ISO_DOCUMENT_FOLDERS;
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('constructos_document_folders', JSON.stringify(documentFolders));
    } catch {
      // ignore
    }
  }, [documentFolders]);

  const DEFAULT_INITIAL_WORK_PACKAGES: WorkPackageBinder[] = [
    {
      id: 'WPB-01',
      projectId: 'PRJ-001',
      code: 'WPB-CIV-001',
      title: 'Main Foundation & Rebar Pour Dossier',
      discipline: 'Civil',
      status: 'Active On-Site',
      description: 'Civil structural drawing set, concrete mix design specs, rebar bending schedules, and ITP signoff pack.',
      documentIds: [],
      createdDate: '2026-08-20',
      createdBy: 'Lindokuhle Chris'
    },
    {
      id: 'WPB-02',
      projectId: 'PRJ-001',
      code: 'WPB-ELE-001',
      title: 'MV Inverter & 33kV Substation Cable Pulling Pack',
      discipline: 'Electrical & MEP',
      status: 'Active On-Site',
      description: 'Single line diagram (SLD), trench cross sections, cable schedule, and factory test reports.',
      documentIds: [],
      createdDate: '2026-08-21',
      createdBy: 'Lindokuhle Chris'
    },
    {
      id: 'WPB-03',
      projectId: 'PRJ-001',
      code: 'WPB-STR-001',
      title: 'Structural Steel Tracker Framing & Torquing Dossier',
      discipline: 'Structural',
      status: 'Drafting',
      description: 'Tracker structural framing blueprints, torque inspection log templates, and mill certificates.',
      documentIds: [],
      createdDate: '2026-08-22',
      createdBy: 'Lindokuhle Chris'
    }
  ];

  const [workPackageBinders, setWorkPackageBinders] = useState<WorkPackageBinder[]>(() => {
    try {
      const saved = localStorage.getItem('constructos_work_package_binders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_INITIAL_WORK_PACKAGES;
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('constructos_work_package_binders', JSON.stringify(workPackageBinders));
    } catch {}
  }, [workPackageBinders]);

  const [documentTransmittals, setDocumentTransmittals] = useState<DocumentTransmittal[]>(() => {
    try {
      const saved = localStorage.getItem('constructos_document_transmittals');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return [];
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('constructos_document_transmittals', JSON.stringify(documentTransmittals));
    } catch {}
  }, [documentTransmittals]);

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [accommodations, setAccommodations] = useState<AccommodationUnit[]>([]);
  const [accommodationUtilities, setAccommodationUtilities] = useState<AccommodationUtilityLog[]>([]);
  const [accommodationPayments, setAccommodationPayments] = useState<AccommodationPaymentLog[]>([]);
  const [surveyRecords, setSurveyRecords] = useState<SurveySectionRecord[]>(DEFAULT_INITIAL_SURVEY_RECORDS);
  const [universalReports, setUniversalReports] = useState<UniversalReportItem[]>(() => {
    try {
      const saved = localStorage.getItem('constructos_universal_reports');
      if (saved) {
        const parsed = JSON.parse(saved);
        const filtered = Array.isArray(parsed) ? parsed.filter((r: UniversalReportItem) => 
          !r.id?.startsWith('REP-SRV-') && 
          !r.id?.startsWith('REP-WPR-') && 
          !r.id?.startsWith('REP-FIN-') && 
          !r.id?.startsWith('REP-FLT-') && 
          !r.id?.startsWith('REP-MAT-') && 
          !r.id?.startsWith('REP-CAMP-') && 
          !r.id?.startsWith('REP-CUST-')
        ) : [];
        return filtered;
      }
      return [];
    } catch {
      return [];
    }
  });
  const [reportTemplates, setReportTemplates] = useState<ReportTemplateDefinition[]>(() => {
    try {
      const saved = localStorage.getItem('constructos_report_templates');
      return saved ? JSON.parse(saved) : DEFAULT_REPORT_TEMPLATES;
    } catch {
      return DEFAULT_REPORT_TEMPLATES;
    }
  });
  const [notes, setNotes] = useState<ActivityNote[]>(() => {
    try {
      const saved = localStorage.getItem('constructos_notes');
      return saved ? JSON.parse(saved) : DEFAULT_INITIAL_NOTES;
    } catch {
      return DEFAULT_INITIAL_NOTES;
    }
  });
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [currentUserProfile, setCurrentUserProfileState] = useState<UserProfile>({
    id: 'USR-001',
    name: 'Current User',
    role: 'Manager',
    title: 'Site Supervisor',
    email: 'user@scedih.io',
    phone: '',
    company: 'Scedih Engineering',
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

  const syncToastTimerRef = React.useRef<any>(null);

  const triggerSyncToast = (
    message?: string, 
    type?: 'syncing' | 'warning' | 'success' | 'offline' | 'info' | 'error',
    autoDismissMs: number = 3500
  ) => {
    if (syncToastTimerRef.current) {
      clearTimeout(syncToastTimerRef.current);
      syncToastTimerRef.current = null;
    }

    const resolvedType = type || (isSyncing ? 'syncing' : isOffline ? 'offline' : 'warning');
    setSyncToast({
      visible: true,
      message,
      type: resolvedType
    });

    if (resolvedType !== 'syncing' && autoDismissMs > 0) {
      syncToastTimerRef.current = setTimeout(() => {
        setSyncToast(prev => ({ ...prev, visible: false }));
        syncToastTimerRef.current = null;
      }, autoDismissMs);
    }
  };

  const hideSyncToast = () => {
    if (syncToastTimerRef.current) {
      clearTimeout(syncToastTimerRef.current);
      syncToastTimerRef.current = null;
    }
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
        reminders,
        surveyRecords
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
      if (getLocal('auditLogs')) setAuditLogs(getLocal('auditLogs'));
      if (getLocal('safetyIncidents')) setSafetyIncidents(getLocal('safetyIncidents'));
      if (getLocal('allocations')) setAllocations(getLocal('allocations'));
      if (getLocal('materials')) setMaterials(getLocal('materials'));
      if (getLocal('materialReceipts')) setMaterialReceipts(getLocal('materialReceipts'));
      if (getLocal('materialUsages')) setMaterialUsages(getLocal('materialUsages'));
      if (getLocal('customFieldDefinitions')) setCustomFieldDefinitions(getLocal('customFieldDefinitions'));
      if (getLocal('employees')) setEmployees(getLocal('employees'));
      if (getLocal('teams')) setTeams(getLocal('teams'));
      if (getLocal('equipment')) setEquipment(getLocal('equipment'));
      if (getLocal('equipmentLogs')) setEquipmentLogs(getLocal('equipmentLogs'));
      if (getLocal('safetyRequirements')) setSafetyRequirements(getLocal('safetyRequirements'));
      if (getLocal('safetyPolicies')) setSafetyPolicies(getLocal('safetyPolicies'));
      if (getLocal('activityInspections')) setActivityInspections(getLocal('activityInspections'));
      if (getLocal('siteInspectionPhotos')) setSiteInspectionPhotos(getLocal('siteInspectionPhotos'));
      if (getLocal('ppeItems')) setPPEItems(getLocal('ppeItems'));
      if (getLocal('qaInspections')) setQAInspections(getLocal('qaInspections'));
      if (getLocal('documents')) setDocuments(getLocal('documents'));
      
      const localAcc = getLocal('accommodations');
      if (localAcc && Array.isArray(localAcc)) {
        const cleanedAcc = localAcc.filter(a => !['ACC-101', 'ACC-102', 'ACC-103'].includes(a.id));
        setAccommodations(cleanedAcc);
        localStorage.setItem('accommodations', JSON.stringify(cleanedAcc));
      } else {
        setAccommodations([]);
        localStorage.setItem('accommodations', JSON.stringify([]));
      }

      const localUtils = getLocal('accommodationUtilities');
      if (localUtils && Array.isArray(localUtils)) {
        const cleanedUtils = localUtils.filter(u => !['ACC-UTL-001', 'ACC-UTL-002', 'ACC-UTL-003', 'ACC-UTL-004'].includes(u.id));
        setAccommodationUtilities(cleanedUtils);
        localStorage.setItem('accommodationUtilities', JSON.stringify(cleanedUtils));
      } else {
        setAccommodationUtilities([]);
        localStorage.setItem('accommodationUtilities', JSON.stringify([]));
      }

      const localPays = getLocal('accommodationPayments');
      if (localPays && Array.isArray(localPays)) {
        setAccommodationPayments(localPays);
      } else {
        setAccommodationPayments([]);
      }

      const localSurveys = getLocal('surveyRecords');
      if (localSurveys && Array.isArray(localSurveys)) {
        setSurveyRecords(localSurveys);
      } else {
        setSurveyRecords(DEFAULT_INITIAL_SURVEY_RECORDS);
        localStorage.setItem('surveyRecords', JSON.stringify(DEFAULT_INITIAL_SURVEY_RECORDS));
      }

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

    // 1.5. Hydrate from IndexedDB offline database in case IDB has restored data not yet in localStorage
    import('../lib/idbService').then(({ getAllIDBData }) => {
      return getAllIDBData();
    }).then(idbData => {
      if (!idbData) return;
      const hydrateFromIDB = (key: string, setter: React.Dispatch<React.SetStateAction<any[]>>) => {
        const arr = idbData[key];
        if (Array.isArray(arr) && arr.length > 0) {
          setter(prev => {
            if (!prev || prev.length === 0) {
              try { localStorage.setItem(key, JSON.stringify(arr)); } catch {}
              return arr;
            }
            return prev;
          });
        }
      };
      hydrateFromIDB('projects', setProjects);
      hydrateFromIDB('activities', setActivities);
      hydrateFromIDB('reports', setReports);
      hydrateFromIDB('weatherLogs', setWeatherLogs);
      hydrateFromIDB('labourLogs', setLabourLogs);
      hydrateFromIDB('labourAllocations', setLabourAllocations);
      hydrateFromIDB('workerCheckIns', setWorkerCheckIns);
      hydrateFromIDB('auditLogs', setAuditLogs);
      hydrateFromIDB('safetyIncidents', setSafetyIncidents);
      hydrateFromIDB('allocations', setAllocations);
      hydrateFromIDB('materials', setMaterials);
      hydrateFromIDB('materialReceipts', setMaterialReceipts);
      hydrateFromIDB('materialUsages', setMaterialUsages);
      hydrateFromIDB('customFieldDefinitions', setCustomFieldDefinitions);
      hydrateFromIDB('employees', setEmployees);
      hydrateFromIDB('teams', setTeams);
      hydrateFromIDB('equipment', setEquipment);
      hydrateFromIDB('equipmentLogs', setEquipmentLogs);
      hydrateFromIDB('safetyRequirements', setSafetyRequirements);
      hydrateFromIDB('safetyPolicies', setSafetyPolicies);
      hydrateFromIDB('activityInspections', setActivityInspections);
      hydrateFromIDB('siteInspectionPhotos', setSiteInspectionPhotos);
      hydrateFromIDB('ppeItems', setPPEItems);
      hydrateFromIDB('qaInspections', setQAInspections);
      hydrateFromIDB('documents', setDocuments);
      hydrateFromIDB('accommodations', setAccommodations);
      hydrateFromIDB('accommodationUtilities', setAccommodationUtilities);
      hydrateFromIDB('accommodationPayments', setAccommodationPayments);
      hydrateFromIDB('surveyRecords', setSurveyRecords);
      hydrateFromIDB('reminders', setReminders);
      hydrateFromIDB('constructos_notes', setNotes);
    }).catch(err => console.warn('Could not hydrate from IDB on mount:', err));

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
        mergeServer('accommodations', setAccommodations);
        mergeServer('accommodationUtilities', setAccommodationUtilities);
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
      syncOrMergeCollection(data.accommodations, setAccommodations, 'accommodations');
      syncOrMergeCollection(data.accommodationUtilities, setAccommodationUtilities, 'accommodationUtilities');
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
  React.useEffect(() => { handleLocalChange('accommodations', accommodations); }, [accommodations, handleLocalChange]);
  React.useEffect(() => { handleLocalChange('accommodationUtilities', accommodationUtilities); }, [accommodationUtilities, handleLocalChange]);
  React.useEffect(() => { handleLocalChange('siteInspectionPhotos', siteInspectionPhotos); }, [siteInspectionPhotos, handleLocalChange]);
  React.useEffect(() => { handleLocalChange('ppeItems', ppeItems); }, [ppeItems, handleLocalChange]);
  React.useEffect(() => { handleLocalChange('qaInspections', qaInspections); }, [qaInspections, handleLocalChange]);
  React.useEffect(() => { handleLocalChange('constructos_rfis', rfis); }, [rfis, handleLocalChange]);
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

  const addUniversalReport = (newReport: UniversalReportItem) => {
    setUniversalReports(prev => {
      const updated = [newReport, ...prev];
      try {
        localStorage.setItem('constructos_universal_reports', JSON.stringify(updated));
      } catch (err) {
        console.error('Error caching universal reports', err);
      }
      return updated;
    });

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: newReport.projectId || projects[0]?.id || 'PRJ-001',
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: `${newReport.category} Report Created`,
      details: `Created ${newReport.category} report "${newReport.title}" (${newReport.documentNumber})`,
      timestamp: new Date().toISOString(),
      entityType: 'Report',
      entityId: newReport.id,
      actionType: 'create',
      newValue: `Title: ${newReport.title} | Type: ${newReport.reportType} | Status: ${newReport.status}`
    });
  };

  const updateUniversalReport = (updatedReport: UniversalReportItem) => {
    setUniversalReports(prev => {
      const updated = prev.map(r => r.id === updatedReport.id ? updatedReport : r);
      try {
        localStorage.setItem('constructos_universal_reports', JSON.stringify(updated));
      } catch (err) {
        console.error('Error caching universal reports', err);
      }
      return updated;
    });

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: updatedReport.projectId || projects[0]?.id || 'PRJ-001',
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: `${updatedReport.category} Report Updated`,
      details: `Updated ${updatedReport.category} report "${updatedReport.title}" (${updatedReport.documentNumber})`,
      timestamp: new Date().toISOString(),
      entityType: 'Report',
      entityId: updatedReport.id,
      actionType: 'update'
    });
  };

  const deleteUniversalReport = (id: string) => {
    const reportToDelete = universalReports.find(r => r.id === id);
    setUniversalReports(prev => {
      const updated = prev.filter(r => r.id !== id);
      try {
        localStorage.setItem('constructos_universal_reports', JSON.stringify(updated));
      } catch (err) {
        console.error('Error caching universal reports', err);
      }
      return updated;
    });

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: reportToDelete?.projectId || projects[0]?.id || 'PRJ-001',
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: `${reportToDelete?.category || 'Report'} Deleted`,
      details: reportToDelete ? `Deleted ${reportToDelete.category} Report "${reportToDelete.title}"` : `Deleted Report #${id}`,
      timestamp: new Date().toISOString(),
      entityType: 'Report',
      entityId: id,
      actionType: 'delete'
    });
  };

  const addReportTemplate = (newTemplate: ReportTemplateDefinition) => {
    setReportTemplates(prev => {
      const updated = [newTemplate, ...prev];
      try {
        localStorage.setItem('constructos_report_templates', JSON.stringify(updated));
      } catch (err) {
        console.error('Error saving report template', err);
      }
      return updated;
    });
  };

  const updateReportTemplate = (updatedTemplate: ReportTemplateDefinition) => {
    setReportTemplates(prev => {
      const updated = prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t);
      try {
        localStorage.setItem('constructos_report_templates', JSON.stringify(updated));
      } catch (err) {
        console.error('Error updating report template', err);
      }
      return updated;
    });
  };

  const deleteReportTemplate = (id: string) => {
    setReportTemplates(prev => {
      const updated = prev.filter(t => t.id !== id);
      try {
        localStorage.setItem('constructos_report_templates', JSON.stringify(updated));
      } catch (err) {
        console.error('Error deleting report template', err);
      }
      return updated;
    });
  };

  const compileWeeklyProgressReport = (projectId: string, startDate: string, endDate: string): UniversalReportItem<WeeklyProgressReportData> => {
    const projActivities = activities.filter(a => a.projectId === projectId);
    const periodDailyReports = reports.filter(r => r.projectId === projectId && r.date >= startDate && r.date <= endDate);
    const periodQA = qaInspections.filter(q => q.projectId === projectId && q.date >= startDate && q.date <= endDate);
    const periodIncidents = safetyIncidents.filter(s => s.projectId === projectId && s.dateReported >= startDate && s.dateReported <= endDate);

    // Sum manpower and safe hours
    const totalWorkers = periodDailyReports.reduce((sum, r) => sum + (r.workersOnSite || 0), 0);
    const peakWorkers = periodDailyReports.reduce((max, r) => Math.max(max, r.workersOnSite || 0), 0) || 24;
    const safeManHours = totalWorkers * 8.5; // Avg 8.5h shift

    // Activity breakdown
    const activitySnapshots: WeeklyActivitySnapshot[] = projActivities.map(a => {
      const plannedWeek = a.dailyTargetQuantity ? a.dailyTargetQuantity * 6 : Math.round((a.targetQuantity || 100) * 0.1);
      const actualWeek = Math.round((a.actualQuantity || 50) * 0.15) || 10;
      const varPct = plannedWeek > 0 ? Math.round(((actualWeek - plannedWeek) / plannedWeek) * 100) : 0;
      return {
        activityId: a.id,
        activityName: a.name,
        workPackage: a.workPackage || 'General Works',
        plannedThisWeek: plannedWeek,
        actualThisWeek: actualWeek,
        unit: a.unit || 'm',
        cumulativeProgressPct: a.progress || 0,
        status: a.status || 'In Progress',
        variancePct: varPct,
        remarks: varPct >= 0 ? 'On or ahead of schedule' : 'Minor delay due to ground conditions'
      };
    });

    const openNCRs = periodQA.filter(q => q.status === 'Failed').length;
    const closedNCRs = periodQA.filter(q => q.status === 'Passed' && q.ncrCode).length;

    const startD = new Date(startDate);
    const oneJan = new Date(startD.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((startD.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
    const weekNum = Math.ceil((startD.getDay() + 1 + numberOfDays) / 7) || 1;

    const docNum = `PRG-WPR-${startD.getFullYear()}-W${weekNum < 10 ? '0' + weekNum : weekNum}`;

    return {
      id: `WPR-${Date.now()}`,
      projectId,
      reportType: 'WEEKLY_PROGRESS',
      category: 'WeeklyProgress',
      title: `Weekly Progress Report - Week ${weekNum} (${startDate} to ${endDate})`,
      documentNumber: docNum,
      revision: 'Rev 0',
      date: endDate,
      submissionDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
      author: currentUserProfile?.name || 'David Smith',
      authorRole: currentUserProfile?.role || 'Site Manager',
      status: 'Submitted',
      location: 'Site-Wide',
      summaryNotes: `Weekly progress compilation for Week ${weekNum}. ${projActivities.length} active construction packages tracked.`,
      signoffs: [
        {
          role: 'Site Construction Manager',
          name: currentUserProfile?.name || 'David Smith',
          date: new Date().toISOString().split('T')[0],
          status: 'Approved',
          notes: 'Auto-compiled from verified daily logs.'
        }
      ],
      data: {
        weekNumber: weekNum,
        year: startD.getFullYear(),
        startDate,
        endDate,
        executiveSummary: `Site operations progressed across ${projActivities.length} main activities during Week ${weekNum}. A total of ${safeManHours.toLocaleString()} safe man-hours were recorded with ${periodIncidents.length} safety incidents.`,
        plannedWeeklyProgressPct: 4.5,
        actualWeeklyProgressPct: 4.9,
        cumulativePlannedProgressPct: 60.0,
        cumulativeActualProgressPct: 63.5,
        safeManHoursThisWeek: safeManHours,
        cumulativeSafeManHours: 35000 + safeManHours,
        workersPeakCount: peakWorkers,
        incidentsCount: periodIncidents.length,
        nearMissCount: 1,
        toolboxesConducted: periodDailyReports.length || 5,
        inspectionsConducted: periodQA.length || 8,
        openNCRsCount: openNCRs,
        closedNCRsCount: closedNCRs,
        activities: activitySnapshots,
        criticalDelaysAndBlockers: [
          'Weather interruptions during mid-week rain showers',
          'Material delivery coordination for high-spec piping'
        ],
        lookaheadSchedule: [
          {
            activityName: 'Section Continuation & Trenching',
            targetStartDate: new Date(new Date(endDate).getTime() + 86400000).toISOString().split('T')[0],
            targetFinishDate: new Date(new Date(endDate).getTime() + 7 * 86400000).toISOString().split('T')[0],
            plannedVolume: '250 meters',
            resourcesRequired: '2x Excavators, 1x Survey Crew, 12x Civil Team'
          }
        ]
      }
    };
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
    
    // Reject multi-name comma-separated combined group strings
    const rawName = (newLog.workerName || '').trim();
    if (rawName.includes(',') && rawName.split(',').length > 1) {
      console.warn("Skipping combined multi-worker string log:", rawName);
      return;
    }

    const normName = (newLog.workerName || newLog.trade || 'Worker').trim().toLowerCase();
    const logDate = newLog.date || new Date().toISOString().split('T')[0];
    const isSpecialShift = (newLog.notes || '').toLowerCase().includes('night shift') || (newLog.notes || '').toLowerCase().includes('overtime');

    let processedLog: LabourLog = {
      ...newLog,
      date: logDate,
      hours: Math.min(isSpecialShift ? 16 : 12, Math.max(0.5, Number(newLog.hoursWorked || newLog.hours || 8))),
      hoursWorked: Math.min(isSpecialShift ? 16 : 12, Math.max(0.5, Number(newLog.hoursWorked || newLog.hours || 8)))
    };

    let didUpdateExisting = false;

    setLabourLogs(prev => {
      // If normal shift, check if worker already has a normal shift entry on that date
      if (!isSpecialShift) {
        const existingIndex = prev.findIndex(l => {
          const lName = (l.workerName || l.trade || '').trim().toLowerCase();
          const lDate = l.date;
          const lIsSpecial = (l.notes || '').toLowerCase().includes('night shift') || (l.notes || '').toLowerCase().includes('overtime');
          return lName === normName && lDate === logDate && !lIsSpecial;
        });

        if (existingIndex >= 0) {
          didUpdateExisting = true;
          const existing = prev[existingIndex];
          // Consolidate/update hours capped at 12 max per day
          const consolidatedHours = Math.min(12, Math.max(existing.hoursWorked || existing.hours || 0, processedLog.hoursWorked || processedLog.hours || 8));
          const updatedRecord: LabourLog = {
            ...existing,
            projectId: processedLog.projectId || existing.projectId,
            activityId: processedLog.activityId || existing.activityId,
            startTime: processedLog.startTime || existing.startTime,
            endTime: processedLog.endTime || existing.endTime,
            lunchBreak: processedLog.lunchBreak !== undefined ? processedLog.lunchBreak : existing.lunchBreak,
            hours: consolidatedHours,
            hoursWorked: consolidatedHours,
            trade: processedLog.trade || existing.trade,
            workerType: processedLog.workerType || existing.workerType,
            notes: processedLog.notes || existing.notes
          };
          const updated = [...prev];
          updated[existingIndex] = updatedRecord;
          localStorage.setItem('labourLogs', JSON.stringify(updated));
          if (isManualSyncMode) {
            setHasPendingChanges(true);
            localStorage.setItem('hasPendingChanges', 'true');
            setPendingChangesCount(c => c + 1);
          } else {
            saveFirestoreKey('labourLogs', updated);
          }
          syncToServer('update_labour_log', updatedRecord);
          return updated;
        }
      }

      // If special shift (overtime/night shift), limit cumulative day hours
      if (isSpecialShift) {
        const existingForDay = prev.filter(l => {
          const lName = (l.workerName || l.trade || '').trim().toLowerCase();
          return lName === normName && l.date === logDate;
        });
        const currentTotal = existingForDay.reduce((sum, l) => sum + (l.hoursWorked || l.hours || 0), 0);
        const maxAdditional = Math.max(1, 16 - currentTotal);
        const allowedHours = Math.min(maxAdditional, processedLog.hoursWorked || 8);
        processedLog.hours = allowedHours;
        processedLog.hoursWorked = allowedHours;
      }

      const updated = [processedLog, ...prev];
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

    if (!didUpdateExisting) {
      syncToServer('add_labour_log', processedLog);
    }

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: processedLog.projectId,
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: didUpdateExisting ? 'Labour Log Updated (Consolidated)' : 'Labour Log Created',
      details: `${processedLog.hoursWorked} hours logged for ${processedLog.workerName || processedLog.trade || 'Worker'} on Activity ${processedLog?.activityId || 'N/A'}`,
      timestamp: new Date().toISOString(),
      entityType: 'LabourLog',
      entityId: processedLog.id,
      actionType: didUpdateExisting ? 'update' : 'create',
      newValue: `Worker: ${processedLog.workerName || processedLog.trade || 'N/A'} | Hours: ${processedLog.hoursWorked}`
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
      const hasCostTracking = targetEq?.trackOperationalCost !== false && Boolean(targetEq?.hourlyRate);
      if (enrichedLog.hourlyRateApplied === undefined) {
        enrichedLog.hourlyRateApplied = hasCostTracking ? (targetEq?.hourlyRate || 0) : 0;
      }
      if (enrichedLog.calculatedOperatingCost === undefined) {
        enrichedLog.calculatedOperatingCost = (enrichedLog.hourlyRateApplied || 0) > 0 
          ? (log.hoursAdded * (enrichedLog.hourlyRateApplied || 0)) 
          : 0;
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

  const updateEquipmentLog = (updatedLog: EquipmentLog) => {
    const existingLog = equipmentLogs.find(l => l.id === updatedLog.id);
    const targetEq = equipment.find(e => e.id === updatedLog.equipmentId);
    const enrichedLog: EquipmentLog = { ...updatedLog };

    if (updatedLog.type === 'Hours' && updatedLog.hoursAdded !== undefined) {
      const hasCostTracking = targetEq?.trackOperationalCost !== false && Boolean(targetEq?.hourlyRate);
      if (enrichedLog.hourlyRateApplied === undefined) {
        enrichedLog.hourlyRateApplied = hasCostTracking ? (targetEq?.hourlyRate || 0) : 0;
      }
      if (enrichedLog.calculatedOperatingCost === undefined) {
        enrichedLog.calculatedOperatingCost = (enrichedLog.hourlyRateApplied || 0) > 0 
          ? ((updatedLog.hoursAdded || 0) * (enrichedLog.hourlyRateApplied || 0)) 
          : 0;
      }
    }

    setEquipmentLogs(prev => prev.map(l => l.id === updatedLog.id ? enrichedLog : l));
    syncToServer('update_equipment_log', enrichedLog);

    // Adjust equipment engine hours if hours changed
    if (existingLog && existingLog.type === 'Hours' && enrichedLog.type === 'Hours') {
      const oldHours = existingLog.hoursAdded || 0;
      const newHours = enrichedLog.hoursAdded || 0;
      const delta = newHours - oldHours;
      if (delta !== 0) {
        setEquipment(prev => prev.map(eq => {
          if (eq.id !== enrichedLog.equipmentId) return eq;
          const currentHours = typeof eq.engineHours === 'number' ? eq.engineHours : (parseInt(String(eq.engineHours)) || 0);
          const updatedHours = Math.max(0, currentHours + delta);
          const updated = { ...eq, engineHours: updatedHours };
          syncToServer('update_equipment', updated);
          return updated;
        }));
      }
    }

    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: projects[0]?.id || '',
      userId: userRole === 'Manager' ? 'Current User' : 'Current User',
      action: 'Equipment Log Updated',
      details: `Updated ${updatedLog.type} log for equipment ${updatedLog.equipmentId}`,
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
  const deletePPEItem = (idOrItem: string | PPEMaterialItem) => {
    const id = typeof idOrItem === 'string' ? idOrItem : idOrItem.id;
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

  const updateQAInspection = (inspection: QAInspectionItem, oldId?: string) => {
    const targetId = oldId || inspection.id;
    setQAInspections(prev => prev.map(i => (i.id === targetId || i.id === inspection.id) ? inspection : i));
    syncToServer('update_qa_inspection', { ...inspection, originalId: targetId });

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

  const addRFI = (rfi: QARFIItem) => {
    setRFIs(prev => [rfi, ...prev]);
    syncToServer('add_rfi', rfi);

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: rfi.projectId || projects[0]?.id || 'PRJ-001',
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: 'RFI / Inspection Request Created',
      details: `Created ${rfi.rfiType} "${rfi.rfiNumber}: ${rfi.title}" (${rfi.discipline})`,
      timestamp: new Date().toISOString(),
      entityType: 'QA',
      entityId: rfi.id,
      actionType: 'create'
    });
  };

  const updateRFI = (rfi: QARFIItem) => {
    setRFIs(prev => prev.map(r => r.id === rfi.id ? r : r));
    syncToServer('update_rfi', rfi);

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: rfi.projectId || projects[0]?.id || 'PRJ-001',
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: 'RFI / Inspection Request Updated',
      details: `Updated ${rfi.rfiNumber} status to "${rfi.status}"`,
      timestamp: new Date().toISOString(),
      entityType: 'QA',
      entityId: rfi.id,
      actionType: 'update'
    });
  };

  const deleteRFI = (id: string) => {
    const rfiToDelete = rfis.find(r => r.id === id);
    setRFIs(prev => prev.filter(r => r.id !== id));
    syncToServer('delete_rfi', { id });

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: rfiToDelete?.projectId || projects[0]?.id || 'PRJ-001',
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: 'RFI Deleted',
      details: rfiToDelete ? `Deleted ${rfiToDelete.rfiNumber} (${rfiToDelete.title})` : `Deleted RFI #${id}`,
      timestamp: new Date().toISOString(),
      entityType: 'QA',
      entityId: id,
      actionType: 'delete'
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
        return {
          ...d,
          linkedActivityId: activityId || undefined,
          linkedActivityName: activityName || undefined,
          lastModified: new Date().toISOString()
        };
      }
      return d;
    }));
    syncToServer('assign_document_activity', { docId, activityId, activityName });
  };

  const addDocumentFolder = (folder: DocumentFolder) => {
    setDocumentFolders(prev => [...prev, folder]);
    syncToServer('add_document_folder', folder);
  };

  const updateDocumentFolder = (folder: DocumentFolder) => {
    setDocumentFolders(prev => prev.map(f => f.id === folder.id ? folder : f));
    syncToServer('update_document_folder', folder);
  };

  const deleteDocumentFolder = (id: string) => {
    setDocumentFolders(prev => prev.filter(f => f.id !== id && f.parentId !== id));
    setDocuments(prev => prev.map(d => d.folderId === id ? { ...d, folderId: undefined, folderPath: undefined } : d));
    syncToServer('delete_document_folder', { id });
  };

  const moveDocumentsToFolder = (docIds: string[], folderId: string, folderPath?: string) => {
    setDocuments(prev => prev.map(d => {
      if (docIds.includes(d.id)) {
        return { ...d, folderId, folderPath, lastModified: new Date().toISOString() };
      }
      return d;
    }));
    syncToServer('move_documents_to_folder', { docIds, folderId, folderPath });
  };

  const bulkUpdateDocuments = (docIds: string[], updates: Partial<DocumentItem>) => {
    setDocuments(prev => prev.map(d => {
      if (docIds.includes(d.id)) {
        return { ...d, ...updates, lastModified: new Date().toISOString() };
      }
      return d;
    }));
    syncToServer('bulk_update_documents', { docIds, updates });
  };

  const bulkDeleteDocuments = (docIds: string[]) => {
    setDocuments(prev => prev.filter(d => !docIds.includes(d.id)));
    docIds.forEach(id => deleteDocumentFile(id).catch(console.warn));
    syncToServer('bulk_delete_documents', { docIds });
  };

  const addWorkPackageBinder = (binder: WorkPackageBinder) => {
    setWorkPackageBinders(prev => [binder, ...prev]);
    syncToServer('add_work_package_binder', binder);
  };

  const updateWorkPackageBinder = (binder: WorkPackageBinder) => {
    setWorkPackageBinders(prev => prev.map(b => b.id === binder.id ? binder : b));
    syncToServer('update_work_package_binder', binder);
  };

  const deleteWorkPackageBinder = (id: string) => {
    setWorkPackageBinders(prev => prev.filter(b => b.id !== id));
    syncToServer('delete_work_package_binder', { id });
  };

  const toggleDocInWorkPackage = (binderId: string, docId: string) => {
    setWorkPackageBinders(prev => prev.map(b => {
      if (b.id === binderId) {
        const exists = b.documentIds.includes(docId);
        const updatedIds = exists ? b.documentIds.filter(id => id !== docId) : [...b.documentIds, docId];
        return { ...b, documentIds: updatedIds };
      }
      return b;
    }));
    syncToServer('toggle_doc_in_work_package', { binderId, docId });
  };

  const addDocumentTransmittal = (transmittal: DocumentTransmittal) => {
    setDocumentTransmittals(prev => [transmittal, ...prev]);
    syncToServer('add_document_transmittal', transmittal);
  };

  const updateDocumentTransmittal = (transmittal: DocumentTransmittal) => {
    setDocumentTransmittals(prev => prev.map(t => t.id === transmittal.id ? transmittal : t));
    syncToServer('update_document_transmittal', transmittal);
  };

  const deleteDocumentTransmittal = (id: string) => {
    setDocumentTransmittals(prev => prev.filter(t => t.id !== id));
    syncToServer('delete_document_transmittal', { id });
  };

  const addAccommodation = (acc: AccommodationUnit) => {
    setAccommodations(prev => [acc, ...prev]);
    syncToServer('add_accommodation', acc);

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: acc.projectId || projects[0]?.id || 'PRJ-001',
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: 'Accommodation Facility Registered',
      details: `Added ${acc.ownership} accommodation: "${acc.name}" (${acc.type}, Capacity: ${acc.totalCapacityBeds} beds)`,
      timestamp: new Date().toISOString(),
      entityType: 'Employee',
      entityId: acc.id,
      actionType: 'create'
    });
  };

  const updateAccommodation = (acc: AccommodationUnit) => {
    setAccommodations(prev => prev.map(a => a.id === acc.id ? acc : a));
    syncToServer('update_accommodation', acc);
  };

  const deleteAccommodation = (id: string) => {
    const accToDelete = accommodations.find(a => a.id === id);
    setAccommodations(prev => prev.filter(a => a.id !== id));
    syncToServer('delete_accommodation', { id });

    // Also unassign any employees assigned to this facility
    setEmployees(prev => prev.map(emp => {
      if (emp.accommodationDetails?.campId === id || (accToDelete && emp.accommodationDetails?.campName === accToDelete.name)) {
        const updated = {
          ...emp,
          hasAccommodation: false,
          accommodationDetails: undefined
        };
        syncToServer('update_employee', updated);
        return updated;
      }
      return emp;
    }));

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: accToDelete?.projectId || projects[0]?.id || 'PRJ-001',
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: 'Accommodation Facility Deleted',
      details: `Deleted accommodation facility "${accToDelete?.name || id}"`,
      timestamp: new Date().toISOString(),
      entityType: 'Employee',
      entityId: id,
      actionType: 'delete'
    });
  };

  const assignEmployeeToAccommodation = (accId: string, empId: string, roomNumber?: string) => {
    const targetAcc = accommodations.find(a => a.id === accId);
    if (!targetAcc) return;

    // 1. Update accommodation unit's occupantIds
    setAccommodations(prev => prev.map(a => {
      if (a.id === accId) {
        const occupants = a.occupantIds.includes(empId) ? a.occupantIds : [...a.occupantIds, empId];
        const isFull = occupants.length >= a.totalCapacityBeds;
        const updated: AccommodationUnit = {
          ...a,
          occupantIds: occupants,
          status: isFull ? 'Full' : (occupants.length > 0 ? 'Partially Occupied' : 'Available')
        };
        syncToServer('update_accommodation', updated);
        return updated;
      } else {
        // If employee was assigned to a different unit, remove them
        if (a.occupantIds.includes(empId)) {
          const filtered = a.occupantIds.filter(id => id !== empId);
          const updated: AccommodationUnit = {
            ...a,
            occupantIds: filtered,
            status: filtered.length === 0 ? 'Available' : 'Partially Occupied'
          };
          syncToServer('update_accommodation', updated);
          return updated;
        }
      }
      return a;
    }));

    // 2. Update employee's accommodationDetails
    setEmployees(prev => prev.map(emp => {
      if (emp.id === empId) {
        const updated: Employee = {
          ...emp,
          hasAccommodation: true,
          accommodationDetails: {
            ...emp.accommodationDetails,
            campId: targetAcc.id,
            campName: targetAcc.name,
            roomNumber: roomNumber || emp.accommodationDetails?.roomNumber || 'Room 1',
            checkInDate: emp.accommodationDetails?.checkInDate || new Date().toISOString().split('T')[0]
          }
        };
        syncToServer('update_employee', updated);
        return updated;
      }
      return emp;
    }));
  };

  const removeEmployeeFromAccommodation = (accId: string, empId: string) => {
    // 1. Remove from accommodation unit
    setAccommodations(prev => prev.map(a => {
      if (a.id === accId || a.occupantIds.includes(empId)) {
        const filtered = a.occupantIds.filter(id => id !== empId);
        const updated: AccommodationUnit = {
          ...a,
          occupantIds: filtered,
          status: filtered.length === 0 ? 'Available' : 'Partially Occupied'
        };
        syncToServer('update_accommodation', updated);
        return updated;
      }
      return a;
    }));

    // 2. Update employee
    setEmployees(prev => prev.map(emp => {
      if (emp.id === empId) {
        const updated: Employee = {
          ...emp,
          hasAccommodation: false,
          accommodationDetails: undefined
        };
        syncToServer('update_employee', updated);
        return updated;
      }
      return emp;
    }));
  };

  const addAccommodationUtility = (log: AccommodationUtilityLog) => {
    setAccommodationUtilities(prev => [log, ...prev]);
    syncToServer('add_accommodation_utility', log);

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: projects[0]?.id || 'PRJ-001',
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: 'Accommodation Utility Logged',
      details: `Logged ${log.utilityType} (R ${log.amountZAR.toLocaleString()}) for "${log.accommodationName}"`,
      timestamp: new Date().toISOString(),
      entityType: 'Employee',
      entityId: log.id,
      actionType: 'create'
    });
  };

  const deleteAccommodationUtility = (id: string) => {
    setAccommodationUtilities(prev => prev.filter(u => u.id !== id));
    syncToServer('delete_accommodation_utility', { id });
  };

  const addAccommodationPayment = (payment: AccommodationPaymentLog) => {
    setAccommodationPayments(prev => {
      const updated = [payment, ...prev];
      localStorage.setItem('accommodationPayments', JSON.stringify(updated));
      return updated;
    });
    syncToServer('add_accommodation_payment', payment);

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: projects[0]?.id || 'PRJ-001',
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: 'Accommodation Lease Payment Logged',
      details: `Logged lease payment of R ${payment.amountPaidZAR.toLocaleString()} for "${payment.accommodationName}" (${payment.billingPeriod})`,
      timestamp: new Date().toISOString(),
      entityType: 'Employee',
      entityId: payment.id,
      actionType: 'create'
    });
  };

  const updateAccommodationPayment = (payment: AccommodationPaymentLog) => {
    setAccommodationPayments(prev => {
      const updated = prev.map(p => p.id === payment.id ? payment : p);
      localStorage.setItem('accommodationPayments', JSON.stringify(updated));
      return updated;
    });
    syncToServer('update_accommodation_payment', payment);
  };

  const deleteAccommodationPayment = (id: string) => {
    setAccommodationPayments(prev => {
      const updated = prev.filter(p => p.id !== id);
      localStorage.setItem('accommodationPayments', JSON.stringify(updated));
      return updated;
    });
    syncToServer('delete_accommodation_payment', { id });
  };

  const addSurveyRecord = (record: SurveySectionRecord) => {
    setSurveyRecords(prev => {
      const updated = [record, ...prev];
      localStorage.setItem('surveyRecords', JSON.stringify(updated));
      return updated;
    });
    syncToServer('add_survey_record', record);

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: record.projectId || projects[0]?.id || 'PRJ-001',
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: 'Survey Section Added',
      details: `Added survey section "${record.spanName}" (${record.distanceMeters}m)`,
      timestamp: new Date().toISOString(),
      entityType: 'Activity',
      entityId: record.id,
      actionType: 'create'
    });
  };

  const updateSurveyRecord = (record: SurveySectionRecord) => {
    setSurveyRecords(prev => {
      const updated = prev.map(r => r.id === record.id ? record : r);
      localStorage.setItem('surveyRecords', JSON.stringify(updated));
      return updated;
    });
    syncToServer('update_survey_record', record);

    // If this survey record is linked to an activity, also keep the counterpart subtask in sync
    if (record.linkedActivityId) {
      setActivities(prev => prev.map(act => {
        if (act.id !== record.linkedActivityId) return act;
        const subtasks = act.subtasks || [];
        const hasLinkedSubtask = subtasks.some(s => s.surveyRecordId === record.id || s.id === record.linkedSubtaskId);
        
        let updatedSubtasks: SubTask[];
        if (hasLinkedSubtask) {
          updatedSubtasks = subtasks.map(s => {
            if (s.surveyRecordId === record.id || s.id === record.linkedSubtaskId) {
              return {
                ...s,
                status: record.status,
                completedQuantity: record.completedMeters,
                targetQuantity: record.distanceMeters,
                assignedWorkers: record.surveyors && record.surveyors.length > 0 ? record.surveyors : s.assignedWorkers,
                surveyData: {
                  peggingNotes: record.peggingNotes,
                  coordinates: record.coordinates,
                  benchMarkRef: record.benchmarkRef,
                  surveyorName: (record.surveyors || []).join(', '),
                  surveyDate: record.surveyDate,
                  elevation: record.elevation
                }
              };
            }
            return s;
          });
        } else {
          // If the activity doesn't have the subtask yet, add it
          const newLinkedSubtask: SubTask = {
            id: `ST-SURV-${Date.now().toString(36)}`,
            title: `Trench set-out (${record.spanName})`,
            category: 'Surveying & Set-out',
            status: record.status,
            targetQuantity: record.distanceMeters,
            completedQuantity: record.completedMeters,
            unit: 'm',
            assignedWorkers: record.surveyors || [],
            isMilestone: true,
            milestoneCriteria: 'Ground benchmark and trench centerline pegs established & QA verified',
            isLinkedDiscipline: true,
            linkedActivityId: act.id,
            surveyRecordId: record.id,
            sectionSpan: record.spanName,
            chainage: record.chainageStart && record.chainageEnd ? `${record.chainageStart} - ${record.chainageEnd}` : undefined,
            surveyData: {
              peggingNotes: record.peggingNotes,
              coordinates: record.coordinates,
              benchMarkRef: record.benchmarkRef,
              surveyorName: (record.surveyors || []).join(', '),
              surveyDate: record.surveyDate,
              elevation: record.elevation
            }
          };
          updatedSubtasks = [newLinkedSubtask, ...subtasks];
        }

        const totalSubtasks = updatedSubtasks.length;
        const completedCount = updatedSubtasks.filter(s => s.status === 'Completed').length;
        const autoProgress = totalSubtasks > 0 ? Math.round((completedCount / totalSubtasks) * 100) : act.progress;

        return {
          ...act,
          subtasks: updatedSubtasks,
          progress: autoProgress,
          updatedAt: new Date().toISOString().split('T')[0]
        };
      }));
    }
  };

  const deleteSurveyRecord = (id: string) => {
    setSurveyRecords(prev => {
      const updated = prev.filter(r => r.id !== id);
      localStorage.setItem('surveyRecords', JSON.stringify(updated));
      return updated;
    });
    syncToServer('delete_survey_record', { id });
  };

  const batchGenerateSurveySections = (records: SurveySectionRecord[]) => {
    setSurveyRecords(prev => {
      const existingIds = new Set(prev.map(r => r.id));
      const newOnly = records.filter(r => !existingIds.has(r.id));
      const updated = [...newOnly, ...prev];
      localStorage.setItem('surveyRecords', JSON.stringify(updated));
      return updated;
    });
    syncToServer('batch_add_survey_records', records);
  };

  const linkSurveyRecordToActivity = (surveyRecordId: string, activityId: string, subtaskId?: string) => {
    const surveyRec = surveyRecords.find(r => r.id === surveyRecordId);
    const targetAct = activities.find(a => a.id === activityId);
    if (!surveyRec || !targetAct) return;

    const updatedSurveyRec: SurveySectionRecord = {
      ...surveyRec,
      linkedActivityId: targetAct.id,
      linkedActivityName: targetAct.name,
      linkedSubtaskId: subtaskId,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    updateSurveyRecord(updatedSurveyRec);
    triggerSyncToast(`Linked Survey "${surveyRec.spanName}" to Activity "${targetAct.name}"`, 'success');
  };

  const unlinkSurveyRecordFromActivity = (surveyRecordId: string) => {
    const surveyRec = surveyRecords.find(r => r.id === surveyRecordId);
    if (!surveyRec) return;

    const updatedSurveyRec: SurveySectionRecord = {
      ...surveyRec,
      linkedActivityId: undefined,
      linkedActivityName: undefined,
      linkedSubtaskId: undefined,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    updateSurveyRecord(updatedSurveyRec);
    triggerSyncToast(`Unlinked Survey "${surveyRec.spanName}"`, 'info');
  };

  const addNote = (newNote: ActivityNote) => {
    setNotes(prev => {
      const updated = [newNote, ...prev];
      localStorage.setItem('constructos_notes', JSON.stringify(updated));
      return updated;
    });
    setHasPendingChanges(true);
    triggerSyncToast(`Note "${newNote.title}" created`, 'success');
  };

  const updateNote = (updatedNote: ActivityNote) => {
    setNotes(prev => {
      const updated = prev.map(n => n.id === updatedNote.id ? updatedNote : n);
      localStorage.setItem('constructos_notes', JSON.stringify(updated));
      return updated;
    });
    setHasPendingChanges(true);
    triggerSyncToast(`Note updated`, 'info');
  };

  const deleteNote = (id: string) => {
    setNotes(prev => {
      const updated = prev.filter(n => n.id !== id);
      localStorage.setItem('constructos_notes', JSON.stringify(updated));
      return updated;
    });
    setHasPendingChanges(true);
    triggerSyncToast(`Note removed`, 'info');
  };

  const togglePinNote = (id: string) => {
    setNotes(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n);
      localStorage.setItem('constructos_notes', JSON.stringify(updated));
      return updated;
    });
    setHasPendingChanges(true);
  };

  const toggleArchiveNote = (id: string) => {
    setNotes(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, isArchived: !n.isArchived } : n);
      localStorage.setItem('constructos_notes', JSON.stringify(updated));
      return updated;
    });
    setHasPendingChanges(true);
    triggerSyncToast(`Note status updated`, 'info');
  };

  const convertNoteToReminder = (note: ActivityNote, dueDate: string, dueTime?: string, priority?: Priority) => {
    const reminderId = `REM-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRem: Reminder = {
      id: reminderId,
      title: note.title,
      description: note.content,
      dueDate,
      dueTime: dueTime || '09:00',
      status: 'Pending',
      priority: priority || (note.priority as any) || 'Medium',
      linkedModules: ['Notes', ...(note.activityId ? ['Activities'] : []), ...(note.linkedEquipmentId ? ['Equipment'] : []), ...(note.linkedEmployeeId ? ['Employees'] : [])],
      linkedActivityId: note.activityId,
      linkedEquipmentId: note.linkedEquipmentId,
      linkedEmployeeId: note.linkedEmployeeId,
      linkedNoteId: note.id,
      attachments: note.photos || note.attachments || [],
      createdBy: currentUserProfile?.name || 'Administrator',
      createdAt: new Date().toISOString()
    };

    addReminder(newRem);

    // Update note to link back to reminder
    updateNote({
      ...note,
      linkedReminderId: reminderId
    });

    triggerSyncToast(`Converted note to reminder due on ${dueDate}`, 'success');
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
    // Only Admin can create or whitelist profiles
    if (userProfiles.length > 0 && currentUserProfile?.role !== 'Admin') {
      triggerSyncToast('Access Denied: Only System Administrators can add or whitelist new profiles.', 'error');
      return;
    }

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
    const isCurrentUserAdmin = currentUserProfile?.role === 'Admin';
    const isSelf = currentUserProfile?.id === profile.id;

    // Security Gate: Non-admin users cannot edit other users
    if (!isCurrentUserAdmin && !isSelf) {
      triggerSyncToast('Access Denied: Only System Administrators can modify other user accounts.', 'error');
      return;
    }

    // Security Gate: Non-admin users editing their own profile CANNOT alter roles, permissions, passwords or access
    let sanitizedProfile: UserProfile = profile;
    if (!isCurrentUserAdmin && isSelf && oldProfile) {
      sanitizedProfile = {
        ...profile,
        role: oldProfile.role,
        accessAllowed: oldProfile.accessAllowed,
        permissions: oldProfile.permissions,
        allowedProjectIds: oldProfile.allowedProjectIds,
        password: oldProfile.password
      };
    }

    setUserProfiles(prev => prev.map(p => p.id === profile.id ? sanitizedProfile : p));
    if (currentUserProfile.id === profile.id) {
      setCurrentUserProfileState(sanitizedProfile);
      setUserRole(sanitizedProfile.role);
    }

    const userName = currentUserProfile?.name || 'Current User';
    const userRoleStr = currentUserProfile?.role || userRole || 'User';
    addAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: projects[0]?.id || 'PRJ-001',
      userId: `${userName} (${userRoleStr})`,
      userRole: userRoleStr,
      action: 'User Role/Permissions Updated',
      details: `Updated profile "${sanitizedProfile.name}" (${sanitizedProfile.role})`,
      timestamp: new Date().toISOString(),
      entityType: 'Profile',
      entityId: profile.id,
      actionType: 'security_permission',
      previousValue: oldProfile ? `Role: ${oldProfile.role} | Access: ${oldProfile.accessAllowed ? 'Allowed' : 'Blocked'}` : undefined,
      newValue: `Role: ${sanitizedProfile.role} | Access: ${sanitizedProfile.accessAllowed ? 'Allowed' : 'Blocked'}`
    });
  };

  const deleteProfile = (id: string) => {
    // Only Admin can delete profiles
    if (currentUserProfile?.role !== 'Admin') {
      triggerSyncToast('Access Denied: Only System Administrators can remove profiles.', 'error');
      return;
    }

    const profToDelete = userProfiles.find(p => p.id === id);
    if (profToDelete?.role === 'Admin' && userProfiles.filter(p => p.role === 'Admin').length <= 1) {
      triggerSyncToast('Action Prevented: Cannot delete the sole Administrator account.', 'error');
      return;
    }

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
        company: 'Scedih',
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

    // Enforce Password / Passcode Verification if set by Administrator
    if (foundProfile.password && foundProfile.password.trim() !== '') {
      if (!_password || _password.trim() !== foundProfile.password.trim()) {
        return {
          success: false,
          message: `Incorrect Password: The passcode or password entered is invalid for ${foundProfile.name}. Please enter the password assigned by your Administrator.`
        };
      }
    }

    setCurrentUserProfileState(foundProfile);
    setUserRole(foundProfile.role);
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
    triggerSyncToast(`Authenticated: Welcome back, ${foundProfile.name}`, 'success');
    return { success: true };
  };

  const loginWithProfile = (profileId: string, _password?: string): { success: boolean; message?: string } => {
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

    // Enforce Password check if set
    if (foundProfile.password && foundProfile.password.trim() !== '') {
      if (!_password || _password.trim() !== foundProfile.password.trim()) {
        return {
          success: false,
          message: `Password Required: Account '${foundProfile.name}' is password-protected. Please enter your authorized password to sign in.`
        };
      }
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

  const restoreFromArchivePackage = async (
    plainPackage: any,
    sectionsToRestore: string[],
    strategy: 'merge' | 'replace' = 'merge'
  ) => {
    isRemoteUpdateRef.current = false;
    const { executeRestore } = await import('../lib/dataArchiveService');
    const { getAllIDBData } = await import('../lib/idbService');
    const result = await executeRestore(plainPackage, sectionsToRestore as any, strategy);

    if (result.success) {
      try {
        const updatedAllIDB = await getAllIDBData();
        const incomingIDB = plainPackage.data?.idb || {};
        const incomingStorage = plainPackage.data?.storage || {};

        const getCollection = (k: string) => {
          if (Array.isArray(updatedAllIDB[k]) && updatedAllIDB[k].length > 0) {
            try { localStorage.setItem(k, JSON.stringify(updatedAllIDB[k])); } catch {}
            return updatedAllIDB[k];
          }
          if (Array.isArray(incomingIDB[k]) && incomingIDB[k].length > 0) {
            try { localStorage.setItem(k, JSON.stringify(incomingIDB[k])); } catch {}
            return incomingIDB[k];
          }
          const val = localStorage.getItem(k) || incomingStorage[k];
          if (!val) return null;
          try {
            const parsed = typeof val === 'string' ? JSON.parse(val) : val;
            if (Array.isArray(parsed)) {
              try { localStorage.setItem(k, JSON.stringify(parsed)); } catch {}
              return parsed.filter(Boolean);
            }
            return parsed;
          } catch {
            return null;
          }
        };

        const resProjects = getCollection('projects');
        const resActivities = getCollection('activities');
        const resReports = getCollection('reports');
        const resWeatherLogs = getCollection('weatherLogs');
        const resLabourLogs = getCollection('labourLogs');
        const resLabourAllocations = getCollection('labourAllocations');
        const resWorkerCheckIns = getCollection('workerCheckIns');
        const resAuditLogs = getCollection('auditLogs');
        const resSafetyIncidents = getCollection('safetyIncidents');
        const resAllocations = getCollection('allocations');
        const resMaterials = getCollection('materials');
        const resMaterialReceipts = getCollection('materialReceipts');
        const resMaterialUsages = getCollection('materialUsages');
        const resCustomFields = getCollection('customFieldDefinitions');
        const resEmployees = getCollection('employees');
        const resTeams = getCollection('teams');
        const resEquipment = getCollection('equipment');
        const resEquipmentLogs = getCollection('equipmentLogs');
        const resSafetyReqs = getCollection('safetyRequirements');
        const resSafetyPolicies = getCollection('safetyPolicies');
        const resActivityInspections = getCollection('activityInspections');
        const resInspectionPhotos = getCollection('siteInspectionPhotos');
        const resPPEItems = getCollection('ppeItems');
        const resQAInspections = getCollection('qaInspections');
        const resDocuments = getCollection('documents');
        const resAccommodations = getCollection('accommodations');
        const resAccUtils = getCollection('accommodationUtilities');
        const resAccPays = getCollection('accommodationPayments');
        const resSurveys = getCollection('surveyRecords');
        const resNotes = getCollection('constructos_notes');
        const resProfiles = getCollection('userProfiles');
        const resReminders = getCollection('reminders');

        if (resProjects) setProjects(resProjects);
        if (resActivities) setActivities(resActivities);
        if (resReports) setReports(resReports);
        if (resWeatherLogs) setWeatherLogs(resWeatherLogs);
        if (resLabourLogs) setLabourLogs(resLabourLogs);
        if (resLabourAllocations) setLabourAllocations(resLabourAllocations);
        if (resWorkerCheckIns) setWorkerCheckIns(resWorkerCheckIns);
        if (resAuditLogs) setAuditLogs(resAuditLogs);
        if (resSafetyIncidents) setSafetyIncidents(resSafetyIncidents);
        if (resAllocations) setAllocations(resAllocations);
        if (resMaterials) setMaterials(resMaterials);
        if (resMaterialReceipts) setMaterialReceipts(resMaterialReceipts);
        if (resMaterialUsages) setMaterialUsages(resMaterialUsages);
        if (resCustomFields) setCustomFieldDefinitions(resCustomFields);
        if (resEmployees) setEmployees(resEmployees);
        if (resTeams) setTeams(resTeams);
        if (resEquipment) setEquipment(resEquipment);
        if (resEquipmentLogs) setEquipmentLogs(resEquipmentLogs);
        if (resSafetyReqs) setSafetyRequirements(resSafetyReqs);
        if (resSafetyPolicies) setSafetyPolicies(resSafetyPolicies);
        if (resActivityInspections) setActivityInspections(resActivityInspections);
        if (resInspectionPhotos) setSiteInspectionPhotos(resInspectionPhotos);
        if (resPPEItems) setPPEItems(resPPEItems);
        if (resQAInspections) setQAInspections(resQAInspections);
        if (resDocuments) setDocuments(resDocuments);
        if (resAccommodations) setAccommodations(resAccommodations);
        if (resAccUtils) setAccommodationUtilities(resAccUtils);
        if (resAccPays) setAccommodationPayments(resAccPays);
        if (resSurveys) setSurveyRecords(resSurveys);
        if (resNotes) setNotes(resNotes);
        if (resProfiles) setUserProfiles(resProfiles);
        if (resReminders) setReminders(resReminders);

        const fullState = {
          projects: resProjects || projects,
          activities: resActivities || activities,
          reports: resReports || reports,
          weatherLogs: resWeatherLogs || weatherLogs,
          labourLogs: resLabourLogs || labourLogs,
          labourAllocations: resLabourAllocations || labourAllocations,
          workerCheckIns: resWorkerCheckIns || workerCheckIns,
          auditLogs: resAuditLogs || auditLogs,
          safetyIncidents: resSafetyIncidents || safetyIncidents,
          allocations: resAllocations || allocations,
          materials: resMaterials || materials,
          materialReceipts: resMaterialReceipts || materialReceipts,
          materialUsages: resMaterialUsages || materialUsages,
          customFieldDefinitions: resCustomFields || customFieldDefinitions,
          employees: resEmployees || employees,
          teams: resTeams || teams,
          equipment: resEquipment || equipment,
          equipmentLogs: resEquipmentLogs || equipmentLogs,
          safetyRequirements: resSafetyReqs || safetyRequirements,
          safetyPolicies: resSafetyPolicies || safetyPolicies,
          activityInspections: resActivityInspections || activityInspections,
          siteInspectionPhotos: resInspectionPhotos || siteInspectionPhotos,
          ppeItems: resPPEItems || ppeItems,
          qaInspections: resQAInspections || qaInspections,
          documents: resDocuments || documents,
          userProfiles: resProfiles || userProfiles,
          reminders: resReminders || reminders,
          surveyRecords: resSurveys || surveyRecords
        };

        saveFullFirestoreState(fullState).catch(console.warn);
        syncToServer('sync_full_state', fullState);
        setHasPendingChanges(false);
        localStorage.setItem('hasPendingChanges', 'false');
        setPendingChangesCount(0);
        localStorage.setItem('pendingChangesCount', '0');
        setLastSyncedAt(new Date());

        triggerSyncToast(`Restoration successful: ${result.recordsProcessed} records imported & synced`, 'success', 4000);
      } catch (reloadErr) {
        console.error('State re-hydration error:', reloadErr);
      }
    }
    return result;
  };

  const clearDataSections = async (
    sectionsToClear: string[],
    resetToDefaults = false
  ) => {
    isRemoteUpdateRef.current = false;
    const { clearSectionData } = await import('../lib/dataArchiveService');
    const result = await clearSectionData(sectionsToClear as any, resetToDefaults);

    if (result.success) {
      try {
        if (sectionsToClear.includes('activities')) {
          setActivities([]);
          setProjects([]);
          setAllocations([]);
          setAuditLogs([]);
          setReminders([]);
          setNotes([]);
        }
        if (sectionsToClear.includes('reports')) {
          setReports([]);
          setWeatherLogs([]);
        }
        if (sectionsToClear.includes('labour')) {
          setLabourLogs([]);
          setLabourAllocations([]);
          setWorkerCheckIns([]);
          setEmployees([]);
          setTeams([]);
        }
        if (sectionsToClear.includes('materials')) {
          setMaterials([]);
          setMaterialReceipts([]);
          setMaterialUsages([]);
          setPPEItems([]);
        }
        if (sectionsToClear.includes('safety')) {
          setSafetyIncidents([]);
          setSafetyRequirements([]);
          setSafetyPolicies([]);
        }
        if (sectionsToClear.includes('quality')) {
          setQAInspections([]);
          setActivityInspections([]);
          setSiteInspectionPhotos([]);
        }
        if (sectionsToClear.includes('equipment')) {
          setEquipment([]);
          setEquipmentLogs([]);
        }
        if (sectionsToClear.includes('accommodation')) {
          setAccommodations([]);
          setAccommodationUtilities([]);
          setAccommodationPayments([]);
        }
        if (sectionsToClear.includes('surveys')) {
          setSurveyRecords([]);
        }
        if (sectionsToClear.includes('documents')) {
          setDocuments([]);
        }
        if (sectionsToClear.includes('settings') && resetToDefaults) {
          setCustomFieldDefinitions([]);
        }

        const fullState = {
          projects: sectionsToClear.includes('activities') ? [] : projects,
          activities: sectionsToClear.includes('activities') ? [] : activities,
          reports: sectionsToClear.includes('reports') ? [] : reports,
          weatherLogs: sectionsToClear.includes('reports') ? [] : weatherLogs,
          labourLogs: sectionsToClear.includes('labour') ? [] : labourLogs,
          labourAllocations: sectionsToClear.includes('labour') ? [] : labourAllocations,
          workerCheckIns: sectionsToClear.includes('labour') ? [] : workerCheckIns,
          auditLogs: sectionsToClear.includes('activities') ? [] : auditLogs,
          safetyIncidents: sectionsToClear.includes('safety') ? [] : safetyIncidents,
          allocations: sectionsToClear.includes('activities') ? [] : allocations,
          materials: sectionsToClear.includes('materials') ? [] : materials,
          materialReceipts: sectionsToClear.includes('materials') ? [] : materialReceipts,
          materialUsages: sectionsToClear.includes('materials') ? [] : materialUsages,
          customFieldDefinitions: (sectionsToClear.includes('settings') && resetToDefaults) ? [] : customFieldDefinitions,
          employees: sectionsToClear.includes('labour') ? [] : employees,
          teams: sectionsToClear.includes('labour') ? [] : teams,
          equipment: sectionsToClear.includes('equipment') ? [] : equipment,
          equipmentLogs: sectionsToClear.includes('equipment') ? [] : equipmentLogs,
          safetyRequirements: sectionsToClear.includes('safety') ? [] : safetyRequirements,
          safetyPolicies: sectionsToClear.includes('safety') ? [] : safetyPolicies,
          activityInspections: sectionsToClear.includes('quality') ? [] : activityInspections,
          siteInspectionPhotos: sectionsToClear.includes('quality') ? [] : siteInspectionPhotos,
          ppeItems: sectionsToClear.includes('materials') ? [] : ppeItems,
          qaInspections: sectionsToClear.includes('quality') ? [] : qaInspections,
          documents: sectionsToClear.includes('documents') ? [] : documents,
          userProfiles: userProfiles,
          reminders: sectionsToClear.includes('activities') ? [] : reminders,
          surveyRecords: sectionsToClear.includes('surveys') ? [] : surveyRecords
        };

        saveFullFirestoreState(fullState).catch(console.warn);
        syncToServer('sync_full_state', fullState);
        setHasPendingChanges(false);
        localStorage.setItem('hasPendingChanges', 'false');
        setPendingChangesCount(0);
        localStorage.setItem('pendingChangesCount', '0');
        setLastSyncedAt(new Date());

        triggerSyncToast(`Purged ${result.recordsCleared} records across ${sectionsToClear.length} section(s)`, 'success', 3500);
      } catch (err) {
        console.error('State purge synchronization error:', err);
      }
    }
    return result;
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
      projects, activities, reports, universalReports, addUniversalReport, updateUniversalReport, deleteUniversalReport, compileWeeklyProgressReport, reportTemplates, addReportTemplate, updateReportTemplate, deleteReportTemplate, weatherLogs, labourLogs, labourAllocations, workerCheckIns, auditLogs, allocations, safetyIncidents, materials, materialReceipts, materialUsages, customFieldDefinitions, employees, teams, equipment, equipmentLogs, 
      safetyRequirements, safetyPolicies, activityInspections, siteInspectionPhotos, ppeItems, qaInspections, reminders, userProfiles, currentUserProfile, hasPermission, theme, units, currency, userRole, 
      isAuthenticated, login, loginWithProfile, logout, accessRequests, addAccessRequest, approveAccessRequest, rejectAccessRequest,
      isSyncing, isOffline, lastSyncedAt, syncToast, syncConflict, isManualSyncMode, setIsManualSyncMode, hasPendingChanges, pendingChangesCount, setSyncConflict, resolveSyncConflict, triggerSyncToast, hideSyncToast, forceSyncAll,
      setUserRole, setTheme, setUnits, setCurrency, setCurrentUserProfile, addProfile, updateProfile, deleteProfile,
      updateActivity, addActivity, deleteActivity, addReport, updateReport, deleteReport, updateProject, addProject, deleteProject,
      addLabourLog, updateLabourLog, deleteLabourLog, addLabourAllocation, updateLabourAllocation, deleteLabourAllocation, addWorkerCheckIn, deleteWorkerCheckIn, addAuditLog, addAllocation, updateAllocation, deleteAllocation,
      addSafetyIncident, updateSafetyIncident, deleteSafetyIncident, addMaterialReceipt, addMaterialUsage, addMaterial, addMaterials, updateMaterial, deleteMaterial,
      addCustomFieldDefinition, updateCustomFieldDefinition, addEmployee, updateEmployee, deleteEmployee, addTeam, updateTeam, deleteTeam,
      addEquipment, updateEquipment, deleteEquipment, addEquipmentLog, updateEquipmentLog, deleteEquipmentLog,
      addSafetyRequirement, updateSafetyRequirement, deleteSafetyRequirement,
      addSafetyPolicy, updateSafetyPolicy, deleteSafetyPolicy,
      addActivityInspection, updateActivityInspection, deleteActivityInspection, addSiteInspectionPhoto, deleteSiteInspectionPhoto,
      addPPEItem, updatePPEItem, deletePPEItem,
      addQAInspection, updateQAInspection, deleteQAInspection,
      rfis, addRFI, updateRFI, deleteRFI,
      addReminder, updateReminder, deleteReminder,
      addWeatherLog, updateWeatherLog, deleteWeatherLog,
      documents, documentFolders, addDocument, updateDocument, deleteDocument, assignDocumentToActivity,
      addDocumentFolder, updateDocumentFolder, deleteDocumentFolder, moveDocumentsToFolder, bulkUpdateDocuments, bulkDeleteDocuments,
      workPackageBinders, addWorkPackageBinder, updateWorkPackageBinder, deleteWorkPackageBinder, toggleDocInWorkPackage,
      documentTransmittals, addDocumentTransmittal, updateDocumentTransmittal, deleteDocumentTransmittal,
      accommodations, accommodationUtilities, accommodationPayments,
      addAccommodation, updateAccommodation, deleteAccommodation,
      assignEmployeeToAccommodation, removeEmployeeFromAccommodation,
      addAccommodationUtility, deleteAccommodationUtility,
      addAccommodationPayment, updateAccommodationPayment, deleteAccommodationPayment,
      surveyRecords, addSurveyRecord, updateSurveyRecord, deleteSurveyRecord,
      batchGenerateSurveySections, linkSurveyRecordToActivity, unlinkSurveyRecordFromActivity,
      notes, addNote, updateNote, deleteNote, togglePinNote, toggleArchiveNote, convertNoteToReminder,
      restoreFromArchivePackage, clearDataSections
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
