import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Check, 
  Plus, 
  HardHat, 
  ShieldCheck, 
  Compass, 
  Truck, 
  FileCheck, 
  Zap, 
  Layers, 
  UserCheck, 
  AlertTriangle, 
  Sparkles, 
  Tag, 
  FolderPlus,
  Wrench,
  Flame,
  Users,
  Settings,
  Cpu,
  Bookmark
} from 'lucide-react';
import { Button } from './ui';

export interface PrerequisiteCategoryDef {
  id: string;
  name: string;
  group: 'Safety & HSE' | 'Engineering & Survey' | 'Civil & Structural' | 'MEP & Utilities' | 'Plant & QA';
  description: string;
  icon: any;
  bg: string;
  text: string;
  border: string;
  badgeBg: string;
}

export const PREREQUISITE_CATEGORIES: PrerequisiteCategoryDef[] = [
  // 1. Safety & HSE
  {
    id: 'permit-safety',
    name: 'Permit & Safety',
    group: 'Safety & HSE',
    description: 'Hot works, excavation permits, PPE, hazard risk assessments & safety sign-offs',
    icon: HardHat,
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    badgeBg: 'bg-red-100 dark:bg-red-900/60'
  },
  {
    id: 'environmental-spill',
    name: 'Environmental & Spill Control',
    group: 'Safety & HSE',
    description: 'EIA compliance, spill kits, stormwater runoff, dust suppression & waste disposal',
    icon: ShieldCheck,
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/60'
  },
  {
    id: 'site-access-induction',
    name: 'Site Access & Induction',
    group: 'Safety & HSE',
    description: 'Gate clearances, medical fitness certs, daily toolbox talks & site rules briefing',
    icon: UserCheck,
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/60'
  },
  {
    id: 'heights-confined',
    name: 'Working at Heights & Confined Space',
    group: 'Safety & HSE',
    description: 'Harness inspection, scaffolding green tags, atmospheric gas testing & rescue plan',
    icon: AlertTriangle,
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
    badgeBg: 'bg-rose-100 dark:bg-rose-900/60'
  },

  // 2. Engineering & Survey
  {
    id: 'survey-location',
    name: 'Survey & Location',
    group: 'Engineering & Survey',
    description: 'Pegging, benchmark datum, GPS coordinates, chainage, elevation & as-builts',
    icon: Compass,
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-800',
    badgeBg: 'bg-sky-100 dark:bg-sky-900/60'
  },
  {
    id: 'design-clearance',
    name: 'Design & Engineering Clearance',
    group: 'Engineering & Survey',
    description: 'Approved IFC drawings, engineer sign-off, RFI resolutions & revision validation',
    icon: FileCheck,
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/60'
  },
  {
    id: 'geotech-soil',
    name: 'Geotechnical & Soil Testing',
    group: 'Engineering & Survey',
    description: 'Borehole log verification, ground stability analysis & California Bearing Ratio (CBR)',
    icon: Layers,
    bg: 'bg-stone-100 dark:bg-stone-900/40',
    text: 'text-stone-700 dark:text-stone-300',
    border: 'border-stone-200 dark:border-stone-800',
    badgeBg: 'bg-stone-200 dark:bg-stone-800'
  },

  // 3. Civil & Structural
  {
    id: 'excavation-earthworks',
    name: 'Excavation & Earthworks',
    group: 'Civil & Structural',
    description: 'Underground service scanning (CAT scan), trench shoring & sub-base compaction',
    icon: Layers,
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
    badgeBg: 'bg-orange-100 dark:bg-orange-900/60'
  },
  {
    id: 'concrete-structural',
    name: 'Concrete & Structural Formwork',
    group: 'Civil & Structural',
    description: 'Rebar placement, cover blocks, formwork stability, pre-pour sign-off & slump test',
    icon: Layers,
    bg: 'bg-slate-100 dark:bg-slate-800/80',
    text: 'text-slate-800 dark:text-slate-200',
    border: 'border-slate-300 dark:border-slate-700',
    badgeBg: 'bg-slate-200 dark:bg-slate-700'
  },
  {
    id: 'paving-roadworks',
    name: 'Paving, Roadworks & Asphalting',
    group: 'Civil & Structural',
    description: 'Sub-grade level check, prime coat, asphalt temp, rolling passes & curb alignment',
    icon: Layers,
    bg: 'bg-zinc-100 dark:bg-zinc-900/40',
    text: 'text-zinc-800 dark:text-zinc-200',
    border: 'border-zinc-300 dark:border-zinc-700',
    badgeBg: 'bg-zinc-200 dark:bg-zinc-800'
  },

  // 4. MEP & Utilities
  {
    id: 'mep-electrical',
    name: 'MEP & Electrical Isolations',
    group: 'MEP & Utilities',
    description: 'Lockout/Tagout (LOTO), megger insulation test, earthing & circuit continuity',
    icon: Zap,
    bg: 'bg-yellow-50 dark:bg-yellow-950/40',
    text: 'text-yellow-800 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800',
    badgeBg: 'bg-yellow-100 dark:bg-yellow-900/60'
  },
  {
    id: 'utilities-wayleaves',
    name: 'Utilities & Wayleaves',
    group: 'MEP & Utilities',
    description: 'Municipal wayleaves, power grid tie-in clearance, water mains & gas line permits',
    icon: Wrench,
    bg: 'bg-cyan-50 dark:bg-cyan-950/40',
    text: 'text-cyan-800 dark:text-cyan-300',
    border: 'border-cyan-200 dark:border-cyan-800',
    badgeBg: 'bg-cyan-100 dark:bg-cyan-900/60'
  },
  {
    id: 'piping-pressure',
    name: 'Piping, Plumbing & Pressure Tests',
    group: 'MEP & Utilities',
    description: 'Hydrostatic pressure testing, weld NDT x-ray, pipe gradient & valve alignment',
    icon: Flame,
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-800 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-900/60'
  },

  // 5. Plant & QA
  {
    id: 'materials-plant',
    name: 'Materials & Plant',
    group: 'Plant & QA',
    description: 'Batch tickets, supplier delivery notes, material test certs & storage protection',
    icon: Truck,
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/60'
  },
  {
    id: 'plant-prestart',
    name: 'Plant & Equipment Pre-start',
    group: 'Plant & QA',
    description: 'Operator licensing, machine daily inspection, lifting rigging certs & fire extinguisher',
    icon: Cpu,
    bg: 'bg-lime-50 dark:bg-lime-950/40',
    text: 'text-lime-800 dark:text-lime-300',
    border: 'border-lime-200 dark:border-lime-800',
    badgeBg: 'bg-lime-100 dark:bg-lime-900/60'
  },
  {
    id: 'subcontractor-crew',
    name: 'Subcontractor & Crew Allocation',
    group: 'Plant & QA',
    description: 'Trade skills verification, crew size, supervisor appointment & shift rosters',
    icon: Users,
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    text: 'text-violet-700 dark:text-violet-300',
    border: 'border-violet-200 dark:border-violet-800',
    badgeBg: 'bg-violet-100 dark:bg-violet-900/60'
  },
  {
    id: 'qa-method',
    name: 'QA & Method Statement',
    group: 'Plant & QA',
    description: 'ITP hold point verification, method statement briefing, test cubes & witness points',
    icon: ShieldCheck,
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    badgeBg: 'bg-purple-100 dark:bg-purple-900/60'
  },
  {
    id: 'operational-handover',
    name: 'Operational Readiness & Handover',
    group: 'Plant & QA',
    description: 'Commissioning pre-checks, live plant interface, facility clearance & client walk-downs',
    icon: Settings,
    bg: 'bg-teal-50 dark:bg-teal-950/40',
    text: 'text-teal-800 dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-800',
    badgeBg: 'bg-teal-100 dark:bg-teal-900/60'
  },
  {
    id: 'general',
    name: 'General',
    group: 'Plant & QA',
    description: 'General administrative, progress milestones and site prerequisite checks',
    icon: FileCheck,
    bg: 'bg-slate-50 dark:bg-slate-800/60',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    badgeBg: 'bg-slate-100 dark:bg-slate-800'
  }
];

export function getCategoryMetadata(categoryName: string): PrerequisiteCategoryDef {
  const found = PREREQUISITE_CATEGORIES.find(
    c => c.name.toLowerCase() === categoryName.toLowerCase()
  );

  if (found) return found;

  // Custom Category fallback
  return {
    id: `custom-${categoryName.toLowerCase().replace(/\s+/g, '-')}`,
    name: categoryName,
    group: 'Plant & QA',
    description: 'Custom site prerequisite category',
    icon: Bookmark,
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-900/60'
  };
}

interface PrerequisiteCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: string;
  onSelectCategory: (categoryName: string) => void;
}

export function PrerequisiteCategoryModal({
  isOpen,
  onClose,
  selectedCategory,
  onSelectCategory
}: PrerequisiteCategoryModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [isCustomExpanded, setIsCustomExpanded] = useState(false);

  const groups = ['All', 'Safety & HSE', 'Engineering & Survey', 'Civil & Structural', 'MEP & Utilities', 'Plant & QA'];

  // Filter categories by search and group
  const filteredCategories = useMemo(() => {
    return PREREQUISITE_CATEGORIES.filter(cat => {
      const matchesGroup = selectedGroup === 'All' || cat.group === selectedGroup;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        cat.name.toLowerCase().includes(query) || 
        cat.description.toLowerCase().includes(query) ||
        cat.group.toLowerCase().includes(query);

      return matchesGroup && matchesSearch;
    });
  }, [searchQuery, selectedGroup]);

  if (!isOpen) return null;

  const handleSelect = (name: string) => {
    onSelectCategory(name);
    onClose();
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCategoryInput.trim()) return;
    onSelectCategory(customCategoryInput.trim());
    setCustomCategoryInput('');
    setIsCustomExpanded(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0B5FFF]">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Select Prerequisite Category
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Categorize your site gate checks, permits, QA holds, and operational readiness
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Group Filter Bar */}
        <div className="p-3 sm:px-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Search 15+ construction, HSE, MEP & operational categories..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#0B5FFF]"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Group Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {groups.map(grp => (
              <button
                key={grp}
                type="button"
                onClick={() => setSelectedGroup(grp)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                  selectedGroup === grp
                    ? 'bg-[#0B5FFF] text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {grp}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body: Categories Grid List */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 custom-scrollbar space-y-2">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8 px-4 text-slate-400 space-y-2">
              <p className="text-xs font-semibold">No standard category matching "{searchQuery}"</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCustomCategoryInput(searchQuery);
                  setIsCustomExpanded(true);
                }}
                className="text-xs gap-1 border-indigo-200 text-indigo-600"
              >
                <Plus className="h-3.5 w-3.5" /> Create "{searchQuery}" as Custom Category
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredCategories.map(cat => {
                const IconComp = cat.icon;
                const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();

                return (
                  <div
                    key={cat.id}
                    onClick={() => handleSelect(cat.name)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'border-[#0B5FFF] bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-400/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${cat.bg} ${cat.text} border ${cat.border}`}>
                      <IconComp className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {cat.name}
                        </span>
                        {isSelected && (
                          <span className="p-0.5 rounded-full bg-[#0B5FFF] text-white shrink-0">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {cat.description}
                      </p>
                      <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        {cat.group}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Custom Category Accordion / Input Section */}
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {!isCustomExpanded ? (
              <button
                type="button"
                onClick={() => setIsCustomExpanded(true)}
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <FolderPlus className="h-4 w-4" />
                <span>+ Add Custom Category</span>
              </button>
            ) : (
              <form onSubmit={handleApplyCustom} className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1">
                    <Bookmark className="h-3.5 w-3.5 text-indigo-600" />
                    Enter Custom Category Name
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setIsCustomExpanded(false)}
                    className="text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Geotechnical Boreholes, Rail Signalling, Subsea Cable..."
                    value={customCategoryInput}
                    onChange={e => setCustomCategoryInput(e.target.value)}
                    className="flex-1 h-8 px-3 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 px-3 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                  >
                    Apply Custom
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
          <span>Current Selection: <strong className="text-slate-900 dark:text-white">{selectedCategory}</strong></span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-7 text-xs rounded-lg"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
