export type ProjectStatus = 'Not Started' | 'In Progress' | 'Delayed' | 'Completed';
export type ActivityStatus = 'Not Started' | 'Ready' | 'In Progress' | 'Waiting' | 'Blocked' | 'Completed' | 'Cancelled';
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';

export type UserRole = 'Worker' | 'Manager';

export type ReminderStatus = 'Pending' | 'Completed' | 'Overdue';

export interface Reminder {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  dueTime?: string;
  status: ReminderStatus;
  priority: Priority;
  linkedModules: string[];
  linkedEmployeeId?: string;
  linkedEquipmentId?: string;
  linkedActivityId?: string;
  attachments?: string[];
  createdBy: string;
  createdAt: string;
}

export interface CustomFieldDefinition {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  options?: string[];
  required: boolean;
  active: boolean;
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
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  avatar?: string;
}

export type SubTaskCategory = 
  | 'Site Establishment'
  | 'Excavation & Earthworks'
  | 'Cable & Underground Installation'
  | 'Structure & Foundations'
  | 'Electrical & MEP'
  | 'Paving & Surfacing'
  | 'Quality & Inspection'
  | 'Custom';

export interface SubTask {
  id: string;
  title: string;
  category: SubTaskCategory;
  status: 'Not Started' | 'In Progress' | 'Completed';
  targetQuantity?: number;
  completedQuantity?: number;
  unit?: string;
  assignedPerson?: string;
  assignedEquipment?: string;
  dueDate?: string;
  notes?: string;
}

export interface ActivityExplainerItem {
  id: string;
  title: string;
  discipline?: string;
  scopeDescription: string;
  methodSpecs?: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  targetDate?: string;
}

export interface Activity {
  id: string;
  projectId: string;
  name: string;
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
  plannedHours: number;
  actualHours: number;
  progress: number;
  dependencies?: string[];
  constraints?: string[];
  remarks?: string;
  methodStatement?: string;
  explainerItems?: ActivityExplainerItem[];
  photos?: string[];
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
}

export interface TaskMaterialAssignment {
  id: string;
  materialId: string;
  name: string;
  quantity: number;
  unit: string;
  assignedDate: string;
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
}

export interface TaskEquipmentAssignment {
  id: string;
  equipmentId: string;
  name: string;
  operator?: string;
  startDate: string;
  endDate?: string;
  notes?: string;
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
  action: string;
  details: string;
  timestamp: string;
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
  hours: number;
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
  workerName: string;
  workerRole: string;
  startDate: string;
  endDate: string;
  status: 'Scheduled' | 'Active' | 'Completed' | 'Cancelled';
  notes?: string;
}

export interface ResourceAllocation {
  id: string;
  projectId: string;
  resourceType: 'Material' | 'Equipment';
  name: string;
  quantity: number;
  unit?: string;
  status: 'Allocated' | 'In Use' | 'Depleted' | 'Returned';
  assignedDate: string;
  expectedReturnDate?: string;
  assignedTo?: string;
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

export interface MaterialInventory {
  id: string;
  projectId: string;
  name: string;
  sku?: string;
  category: string;
  unit: string;
  estimatedQuantity: number;
  receivedQuantity: number;
  usedQuantity: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Over Estimate';
  unitCost?: number;
  location?: string;
  reorderLevel?: number;
  certificates?: MaterialCertificate[];
  photos?: string[];
  manuals?: MaterialDocument[];
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

export interface DailyReport {
  id: string;
  date: string;
  projectId: string;
  weather: string;
  temperature: string;
  siteConditions?: string;
  significantEvents?: string;
  workersOnSite: number;
  equipmentRunning: number;
  incidents: number;
  ncr: number;
  activitiesLogged?: string[];
  manpowerBreakdown?: { trade: string; count: number; hours: number }[];
  equipmentLogged?: { equipmentId: string; hours: number; status: string }[];
  photos?: string[];
  supervisorNotes?: string;
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

export interface Equipment {
  id: string;
  name: string;
  type: string;
  category?: string;
  status: EquipmentStatus;
  operator: string;
  location: string;
  engineHours: number;
  lastService: string;
  nextService?: string;
  fuelLevel: number; // percentage
  fuelColor?: string;
  serialNumber?: string;
  model?: string;
  notes?: string;
}

export type EquipmentLogType = 'Hours' | 'Refuel' | 'Maintenance';

export interface EquipmentLog {
  id: string;
  equipmentId: string;
  type: EquipmentLogType;
  date: string;
  loggedBy: string;
  hoursAdded?: number;
  totalHours?: number;
  fuelLitres?: number;
  fuelLevelAfter?: number;
  maintenanceType?: string;
  cost?: number;
  notes?: string;
  setStatus?: EquipmentStatus;
}


