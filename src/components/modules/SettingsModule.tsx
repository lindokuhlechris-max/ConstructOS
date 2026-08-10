import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '../ui';
import { 
  ArrowLeft, 
  Plus, 
  Settings2, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  User, 
  Sun, 
  Moon, 
  Database, 
  Download, 
  Upload, 
  Globe, 
  Sliders, 
  Shield, 
  Check, 
  UserPlus, 
  HardDrive,
  RefreshCw
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { CustomFieldDefinition, UserProfile, UserRole } from '../../types';

interface SettingsModuleProps {
  onBack: () => void;
}

export function SettingsModule({ onBack }: SettingsModuleProps) {
  const { 
    currentUserProfile, 
    setCurrentUserProfile, 
    userProfiles, 
    addProfile, 
    updateProfile, 
    deleteProfile,
    theme, 
    setTheme, 
    units, 
    setUnits,
    customFieldDefinitions, 
    addCustomFieldDefinition, 
    updateCustomFieldDefinition 
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<'profile' | 'theme' | 'data' | 'units' | 'fields'>('profile');

  // Profile Edit State
  const [profileForm, setProfileForm] = useState<Partial<UserProfile>>({
    name: currentUserProfile?.name || '',
    title: currentUserProfile?.title || '',
    email: currentUserProfile?.email || '',
    phone: currentUserProfile?.phone || '',
    company: currentUserProfile?.company || '',
    department: currentUserProfile?.department || ''
  });

  // Create Profile Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProfile, setNewProfile] = useState<{
    name: string;
    role: UserRole;
    title: string;
    email: string;
    phone: string;
    company: string;
    department: string;
  }>({
    name: '',
    role: 'Manager',
    title: '',
    email: '',
    phone: '',
    company: 'Acme Civil Infrastructure',
    department: 'Site Management'
  });

  // Custom Fields State
  const [isEditingField, setIsEditingField] = useState(false);
  const [currentField, setCurrentField] = useState<Partial<CustomFieldDefinition>>({
    name: '',
    type: 'text',
    required: false,
    active: true,
  });

  // Export JSON Backup
  const handleExportBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      theme,
      units,
      currentUserProfile,
      userProfiles,
      customFieldDefinitions,
      storage: { ...localStorage }
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `constructos-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          if (imported.storage) {
            Object.keys(imported.storage).forEach(key => {
              localStorage.setItem(key, imported.storage[key]);
            });
            alert('System backup restored successfully! Reloading application...');
            window.location.reload();
          }
        } catch (err) {
          alert('Failed to parse backup JSON file.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile) return;
    const names = (profileForm.name || currentUserProfile.name).trim().split(' ');
    const initials = names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : names[0].substring(0, 2).toUpperCase();

    const updated: UserProfile = {
      ...currentUserProfile,
      name: profileForm.name || currentUserProfile.name,
      title: profileForm.title || currentUserProfile.title,
      email: profileForm.email || currentUserProfile.email,
      phone: profileForm.phone || currentUserProfile.phone,
      company: profileForm.company || currentUserProfile.company,
      department: profileForm.department || currentUserProfile.department,
      initials
    };

    updateProfile(updated);
    alert('User profile updated successfully!');
  };

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfile.name) return;

    const names = newProfile.name.trim().split(' ');
    const initials = names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : names[0].substring(0, 2).toUpperCase();

    const created: UserProfile = {
      id: `USR-${Math.floor(100 + Math.random() * 900)}`,
      name: newProfile.name,
      role: newProfile.role,
      title: newProfile.title || newProfile.role,
      email: newProfile.email || `${newProfile.name.toLowerCase().replace(/\s+/g, '.')}@constructos.io`,
      phone: newProfile.phone || '+61 400 000 000',
      company: newProfile.company,
      department: newProfile.department,
      initials,
      certifications: ['White Card']
    };

    addProfile(created);
    setCurrentUserProfile(created);
    setShowCreateModal(false);
    setNewProfile({
      name: '',
      role: 'Manager',
      title: '',
      email: '',
      phone: '',
      company: 'Acme Civil Infrastructure',
      department: 'Site Management'
    });
  };

  const handleSaveCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentField.name) return;

    if (currentField.id) {
      updateCustomFieldDefinition(currentField as CustomFieldDefinition);
    } else {
      addCustomFieldDefinition({
        ...(currentField as CustomFieldDefinition),
        id: `CF-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      });
    }
    
    setIsEditingField(false);
    setCurrentField({ name: '', type: 'text', required: false, active: true });
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full p-4 md:p-6 overflow-y-auto">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-full">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={onBack} className="rounded-xl h-10 w-10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Settings2 className="h-6 w-6 text-[#0B5FFF]" /> Settings & System Configuration
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Manage user profiles, appearance themes, system data backups, and custom fields.</p>
          </div>
        </div>
      </div>

      {/* Settings Tab Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto w-full">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'profile' ? 'bg-[#0B5FFF] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400'
          }`}
        >
          <User className="h-4 w-4" /> Profile & Accounts
        </button>

        <button
          onClick={() => setActiveTab('theme')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'theme' ? 'bg-[#0B5FFF] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400'
          }`}
        >
          <Sun className="h-4 w-4" /> Appearance & Theme
        </button>

        <button
          onClick={() => setActiveTab('data')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'data' ? 'bg-[#0B5FFF] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400'
          }`}
        >
          <Database className="h-4 w-4" /> System & Offline Storage
        </button>

        <button
          onClick={() => setActiveTab('units')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'units' ? 'bg-[#0B5FFF] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400'
          }`}
        >
          <Globe className="h-4 w-4" /> Units & Preferences
        </button>

        <button
          onClick={() => setActiveTab('fields')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'fields' ? 'bg-[#0B5FFF] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400'
          }`}
        >
          <Sliders className="h-4 w-4" /> Activity Custom Fields
        </button>
      </div>

      {/* TAB 1: PROFILE & ACCOUNTS */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          {/* Active Profile Edit Form */}
          <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <User className="h-5 w-5 text-[#0B5FFF]" /> User Profile Details
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Job Title</label>
                    <input
                      type="text"
                      value={profileForm.title}
                      onChange={e => setProfileForm({ ...profileForm, title: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Phone Number</label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Company Name</label>
                    <input
                      type="text"
                      value={profileForm.company}
                      onChange={e => setProfileForm({ ...profileForm, company: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Department</label>
                    <input
                      type="text"
                      value={profileForm.department}
                      onChange={e => setProfileForm({ ...profileForm, department: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <Button type="submit" className="bg-[#0B5FFF] text-white rounded-xl text-xs font-semibold gap-2">
                    <Save className="h-4 w-4" /> Save Profile Details
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Profile Switcher & Creation Column */}
          <div className="space-y-6">
            <Card className="p-5 border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Profiles</h3>
                <Button size="sm" onClick={() => setShowCreateModal(true)} className="gap-1.5 bg-[#0B5FFF] text-white rounded-xl text-xs">
                  <UserPlus className="h-3.5 w-3.5" /> Add Profile
                </Button>
              </div>

              <div className="space-y-2">
                {userProfiles && userProfiles.map(prof => (
                  <div 
                    key={prof.id}
                    onClick={() => setCurrentUserProfile(prof)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      prof.id === currentUserProfile?.id ? 'border-[#0B5FFF] bg-blue-50/50 dark:bg-blue-950/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#0B5FFF] text-white font-bold flex items-center justify-center text-xs">
                        {prof.initials}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">{prof.name}</h4>
                        <span className="text-[10px] text-slate-500">{prof.title} • {prof.role}</span>
                      </div>
                    </div>
                    {prof.id === currentUserProfile?.id && <Badge variant="success" className="text-[10px]">Active</Badge>}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: APPEARANCE & THEME */}
      {activeTab === 'theme' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <Card 
            onClick={() => setTheme('light')}
            className={`p-6 cursor-pointer border transition-all ${
              theme === 'light' ? 'border-[#0B5FFF] ring-2 ring-blue-500/20 bg-blue-50/20' : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl">
                <Sun className="h-6 w-6" />
              </div>
              {theme === 'light' && <Badge variant="success">Active Mode</Badge>}
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Light Mode</h3>
            <p className="text-xs text-slate-500 mt-1">Clean, high-contrast light theme optimized for outdoor daylight viewing on site.</p>
          </Card>

          <Card 
            onClick={() => setTheme('dark')}
            className={`p-6 cursor-pointer border transition-all ${
              theme === 'dark' ? 'border-[#0B5FFF] ring-2 ring-blue-500/20 bg-slate-900' : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-slate-800 text-indigo-400 rounded-xl">
                <Moon className="h-6 w-6" />
              </div>
              {theme === 'dark' && <Badge variant="success">Active Mode</Badge>}
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Dark Mode</h3>
            <p className="text-xs text-slate-500 mt-1">Sleek dark theme reducing eye strain during night shifts and indoor office planning.</p>
          </Card>
        </div>
      )}

      {/* TAB 3: SYSTEM & OFFLINE DATA MANAGEMENT */}
      {activeTab === 'data' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <Card className="p-6 border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold flex items-center gap-2 mb-2">
              <Download className="h-5 w-5 text-[#0B5FFF]" /> Export System Data Backup (JSON)
            </h3>
            <p className="text-xs text-slate-500 mb-4">Download a full offline JSON backup containing all local site logs, activities, safety records, and quality reports.</p>
            <Button onClick={handleExportBackup} className="gap-2 bg-[#0B5FFF] text-white rounded-xl text-xs">
              <Download className="h-4 w-4" /> Export Backup File
            </Button>
          </Card>

          <Card className="p-6 border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold flex items-center gap-2 mb-2">
              <Upload className="h-5 w-5 text-emerald-600" /> Restore System Data Backup
            </h3>
            <p className="text-xs text-slate-500 mb-4">Restore ConstructOS database from a previously saved JSON backup file.</p>
            <label className="cursor-pointer inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold">
              <Upload className="h-4 w-4" /> Select Backup JSON File
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>
          </Card>
        </div>
      )}

      {/* TAB 4: UNITS & PREFERENCES */}
      {activeTab === 'units' && (
        <Card className="p-6 border-slate-200 dark:border-slate-800 max-w-2xl">
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5 text-[#0B5FFF]" /> Measurement Units & System Regional Options
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <h4 className="font-bold text-sm">Measurement System</h4>
                <p className="text-xs text-slate-500">Metric (meters, m², m³) vs Imperial (feet, sq ft, cu yd)</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant={units === 'metric' ? 'default' : 'outline'} onClick={() => setUnits('metric')}>Metric</Button>
                <Button size="sm" variant={units === 'imperial' ? 'default' : 'outline'} onClick={() => setUnits('imperial')}>Imperial</Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 5: ACTIVITY CUSTOM FIELDS */}
      {activeTab === 'fields' && (
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <div>
              <CardTitle>Activity Custom Fields Builder</CardTitle>
              <p className="text-sm text-slate-500">Configure custom fields to track additional data on construction activities.</p>
            </div>
            <Button onClick={() => setIsEditingField(true)} className="gap-2 bg-[#0B5FFF] text-white rounded-xl text-xs font-semibold">
              <Plus className="h-4 w-4" /> Add Custom Field
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            {isEditingField && (
              <form onSubmit={handleSaveCustomField} className="mb-6 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-4">
                <h3 className="font-semibold text-sm">{currentField.id ? 'Edit Field' : 'New Custom Field'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Field Name *</label>
                    <input
                      type="text"
                      required
                      value={currentField.name}
                      onChange={e => setCurrentField({ ...currentField, name: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Field Type *</label>
                    <select
                      value={currentField.type}
                      onChange={e => setCurrentField({ ...currentField, type: e.target.value as any })}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="text">Text (Single Line)</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="boolean">Checkbox (Yes/No)</option>
                      <option value="select">Dropdown (Select)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditingField(false)} className="rounded-xl text-xs">Cancel</Button>
                  <Button type="submit" className="bg-[#0B5FFF] text-white rounded-xl text-xs font-semibold">Save Field Definition</Button>
                </div>
              </form>
            )}

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Field Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {customFieldDefinitions.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-500 text-xs">No custom fields defined yet.</td>
                    </tr>
                  ) : (
                    customFieldDefinitions.map(field => (
                      <tr key={field.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-bold">{field.name}</td>
                        <td className="px-4 py-3 capitalize">{field.type}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={field.active ? 'success' : 'outline'}>{field.active ? 'Active' : 'Inactive'}</Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CREATE NEW PROFILE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-[#0B5FFF]" /> Create New User Profile
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreateProfile} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marcus Vance"
                  value={newProfile.name}
                  onChange={e => setNewProfile({ ...newProfile, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Role Authority *</label>
                  <select
                    value={newProfile.role}
                    onChange={e => setNewProfile({ ...newProfile, role: e.target.value as UserRole })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm"
                  >
                    <option value="Manager">Manager / Supervisor</option>
                    <option value="Engineer">Engineer</option>
                    <option value="Inspector">QA/QC Inspector</option>
                    <option value="Worker">Worker</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Job Title</label>
                  <input
                    type="text"
                    placeholder="Senior Engineer"
                    value={newProfile.title}
                    onChange={e => setNewProfile({ ...newProfile, title: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0B5FFF] text-white">Create Profile</button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
