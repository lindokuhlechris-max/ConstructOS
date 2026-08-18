import React, { useState, useEffect } from 'react';
import { Card } from '../ui';
import { ArrowLeft, Building2, Edit3, Save, X, Globe, Mail, Phone, MapPin, ShieldCheck, Rocket, Eye, Award } from 'lucide-react';
import { Button } from '../ui';

interface CompanyModuleProps {
  onBack: () => void;
}

export interface CompanyDetails {
  name: string;
  tagline: string;
  mission: string;
  vision: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  registrationNumber: string;
  coreValues: string[];
}

const defaultCompanyDetails: CompanyDetails = {
  name: 'Scedih Infrastructure Ltd.',
  tagline: 'Building the Future with Precision & Safety',
  mission: 'To deliver exceptional construction projects through innovation, safety, and unwavering commitment to quality, building the infrastructure of tomorrow.',
  vision: 'To be the industry leader in sustainable and intelligent construction, transforming skylines and communities worldwide.',
  address: '100 Construction Way, Suite 400, Industrial Zone',
  phone: '+61 2 9000 8888',
  email: 'contact@scedih.io',
  website: 'www.scedih.io',
  registrationNumber: 'ABN 99 123 456 789',
  coreValues: ['Safety First', 'Uncompromised Quality', 'Sustainable Innovation', 'Integrity & Respect']
};

export function CompanyModule({ onBack }: CompanyModuleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newValueInput, setNewValueInput] = useState('');
  
  const [company, setCompany] = useState<CompanyDetails>(() => {
    const saved = localStorage.getItem('companyProfile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing companyProfile from localStorage', e);
      }
    }
    return defaultCompanyDetails;
  });

  const [formData, setFormData] = useState<CompanyDetails>(company);

  useEffect(() => {
    localStorage.setItem('companyProfile', JSON.stringify(company));
  }, [company]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setCompany(formData);
    setIsEditing(false);
  };

  const handleAddCoreValue = () => {
    if (!newValueInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      coreValues: [...prev.coreValues, newValueInput.trim()]
    }));
    setNewValueInput('');
  };

  const handleRemoveCoreValue = (index: number) => {
    setFormData(prev => ({
      ...prev,
      coreValues: prev.coreValues.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-12">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="h-6 w-6 text-indigo-500" />
              Company Profile
            </h2>
            <p className="text-sm text-slate-500">Corporate details, mission, vision, and core values</p>
          </div>
        </div>

        {!isEditing ? (
          <Button onClick={() => { setFormData(company); setIsEditing(true); }} className="gap-2 bg-[#0B5FFF] hover:bg-blue-700 text-white rounded-xl">
            <Edit3 className="h-4 w-4" /> Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSave} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
              <Save className="h-4 w-4" /> Save Changes
            </Button>
          </div>
        )}
      </div>

      {!isEditing ? (
        /* VIEW MODE */
        <div className="space-y-6">
          {/* Main Info Header Card */}
          <Card className="p-6 md:p-8 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Building2 className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{company.name}</h1>
                  <p className="text-slate-500 text-sm font-medium">{company.tagline}</p>
                  <p className="text-xs text-slate-400 mt-1 font-mono">{company.registrationNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400 w-full md:w-auto">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                  <MapPin className="h-4 w-4 text-[#0B5FFF]" /> {company.address}
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                  <Phone className="h-4 w-4 text-[#0B5FFF]" /> {company.phone}
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                  <Mail className="h-4 w-4 text-[#0B5FFF]" /> {company.email}
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                  <Globe className="h-4 w-4 text-[#0B5FFF]" /> {company.website}
                </div>
              </div>
            </div>
          </Card>

          {/* Mission & Vision Card */}
          <Card className="p-6 md:p-8 bg-gradient-to-br from-blue-600 to-indigo-800 text-white border-0 rounded-2xl shadow-xl">
            <div className="flex flex-col gap-10">
              <div>
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                    <Rocket className="h-5 w-5 text-white" />
                  </span>
                  Our Mission
                </h3>
                <p className="text-blue-100 text-lg leading-relaxed max-w-3xl">
                  {company.mission}
                </p>
              </div>

              <div className="w-full h-px bg-white/20"></div>

              <div>
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                    <Eye className="h-5 w-5 text-white" />
                  </span>
                  Our Vision
                </h3>
                <p className="text-blue-100 text-lg leading-relaxed max-w-3xl">
                  {company.vision}
                </p>
              </div>
            </div>
          </Card>

          {/* Core Values */}
          <Card className="p-6 border-slate-200 dark:border-slate-700 rounded-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-[#0B5FFF]" /> Core Operating Values
            </h3>
            <div className="flex flex-wrap gap-3">
              {company.coreValues.map((val, idx) => (
                <div key={idx} className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" /> {val}
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : (
        /* EDIT MODE FORM */
        <form onSubmit={handleSave} className="space-y-6">
          <Card className="p-6 md:p-8 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-3">General Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Company Name</label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Tagline / Motto</label>
                <input 
                  type="text"
                  value={formData.tagline}
                  onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Registration / Tax ID (ABN/ACN)</label>
                <input 
                  type="text"
                  value={formData.registrationNumber}
                  onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Headquarters Address</label>
                <input 
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Phone Number</label>
                <input 
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Official Email</label>
                <input 
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Website URL</label>
                <input 
                  type="text"
                  value={formData.website}
                  onChange={e => setFormData({ ...formData, website: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 md:p-8 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-3">Mission & Vision Statements</h3>

            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Our Mission</label>
              <textarea 
                rows={3}
                value={formData.mission}
                onChange={e => setFormData({ ...formData, mission: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Our Vision</label>
              <textarea 
                rows={3}
                value={formData.vision}
                onChange={e => setFormData({ ...formData, vision: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
          </Card>

          <Card className="p-6 md:p-8 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-3">Core Operating Values</h3>
            
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Add a core value (e.g. Safety First)" 
                value={newValueInput} 
                onChange={e => setNewValueInput(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm"
              />
              <Button type="button" onClick={handleAddCoreValue} className="bg-[#0B5FFF] text-white rounded-xl">
                Add Value
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {formData.coreValues.map((val, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-xl text-sm font-medium">
                  <span>{val}</span>
                  <button type="button" onClick={() => handleRemoveCoreValue(idx)} className="text-slate-400 hover:text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </form>
      )}
    </div>
  );
}
