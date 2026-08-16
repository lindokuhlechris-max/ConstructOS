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
  RefreshCw,
  Lock,
  Unlock,
  Key,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
  Cloud,
  CloudUpload,
  CloudDownload,
  Loader2,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { CustomFieldDefinition, UserProfile, UserRole, ProjectSectionPermissions } from '../../types';

declare global {
  interface Window {
    google: any;
  }
}

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
    updateCustomFieldDefinition,
    accessRequests,
    approveAccessRequest,
    rejectAccessRequest,
    forceSyncAll,
    isSyncing,
    isOffline,
    lastSyncedAt,
    isManualSyncMode,
    setIsManualSyncMode,
    hasPendingChanges,
    pendingChangesCount
  } = useAppContext();

  const isAdmin = currentUserProfile?.role === 'Admin' || currentUserProfile?.permissions?.settings === true;
  const [activeTab, setActiveTab] = useState<'admin' | 'profile' | 'theme' | 'data' | 'units' | 'fields'>(() => {
    return (currentUserProfile?.role === 'Admin' || currentUserProfile?.permissions?.settings === true) ? 'admin' : 'profile';
  });
  const [adminSearch, setAdminSearch] = useState('');

  // Admin Section Permissions Edit Modal State
  const [editingUserProfile, setEditingUserProfile] = useState<UserProfile | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [permForm, setPermForm] = useState<UserProfile>({
    id: '',
    name: '',
    role: 'Engineer',
    title: '',
    email: '',
    phone: '',
    company: 'Constructfield Engineering',
    department: 'Operations',
    initials: '',
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
  });

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

  // Admin Permission Handlers
  const handleToggleUserAccess = (profile: UserProfile) => {
    const updated: UserProfile = {
      ...profile,
      accessAllowed: profile.accessAllowed === false ? true : false
    };
    updateProfile(updated);
  };

  const handleOpenEditPermissions = (profile?: UserProfile) => {
    if (profile) {
      setEditingUserProfile(profile);
      setPermForm({
        ...profile,
        accessAllowed: profile.accessAllowed ?? true,
        permissions: {
          activities: profile.permissions?.activities ?? (profile.role === 'Admin' || profile.role === 'Manager' || profile.role === 'Engineer'),
          reports: profile.permissions?.reports ?? true,
          labour: profile.permissions?.labour ?? (profile.role === 'Admin' || profile.role === 'Manager'),
          materials: profile.permissions?.materials ?? (profile.role === 'Admin' || profile.role === 'Manager' || profile.role === 'Engineer'),
          safety: profile.permissions?.safety ?? (profile.role !== 'Viewer'),
          quality: profile.permissions?.quality ?? (profile.role === 'Admin' || profile.role === 'Manager' || profile.role === 'Engineer' || profile.role === 'Inspector'),
          equipment: profile.permissions?.equipment ?? (profile.role === 'Admin' || profile.role === 'Manager'),
          settings: profile.permissions?.settings ?? (profile.role === 'Admin')
        }
      });
    } else {
      setEditingUserProfile(null);
      setPermForm({
        id: '',
        name: '',
        role: 'Engineer',
        title: 'Project Staff',
        email: '',
        phone: '+1 (555) 000-0000',
        company: 'Constructfield Engineering',
        department: 'Site Operations',
        initials: '',
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
      });
    }
    setShowPermissionsModal(true);
  };

  const handleSavePermissions = (e: React.FormEvent) => {
    e.preventDefault();
    if (!permForm.email) return;

    const names = (permForm.name || permForm.email.split('@')[0]).trim().split(' ');
    const initials = names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : names[0].substring(0, 2).toUpperCase();

    const profileToSave: UserProfile = {
      ...permForm,
      id: permForm.id || `USR-${Math.floor(100 + Math.random() * 900)}`,
      initials
    };

    if (editingUserProfile) {
      updateProfile(profileToSave);
    } else {
      addProfile(profileToSave);
    }

    setShowPermissionsModal(false);
    setEditingUserProfile(null);
  };

  const filteredAdminProfiles = userProfiles.filter(p => 
    p.name.toLowerCase().includes(adminSearch.toLowerCase()) ||
    p.email.toLowerCase().includes(adminSearch.toLowerCase()) ||
    p.role.toLowerCase().includes(adminSearch.toLowerCase()) ||
    p.title.toLowerCase().includes(adminSearch.toLowerCase())
  );

  // Google Drive & Cloud Sync State
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);
  const [driveStatus, setDriveStatus] = useState<string | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<string | null>(null);
  const [customGoogleClientId, setCustomGoogleClientId] = useState(() => localStorage.getItem('constructfield_google_client_id') || localStorage.getItem('constructos_google_client_id') || '');
  const [clientIdSavedMsg, setClientIdSavedMsg] = useState(false);

  const handleSaveClientId = () => {
    if (customGoogleClientId.trim()) {
      localStorage.setItem('constructfield_google_client_id', customGoogleClientId.trim());
    } else {
      localStorage.removeItem('constructfield_google_client_id');
      localStorage.removeItem('constructos_google_client_id');
    }
    setClientIdSavedMsg(true);
    setTimeout(() => setClientIdSavedMsg(false), 3000);
  };

  const handleCloudForceSync = async () => {
    try {
      setIsCloudSyncing(true);
      setCloudSyncStatus('Uploading all records, subtasks, and audit logs to Cloud...');
      await forceSyncAll();
      setCloudSyncStatus('All records synchronized to Cloud successfully!');
      setTimeout(() => setCloudSyncStatus(null), 4000);
    } catch (err: any) {
      console.error(err);
      setCloudSyncStatus('Error: ' + (err.message || 'Sync failed. Please check network connection.'));
      setTimeout(() => setCloudSyncStatus(null), 5000);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleDriveBackup = async () => {
    try {
      setIsDriveSyncing(true);
      const { getAllIDBData } = await import('../../lib/idbService');
      const allData = await getAllIDBData();
      
      const backupData = {
        app: 'Constructfield',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        theme,
        units,
        currentUserProfile,
        userProfiles,
        customFieldDefinitions,
        storage: { ...localStorage },
        idbData: allData
      };
      
      const { GoogleDriveService } = await import('../../services/GoogleDriveService');
      const driveService = new GoogleDriveService();
      await driveService.writeData(backupData, 'constructfield_data.json', setDriveStatus);
      
      setDriveStatus('Google Drive backup successful!');
      setTimeout(() => setDriveStatus(null), 4000);
    } catch (err: any) {
      console.error(err);
      setDriveStatus('Error: ' + (err.message || 'Unknown error occurred.'));
      setTimeout(() => setDriveStatus(null), 6000);
    } finally {
      setIsDriveSyncing(false);
    }
  };

  const handleDriveRestore = async () => {
    if (!window.confirm('Restoring from Google Drive will replace current local data with the backup snapshot. Do you wish to continue?')) {
      return;
    }
    try {
      setIsDriveSyncing(true);
      
      const { GoogleDriveService } = await import('../../services/GoogleDriveService');
      const driveService = new GoogleDriveService();
      const imported = await driveService.readData('constructfield_data.json', setDriveStatus) || await driveService.readData('constructos_data.json', setDriveStatus);
      
      if (imported) {
        if (imported.storage) {
          Object.keys(imported.storage).forEach(key => {
            localStorage.setItem(key, imported.storage[key]);
          });
        }
        if (imported.idbData) {
          const { saveFullFirestoreState } = await import('../../lib/firestoreService');
          await saveFullFirestoreState(imported.idbData);
        }
        setDriveStatus('Restore complete. Reloading Constructfield...');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        throw new Error('Invalid backup format.');
      }
    } catch (err: any) {
      console.error(err);
      setDriveStatus('Error: ' + (err.message || 'Unknown error occurred.'));
      setTimeout(() => setDriveStatus(null), 6000);
    } finally {
      setIsDriveSyncing(false);
    }
  };

  // Export Local JSON Backup
  const handleExportBackup = async () => {
    try {
      const { getAllIDBData } = await import('../../lib/idbService');
      const allData = await getAllIDBData();

      const backupData = {
        app: 'Constructfield',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        theme,
        units,
        currentUserProfile,
        userProfiles,
        customFieldDefinitions,
        storage: { ...localStorage },
        idbData: allData
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `constructfield-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert('Failed to export backup: ' + e.message);
    }
  };

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          if (imported.storage || imported.idbData) {
            if (imported.storage) {
              Object.keys(imported.storage).forEach(key => {
                localStorage.setItem(key, imported.storage[key]);
              });
            }
            if (imported.idbData) {
              const { saveFullFirestoreState } = await import('../../lib/firestoreService');
              await saveFullFirestoreState(imported.idbData);
            }
            alert('System backup restored successfully! Reloading application...');
            window.location.reload();
          } else {
            alert('Invalid backup format. File does not contain Constructfield data.');
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
      email: newProfile.email || `${newProfile.name.toLowerCase().replace(/\s+/g, '.')}@constructfield.io`,
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
        {isAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'admin' ? 'bg-[#0B5FFF] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400'
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-emerald-400" /> Admin & Access Control
          </button>
        )}

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

      {/* TAB 0: ADMIN & EMAIL ACCESS CONTROL */}
      {activeTab === 'admin' && (
        <div className="space-y-6 w-full">
          {/* Admin Summary KPI Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Whitelisted Emails</p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{userProfiles.length}</h3>
                </div>
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/50 text-[#0B5FFF] rounded-xl flex items-center justify-center">
                  <Mail className="h-5 w-5" />
                </div>
              </div>
            </Card>

            <Card className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Allowed Access</p>
                  <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {userProfiles.filter(p => p.accessAllowed !== false).length}
                  </h3>
                </div>
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
            </Card>

            <Card className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Access Blocked / Revoked</p>
                  <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                    {userProfiles.filter(p => p.accessAllowed === false).length}
                  </h3>
                </div>
                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
                  <XCircle className="h-5 w-5" />
                </div>
              </div>
            </Card>

            <Card className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Access Requests</p>
                  <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                    {accessRequests.filter(r => r.status === 'Pending').length}
                  </h3>
                </div>
                <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
                  <UserPlus className="h-5 w-5" />
                </div>
              </div>
            </Card>
          </div>

          {/* Pending Admission Access Requests Card */}
          {accessRequests.length > 0 && (
            <Card className="border-purple-200 dark:border-purple-900/50 bg-purple-50/20 dark:bg-purple-950/10 overflow-hidden">
              <CardHeader className="border-b border-purple-100 dark:border-purple-900/30 pb-3">
                <CardTitle className="text-sm font-bold flex items-center justify-between text-purple-950 dark:text-purple-200">
                  <span className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    Pending Admission Access Requests ({accessRequests.filter(r => r.status === 'Pending').length} Pending)
                  </span>
                  <span className="text-xs font-normal text-purple-600 dark:text-purple-400 font-mono">
                    System Access Gate
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-purple-100/50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-300 font-bold border-b border-purple-200 dark:border-purple-900/40">
                      <tr>
                        <th className="py-2.5 px-4">Applicant</th>
                        <th className="py-2.5 px-4">Email Address</th>
                        <th className="py-2.5 px-4">Company</th>
                        <th className="py-2.5 px-4">Requested Role</th>
                        <th className="py-2.5 px-4">Reason / Project</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-100 dark:divide-purple-900/20">
                      {accessRequests.map(req => (
                        <tr key={req.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-colors">
                          <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">
                            {req.name}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                            {req.email}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                            {req.company}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300">
                              {req.requestedRole}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-500 max-w-xs truncate">
                            {req.reason}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            {req.status === 'Pending' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  onClick={() => approveAccessRequest(req.id)}
                                  className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 rounded-lg flex items-center gap-1"
                                >
                                  <Check className="h-3 w-3" /> Approve & Whitelist
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => rejectAccessRequest(req.id)}
                                  className="h-7 text-[11px] border-red-300 text-red-600 dark:border-red-800 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 px-2 rounded-lg"
                                >
                                  <X className="h-3 w-3" /> Reject
                                </Button>
                              </div>
                            ) : (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              }`}>
                                {req.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admin Email Whitelist & Permission Management Table */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Authorized Emails & Section Access Management
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure allowed user emails, toggle application access, and specify granular section editing permissions.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search email, name or role..."
                    value={adminSearch}
                    onChange={e => setAdminSearch(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                  />
                </div>
                <Button 
                  onClick={() => handleOpenEditPermissions()} 
                  className="bg-[#0B5FFF] text-white rounded-xl text-xs font-semibold gap-1.5 shrink-0"
                >
                  <Plus className="h-4 w-4" /> Authorize New Email
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">User / Email</th>
                    <th className="px-4 py-3">System Role</th>
                    <th className="px-4 py-3 text-center">App Access</th>
                    <th className="px-4 py-3">Section Edit Permissions</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAdminProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No authorized email profiles matched your search query.
                      </td>
                    </tr>
                  ) : (
                    filteredAdminProfiles.map(prof => {
                      const isAllowed = prof.accessAllowed !== false;
                      const isCurrentUser = prof.id === currentUserProfile?.id;
                      const hasAdminRole = prof.role === 'Admin';

                      const canEditActivities = prof.permissions?.activities ?? (hasAdminRole || prof.role === 'Manager' || prof.role === 'Engineer');
                      const canEditReports = prof.permissions?.reports ?? true;
                      const canEditLabour = prof.permissions?.labour ?? (hasAdminRole || prof.role === 'Manager');
                      const canEditMaterials = prof.permissions?.materials ?? (hasAdminRole || prof.role === 'Manager' || prof.role === 'Engineer');
                      const canEditSafety = prof.permissions?.safety ?? (prof.role !== 'Viewer');
                      const canEditQuality = prof.permissions?.quality ?? (hasAdminRole || prof.role === 'Manager' || prof.role === 'Engineer' || prof.role === 'Inspector');
                      const canEditEquipment = prof.permissions?.equipment ?? (hasAdminRole || prof.role === 'Manager');
                      const canEditSettings = prof.permissions?.settings ?? hasAdminRole;

                      return (
                        <tr key={prof.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#0B5FFF] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                {prof.initials}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span className="truncate">{prof.name}</span>
                                  {isCurrentUser && (
                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-blue-300 text-blue-600 bg-blue-50">
                                      You
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px] truncate flex items-center gap-1">
                                  <Mail className="h-3 w-3 text-slate-400 inline" /> {prof.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              prof.role === 'Admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' :
                              prof.role === 'Manager' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' :
                              prof.role === 'Engineer' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' :
                              prof.role === 'Inspector' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' :
                              'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {prof.role}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleToggleUserAccess(prof)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                                isAllowed 
                                  ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                                  : 'bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                              }`}
                              title={isAllowed ? 'Click to restrict access' : 'Click to grant access'}
                            >
                              {isAllowed ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3" /> Access Allowed
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3" /> Access Blocked
                                </>
                              )}
                            </button>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${canEditActivities ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 line-through'}`}>
                                Activities
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${canEditReports ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 line-through'}`}>
                                Reports
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${canEditLabour ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 line-through'}`}>
                                Labour
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${canEditMaterials ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 line-through'}`}>
                                Materials
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${canEditSafety ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 line-through'}`}>
                                Safety
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${canEditQuality ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 line-through'}`}>
                                Quality
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${canEditEquipment ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 line-through'}`}>
                                Equipment
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${canEditSettings ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 line-through'}`}>
                                Settings
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenEditPermissions(prof)}
                                className="h-7 px-2 text-[11px] rounded-lg gap-1 border-slate-200 dark:border-slate-700"
                                title="Edit section permissions"
                              >
                                <SlidersHorizontal className="h-3 w-3 text-[#0B5FFF]" /> Permissions
                              </Button>

                              {!isCurrentUser && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (confirm(`Revoke access and remove email whitelist profile for ${prof.email}?`)) {
                                      deleteProfile(prof.id);
                                    }
                                  }}
                                  className="h-7 w-7 p-0 rounded-lg border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200"
                                  title="Revoke and delete email whitelist"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

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
        <div className="space-y-6 w-full animate-in fade-in duration-150">
          {/* 1. CLOUD SYNC & REPLICATION CENTER */}
          <Card className="p-6 border-blue-200 dark:border-blue-900/50 bg-blue-50/20 dark:bg-blue-950/10 relative overflow-hidden shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-blue-100 dark:border-blue-900/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-[#0B5FFF]/10 dark:bg-blue-900/40 text-[#0B5FFF] shrink-0">
                  <Cloud className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Cloud Sync & Real-Time Replication</h3>
                    <Badge variant={isOffline ? "danger" : "success"} className="text-[10px] font-bold">
                      {isOffline ? 'OFFLINE' : 'CONNECTED'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Synchronizes activities, subtasks, QA hold points, labour records, and audit logs across Firebase Cloud & Server.
                  </p>
                </div>
              </div>

              {/* Sync Mode Switcher */}
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-start md:self-auto">
                <div className="text-right pr-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    {isManualSyncMode ? 'Manual Sync' : 'Auto Live Sync'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {isManualSyncMode ? 'Local-first batching' : 'Real-time replication'}
                  </span>
                </div>
                <button
                  onClick={() => setIsManualSyncMode(!isManualSyncMode)}
                  className="p-1 rounded-lg text-slate-600 hover:text-[#0B5FFF] dark:text-slate-300 transition-colors"
                  title="Toggle sync mode"
                >
                  {isManualSyncMode ? (
                    <ToggleLeft className="h-6 w-6 text-amber-500" />
                  ) : (
                    <ToggleRight className="h-6 w-6 text-emerald-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Cloud Sync Metrics & Action */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Network Status</span>
                <span className={`text-sm font-bold mt-1 block ${isOffline ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {isOffline ? 'Local Storage Only' : 'Cloud Connected'}
                </span>
                <span className="text-[10px] text-slate-500">IndexedDB & Cache Active</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Last Cloud Sync</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                  {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Never'}
                </span>
                <span className="text-[10px] text-slate-500">{lastSyncedAt ? new Date(lastSyncedAt).toLocaleDateString() : 'Sync pending'}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Cloud Edits</span>
                <span className={`text-sm font-bold mt-1 block ${hasPendingChanges ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {hasPendingChanges ? `${pendingChangesCount} Unsynced Edits` : 'Fully Synchronized'}
                </span>
                <span className="text-[10px] text-slate-500">{hasPendingChanges ? 'Waiting for sync' : 'Zero lag'}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-3">
                <Button 
                  onClick={handleCloudForceSync} 
                  disabled={isOffline || isSyncing || isCloudSyncing}
                  className="gap-2 bg-[#0B5FFF] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm h-9"
                >
                  <RefreshCw className={`h-4 w-4 ${isCloudSyncing || isSyncing ? 'animate-spin' : ''}`} />
                  {isCloudSyncing || isSyncing ? 'Syncing to Cloud...' : 'Sync Everything to Cloud Now'}
                </Button>
                {cloudSyncStatus && (
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 animate-in fade-in">
                    {cloudSyncStatus}
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* 2. GOOGLE DRIVE BACKUP & RESTORE SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <Card className="p-6 border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20 relative overflow-hidden shadow-xs flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <CloudUpload className="h-24 w-24 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-base font-bold flex items-center gap-2 mb-2 text-indigo-950 dark:text-indigo-100">
                  <CloudUpload className="h-5 w-5 text-indigo-600" /> Sync to Google Drive
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 pr-6 leading-relaxed">
                  Securely backup all Constructfield project database models (including activities, subtasks, QA hold points, daily reports, and audit trail logs) directly to your Google Drive account.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
                <Button 
                  onClick={handleDriveBackup} 
                  disabled={isDriveSyncing}
                  className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold h-9 shadow-sm"
                >
                  {isDriveSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
                  {isDriveSyncing ? 'Backing up...' : 'Backup to Google Drive'}
                </Button>
                {driveStatus && (
                  <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 animate-in fade-in">
                    {driveStatus}
                  </span>
                )}
              </div>
            </Card>

            <Card className="p-6 border-teal-200 dark:border-teal-900/50 bg-teal-50/30 dark:bg-teal-950/20 relative overflow-hidden shadow-xs flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <CloudDownload className="h-24 w-24 text-teal-600" />
              </div>
              <div>
                <h3 className="text-base font-bold flex items-center gap-2 mb-2 text-teal-950 dark:text-teal-100">
                  <CloudDownload className="h-5 w-5 text-teal-600" /> Restore from Google Drive
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 pr-6 leading-relaxed">
                  Retrieve and restore your most recent Constructfield backup snapshot from your Google Drive account. This will restore all activities, reports, and system settings.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
                <Button 
                  onClick={handleDriveRestore} 
                  disabled={isDriveSyncing}
                  className="gap-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold h-9 shadow-sm"
                >
                  {isDriveSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudDownload className="h-4 w-4" />}
                  {isDriveSyncing ? 'Restoring...' : 'Restore from Google Drive'}
                </Button>
              </div>
            </Card>
          </div>

          {/* Google Drive Client ID Setting Box */}
          <Card className="p-4 sm:p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <Key className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Google OAuth Client ID (Optional)</h4>
                  <p className="text-[11px] text-slate-500">Configure your custom Google Cloud OAuth 2.0 Web Client ID for enterprise Drive backup.</p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="e.g. 123456-abc.apps.googleusercontent.com"
                  value={customGoogleClientId}
                  onChange={e => setCustomGoogleClientId(e.target.value)}
                  className="h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono flex-1 sm:w-72 focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                />
                <Button
                  onClick={handleSaveClientId}
                  variant="outline"
                  className="h-9 px-3 rounded-xl text-xs font-semibold shrink-0"
                >
                  Save ID
                </Button>
              </div>
            </div>
            {clientIdSavedMsg && (
              <p className="text-[11px] font-semibold text-emerald-600 mt-2 flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Google Client ID configuration updated successfully.
              </p>
            )}
          </Card>

          {/* 3. LOCAL DEVICE BACKUP & RESTORE SECTION */}
          <div className="flex items-center gap-4 py-1">
            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Local Device Offline Backup</span>
            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2 mb-2 text-slate-900 dark:text-white">
                  <Download className="h-5 w-5 text-[#0B5FFF]" /> Export Local JSON Snapshot
                </h3>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Download a complete, offline JSON file containing your entire Constructfield database, activities, and QA audit logs.
                </p>
              </div>
              <Button onClick={handleExportBackup} className="gap-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold h-9 self-start">
                <Download className="h-4 w-4 text-[#0B5FFF]" /> Export JSON File
              </Button>
            </Card>

            <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2 mb-2 text-slate-900 dark:text-white">
                  <Upload className="h-5 w-5 text-emerald-600" /> Restore Local JSON Snapshot
                </h3>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Restore your entire Constructfield database from a saved offline JSON backup file.
                </p>
              </div>
              <label className="cursor-pointer inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-2 rounded-xl text-xs font-bold self-start">
                <Upload className="h-4 w-4 text-emerald-600" /> Select JSON File to Restore
                <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
              </label>
            </Card>
          </div>
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
                    <option value="Admin">System Administrator</option>
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
      {/* CONFIGURE USER SECTION PERMISSIONS MODAL */}
      {showPermissionsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-xl shadow-2xl border-slate-200 dark:border-slate-800 my-8">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-[#0B5FFF]" />
                  {editingUserProfile ? 'Configure Section Permissions & Access' : 'Authorize New Email & Set Permissions'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set whitelisted email access and specify which project sections this account can edit.
                </p>
              </div>
              <button onClick={() => setShowPermissionsModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSavePermissions} className="p-6 space-y-5">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Authorized Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="user@organization.com"
                      value={permForm.email}
                      onChange={e => setPermForm({ ...permForm, email: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lindokuhle Chris"
                      value={permForm.name}
                      onChange={e => setPermForm({ ...permForm, name: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">System Role Authority *</label>
                    <select
                      value={permForm.role}
                      onChange={e => {
                        const role = e.target.value as UserRole;
                        setPermForm({
                          ...permForm,
                          role,
                          permissions: {
                            activities: role === 'Admin' || role === 'Manager' || role === 'Engineer',
                            reports: true,
                            labour: role === 'Admin' || role === 'Manager',
                            materials: role === 'Admin' || role === 'Manager' || role === 'Engineer',
                            safety: role !== 'Viewer',
                            quality: role === 'Admin' || role === 'Manager' || role === 'Engineer' || role === 'Inspector',
                            equipment: role === 'Admin' || role === 'Manager',
                            settings: role === 'Admin'
                          }
                        });
                      }}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold"
                    >
                      <option value="Admin">System Administrator (Full Control)</option>
                      <option value="Manager">Project / Site Manager</option>
                      <option value="Engineer">Field / Site Engineer</option>
                      <option value="Inspector">Quality & Safety Inspector</option>
                      <option value="Worker">Site Labour / Worker</option>
                      <option value="Viewer">Restricted Guest / Viewer</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Job Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Lead Project Director"
                      value={permForm.title}
                      onChange={e => setPermForm({ ...permForm, title: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                    />
                  </div>
                </div>

                {/* App Access Allowed Switch */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-[#0B5FFF]" /> Whitelisted App Access
                    </div>
                    <p className="text-[11px] text-slate-500">Allow this email address to log in and view project details on Constructfield.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permForm.accessAllowed !== false}
                      onChange={e => setPermForm({ ...permForm, accessAllowed: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0B5FFF]"></div>
                  </label>
                </div>

                {/* Granular Section Editing Permissions */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                      <SlidersHorizontal className="h-3.5 w-3.5 text-[#0B5FFF]" /> Project Section Edit Permissions
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">Who can edit which part</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                    {[
                      { key: 'activities', label: 'Activities & Quantities', desc: 'Create, update & delete activities, dates and progress %' },
                      { key: 'reports', label: 'Daily Site Reports', desc: 'Create and submit daily site reports and weather logs' },
                      { key: 'labour', label: 'Labour & Attendance', desc: 'Log worker check-ins and site labour hours allocation' },
                      { key: 'materials', label: 'Materials & Stock', desc: 'Manage material inventory, receipts and site usages' },
                      { key: 'safety', label: 'Safety & Incidents', desc: 'Report hazards, safety incidents and SWMS compliance' },
                      { key: 'quality', label: 'Quality & QA/QC', desc: 'Conduct QA inspections, checklists and NCR approvals' },
                      { key: 'equipment', label: 'Equipment Operations', desc: 'Log machinery hours, fuel logs and maintenance' },
                      { key: 'settings', label: 'Admin & System Settings', desc: 'Access administrative controls and user permissions' },
                    ].map(sec => {
                      const isChecked = permForm.permissions?.[sec.key as keyof ProjectSectionPermissions] ?? false;
                      const isAdminRole = permForm.role === 'Admin';

                      return (
                        <div key={sec.key} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-start justify-between gap-2">
                          <div className="min-w-0 pr-1">
                            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{sec.label}</div>
                            <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{sec.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                            <input
                              type="checkbox"
                              disabled={isAdminRole}
                              checked={isAdminRole || isChecked}
                              onChange={e => setPermForm({
                                ...permForm,
                                permissions: {
                                  ...(permForm.permissions as any),
                                  [sec.key]: e.target.checked
                                }
                              })}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0B5FFF] peer-disabled:opacity-60"></div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowPermissionsModal(false)} className="rounded-xl text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#0B5FFF] text-white rounded-xl text-xs font-bold gap-1.5">
                  <Save className="h-4 w-4" /> Save User Access & Permissions
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
