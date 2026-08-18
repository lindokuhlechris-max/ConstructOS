import { ChecklistTemplate } from '../types';

export const STORAGE_KEY_CHECKLIST_TEMPLATES = 'scedih_checklist_templates';

export const DEFAULT_CHECKLIST_TEMPLATES: ChecklistTemplate[] = [
  {
    id: 'tmpl-std-safety-permits',
    title: 'Safety & Site Permits Pre-Start',
    category: 'Permit & Safety',
    discipline: 'General / Safety',
    description: 'Mandatory statutory safety permits, toolbox talks, and emergency rescue readiness before commencing any work.',
    items: [
      'Permit to Work (PTW) & Hot Work / Excavation Permit signed & displayed',
      'Daily Pre-Shift Risk Assessment & Toolbox Talk conducted with crew',
      'Mandatory PPE compliance checked (Hi-Vis, Hard Hat, Steel Toes, Eye Protection)',
      'Site First-Aider & Emergency assembly point identified',
      'Communication radios and emergency contact numbers confirmed operational'
    ],
    isCustom: false
  },
  {
    id: 'tmpl-std-survey-setting-out',
    title: 'Civil & Survey Setting-Out',
    category: 'Survey & Location',
    discipline: 'Civil / Surveying',
    description: 'Verification of survey pegs, control benchmarks, utility scans, and alignment offsets.',
    items: [
      'Pegging coordinates & survey pegs verified against approved construction drawings',
      'Benchmark reference elevation (AMSL) verified with survey team',
      'Underground services & buried utilities scanned (CAT & Genny clearance)',
      'Trench center-line & boundary offset chalked out',
      'Site clearing limits and easement boundaries visibly staked'
    ],
    isCustom: false
  },
  {
    id: 'tmpl-std-plant-machinery',
    title: 'Plant, Machinery & Tools Pre-Start',
    category: 'Materials & Plant',
    discipline: 'Mechanical / Plant',
    description: 'Operator certifications, daily mechanical inspections, reverse alarms, and trench safety boxes staging.',
    items: [
      'Plant & excavator 10-point daily pre-start inspection checklist completed',
      'Plant operator license & competency certification verified',
      'Audible reverse alarms, flashing beacon, and emergency stop operational',
      'Trench shoring boxes / trench shields staged on site',
      'Fire extinguishers in cabin inspected and in date'
    ],
    isCustom: false
  },
  {
    id: 'tmpl-std-qa-method',
    title: 'Quality & Technical Method Statement',
    category: 'QA & Method Statement',
    discipline: 'Quality / Engineering',
    description: 'Inspection Test Plans (ITP), material delivery batch certifications, and lab testing arrangements.',
    items: [
      'Approved Method Statement & Inspection Test Plan (ITP) briefed to foreman',
      'Bedding sand gradation & delivery batch approval certificate verified',
      'Compaction density test equipment (nuclear gauge / DCP) scheduled for hold point',
      'Environmental dust suppression & spill kit accessible',
      'Hold-point notification issued to client QA/QC inspector'
    ],
    isCustom: false
  },
  {
    id: 'tmpl-std-underground-electrical',
    title: 'Underground Cable & Conduit Pre-Laying',
    category: 'QA & Method Statement',
    discipline: 'Electrical',
    description: 'Conduit integrity checks, cable drum inspection, mandrel clearance, and warning tape readiness.',
    items: [
      'Approved electrical schematic & cable schedule on site',
      'Cable drum insulation pre-test (Megger test) verified before pulling',
      'HDPE conduit mandrel pulled & proved clean of debris',
      'Underground electrical warning tape & cable tiles staged on site',
      'Trench depth & sand bedding thickness verified by inspector'
    ],
    isCustom: false
  },
  {
    id: 'tmpl-std-trench-entry',
    title: 'Deep Trench & Confined Space Entry',
    category: 'Permit & Safety',
    discipline: 'Safety / Geotechnical',
    description: 'Atmospheric gas testing, certified shoring boxes, ladder access every 7.5m, and top standby person.',
    items: [
      'Confined space / deep excavation entry permit authorized',
      'Atmospheric gas monitoring performed (O2, H2S, CO, LEL levels safe)',
      'Certified trench shoring / hydraulic jacks installed according to soil type',
      'Ladders positioned for safe egress every 7.5 meters',
      'Designated surface standby watchman stationed at trench edge'
    ],
    isCustom: false
  },
  {
    id: 'tmpl-std-concrete-pour',
    title: 'Concrete Pour & Foundation Readiness',
    category: 'QA & Method Statement',
    discipline: 'Structural',
    description: 'Rebar cover blocks, shutter cleanliness, slump test cone, batch plant booking, and curing blankets.',
    items: [
      'Rebar spacing, tying wire, and concrete cover blocks inspected & approved',
      'Formwork / shuttering securely braced, oiled, and cleaned of debris',
      'Ready-mix concrete batch plant schedule & slump test equipment ready',
      'Test cylinder / cube sampling moulds and water curing bath prepared',
      'Concrete poker vibrators checked and backup vibrator on standby'
    ],
    isCustom: false
  }
];

/**
 * Loads all checklist templates (combining built-in standards with user-saved custom templates)
 */
export function getChecklistTemplates(): ChecklistTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CHECKLIST_TEMPLATES);
    if (!raw) {
      // First time initialization
      localStorage.setItem(STORAGE_KEY_CHECKLIST_TEMPLATES, JSON.stringify(DEFAULT_CHECKLIST_TEMPLATES));
      return DEFAULT_CHECKLIST_TEMPLATES;
    }
    const parsed: ChecklistTemplate[] = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to load checklist templates from localStorage:', err);
  }
  return DEFAULT_CHECKLIST_TEMPLATES;
}

/**
 * Saves or updates a checklist template in persistent storage
 */
export function saveChecklistTemplate(
  template: Omit<ChecklistTemplate, 'id' | 'createdAt'> & { id?: string }
): ChecklistTemplate {
  const existing = getChecklistTemplates();
  const now = new Date().toISOString();

  let savedItem: ChecklistTemplate;

  if (template.id && existing.some(t => t.id === template.id)) {
    // Update existing template
    savedItem = {
      ...template,
      id: template.id,
      updatedAt: now,
      isCustom: true
    };
    const updatedList = existing.map(t => (t.id === template.id ? savedItem : t));
    localStorage.setItem(STORAGE_KEY_CHECKLIST_TEMPLATES, JSON.stringify(updatedList));
  } else {
    // Create new template
    savedItem = {
      ...template,
      id: `tmpl-custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: now,
      updatedAt: now,
      isCustom: true
    };
    const updatedList = [savedItem, ...existing];
    localStorage.setItem(STORAGE_KEY_CHECKLIST_TEMPLATES, JSON.stringify(updatedList));
  }

  return savedItem;
}

/**
 * Deletes a custom checklist template
 */
export function deleteChecklistTemplate(templateId: string): boolean {
  try {
    const existing = getChecklistTemplates();
    const updatedList = existing.filter(t => t.id !== templateId);
    localStorage.setItem(STORAGE_KEY_CHECKLIST_TEMPLATES, JSON.stringify(updatedList));
    return true;
  } catch (err) {
    console.error('Failed to delete checklist template:', err);
    return false;
  }
}

/**
 * Resets the checklist templates back to the default industry standard templates
 */
export function resetDefaultChecklistTemplates(): ChecklistTemplate[] {
  localStorage.setItem(STORAGE_KEY_CHECKLIST_TEMPLATES, JSON.stringify(DEFAULT_CHECKLIST_TEMPLATES));
  return DEFAULT_CHECKLIST_TEMPLATES;
}
