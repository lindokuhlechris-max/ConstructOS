export type ProjectStatus = 'Not Started' | 'In Progress' | 'Delayed' | 'Completed';
export type ActivityStatus = 'Not Started' | 'Ready' | 'In Progress' | 'Waiting' | 'Blocked' | 'Completed' | 'Cancelled';
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';

export type UserRole = 'Admin' | 'Manager' | 'Engineer' | 'Inspector' | 'Worker' | 'Viewer';

export function canManage(role: UserRole): boolean {
  return role === 'Admin' || role === 'Manager';
}

export function isAdmin(role: UserRole): boolean {
  return role === 'Admin';
}

export type ReminderStatus = 'Pending' | 'Completed' | 'Overdue';

export interface Reminder {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  dueTime?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  status: ReminderStatus;
  priority: Priority;
  completed?: boolean;
  linkedModules: string[];
  linkedEmployeeId?: string;
  linkedEquipmentId?: string;
  linkedActivityId?: string;
  linkedNoteId?: string;
  attachments?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CustomFieldDefinition {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  options?: string[];
  required: boolean;
  active: boolean;
}

export interface ProjectDeliverable {
  pos: string;
  description: string;
  specification?: string;
  unit: string;
  quantity: string | number;
  unitCost?: number;
  totalCost?: number;
  currency?: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  contractNumber: string;
  location: string;
  engineer: string;
  contractValue: number;
  startDate: string;
  finishDate: string;
  status: ProjectStatus;
  progress: number;
  scopeDescription?: string;
  deliverables?: ProjectDeliverable[];
  totalScopeCost?: number;
  currency?: string;
}

export interface Comment {
  id: string;
  author: string;
  userId?: string;
  userRole?: string;
  userInitials?: string;
  text: string;
  timestamp: string;
  avatar?: string;
  editedAt?: string;
}

export type SubTaskCategory = 
  | 'Site Establishment'
  | 'Surveying & Set-out'
  | 'Surveying'
  | 'Excavation & Earthworks'
  | 'Cable & Underground Installation'
  | 'Structure & Foundations'
  | 'Electrical & MEP'
  | 'Paving & Surfacing'
  | 'Quality & Inspection'
  | 'Quality Control & Hold Points'
  | 'Custom';

export type SubTaskMeasurementType = 
  | 'Quantity'
  | 'Length'
  | 'Area'
  | 'Volume'
  | 'Weight'
  | 'Count'
  | 'Percentage'
  | 'Checklist'
  | 'Sign-off'
  | 'Milestone'
  | 'Yes/No';

export interface MeasurementPresetConfig {
  targetQuantity?: number;
  unit?: string;
  stepIncrement?: number;
}

export type ActivityMeasurementPresets = Partial<Record<SubTaskMeasurementType, MeasurementPresetConfig>>;

export interface SubTaskChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface SubTaskHoldPointSignOff {
  signedBy: string;
  signedAt: string;
  signatureNote?: string;
  photoUrl?: string;
  approved: boolean;
}

export interface SubTask {
  id: string;
  title: string;
  category: SubTaskCategory;
  status: 'Not Started' | 'In Progress' | 'Completed';
  measurementType?: SubTaskMeasurementType;
  checklist?: SubTaskChecklistItem[];
  targetQuantity?: number;
  completedQuantity?: number;
  unit?: string;
  stepIncrement?: number;
  assignedPerson?: string;
  assignedWorkers?: string[];
  assignedEquipment?: string;
  assignedEquipmentList?: string[];
  assignedTeam?: string;
  assignedTeams?: string[];
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  notes?: string;
  assignments?: MaterialAssignment[];
  parentId?: string;
  isMilestone?: boolean;
  milestoneCriteria?: string;
  isHoldPoint?: boolean;
  holdPointSignOff?: SubTaskHoldPointSignOff;
  predecessorId?: string;
  requiresPhotoEvidence?: boolean;
  requiresSupervisorSignOff?: boolean;

  // Link & Survey Discipline Metadata
  linkedActivityId?: string;
  linkedActivityName?: string;
  linkedSubtaskId?: string;
  isLinkedDiscipline?: boolean;
  sourceActivityId?: string;
  sourceActivityName?: string;
  sectionSpan?: string;
  chainage?: string;
  surveyRecordId?: string;
  surveyData?: {
    peggingNotes?: string;
    coordinates?: string;
    benchMarkRef?: string;
    surveyorName?: string;
    surveyDate?: string;
    elevation?: string;
  };
}

export interface SurveySectionRecord {
  id: string;
  projectId?: string;
  spanName: string; // e.g. "PTS 1 - PTS 2", "PTS 20 - PTS 21"
  startPoint: string; // e.g. "PTS 1"
  endPoint: string; // e.g. "PTS 2"
  chainageStart?: string; // e.g. "CH 0+000"
  chainageEnd?: string; // e.g. "CH 0+433"
  distanceMeters: number; // e.g. 433
  completedMeters: number; // e.g. 433
  status: 'Not Started' | 'In Progress' | 'Completed';
  surveyDate?: string;
  surveyors?: string[]; // e.g. ["Dimi Maphanga", "Refumuni Malungane"]
  peggingNotes?: string;
  benchmarkRef?: string;
  coordinates?: string;
  elevation?: string;
  linkedActivityId?: string; // ID of the construction activity this is bound to (e.g. "ACT-001")
  linkedActivityName?: string; // e.g. "PTS 1 - PTS 2 Trenching"
  linkedSubtaskId?: string; // ID of the subtask in the construction activity
  updatedAt?: string;
}

export interface ActivityExplainerItem {
  id: string;
  title: string;
  discipline?: string;
  scopeDescription: string;
  methodSpecs?: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  targetDate?: string;
  subtaskId?: string;
  assignedTo?: string;
}

export type SubtaskExplainerItem = ActivityExplainerItem;

export interface ActivityChecklistItem {
  id: string;
  text: string;
  category?: 'Permit & Safety' | 'Survey & Location' | 'Materials & Plant' | 'QA & Method Statement' | 'General' | string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface ChecklistTemplate {
  id: string;
  title: string;
  category: 'Permit & Safety' | 'Survey & Location' | 'Materials & Plant' | 'QA & Method Statement' | 'General' | string;
  discipline?: string;
  description?: string;
  items: string[];
  createdAt?: string;
  updatedAt?: string;
  isCustom?: boolean;
  authorName?: string;
}

export interface Activity {
  id: string;
  projectId: string;
  name: string;
  isMilestone?: boolean;
  description: string;
  workPackage: string;
  area: string;
  location?: string;
  chainage?: string;
  priority: Priority;
  discipline: string;
  category?: string;
  assignedTo: string;
  supervisor: string;
  targetQuantity: number;
  actualQuantity: number;
  unit: string;
  status: ActivityStatus;
  startDate: string;
  finishDate: string;
  createdAt?: string;
  updatedAt?: string;
  plannedHours: number;
  actualHours: number;
  progress: number;
  planningType?: 'Daily' | 'Weekly' | 'Monthly' | 'Project Duration';
  dailyTargetQuantity?: number;
  dailyTargetPercentage?: number;
  dependencies?: string[];
  constraints?: string[];
  remarks?: string;
  methodStatement?: string;
  explainerItems?: ActivityExplainerItem[];
  photos?: string[];
  photoTags?: Record<number, string>;
  attachments?: string[];
  gpsLocation?: { lat: number; lng: number } | string;
  qrCode?: string;
  barcode?: string;
  voiceNotes?: string[];
  digitalSignature?: string;
  comments?: Comment[];
  customFields?: Record<string, any>;
  assignedMaterials?: TaskMaterialAssignment[];
  assignedLabour?: TaskLabourAssignment[];
  assignedEquipment?: TaskEquipmentAssignment[];
  subtasks?: SubTask[];
  checklists?: ActivityChecklistItem[];
  measurementPresets?: ActivityMeasurementPresets;

  // Legacy & Alias fields for CSV/Reporting
  endDate?: string;
  quantity?: number;
  assignedTeam?: string;
  assignedTeams?: string[];
  labourTracking?: any;

  // Multi-Discipline Workstream Metadata
  workstream?: WorkstreamType;
  customWorkstream?: string;
  linkedPTSActivityId?: string;
  linkedPTSActivityName?: string;
  sectionSpan?: string; // e.g. "Section A - Section B", "PTS 19 - PTS 20"
  chainageStart?: string;
  chainageEnd?: string;
  prerequisiteWorkstreamIds?: string[];
}

export type WorkstreamType = 
  | 'CONSTRUCTION'      // Civil & Physical Construction Execution
  | 'PTS_CONSTRUCTION'  // Legacy compatibility for Civil / Construction
  | 'SURVEYING'         // Topography, Setting-Out, Pegging, Benchmark, Elevation, As-Builts
  | 'QA_QC'             // Hold Points, Compaction Tests, Non-Conformance, Sign-Offs
  | 'MATERIALS'         // Batch Procurement, Delivery Tracking, Mill Certs, Material Allocation
  | 'SAFETY'            // Daily Risk Assessments, Permits, Tool Box Talks
  | 'COMMISSIONING'     // Testing, Hydrotesting, Energization, Handover
  | 'CUSTOM'            // User-defined Custom Workstream
  | string;

export interface CustomDisciplineConfig {
  id: string; // e.g. "DISC_ENV", "DISC_GEOTECH", or custom string
  name: string; // e.g. "Environmental & Ecology"
  shortName: string; // e.g. "Environment"
  description: string;
  categoryKeywords: string[]; // categories or keywords used to auto-match subtasks
  measurementType: SubTaskMeasurementType;
  defaultUnit?: string;
  targetDeliverableLabel?: string; // e.g. "Total Linear Set-Out", "Total Quality Inspections", "Material Deliveries"
  icon?: string; // 'Compass' | 'ShieldCheck' | 'Package' | 'ShieldAlert' | 'Zap' | 'Leaf' | 'Layers' | 'FileText' | 'HardHat' | 'Wrench'
  color?: string;
  bgLight?: string;
  borderLight?: string;
  badgeClass?: string;
  createdAt?: string;
}

export interface WorkstreamConfig {
  id: WorkstreamType;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  color: string;
  bgLight: string;
  borderLight: string;
  badgeClass: string;
}

export const WORKSTREAMS: Record<string, WorkstreamConfig> = {
  CONSTRUCTION: {
    id: 'CONSTRUCTION',
    name: 'Civil & Physical Execution',
    shortName: 'Construction',
    description: 'Physical site civil works, earthworks, structural execution, piping & installation',
    icon: 'Building2',
    color: '#0B5FFF',
    bgLight: 'bg-blue-50 dark:bg-blue-950/40',
    borderLight: 'border-blue-200 dark:border-blue-800',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300'
  },
  PTS_CONSTRUCTION: {
    id: 'CONSTRUCTION',
    name: 'Civil & Physical Execution',
    shortName: 'Construction',
    description: 'Physical site civil works, earthworks, structural execution, piping & installation',
    icon: 'Building2',
    color: '#0B5FFF',
    bgLight: 'bg-blue-50 dark:bg-blue-950/40',
    borderLight: 'border-blue-200 dark:border-blue-800',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300'
  },
  SURVEYING: {
    id: 'SURVEYING',
    name: 'Surveying & Setting-Out',
    shortName: 'Surveying',
    description: 'Setting-out, boundary verification, chainage coordinate logs & benchmarks',
    icon: 'Compass',
    color: '#0284C7',
    bgLight: 'bg-sky-50 dark:bg-sky-950/40',
    borderLight: 'border-sky-200 dark:border-sky-800',
    badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300'
  },
  QA_QC: {
    id: 'QA_QC',
    name: 'QA/QC & Inspections',
    shortName: 'QA/QC',
    description: 'Quality hold points, witness inspections, test plans, compaction & sign-offs',
    icon: 'ShieldCheck',
    color: '#E11D48',
    bgLight: 'bg-rose-50 dark:bg-rose-950/40',
    borderLight: 'border-rose-200 dark:border-rose-800',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300'
  },
  MATERIALS: {
    id: 'MATERIALS',
    name: 'Materials & Supply Chain',
    shortName: 'Materials',
    description: 'Batch tracking, mill test certificates, delivery notes & stock issuance',
    icon: 'Package',
    color: '#D97706',
    bgLight: 'bg-amber-50 dark:bg-amber-950/40',
    borderLight: 'border-amber-200 dark:border-amber-800',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
  },
  SAFETY: {
    id: 'SAFETY',
    name: 'Safety & HSE Compliance',
    shortName: 'Safety / HSE',
    description: 'Work permits, safety audits, risk assessments & toolbox talks',
    icon: 'ShieldAlert',
    color: '#059669',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderLight: 'border-emerald-200 dark:border-emerald-800',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
  },
  COMMISSIONING: {
    id: 'COMMISSIONING',
    name: 'Testing & Commissioning',
    shortName: 'Commissioning',
    description: 'Pressure testing, hydrotests, electrical testing, energization & handover',
    icon: 'Zap',
    color: '#7C3AED',
    bgLight: 'bg-purple-50 dark:bg-purple-950/40',
    borderLight: 'border-purple-200 dark:border-purple-800',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300'
  },
  CUSTOM: {
    id: 'CUSTOM',
    name: 'Custom Discipline / Workstream',
    shortName: 'Custom',
    description: 'User-defined specialized discipline or customized scope of work',
    icon: 'Tag',
    color: '#64748B',
    bgLight: 'bg-slate-50 dark:bg-slate-800/60',
    borderLight: 'border-slate-300 dark:border-slate-700',
    badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
  }
};

export interface TaskMaterialAssignment {
  id: string;
  materialId: string;
  name: string;
  quantity: number;
  unit: string;
  assignedDate: string;
  status?: string;
  notes?: string;
}

export interface TaskLabourAssignment {
  id: string;
  employeeId?: string;
  name: string;
  role: string;
  hours: number;
  startDate: string;
  endDate?: string;
  notes?: string;
  labourLogId?: string;
}

export interface TaskEquipmentAssignment {
  id: string;
  equipmentId: string;
  name: string;
  operator?: string;
  type?: string;
  hours?: number;
  startDate: string;
  endDate?: string;
  notes?: string;
  equipmentLogId?: string;
}

export interface ActivityTrackerFilter {
  searchQuery: string;
  status?: ActivityStatus | 'All';
  priority?: Priority | 'All';
  discipline?: string | 'All';
  workPackage?: string | 'All';
}

export interface ActivityTrackerState {
  activities: Activity[];
  selectedActivityId: string | null;
  filter: ActivityTrackerFilter;
  isLoading: boolean;
  error: string | null;
}

export interface AuditLog {
  id: string;
  projectId: string;
  userId: string;
  userRole?: string;
  action: string;
  details: string;
  timestamp: string;
  entityType?: 'Activity' | 'LabourLog' | 'Equipment' | 'Material' | 'Safety' | 'Report' | 'Project' | 'Employee' | 'Profile' | 'QA' | 'Reminder' | 'System';
  entityId?: string;
  activityId?: string;
  actionType?: 'create' | 'update' | 'delete' | 'status_change' | 'security_permission' | 'other' | 'sign_off' | 'sign_off_revoked';
  previousValue?: string;
  newValue?: string;
  ipAddress?: string;
  activityName?: string;
  subtaskTitle?: string;
  subtaskId?: string;
  inspectorName?: string;
  photoUrl?: string;
  metadata?: Record<string, any>;
}

export interface LabourLog {
  id: string;
  projectId: string;
  activityId: string;
  date: string;
  workerType: string;
  workerName?: string;
  startTime?: string;
  endTime?: string;
  lunchBreak?: number;
  hours: number;
  workersCount?: number;
  trade?: string;
  hoursWorked?: number;
  supervisorName?: string;
  notes?: string;
}

export interface WorkerCheckIn {
  id: string;
  projectId: string;
  workerName: string;
  workerId?: string;
  timestamp: string;
  action: 'Check-In' | 'Check-Out';
  location: {
    lat: number;
    lng: number;
  };
}

export interface LabourAllocation {
  id: string;
  projectId: string;
  activityId: string;
  subtaskId?: string;
  employeeId?: string;
  workerName: string;
  workerRole: string;
  hours?: number;
  startDate: string;
  endDate: string;
  status: 'Scheduled' | 'Active' | 'Completed' | 'Cancelled';
  notes?: string;
}

export interface ResourceAllocation {
  id: string;
  projectId: string;
  activityId?: string;
  subtaskId?: string;
  resourceId?: string;
  equipmentId?: string;
  materialId?: string;
  resourceType: 'Material' | 'Equipment';
  name: string;
  quantity: number;
  unit?: string;
  status: 'Allocated' | 'In Use' | 'Depleted' | 'Returned' | 'Completed';
  assignedDate: string;
  expectedReturnDate?: string;
  assignedTo?: string;
  operatorEmployeeId?: string;
  plannedHours?: number;
  notes?: string;
}

export interface CorrectiveAction {
  id: string;
  action: string;
  assignedTo: string;
  dueDate: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  completedDate?: string;
}

export interface SafetyRequirement {
  id: string;
  projectId: string;
  title: string;
  category: 'SWMS' | 'Permit to Work' | 'Site Induction' | 'Environmental Control' | 'High Risk Work';
  description: string;
  mandatoryCertificates?: string[];
  status: 'Active' | 'Under Review';
  effectiveDate: string;
}

export interface SafetyPolicy {
  id: string;
  title: string;
  code: string;
  category: 'General Safety' | 'Working at Heights' | 'Machinery & Equipment' | 'PPE Compliance' | 'Emergency Response';
  version: string;
  effectiveDate: string;
  summary: string;
  documentUrl?: string;
}

export interface SiteInspectionPhoto {
  id: string;
  projectId: string;
  activityId?: string;
  inspectionId?: string;
  title: string;
  category: 'General Site' | 'Working at Heights' | 'PPE Compliance' | 'Scaffolding' | 'Electrical' | 'Excavation' | 'Hazard' | 'Housekeeping';
  url: string;
  capturedAt: string;
  inspectorName: string;
  location?: string;
  gpsLocation?: { lat: number; lng: number } | string;
  notes?: string;
  tags?: string[];
}

export interface ActivitySafetyInspection {
  id: string;
  projectId: string;
  activityId: string;
  title: string;
  inspectorName: string;
  scheduledDate: string;
  completedDate?: string;
  status: 'Scheduled' | 'In Progress' | 'Passed' | 'Failed';
  checklistItems: { id: string; item: string; passed: boolean }[];
  notes?: string;
  photos?: string[];
  location?: string;
}

export interface PPEMaterialItem {
  id: string;
  name: string;
  category: 'Head Protection' | 'Eye Protection' | 'Footwear' | 'Fall Arrest' | 'Respiratory' | 'High-Vis Clothing';
  mandatoryForDisciplines: string[];
  stockQuantity: number;
  minStockLevel: number;
  unit: string;
}

export type QAMeasurementType =
  | 'Quantity'
  | 'Length'
  | 'Area'
  | 'Volume'
  | 'Weight'
  | 'Percentage'
  | 'Thickness'
  | 'Strength'
  | 'Temperature'
  | 'Pressure'
  | 'Count'
  | 'Checklist'
  | 'Pass/Fail'
  | 'Custom';

export interface QAMeasurementRecord {
  id: string;
  itemDescription: string;
  measurementType: QAMeasurementType;
  unit: string;
  targetOrRequired: number;
  inspectedAmount: number;
  approvedAmount: number;
  rejectedAmount: number;
  tolerance?: string;
  remarks?: string;
  status: 'Approved' | 'Partially Approved' | 'Rejected' | 'Pending Inspection';
  inspectionDate?: string;
  testedBy?: string;
}

export interface QAInspectionItem {
  id: string;
  projectId: string;
  activityId?: string;
  title: string;
  category: string;
  location: string;
  inspector: string;
  date: string;
  status: 'Passed' | 'Failed' | 'Pending Approval';
  
  // Measurement & Quality Inspection Scope
  measurementType?: QAMeasurementType;
  unit?: string;
  targetQuantity?: number;
  inspectedQuantity?: number;
  approvedQuantity?: number;
  rejectedQuantity?: number;
  toleranceSpec?: string;
  measurementItems?: QAMeasurementRecord[];

  ncrCode?: string;
  ncrDetails?: {
    ncrNumber: string;
    deficiencySummary: string;
    rootCause?: string;
    remediationPlan?: string;
    assignedEngineer?: string;
    reinspectionDate?: string;
    status: 'Open' | 'Under Repair' | 'Closed';
  };
  testMetrics?: { id: string; parameter: string; specification: string; measured: string; pass: boolean }[];
  labCertificates?: { id: string; name: string; url: string; date: string }[];
  photos?: string[];
  signoffNotes?: string;
  approvedBy?: string;
  approvalDate?: string;
  clientQCRepresentative?: string;
  clientQCStatus?: 'Approved' | 'Rejected' | 'Pending Client Review';
  clientQCSignoffDate?: string;
  clientQCNotes?: string;
  linkedDocumentIds?: string[];
  comments?: Comment[];
  notes?: string;
}

export interface ProjectSectionPermissions {
  activities: boolean;
  reports: boolean;
  labour: boolean;
  materials: boolean;
  safety: boolean;
  quality: boolean;
  equipment: boolean;
  documents: boolean;
  settings: boolean;
}

export const DEFAULT_SECTION_PERMISSIONS: Record<UserRole, ProjectSectionPermissions> = {
  Admin: { activities: true, reports: true, labour: true, materials: true, safety: true, quality: true, equipment: true, documents: true, settings: true },
  Manager: { activities: true, reports: true, labour: true, materials: true, safety: true, quality: true, equipment: true, documents: true, settings: false },
  Engineer: { activities: true, reports: true, labour: false, materials: true, safety: true, quality: true, equipment: false, documents: true, settings: false },
  Inspector: { activities: false, reports: true, labour: false, materials: false, safety: true, quality: true, equipment: false, documents: true, settings: false },
  Worker: { activities: false, reports: true, labour: false, materials: false, safety: true, quality: false, equipment: false, documents: true, settings: false },
  Viewer: { activities: false, reports: false, labour: false, materials: false, safety: false, quality: false, equipment: false, documents: true, settings: false },
};

export type DocumentCategory = 
  | 'Drawings & Blueprints'
  | 'Contracts & Agreements'
  | 'Specifications & Specs'
  | 'Safety & Compliance'
  | 'QA/QC Inspections'
  | 'Financial & Invoices'
  | 'Material Data Sheets (MSDS)'
  | 'Daily Logs & Site Records'
  | 'Method Statements'
  | 'General';

export type DocumentFileType = 'pdf' | 'excel' | 'word' | 'image' | 'cad' | 'archive' | 'text' | 'other';
export type DocumentStatus = 'Approved' | 'Draft' | 'Under Review' | 'Archived' | 'Superseded';

export interface DocumentItem {
  id: string;
  projectId: string;
  title: string;
  fileName: string;
  fileType: DocumentFileType;
  fileExtension: string; // e.g. pdf, xlsx, docx, png, dwg
  extension?: string; // alias for CSV export
  fileSize: number; // in bytes
  fileSizeFormatted?: string; // e.g. 2.4 MB
  category: DocumentCategory;
  tags?: string[];
  version: string;
  status: DocumentStatus;
  fileUrl?: string; // base64 data URL or asset link for preview/download
  linkedActivityId?: string; // optional assignment to an Activity
  linkedActivityName?: string;
  linkedQAInspectionId?: string; // optional assignment to QA/QC Inspection
  linkedQAInspectionTitle?: string;
  uploadedBy: string;
  uploadedAt: string;
  lastModified?: string;
  description?: string;
  confidential?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  title: string;
  email: string;
  phone: string;
  company: string;
  department: string;
  avatarUrl?: string;
  initials: string;
  certifications?: string[];
  accessAllowed?: boolean;
  permissions?: Partial<ProjectSectionPermissions>;
  allowedProjectIds?: string[];
  password?: string;
}

export interface AccessRequest {
  id: string;
  name: string;
  email: string;
  company: string;
  requestedRole: UserRole;
  reason: string;
  timestamp: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export function canUserEditSection(profile: UserProfile | null | undefined, section: keyof ProjectSectionPermissions): boolean {
  if (!profile) return false;
  if (profile.accessAllowed === false) return false;
  if (profile.role === 'Admin') return true;
  if (profile.permissions && typeof profile.permissions[section] === 'boolean') {
    return profile.permissions[section]!;
  }
  return DEFAULT_SECTION_PERMISSIONS[profile.role]?.[section] ?? false;
}

export interface SafetyIncident {
  id: string;
  projectId: string;
  title: string;
  type: 'Hazard' | 'Near Miss' | 'Injury' | 'Environmental' | 'Equipment Damage' | 'Quality Non-Conformance';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'Under Investigation' | 'Resolved' | 'Closed';
  dateReported: string;
  reportedBy: string;
  description: string;
  location?: string;
  gpsLocation?: { lat: number; lng: number } | string;
  photos?: string[];
  correctiveAction?: string;
  correctiveActions?: CorrectiveAction[];
  riskLevel?: 'Minor' | 'Moderate' | 'Severe' | 'Extreme';
  investigatorNotes?: string;
}

export interface MaterialCertificate {
  id: string;
  title: string;
  fileUrl: string;
  uploadDate: string;
  type?: 'Mill Test Certificate' | 'MSDS' | 'ISO Certification' | 'Quality Inspection' | 'Compliance Certificate';
  fileType?: string;
}

export interface MaterialDocument {
  id: string;
  title: string;
  fileUrl: string;
  uploadDate: string;
  type?: 'Technical Specs' | 'Installation Manual' | 'Safety Guide' | 'User Manual' | 'Datasheet';
  fileType?: string;
}

export interface MaterialAssignment {
  id: string;
  employeeId: string;
  assignedDate: string;
  returnedDate?: string;
  notes?: string;
  assignedBy?: string;
}

export interface MaterialInventory {
  id: string;
  projectId: string;
  name: string;
  sku?: string;
  category: string;
  type: 'Consumable' | 'Non-Consumable';
  unit: string;
  baseUnit?: string;
  baseAmount?: number;
  estimatedQuantity: number;
  receivedQuantity: number;
  usedQuantity: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Over Estimate';
  unitCost?: number;
  location?: string;
  reorderLevel?: number;
  costPerUnit?: number;
  certificates?: MaterialCertificate[];
  photos?: string[];
  manuals?: MaterialDocument[];
  assignments?: MaterialAssignment[];
  notes?: string;
}

export interface MaterialReceipt {
  id: string;
  materialId: string;
  date: string;
  quantity: number;
  receivedBy: string;
  supplier?: string;
  deliveryNoteNumber?: string;
  notes?: string;
}

export interface MaterialUsage {
  id: string;
  materialId: string;
  activityId?: string;
  date: string;
  quantity: number;
  recordedBy: string;
  notes?: string;
}

export type WeatherCondition = 
  | 'Sunny'
  | 'Clear'
  | 'Partly Cloudy'
  | 'Overcast'
  | 'Light Rain'
  | 'Heavy Rain'
  | 'Thunderstorm'
  | 'High Winds'
  | 'Extreme Heat'
  | 'Freezing'
  | 'Dust / Haze'
  | 'Fog';

export type WeatherImpactLevel = 'Normal Operations' | 'Caution / Monitoring' | 'Work Package Delay' | 'Site Suspension';

export interface WeatherLog {
  id: string;
  projectId: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  condition: WeatherCondition;
  temperature: number;
  humidity?: number; // %
  windSpeed?: number; // km/h or mph
  windDirection?: string;
  rainfall?: number; // mm or in
  impactLevel: WeatherImpactLevel;
  safetyAdvisories: string[];
  affectedActivityIds?: string[];
  notes?: string;
  loggedBy: string;
  createdAt: string;
}

export interface DailyReport {
  id: string;
  date: string;
  projectId: string;
  weather: string;
  temperature: string;
  condition?: string;
  temp?: string;
  siteConditions?: string;
  significantEvents?: string;
  workersOnSite?: number;
  equipmentRunning?: number;
  incidents?: number;
  ncr?: number;
  activitiesLogged?: string[];
  activitiesWorked?: string[];
  subtasksCompleted?: string[];
  delaysOrIssues?: string[];
  generalNotes?: string;
  submittedBy?: string;
  supervisor?: string;
  workSummary?: string;
  notes?: string;
  delays?: string | string[];
  blockers?: string | string[];
  qaHoldPoints?: string | string[];
  safety?: any;
  labour?: any;
  manpowerBreakdown?: { trade: string; count: number; hours: number }[];
  labourLogged?: { name: string; role: string; hours: number }[];
  equipmentLogged?: { equipmentId: string; hours: number; status: string }[];
  photos?: string[];
  supervisorNotes?: string;
  createdAt?: string;
  status?: string;
}

export interface EmployeeCertificate {
  id: string;
  title: string;
  type: 'White Card' | 'High Risk License' | 'First Aid' | 'Driver License' | 'Machinery Ticket' | 'Safety Induction';
  issueDate?: string;
  expiryDate?: string;
  status: 'Valid' | 'Expiring Soon' | 'Expired';
  fileUrl?: string;
  uploadDate: string;
}

export type EmployeeStatus = 'Active' | 'Absent' | 'On Leave' | 'Terminated' | 'Induction' | 'Under Review';

export type LeaveType = 'Annual Leave' | 'Sick Leave' | 'Maternity / Paternity' | 'Personal / Casual' | 'Study / Training' | 'Unpaid Leave';
export type LeaveStatus = 'Approved' | 'Pending' | 'Rejected';

export interface LeaveRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason?: string;
  status: LeaveStatus;
  appliedDate: string;
  approvedBy?: string;
}

export interface EmployeeLeaveBalance {
  annualTotal: number;
  annualUsed: number;
  sickTotal: number;
  sickUsed: number;
  casualTotal: number;
  casualUsed: number;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  status: EmployeeStatus;
  hireDate: string;
  avatar?: string;
  assignedActivities?: string[]; // Array of activity IDs
  skills?: string[];
  certificates?: EmployeeCertificate[];
  idPhotos?: string[];
  emergencyContact?: { name: string; phone: string; relationship: string };
  notes?: string;
  leaveRecords?: LeaveRecord[];
  leaveBalance?: EmployeeLeaveBalance;
  hasAccommodation?: boolean;
  accommodationDetails?: {
    campId?: string;
    campName?: string;
    roomNumber?: string;
    checkInDate?: string;
    checkOutDate?: string;
    subsidyAmount?: number;
    notes?: string;
  };
  hasTransport?: boolean;
  transportDetails?: {
    route?: string;
    pickupPoint?: string;
  };
}

export interface Team {
  id: string;
  name: string;
  department: string;
  leaderId?: string;
  leaderName?: string;
  memberIds: string[];
  description?: string;
  createdAt: string;
}

export type EquipmentStatus = 'Operating' | 'Idle' | 'Maintenance' | 'Out of Service';

export type EquipmentCategory = 
  | 'Cars & Light Vehicles'
  | 'Heavy Machinery'
  | 'Haulage & Dump Trucks'
  | 'Stationary & Generators'
  | 'Lifting & Cranes'
  | 'Light Equipment & Tools';

export type PrimaryUsageMetric = 
  | 'Engine Hours'
  | 'Mileage / Odometer'
  | 'Loads & Trips'
  | 'Power Output (kWh)';

export type EquipmentOwnership = 'Owned' | 'Rented';

export interface Equipment {
  id: string;
  name: string;
  type: string;
  category?: EquipmentCategory | string;
  primaryMetric?: PrimaryUsageMetric;
  status: EquipmentStatus;
  operator: string;
  location: string;
  engineHours: number; // Current machine hour meter reading (h)
  initialHours?: number; // Starting hour meter reading when machine was added to project/fleet
  mileage?: number; // Current odometer reading (km)
  initialMileage?: number; // Starting odometer reading (km)
  totalLoads?: number; // count of loads/trips
  initialLoads?: number; // Starting load count
  totalPowerKWh?: number; // kWh output for generators/power units
  initialPowerKWh?: number; // Starting power output meter
  licensePlate?: string; // for vehicles/trucks
  fuelLevel: number; // percentage (0 - 100)
  fuelColor?: string;
  fuelCapacityLitres?: number;
  fuelConsumptionRate?: number; // L/hr or L/100km
  lastService: string;
  nextService?: string;
  lastServiceKm?: number;
  nextServiceKm?: number;
  serviceIntervalKm?: number;
  serviceIntervalHours?: number;
  serialNumber?: string; // Legacy
  vinSerial?: string;
  accessories?: string;
  model?: string;
  notes?: string;

  // Rented & Financial/Rate Tracking Fields
  ownership?: EquipmentOwnership; // 'Owned' | 'Rented'
  trackOperationalCost?: boolean; // Toggle ON/OFF for tracking operational costs
  hourlyRate?: number; // Rate in Rands (ZAR) per operating hour
  dailyRate?: number; // Optional daily rate in Rands
  standbyRate?: number; // Optional standby/idle rate in Rands
  rentalVendor?: string; // Rental company / supplier (e.g. "Barloworld Equipment", "Goscor", "Coastal Hire")
  rentalAgreementNumber?: string; // Contract / PO / Agreement #
  rentalStartDate?: string; // YYYY-MM-DD
  rentalEndDate?: string; // YYYY-MM-DD (Return deadline)
  rentalBillingCycle?: 'Hourly' | 'Daily' | 'Weekly' | 'Monthly';
  rentalDeposit?: number; // Deposit in Rands

  // Gallery & Field Photos
  photos?: string[]; // Array of photo data URLs or image URLs
}

export type EquipmentLogType = 'Hours' | 'Mileage' | 'Loads & Trips' | 'Power Output' | 'Refuel' | 'Maintenance';

export interface EquipmentLog {
  id: string;
  equipmentId: string;
  activityId?: string;
  activityName?: string;
  projectId?: string;
  type: EquipmentLogType;
  date: string;
  loggedBy: string;
  hoursAdded?: number;
  hours?: number; // alias for hoursAdded for consistent activity tracking
  totalHours?: number;
  startTime?: string;
  endTime?: string;
  mileageAdded?: number;
  odometerReading?: number;
  loadsAdded?: number;
  materialHauled?: string;
  loadWeightTonnes?: number;
  powerKWhAdded?: number;
  generatorLoadPercent?: number;
  fuelLitres?: number;
  fuelLevelAfter?: number;
  fuelCost?: number;
  fuelPricePerLitre?: number;
  hourlyRateApplied?: number; // Operating hourly rate in Rands applied at log time
  calculatedOperatingCost?: number; // hoursAdded * hourlyRateApplied (in Rands)
  cost?: number; // Direct maintenance or refuel cost
  tripRoute?: string;
  driverOperator?: string;
  operator?: string; // alias for driverOperator
  maintenanceType?: string;
  notes?: string;
  status?: EquipmentStatus;
  setStatus?: EquipmentStatus;
}

export interface SyncConflict {
  id: string;
  entityType: string;
  entityId: string;
  entityName: string;
  timestamp: string;
  localVersion: Record<string, any>;
  serverVersion: Record<string, any>;
  changedFields?: {
    fieldName: string;
    label: string;
    localValue: any;
    serverValue: any;
  }[];
}




export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'ZAR' | 'AUD' | 'CAD' | 'INR';

export type AccommodationOwnership = 'Owned' | 'Rented';

export type AccommodationType = 
  | 'Site Camp / Modular Cabin'
  | 'Container Home / Unit'
  | 'Shared House / Flat'
  | 'Single Room / Lodge'
  | 'Dormitory / Barracks'
  | 'Guest House';

export type AccommodationStatus = 'Available' | 'Partially Occupied' | 'Full' | 'Under Maintenance' | 'Vacated';

export type UtilityType = 
  | 'Electricity / Eskom Tokens'
  | 'Water & Sanitation'
  | 'Camp Generator Diesel'
  | 'LPG Gas / Cooking'
  | 'WiFi & Internet'
  | 'Cleaning & Laundry'
  | 'Waste & Septic Pump-out'
  | 'Repairs & Maintenance';

export type RentalRateType = 
  | 'Fixed Monthly' 
  | 'Per Occupant / Bed (Monthly)' 
  | 'Per Room (Monthly)' 
  | 'Daily / Per Night per Person';

export interface AccommodationUnit {
  id: string; // e.g. ACC-101
  name: string; // e.g. "Main Camp Block A", "Polokwane Staff House #2"
  type: AccommodationType;
  ownership: AccommodationOwnership;
  projectId?: string;
  projectName?: string;
  location: string;
  address?: string;
  totalCapacityBeds: number;
  totalRooms?: number; // Total number of rooms available or leased
  bedsPerRoom?: number; // Configured beds per room
  occupantIds: string[]; // array of Employee IDs
  status: AccommodationStatus;
  
  // Rental specific fields (when ownership === 'Rented')
  rentalVendor?: string; // Landlord or leasing agent
  rentalAgreementNumber?: string;
  rentalStartDate?: string;
  rentalEndDate?: string;
  rentalRateType?: RentalRateType; // Pricing model: Fixed vs Per-Occupant vs Per-Room
  rentalRatePerUnit?: number; // Rate per person/bed or per room in ZAR
  rentalMonthlyCost?: number; // Base or fixed monthly rent in ZAR
  rentalDepositPaid?: number;
  rentalBillingCycle?: 'Monthly' | 'Weekly' | 'Daily';

  // Amenities & specs
  amenities?: string[]; // e.g. ['WiFi', 'Aircon / Heating', 'Generator Backup', 'Water Tank / Borehole', 'Kitchenette', 'En-suite Bathroom']
  notes?: string;
  contactPerson?: string;
  contactPhone?: string;
  createdAt?: string;
}

export interface AccommodationUtilityLog {
  id: string; // e.g. ACC-UTL-001
  accommodationId: string;
  accommodationName: string;
  roomNumber?: string; // Optional Room ID/Number e.g. "Room 1", "Room 101", "Entire Facility / General"
  utilityType: UtilityType;
  date: string;
  amountZAR: number; // Cost in ZAR
  unitsConsumed?: number; // e.g. kWh, Litres, kg
  unitLabel?: string; // e.g. "kWh", "Litres", "Cylinders"
  vendorOrProvider?: string; // e.g. "Eskom", "Municipality", "Engen Diesel", "Afrox Gas"
  invoiceOrReceiptNumber?: string;
  paidStatus: 'Paid' | 'Pending' | 'Overdue';
  receiptPhotoUrl?: string; // Uploaded receipt image / invoice PDF data URL
  receiptFileName?: string;
  loggedBy: string;
  notes?: string;
}

export interface AccommodationPaymentLog {
  id: string; // e.g. ACC-PAY-001
  accommodationId: string;
  accommodationName: string;
  billingPeriod: string; // e.g. "2026-08" or "August 2026"
  paymentDate: string; // e.g. "2026-08-15"
  amountDueZAR: number; // Total calculated lease based on active occupants
  amountPaidZAR: number; // Amount paid in ZAR
  paymentMethod: 'EFT / Bank Transfer' | 'Direct Debit' | 'Company Cheque' | 'Credit Card' | 'Cash';
  referenceNumber?: string; // e.g. EFT-ACC-2026-08
  paidToVendor?: string; // Landlord or leasing agent
  status: 'Paid' | 'Partial' | 'Pending' | 'Overdue';
  occupantCount: number; // Number of resident employees at payment time
  proofOfPaymentUrl?: string; // Uploaded POP image or PDF data URL
  proofOfPaymentFileName?: string;
  loggedBy?: string;
  notes?: string;
  createdAt?: string;
}

// -------------------------------------------------------------------
// -------------------------------------------------------------------
// Activity & Field Notes Architecture
// -------------------------------------------------------------------

export interface NoteChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export type NoteCategory = 
  | 'Site Diary'
  | 'Site Observation'
  | 'Meeting Minutes'
  | 'Technical Memo'
  | 'QA & Inspection'
  | 'Safety & Risk'
  | 'Materials & Delivery'
  | 'Engineering Query'
  | 'General';

export type NotePriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type NoteColor = 'default' | 'blue' | 'amber' | 'emerald' | 'rose' | 'purple' | 'indigo' | 'cyan' | 'slate';

export interface ActivityNote {
  id: string;
  projectId?: string;
  activityId?: string;       // Linked Activity ID (e.g. "ACT-1179")
  activityName?: string;     // Linked Activity Name (e.g. "PTS08 TO PTS15")
  subtaskId?: string;        // Linked Subtask ID
  subtaskTitle?: string;     // Linked Subtask Title
  subtaskSeq?: string;       // Progression sequence e.g. "1.0", "2.1"
  title: string;
  content: string;
  category: NoteCategory;
  priority: NotePriority;
  tags?: string[];
  isPinned?: boolean;
  isResolved?: boolean;
  isArchived?: boolean;
  author: string;
  authorRole?: string;
  authorInitials?: string;
  createdAt: string;
  updatedAt?: string;
  checklists?: NoteChecklistItem[];
  photos?: string[];
  attachments?: string[];
  voiceNotes?: string[];
  location?: string;
  chainage?: string;
  color?: NoteColor;
  linkedEmployeeId?: string;
  linkedEquipmentId?: string;
  linkedReminderId?: string;
}

export type FieldNote = ActivityNote;


