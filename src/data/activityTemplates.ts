import { SubTask, SubTaskCategory } from '../types';

export interface ActivityTemplate {
  id: string;
  name: string;
  discipline: string;
  category: SubTaskCategory;
  description: string;
  subtasks: Omit<SubTask, 'id'>[];
}

export const WORKFLOW_TEMPLATES: ActivityTemplate[] = [
  {
    id: 'tmpl-site-est',
    name: 'Site Establishment & Setup',
    discipline: 'General',
    category: 'Site Establishment',
    description: 'Complete setup of site perimeter, security, office trailers, and temporary utility connections.',
    subtasks: [
      { title: 'Site Survey & Boundary Marking', category: 'Site Establishment', status: 'Not Started', isMilestone: true, milestoneCriteria: 'Boundary pegs verified and signed off by land surveyor', notes: 'Verify boundary pegs and pegs alignment' },
      { title: 'Erect Security Fencing & Signage', category: 'Site Establishment', status: 'Not Started', targetQuantity: 150, unit: 'm' },
      { title: 'Position Site Office & Welfare Trailers', category: 'Site Establishment', status: 'Not Started' },
      { title: 'Connect Temporary Power & Water Supply', category: 'Site Establishment', status: 'Not Started' },
      { title: 'Establish Material Staging Area & Laydown Yard', category: 'Site Establishment', status: 'Not Started' }
    ]
  },
  {
    id: 'tmpl-excavation',
    name: 'Excavation & Trenching Operations',
    discipline: 'Civil',
    category: 'Excavation & Earthworks',
    description: 'Topsoil stripping, trench excavation, shoring, bedding material, and backfill compaction.',
    subtasks: [
      { title: 'Topsoil Stripping & Vegetation Clearing', category: 'Excavation & Earthworks', status: 'Not Started', targetQuantity: 500, unit: 'm²' },
      { title: 'Trench Excavation to Grade', category: 'Excavation & Earthworks', status: 'Not Started', targetQuantity: 120, unit: 'm³' },
      { title: 'Trench Shoring & Safety Inspection', category: 'Excavation & Earthworks', status: 'Not Started', isMilestone: true, milestoneCriteria: 'Geotechnical & safety engineer sign-off before trench entry' },
      { title: 'Sand Bedding & Base Preparation', category: 'Excavation & Earthworks', status: 'Not Started', targetQuantity: 50, unit: 'm³' },
      { title: 'Backfilling & Layer Compaction', category: 'Excavation & Earthworks', status: 'Not Started', targetQuantity: 120, unit: 'm³' }
    ]
  },
  {
    id: 'tmpl-cable-install',
    name: 'Underground Cable Installation',
    discipline: 'Electrical',
    category: 'Cable & Underground Installation',
    description: 'Conduit laying, cable pulling, chamber terminations, splicing, and insulation testing.',
    subtasks: [
      { title: 'HDPE Conduit Laying & Duct Assembly', category: 'Cable & Underground Installation', status: 'Not Started', targetQuantity: 250, unit: 'm' },
      { title: 'Mandrel & Duct Probing Inspection', category: 'Cable & Underground Installation', status: 'Not Started' },
      { title: 'Main MV/LV Cable Pulling', category: 'Cable & Underground Installation', status: 'Not Started', targetQuantity: 250, unit: 'm' },
      { title: 'Cable Splicing & Box Terminations', category: 'Cable & Underground Installation', status: 'Not Started', targetQuantity: 4, unit: 'units' },
      { title: 'Insulation Resistance & Continuity Test', category: 'Quality & Inspection', status: 'Not Started', isMilestone: true, milestoneCriteria: 'Insulation resistance test certificate and QA verification' }
    ]
  },
  {
    id: 'tmpl-structure-found',
    name: 'Structure & Foundation Concrete Pour',
    discipline: 'Structural',
    category: 'Structure & Foundations',
    description: 'Blinding layer, rebar fixing, shuttering formwork, concrete pour, and 7-day curing.',
    subtasks: [
      { title: 'Blinding Concrete Pour (Mass Con)', category: 'Structure & Foundations', status: 'Not Started', targetQuantity: 25, unit: 'm³' },
      { title: 'Steel Reinforcement Rebar Cage Fixing', category: 'Structure & Foundations', status: 'Not Started', targetQuantity: 4.5, unit: 'Tons' },
      { title: 'Shuttering Formwork Assembly & Oiling', category: 'Structure & Foundations', status: 'Not Started', targetQuantity: 80, unit: 'm²' },
      { title: 'Structural Concrete Pour & Vibration', category: 'Structure & Foundations', status: 'Not Started', targetQuantity: 65, unit: 'm³', isMilestone: true, milestoneCriteria: 'Slump test recorded and 28-day cube samples taken' },
      { title: 'Formwork Stripping & Curing Blanket Setup', category: 'Structure & Foundations', status: 'Not Started' }
    ]
  },
  {
    id: 'tmpl-paving',
    name: 'Road Paving & Surface Asphalt',
    discipline: 'Civil',
    category: 'Paving & Surfacing',
    description: 'Sub-base trimming, G1 base layer compaction, prime coat spraying, and asphalt wearing course.',
    subtasks: [
      { title: 'Sub-base Trimming & Moisture Compaction', category: 'Paving & Surfacing', status: 'Not Started', targetQuantity: 300, unit: 'm²' },
      { title: 'G1 Crushed Stone Base Layer Placement', category: 'Paving & Surfacing', status: 'Not Started', targetQuantity: 150, unit: 'm³' },
      { title: 'Bitumen Emulsion Prime Coat Spraying', category: 'Paving & Surfacing', status: 'Not Started', targetQuantity: 300, unit: 'm²' },
      { title: 'Asphalt Hot Mix Laydown & Rolling', category: 'Paving & Surfacing', status: 'Not Started', targetQuantity: 40, unit: 'Tons', isMilestone: true, milestoneCriteria: 'Density and compaction test > 98% Mod AASHTO verified' },
      { title: 'Kerb Laying & Channel Drainage', category: 'Paving & Surfacing', status: 'Not Started', targetQuantity: 100, unit: 'm' }
    ]
  },
  {
    id: 'tmpl-linear-pipeline',
    name: 'Linear Pipeline & Trenching Corridor (PTS Sections)',
    discipline: 'Civil & Earthworks',
    category: 'Surveying & Set-out',
    description: 'Linear trench corridor construction with advance survey set-out, benchmark verification, excavation, bedding, pipe jointing, and backfilling.',
    subtasks: [
      { 
        title: 'Trench set-out (Surveying & Pegging)', 
        category: 'Surveying & Set-out', 
        status: 'Not Started', 
        targetQuantity: 433, 
        unit: 'm', 
        isMilestone: true, 
        milestoneCriteria: 'Ground benchmark and trench centerline pegs established & QA verified',
        notes: 'Centerline stakes and 20m offset pegs verified with surveyor benchmark'
      },
      { 
        title: 'Trench marking & boundary alignment checks', 
        category: 'Excavation & Earthworks', 
        status: 'Not Started', 
        targetQuantity: 433, 
        unit: 'm' 
      },
      { 
        title: 'Trench excavation to invert grade', 
        category: 'Excavation & Earthworks', 
        status: 'Not Started', 
        targetQuantity: 520, 
        unit: 'm³' 
      },
      { 
        title: 'Sand bedding layer placement (100mm)', 
        category: 'Excavation & Earthworks', 
        status: 'Not Started', 
        targetQuantity: 175, 
        unit: 'm³' 
      },
      { 
        title: 'Pipe laying, laser joint alignment & coupling', 
        category: 'Cable & Underground Installation', 
        status: 'Not Started', 
        targetQuantity: 433, 
        unit: 'm',
        isMilestone: true,
        milestoneCriteria: 'Joint pressure integrity and visual laser alignment signed off'
      },
      { 
        title: 'Selected fill surround & final backfill compaction', 
        category: 'Excavation & Earthworks', 
        status: 'Not Started', 
        targetQuantity: 520, 
        unit: 'm³' 
      }
    ]
  }
];
