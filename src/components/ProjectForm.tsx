import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from './ui';
import { Project } from '../types';
import { Save, X, Building2 } from 'lucide-react';

interface ProjectFormProps {
  onClose: () => void;
  onSubmit: (project: Project) => void;
}

export function ProjectForm({ onClose, onSubmit }: ProjectFormProps) {
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    client: '',
    contractNumber: '',
    location: '',
    engineer: '',
    contractValue: 0,
    startDate: new Date().toISOString().split('T')[0],
    finishDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Not Started',
    progress: 0,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof Project, string>>>({});

  const handleChange = (field: keyof Project, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof Project, string>> = {};
    if (!formData.name?.trim()) newErrors.name = 'Project name is required';
    if (!formData.client?.trim()) newErrors.client = 'Client is required';
    if (!formData.location?.trim()) newErrors.location = 'Location is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.finishDate) newErrors.finishDate = 'Finish date is required';
    
    if (formData.startDate && formData.finishDate) {
      if (new Date(formData.finishDate) < new Date(formData.startDate)) {
        newErrors.finishDate = 'Finish date cannot be earlier than start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const newProject: Project = {
        ...formData as Project,
        id: `PRJ-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      };
      onSubmit(newProject);
    }
  };

  const getInputClass = (field: keyof Project) => `
    w-full h-11 px-3 rounded-xl border bg-transparent text-sm focus:outline-none focus:ring-1 
    ${errors[field] 
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
      : 'border-slate-300 dark:border-slate-700 focus:border-[#0B5FFF] focus:ring-[#0B5FFF]'
    }
  `;

  return (
    <Card className="w-full mx-auto rounded-2xl shadow-md border-slate-200 dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-t-2xl px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
            <Building2 className="h-5 w-5 text-[#0B5FFF]" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-50">New Project</CardTitle>
            <p className="text-xs font-medium text-slate-500">Create a new construction project</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Project Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={getInputClass('name')}
                placeholder="e.g. City Center Mall"
              />
              {errors.name && <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.name}</span>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Client *</label>
              <input
                type="text"
                value={formData.client}
                onChange={(e) => handleChange('client', e.target.value)}
                className={getInputClass('client')}
                placeholder="e.g. Emaar Properties"
              />
              {errors.client && <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.client}</span>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Location *</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                className={getInputClass('location')}
                placeholder="e.g. Dubai Marina"
              />
              {errors.location && <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.location}</span>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Contract Number</label>
              <input
                type="text"
                value={formData.contractNumber}
                onChange={(e) => handleChange('contractNumber', e.target.value)}
                className={getInputClass('contractNumber')}
                placeholder="e.g. CON-2024-001"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Lead Engineer</label>
              <input
                type="text"
                value={formData.engineer}
                onChange={(e) => handleChange('engineer', e.target.value)}
                className={getInputClass('engineer')}
                placeholder="e.g. Sarah Connor"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Contract Value ($)</label>
              <input
                type="number"
                min="0"
                value={formData.contractValue}
                onChange={(e) => handleChange('contractValue', Number(e.target.value))}
                className={getInputClass('contractValue')}
                placeholder="e.g. 5000000"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Start Date *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className={getInputClass('startDate')}
              />
              {errors.startDate && <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.startDate}</span>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Target Finish Date *</label>
              <input
                type="date"
                value={formData.finishDate}
                onChange={(e) => handleChange('finishDate', e.target.value)}
                className={getInputClass('finishDate')}
              />
              {errors.finishDate && <span className="text-[10px] text-red-500 font-medium mt-1 block">{errors.finishDate}</span>}
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="gap-2 rounded-xl bg-[#0B5FFF]">
              <Save className="h-4 w-4" /> Create Project
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
