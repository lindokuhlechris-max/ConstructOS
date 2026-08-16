import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from './ui';
import { X, Building2, MapPin, Calendar, Users, FileText, CheckCircle2, ShieldAlert, Edit3, Save, Plus, Trash2, Download, BookOpen, Search, Tag, Printer, FileSpreadsheet } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAppContext } from '../context/AppContext';
import { Project } from '../types';
import { exportFullProjectCSV } from '../lib/csvExport';

export function ProjectDetailScreen({ project: initialProject, onClose }: { project: Project; onClose: () => void }) {
  const { activities, reports, projects } = useAppContext();
  const [activeTab, setActiveTab] = useState<'details' | 'scope' | 'rules' | 'terminologies'>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [project, setProject] = useState(initialProject);
  const [terminologySearch, setTerminologySearch] = useState('');
  
  // Mock state for scope, rules, and terminologies
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [scopeDescription, setScopeDescription] = useState('');
  const [rules, setRules] = useState<any[]>([]);

  const [terminologies, setTerminologies] = useState<Array<{ term: string; abbreviation?: string; definition: string; category?: string }>>([
    { term: 'Overhead Line', abbreviation: 'OHL', definition: 'Electric power transmission lines suspended by towers or utility poles.', category: 'Electrical' },
    { term: 'Method Statement & Risk Assessment', abbreviation: 'RAMS', definition: 'Document detailing safe working procedures, hazards, and mitigation controls.', category: 'Safety & Quality' },
    { term: 'Bill of Quantities', abbreviation: 'BOQ', definition: 'Itemized list of materials, labor, and cost rates for the project contract.', category: 'Commercial' },
    { term: 'Non-Conformance Report', abbreviation: 'NCR', definition: 'Formal record documenting work or material that falls below required project specs.', category: 'Quality' },
    { term: 'Safe Work Method Statement', abbreviation: 'SWMS', definition: 'Mandatory document outlining high-risk construction activities and safety controls.', category: 'Safety' },
    { term: 'Civil Works', abbreviation: 'CIV', definition: 'Infrastructure, earthworks, foundations, and structural tasks on site.', category: 'Civil' }
  ]);

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Project Details
    doc.setFontSize(18);
    doc.text(`Project Details: ${project.name}`, 14, 20);
    
    doc.setFontSize(12);
    doc.text(`ID: ${project.id}`, 14, 30);
    doc.text(`Location: ${project.location}`, 14, 38);
    doc.text(`Status: ${project.status}`, 14, 46);
    doc.text(`Progress: ${project.progress}%`, 14, 54);
    
    // Scope Description
    doc.setFontSize(14);
    doc.text('Project Scope', 14, 66);
    doc.setFontSize(10);
    const splitScope = doc.splitTextToSize(scopeDescription, 180);
    doc.text(splitScope, 14, 74);
    
    let currentY = 74 + (splitScope.length * 5) + 6;
    
    // Deliverables
    doc.setFontSize(14);
    doc.text('Key Deliverables', 14, currentY);
    currentY += 6;
    
    const tableData = deliverables.map(d => [d.pos, d.description, d.specification, d.unit, d.quantity]);
    autoTable(doc, {
      startY: currentY,
      head: [['Pos', 'Item Description', 'Specification', 'Unit', 'Quantity']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [11, 95, 255] }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 14;
    
    // Rules
    doc.setFontSize(14);
    doc.text('Site Safety Rules', 14, currentY);
    currentY += 8;
    
    doc.setFontSize(10);
    rules.forEach(ruleSec => {
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFont(undefined, 'bold');
      doc.text(ruleSec.title, 14, currentY);
      currentY += 6;
      
      doc.setFont(undefined, 'normal');
      ruleSec.items.forEach(item => {
        if (currentY > 280) {
          doc.addPage();
          currentY = 20;
        }
        const splitItem = doc.splitTextToSize(`• ${item}`, 175);
        doc.text(splitItem, 18, currentY);
        currentY += splitItem.length * 5;
      });
      currentY += 4;
    });

    // Terminologies
    if (terminologies.length > 0) {
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      } else {
        currentY += 10;
      }
      doc.setFontSize(14);
      doc.text('Project Terminologies & Acronyms', 14, currentY);
      currentY += 6;

      const termData = terminologies.map(t => [t.term, t.abbreviation || '-', t.category || '-', t.definition]);
      autoTable(doc, {
        startY: currentY,
        head: [['Term', 'Acronym', 'Category', 'Definition']],
        body: termData,
        theme: 'grid',
        headStyles: { fillColor: [11, 95, 255] }
      });
    }
    
    doc.save(`${project.name.replace(/\s+/g, '_')}_Details.pdf`);
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-slate-900 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-slate-50 dark:bg-slate-800/80 p-6 md:px-8 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl h-10 w-10 text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 shrink-0">
            <X className="h-5 w-5" />
          </Button>
          <div className="w-14 h-14 bg-[#0B5FFF] rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-sm shrink-0">
            {project.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-[#0B5FFF] uppercase tracking-wider">{project.id}</span>
              <Badge variant={project.status === 'In Progress' ? 'success' : 'default'} className="text-[10px] uppercase">
                {project.status}
              </Badge>
            </div>
            {isEditing ? (
              <input 
                type="text" 
                value={project.name} 
                onChange={(e) => setProject({...project, name: e.target.value})}
                className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight bg-transparent border-b border-[#0B5FFF] focus:outline-none px-1"
              />
            ) : (
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">{project.name}</h2>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isEditing ? (
            <Button onClick={handleSave} className="bg-[#0B5FFF] hover:bg-blue-700 text-white gap-2 rounded-xl">
              <Save className="h-4 w-4" /> Save Changes
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => exportFullProjectCSV(activities, reports, projects, project.id)} 
                className="gap-2 rounded-xl border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 font-semibold"
                title="Export project activities and reports to CSV"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Export CSV
              </Button>
              <Button variant="outline" onClick={handleExportPDF} className="gap-2 rounded-xl border-slate-200 dark:border-slate-700 font-semibold">
                <Download className="h-4 w-4 text-[#0B5FFF]" /> Export PDF
              </Button>
              <Button variant="outline" onClick={() => window.print()} className="gap-2 rounded-xl border-slate-200 dark:border-slate-700 font-semibold">
                <Printer className="h-4 w-4 text-slate-600 dark:text-slate-300" /> Print
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2 rounded-xl border-slate-200 dark:border-slate-700 font-semibold">
                <Edit3 className="h-4 w-4" /> Edit Project
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 px-6 md:px-8 pt-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <button
          onClick={() => setActiveTab('details')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'details' ? 'border-[#0B5FFF] text-[#0B5FFF]' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Project Details
        </button>
        <button
          onClick={() => setActiveTab('scope')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'scope' ? 'border-[#0B5FFF] text-[#0B5FFF]' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Scope of Work
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'rules' ? 'border-[#0B5FFF] text-[#0B5FFF]' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Project Rules
        </button>
        <button
          onClick={() => setActiveTab('terminologies')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'terminologies' ? 'border-[#0B5FFF] text-[#0B5FFF]' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Project Terminologies
        </button>
      </div>

      {/* Content */}
      <div className="p-6 md:px-8 overflow-y-auto min-h-0 bg-slate-50/50 dark:bg-slate-900/50 flex-1">
        <div className="w-full">
          {activeTab === 'details' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <span className="flex items-center gap-1.5 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2"><Building2 className="h-4 w-4 text-[#0B5FFF]" /> Client</span>
                  {isEditing ? (
                    <input type="text" value={project.client} onChange={(e) => setProject({...project, client: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm" />
                  ) : (
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{project.client}</span>
                  )}
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <span className="flex items-center gap-1.5 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2"><MapPin className="h-4 w-4 text-[#0B5FFF]" /> Location</span>
                  {isEditing ? (
                    <input type="text" value={project.location} onChange={(e) => setProject({...project, location: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm" />
                  ) : (
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{project.location}</span>
                  )}
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <span className="flex items-center gap-1.5 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2"><Calendar className="h-4 w-4 text-[#0B5FFF]" /> Duration</span>
                  {isEditing ? (
                    <div className="flex gap-2 items-center">
                      <input type="date" value={project.startDate} onChange={(e) => setProject({...project, startDate: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm" />
                      <span className="text-slate-400">to</span>
                      <input type="date" value={project.finishDate} onChange={(e) => setProject({...project, finishDate: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm" />
                    </div>
                  ) : (
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{project.startDate} to {project.finishDate}</span>
                  )}
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <span className="flex items-center gap-1.5 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2"><Users className="h-4 w-4 text-[#0B5FFF]" /> Project Engineer</span>
                  {isEditing ? (
                    <input type="text" value={project.engineer} onChange={(e) => setProject({...project, engineer: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm" />
                  ) : (
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{project.engineer}</span>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Overall Progress</h3>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="relative inline-flex items-center justify-center shrink-0">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="currentColor" className="text-slate-100 dark:text-slate-700" strokeWidth="12" fill="transparent" />
                      <circle cx="64" cy="64" r="56" stroke="#0B5FFF" strokeWidth="12" fill="transparent" strokeDasharray="351" strokeDashoffset={351 - (351 * project.progress) / 100} strokeLinecap="round" />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{project.progress}%</span>
                    </div>
                  </div>
                  <div className="space-y-4 flex-1">
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Project is currently tracking according to schedule. Critical path activities are progressing with minimal delays.
                    </p>
                    {isEditing && (
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Adjust Progress</label>
                        <input type="range" min="0" max="100" value={project.progress} onChange={(e) => setProject({...project, progress: parseInt(e.target.value)})} className="w-full" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scope' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <FileText className="h-5 w-5 text-[#0B5FFF]" />
                  Project Scope
                </h3>
                
                <div>
                  {isEditing ? (
                    <textarea 
                      value={scopeDescription}
                      onChange={(e) => setScopeDescription(e.target.value)}
                      className="w-full min-h-[100px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    />
                  ) : (
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {scopeDescription}
                    </p>
                  )}
                </div>

                <div className="space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Key Deliverables</h4>
                    {isEditing && (
                      <Button variant="outline" size="sm" onClick={() => setDeliverables([...deliverables, { pos: String(deliverables.length + 1), description: 'New Item', specification: '', unit: '', quantity: '' }])} className="h-7 text-xs rounded-lg gap-1">
                        <Plus className="h-3 w-3" /> Add Item
                      </Button>
                    )}
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                    <datalist id="known-units">
                      <option value="m³" />
                      <option value="m²" />
                      <option value="m" />
                      <option value="lm" />
                      <option value="tons" />
                      <option value="kg" />
                      <option value="hrs" />
                      <option value="days" />
                      <option value="ea" />
                      <option value="bags" />
                      <option value="L" />
                    </datalist>
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-center w-16 text-slate-600 dark:text-slate-300">Pos</th>
                          <th className="px-4 py-3 font-semibold w-1/4 text-slate-600 dark:text-slate-300">Item Description</th>
                          <th className="px-4 py-3 font-semibold w-1/3 text-slate-600 dark:text-slate-300">Specification</th>
                          <th className="px-4 py-3 font-semibold text-center w-24 text-slate-600 dark:text-slate-300">Unit</th>
                          <th className="px-4 py-3 font-semibold text-right w-24 text-slate-600 dark:text-slate-300">Quantity</th>
                          {isEditing && <th className="px-4 py-3 w-16 text-center">Action</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {deliverables.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                            <td className="px-4 py-3 text-center align-top font-mono text-xs text-slate-500">
                              {isEditing ? (
                                <input type="text" value={item.pos} onChange={e => { const newD = [...deliverables]; newD[idx].pos = e.target.value; setDeliverables(newD); }} className="w-full text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1" />
                              ) : item.pos}
                            </td>
                            <td className="px-4 py-3 align-top font-semibold text-slate-900 dark:text-slate-100">
                              {isEditing ? (
                                <input type="text" value={item.description} onChange={e => { const newD = [...deliverables]; newD[idx].description = e.target.value; setDeliverables(newD); }} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm font-semibold" />
                              ) : item.description}
                            </td>
                            <td className="px-4 py-3 align-top text-slate-600 dark:text-slate-400">
                              {isEditing ? (
                                <textarea value={item.specification} onChange={e => { const newD = [...deliverables]; newD[idx].specification = e.target.value; setDeliverables(newD); }} className="w-full min-h-[60px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs" />
                              ) : <span className="text-xs">{item.specification}</span>}
                            </td>
                            <td className="px-4 py-3 text-center align-top text-slate-600 dark:text-slate-400">
                              {isEditing ? (
                                <input type="text" list="known-units" value={item.unit} onChange={e => { const newD = [...deliverables]; newD[idx].unit = e.target.value; setDeliverables(newD); }} className="w-full text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1" />
                              ) : item.unit}
                            </td>
                            <td className="px-4 py-3 text-right align-top font-medium text-slate-900 dark:text-slate-100">
                              {isEditing ? (
                                <input type="text" value={item.quantity} onChange={e => { const newD = [...deliverables]; newD[idx].quantity = e.target.value; setDeliverables(newD); }} className="w-full text-right bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1" />
                              ) : item.quantity}
                            </td>
                            {isEditing && (
                              <td className="px-4 py-3 text-center align-top">
                                <Button variant="ghost" size="icon" onClick={() => setDeliverables(deliverables.filter((_, i) => i !== idx))} className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 mx-auto">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 p-5 rounded-2xl flex items-start gap-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl shrink-0">
                  <ShieldAlert className="h-6 w-6 text-amber-600 dark:text-amber-500" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-amber-900 dark:text-amber-100">Site Safety Protocol</h4>
                  <p className="text-sm text-amber-800 dark:text-amber-200/80 mt-1">Strict adherence to these rules is mandatory for all personnel on site. Review specific task requirements before starting work.</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-8">
                {isEditing && (
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setRules([...rules, { title: 'New Rule Section', items: ['New rule item'] }])} className="gap-2 rounded-xl">
                      <Plus className="h-4 w-4" /> Add Rule Section
                    </Button>
                  </div>
                )}
                
                {rules.map((ruleSec, sIdx) => (
                  <div key={sIdx}>
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2 mb-4">
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={ruleSec.title} 
                          onChange={(e) => {
                            const newR = [...rules];
                            newR[sIdx].title = e.target.value;
                            setRules(newR);
                          }}
                          className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm w-full max-w-md"
                        />
                      ) : (
                        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">{ruleSec.title}</h4>
                      )}
                      
                      {isEditing && (
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => {
                            const newR = [...rules];
                            newR[sIdx].items.push('New rule item');
                            setRules(newR);
                          }} className="h-8 px-2 text-xs text-blue-600">Add Rule</Button>
                          <Button variant="ghost" size="sm" onClick={() => setRules(rules.filter((_, i) => i !== sIdx))} className="h-8 w-8 p-0 text-red-500"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      )}
                    </div>

                    <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      {ruleSec.items.map((item, iIdx) => (
                        <li key={iIdx}>
                          {isEditing ? (
                            <div className="flex gap-2 items-center -ml-2 w-full mt-1">
                              <input 
                                type="text" 
                                value={item} 
                                onChange={(e) => {
                                  const newR = [...rules];
                                  newR[sIdx].items[iIdx] = e.target.value;
                                  setRules(newR);
                                }}
                                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm"
                              />
                              <Button variant="ghost" size="icon" onClick={() => {
                                const newR = [...rules];
                                newR[sIdx].items = newR[sIdx].items.filter((_, i) => i !== iIdx);
                                setRules(newR);
                              }} className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className="leading-relaxed">{item}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

              </div>
            </div>
          )}

          {activeTab === 'terminologies' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              {/* Header card / Search Bar */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-[#0B5FFF]" />
                      Project Terminologies & Acronyms
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Standardized terminology, jargon, and abbreviation dictionary for this project.
                    </p>
                  </div>
                  {isEditing && (
                    <Button 
                      onClick={() => setTerminologies([
                        ...terminologies, 
                        { term: 'New Term', abbreviation: 'NEW', definition: 'Definition of the term...', category: 'General' }
                      ])} 
                      className="bg-[#0B5FFF] hover:bg-blue-600 text-white text-xs gap-1.5 rounded-xl font-medium shrink-0"
                    >
                      <Plus className="h-4 w-4" /> Add Terminology
                    </Button>
                  )}
                </div>

                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search terms, acronyms, or definitions..."
                    value={terminologySearch}
                    onChange={(e) => setTerminologySearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0B5FFF]"
                  />
                </div>
              </div>

              {/* Grid of Terminologies */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {terminologies
                  .filter(t => 
                    t.term.toLowerCase().includes(terminologySearch.toLowerCase()) ||
                    (t.abbreviation && t.abbreviation.toLowerCase().includes(terminologySearch.toLowerCase())) ||
                    t.definition.toLowerCase().includes(terminologySearch.toLowerCase()) ||
                    (t.category && t.category.toLowerCase().includes(terminologySearch.toLowerCase()))
                  )
                  .map((t, tIdx) => (
                    <div 
                      key={tIdx}
                      className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-3 relative group hover:border-blue-300 transition-all"
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Term"
                              value={t.term}
                              onChange={(e) => {
                                const newT = [...terminologies];
                                newT[tIdx].term = e.target.value;
                                setTerminologies(newT);
                              }}
                              className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 dark:text-white"
                            />
                            <input
                              type="text"
                              placeholder="Acronym"
                              value={t.abbreviation || ''}
                              onChange={(e) => {
                                const newT = [...terminologies];
                                newT[tIdx].abbreviation = e.target.value;
                                setTerminologies(newT);
                              }}
                              className="w-20 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-[#0B5FFF]"
                            />
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Category"
                              value={t.category || ''}
                              onChange={(e) => {
                                const newT = [...terminologies];
                                newT[tIdx].category = e.target.value;
                                setTerminologies(newT);
                              }}
                              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-600"
                            />
                          </div>
                          <textarea
                            rows={3}
                            placeholder="Definition"
                            value={t.definition}
                            onChange={(e) => {
                              const newT = [...terminologies];
                              newT[tIdx].definition = e.target.value;
                              setTerminologies(newT);
                            }}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-700 dark:text-slate-300"
                          />
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setTerminologies(terminologies.filter((_, i) => i !== tIdx))}
                              className="text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1 h-7"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <div className="space-y-0.5">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t.term}</h4>
                                {t.category && (
                                  <Badge variant="outline" className="text-[10px] font-medium text-slate-500 border-slate-200 dark:border-slate-700">
                                    {t.category}
                                  </Badge>
                                )}
                              </div>
                              {t.abbreviation && (
                                <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[#0B5FFF] border border-blue-200 dark:border-blue-800 text-xs font-mono font-extrabold shrink-0">
                                  {t.abbreviation}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-2">
                              {t.definition}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
