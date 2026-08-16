import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Mail, 
  KeyRound, 
  ArrowRight, 
  UserPlus, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  HardHat,
  ChevronRight,
  Info,
  Key
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { UserRole } from '../types';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';

export function LoginScreen() {
  const { 
    login, 
    loginWithProfile, 
    userProfiles, 
    addAccessRequest, 
    theme, 
    setTheme 
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<'email' | 'request'>('email');
  
  // Email Login Form
  const [emailInput, setEmailInput] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Admission Request Form
  const [requestForm, setRequestForm] = useState<{
    name: string;
    email: string;
    company: string;
    requestedRole: UserRole;
    reason: string;
  }>({
    name: '',
    email: '',
    company: 'Acme Subcontractors',
    requestedRole: 'Engineer',
    reason: 'Joining Site Operations'
  });
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const handleEmailLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!emailInput.trim()) {
      setLoginError('Please enter a whitelisted email address.');
      return;
    }

    const result = login(emailInput, passcode);
    if (!result.success && result.message) {
      setLoginError(result.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoginError(null);
      setIsAuthenticating(true);
      const result = await signInWithPopup(auth, googleProvider);
      
      const email = result.user.email;
      if (email) {
        // Wait a short moment for AppContext's onAuthStateChanged & Firestore onSnapshot to pull data
        let loginResult = login(email, '');
        if (!loginResult.success) {
          // If it failed, wait up to 3 seconds for Firestore to sync their profile
          for (let i = 0; i < 6; i++) {
            await new Promise(r => setTimeout(r, 500));
            loginResult = login(email, '');
            if (loginResult.success) break;
          }
        }
        
        if (!loginResult.success && loginResult.message) {
          setLoginError(loginResult.message);
        }
      }
    } catch (err: any) {
      console.error(err);
      setLoginError(err.message || 'Failed to sign in with Google');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleProfileClick = (profileId: string) => {
    setLoginError(null);
    const result = loginWithProfile(profileId);
    if (!result.success && result.message) {
      setLoginError(result.message);
    }
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestForm.name || !requestForm.email) return;

    addAccessRequest({
      name: requestForm.name,
      email: requestForm.email,
      company: requestForm.company,
      requestedRole: requestForm.requestedRole,
      reason: requestForm.reason
    });

    setRequestSubmitted(true);
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-[#0B5FFF] selection:text-white relative overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#0B5FFF]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Navigation */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#0B5FFF] text-white shadow-lg shadow-blue-500/30 flex items-center justify-center">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-white tracking-tight">Constructfield</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-semibold tracking-wide">
                v1.0 Enterprise
              </span>
            </div>
            <p className="text-xs text-slate-400">Field Operations & Management Suite</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Admission Control Active</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-5xl mx-auto px-4 py-8 flex-1 flex flex-col justify-center items-center z-10">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Platform Branding & Status */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
              <Lock className="h-3.5 w-3.5 text-[#0B5FFF]" /> Controlled Access Gate
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Secure Site <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
                Admission Control
              </span>
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              Verify your whitelisted enterprise credentials or select an authorized project profile to access activities, daily reports, safety logs, and quality inspections.
            </p>

            {/* Quick Whitelisted Email Status Info */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                <span className="flex items-center gap-1.5 text-slate-200">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" /> Whitelisted Accounts
                </span>
                <span className="text-blue-400 font-bold">{userProfiles.filter(p => p.accessAllowed !== false).length} Active</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Only email addresses explicitly authorized by System Administrators are allowed entry. Non-whitelisted users must request admission.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>3 Sites Live</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
                <span>Encrypted Sync</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Login / Profile Selector Form */}
          <div className="lg:col-span-7 bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
            
            {/* Tabs for Login Mode */}
            <div className="flex items-center p-1 rounded-2xl bg-slate-900/80 border border-slate-700/60 mb-6">
              <button
                type="button"
                onClick={() => { setActiveTab('email'); setLoginError(null); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'email' 
                    ? 'bg-[#0B5FFF] text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mail className="h-3.5 w-3.5" /> Whitelisted Email
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('request'); setLoginError(null); setRequestSubmitted(false); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'request' 
                    ? 'bg-[#0B5FFF] text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" /> Request Access
              </button>
            </div>

            {/* ERROR BANNER */}
            {loginError && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-3 animate-in fade-in duration-200">
                <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="font-bold text-rose-300">Admission Denied</div>
                  <div className="leading-relaxed">{loginError}</div>
                </div>
              </div>
            )}

            {/* TAB 1: EMAIL LOGIN */}
            {activeTab === 'email' && (
              <form onSubmit={handleEmailLoginSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                    <span>Whitelisted Email Address</span>
                    <span className="text-[10px] text-blue-400 font-normal">Case-Insensitive</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="enter.your.email@company.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs font-medium placeholder-slate-500 focus:outline-none focus:border-[#0B5FFF] focus:ring-1 focus:ring-[#0B5FFF] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                    <span>Security Passcode / PIN (Optional)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Default: Optional for Whitelisted</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs font-medium placeholder-slate-500 focus:outline-none focus:border-[#0B5FFF] focus:ring-1 focus:ring-[#0B5FFF] transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-[#0B5FFF] hover:bg-blue-600 text-white font-bold text-xs tracking-wide transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Verify Whitelist & Enter Site</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-700/60"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-500 text-xs font-semibold">OR</span>
                  <div className="flex-grow border-t border-slate-700/60"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isAuthenticating}
                  className="w-full py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>{isAuthenticating ? 'Authenticating...' : 'Sign In with Google'}</span>
                </button>
              </form>
            )}

            {/* TAB 3: REQUEST ADMISSION FORM */}
            {activeTab === 'request' && (
              <div className="space-y-4">
                {requestSubmitted ? (
                  <div className="p-6 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600/30 text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-bold text-emerald-200">Admission Request Submitted!</h3>
                    <p className="text-xs text-emerald-300/80 leading-relaxed">
                      Your request for <strong>{requestForm.email}</strong> has been received by System Administrators. You will gain access once approved and whitelisted.
                    </p>
                    <button
                      type="button"
                      onClick={() => { setRequestSubmitted(false); setActiveTab('email'); }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow"
                    >
                      Return to Email Login
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRequestSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          value={requestForm.name}
                          onChange={(e) => setRequestForm({ ...requestForm, name: e.target.value })}
                          placeholder="e.g. Marcus Vance"
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs font-medium placeholder-slate-500 focus:outline-none focus:border-[#0B5FFF]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">Email Address</label>
                        <input
                          type="email"
                          required
                          value={requestForm.email}
                          onChange={(e) => setRequestForm({ ...requestForm, email: e.target.value })}
                          placeholder="e.g. marcus@acme.com"
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs font-medium placeholder-slate-500 focus:outline-none focus:border-[#0B5FFF]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">Company / Organization</label>
                        <input
                          type="text"
                          required
                          value={requestForm.company}
                          onChange={(e) => setRequestForm({ ...requestForm, company: e.target.value })}
                          placeholder="e.g. Apex Foundations Ltd"
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs font-medium placeholder-slate-500 focus:outline-none focus:border-[#0B5FFF]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">Requested Role</label>
                        <select
                          value={requestForm.requestedRole}
                          onChange={(e) => setRequestForm({ ...requestForm, requestedRole: e.target.value as UserRole })}
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-[#0B5FFF]"
                        >
                          <option value="Engineer">Field Engineer</option>
                          <option value="Manager">Site Manager</option>
                          <option value="Inspector">QA Inspector</option>
                          <option value="Worker">Site Worker / Subcontractor</option>
                          <option value="Viewer">Guest Stakeholder</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Reason / Site Assignment</label>
                      <textarea
                        rows={2}
                        value={requestForm.reason}
                        onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                        placeholder="State your project assignment or supervisor name..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs font-medium placeholder-slate-500 focus:outline-none focus:border-[#0B5FFF]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs tracking-wide transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Submit Admission Request</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Footer Disclaimer */}
            <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Info className="h-3.5 w-3.5 text-blue-400" /> Need access help? Contact site lead.
              </span>
              <span className="font-mono text-slate-500">IP: 192.168.1.1 (Encrypted)</span>
            </div>

          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-4 text-center text-xs text-slate-500 border-t border-slate-800/80 z-10 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>© 2026 Constructfield Enterprise Operations. All Rights Reserved.</div>
        <div className="flex items-center gap-4">
          <span className="hover:text-slate-400 cursor-pointer">Security Terms</span>
          <span>•</span>
          <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
          <span>•</span>
          <span className="hover:text-slate-400 cursor-pointer">Support</span>
        </div>
      </footer>
    </div>
  );
}
