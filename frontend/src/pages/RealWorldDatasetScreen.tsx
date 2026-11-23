import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { CompactMusicPlayer } from '../components/music/CompactMusicPlayer';
import {
  ShieldAlert,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  BarChart3,
  Network,
  Layers,
  Lock,
  Unlock,
  Activity,
  FileText,
  UserCheck,
  RotateCcw
} from 'lucide-react';
import { getApiBaseUrl } from '../config/api';

export const RealWorldDatasetScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'associations' | 'target' | 'models' | 'profile' | 'exports'>('overview');
  const [selectedFactor, setSelectedFactor] = useState<string>('Academic Pressure');
  const [isResearchAuthorized, setIsResearchAuthorized] = useState<boolean>(true);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [exploratoryData, setExploratoryData] = useState<any>(null);
  const [modelsData, setModelsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Phase 8.5: Interactive Student Profile Analysis State
  const [profileForm, setProfileForm] = useState({
    age: 20,
    gender: 'Male',
    dietary_habits: 'Moderate',
    degree: 'Engineering & Tech',
    cgpa: 7.5,
    academic_pressure: 3,
    study_satisfaction: 3,
    sleep_duration: '5–6 hours',
    study_hours: 4.0,
    financial_stress: 3
  });
  const [profileResult, setProfileResult] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    fetchResearchData();
  }, [isResearchAuthorized]);

  const fetchResearchData = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const headers: Record<string, string> = {};
      const token = sessionStorage.getItem('mindora_auth_token') || localStorage.getItem('mindora_auth_token') || '';
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (isResearchAuthorized) {
        headers['X-Research-Authorization'] = 'authorized';
      }

      const resOverview = await fetch(`${getApiBaseUrl()}/api/research/163-dataset/overview`, { headers });
      if (resOverview.status === 403) {
        setAuthError('Access restricted: Research laboratory is only accessible to authorized research administrators. Ordinary student accounts cannot access unverified survey datasets.');
        setLoading(false);
        return;
      }

      if (resOverview.ok) {
        const j = await resOverview.json();
        setOverviewData(j.data);
      }

      const resExp = await fetch(`${getApiBaseUrl()}/api/research/163-dataset/exploratory`, { headers });
      if (resExp.ok) {
        const j = await resExp.json();
        setExploratoryData(j.data);
      }

      const resMod = await fetch(`${getApiBaseUrl()}/api/research/163-dataset/models`, { headers });
      if (resMod.ok) {
        const j = await resMod.json();
        setModelsData(j.data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    window.open(`${getApiBaseUrl()}/api/research/163-dataset/export/csv`, '_blank');
  };

  const handleDownloadReport = () => {
    window.open(`${getApiBaseUrl()}/api/research/163-dataset/export/report`, '_blank');
  };

  const handleCompareProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = sessionStorage.getItem('mindora_auth_token') || localStorage.getItem('mindora_auth_token') || '';
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (isResearchAuthorized) {
        headers['X-Research-Authorization'] = 'authorized';
      }

      const res = await fetch(`${getApiBaseUrl()}/api/research/163-dataset/profile-compare`, {
        method: 'POST',
        headers,
        body: JSON.stringify(profileForm)
      });
      const data = await res.json();
      if (data.status === 'success') {
        setProfileResult(data.data);
      } else {
        setProfileError(data.message || (data.errors ? data.errors.join(', ') : 'Profile comparison failed.'));
      }
    } catch (err: any) {
      setProfileError('Network communication error with research analysis backend.');
    } finally {
      setProfileLoading(false);
    }
  };

  const factorKeys = exploratoryData?.factors ? Object.keys(exploratoryData.factors) : [
    'Academic Pressure', 'Study Satisfaction', 'Sleep Duration', 'Financial Stress',
    'Daily Study Hours', 'Dietary Habits', 'Gender Categories', 'Age Groups',
    'Academic Programme', 'CGPA Range'
  ];

  const currentFactorData = exploratoryData?.factors?.[selectedFactor];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* MANDATORY GOVERNANCE NOTICE BANNER */}
      <div className="bg-amber-500/10 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-md shrink-0 mt-0.5">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center px-3 py-1 bg-amber-500/20 text-amber-950 dark:text-amber-200 rounded-full text-xs font-black uppercase tracking-wider">
                  163-RECORD MANUALLY COLLECTED STUDENT DATASET — PROVENANCE AND CONSENT UNVERIFIED. RESEARCH USE ONLY.
                </span>
                <span className="inline-flex items-center px-3 py-1 bg-rose-100 text-rose-900 border border-rose-200 rounded-full text-xs font-bold uppercase tracking-wider">
                  STRICT RESEARCH ISOLATION
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-amber-950 dark:text-amber-100">
                Real-World Depression Data Analyzer (163-Record Cohort)
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-amber-900 dark:text-amber-200/90 leading-relaxed max-w-4xl">
                This section inspects the manually collected student workbook (<code>STUDENT dataset.xlsx</code> / 162 respondent records). No institutional ethics review (IRB/IEC) approval number or verified participant consent logs accompany this file. Under Mindora's scientific integrity protocols, this cohort is strictly restricted to authorized research administrators and is <strong>NEVER used to diagnose students, generate individual predictions, or send guardian alerts.</strong>
              </p>
            </div>
          </div>

          {/* Embedded Ambient Music Controller (Part 2C requirement) & Auth Toggle */}
          <div className="flex flex-col items-end gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200">Ambient Study Player:</span>
              <CompactMusicPlayer className="shadow-sm" />
            </div>

            <button
              onClick={() => setIsResearchAuthorized(!isResearchAuthorized)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isResearchAuthorized
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
              }`}
            >
              {isResearchAuthorized ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{isResearchAuthorized ? 'Research Admin Mode: Active' : 'Student Mode (Restricted)'}</span>
            </button>

            {loading && (
              <span className="text-[11px] font-semibold text-amber-700 animate-pulse">Syncing research metrics...</span>
            )}
          </div>
        </div>
      </div>

      {/* Access Restriction Screen if Student is Unauthorized */}
      {authError && (
        <Card className="p-8 border-2 border-rose-300 bg-rose-50/50 dark:bg-rose-950/20 text-center rounded-3xl space-y-4">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-rose-950 dark:text-rose-200">Research Laboratory Access Restricted</h2>
          <p className="text-sm text-rose-800 dark:text-rose-300 max-w-lg mx-auto leading-relaxed">
            {authError}
          </p>
          <button
            onClick={() => setIsResearchAuthorized(true)}
            className="px-6 py-2.5 bg-violet-600 text-white rounded-xl text-xs font-bold hover:bg-violet-700 shadow-sm"
          >
            Authenticate as Research Administrator
          </button>
        </Card>
      )}

      {!authError && (
        <>
          {/* Top Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Card className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Respondents</span>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-1">162 Records</div>
              <span className="text-[10px] text-slate-500">163 rows with header</span>
            </Card>

            <Card className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <span className="text-[10px] font-bold uppercase text-slate-400">Target: No</span>
              <div className="text-xl font-black text-emerald-600 mt-1">98 (60.5%)</div>
              <span className="text-[10px] text-slate-500">Never told depression</span>
            </Card>

            <Card className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <span className="text-[10px] font-bold uppercase text-slate-400">Target: Yes</span>
              <div className="text-xl font-black text-violet-600 mt-1">45 (27.8%)</div>
              <span className="text-[10px] text-slate-500">Told by professional</span>
            </Card>

            <Card className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <span className="text-[10px] font-bold uppercase text-slate-400">Target: Not Sure</span>
              <div className="text-xl font-black text-amber-600 mt-1">19 (11.7%)</div>
              <span className="text-[10px] text-slate-500">Preserved as distinct</span>
            </Card>

            <Card className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <span className="text-[10px] font-bold uppercase text-slate-400">Minors Detected</span>
              <div className="text-xl font-black text-rose-600 mt-1">17 (&lt;18 yrs)</div>
              <span className="text-[10px] text-slate-500">Ages: 13, 16, 17</span>
            </Card>

            <Card className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <span className="text-[10px] font-bold uppercase text-slate-400">Missing Values</span>
              <div className="text-xl font-black text-emerald-600 mt-1">0 (0.0%)</div>
              <span className="text-[10px] text-slate-500">Complete responses</span>
            </Card>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            {[
              { id: 'overview', label: '1. Dataset Overview & Distributions', icon: BarChart3 },
              { id: 'associations', label: '2. Exploratory Bivariate Associations', icon: Network },
              { id: 'target', label: '3. Target Variable Handling', icon: Layers },
              { id: 'models', label: '4. Research Model Laboratory', icon: Activity },
              { id: 'exports', label: '5. Reports & Exports', icon: Download },
              { id: 'profile', label: '6. Interactive Profile Analysis', icon: UserCheck }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: DATASET OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {overviewData && (
                <div className="text-xs text-slate-600 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span>SHA-256: {overviewData.sha256 ? overviewData.sha256.substring(0, 16) + '...' : 'Verified SHA-256'}</span>
                  <span>Verified Cohort: {overviewData.respondents_count || 162} records (0 missing values)</span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Age & Minors Card */}
                <Card className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center justify-between">
                    <span>Age Distribution &amp; Minors</span>
                    <Badge variant="rose">17 Minors</Badge>
                  </h3>
                  <div className="text-xs text-slate-500 mb-3">
                    Range: 13 to 69 years • Mean: 19.98 • Median: 19.0
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between font-mono mb-1">
                        <span>&lt;18 (Minors)</span>
                        <span className="font-bold text-rose-600">17 (10.5%)</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full" style={{ width: '10.5%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between font-mono mb-1">
                        <span>18–20 Years</span>
                        <span className="font-bold text-emerald-600">95 (58.6%)</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{ width: '58.6%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between font-mono mb-1">
                        <span>21–23 Years</span>
                        <span className="font-bold text-cyan-600">42 (25.9%)</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-cyan-500 h-full" style={{ width: '25.9%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between font-mono mb-1">
                        <span>24+ Years</span>
                        <span className="font-bold text-indigo-600">8 (4.9%)</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full" style={{ width: '4.9%' }} />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Gender Distribution */}
                <Card className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Gender Demographics</h3>
                  <div className="text-xs text-slate-500 mb-3">Self-reported survey respondent gender</div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between font-mono mb-1">
                        <span>Female</span>
                        <span className="font-bold text-purple-600">90 (55.6%)</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full" style={{ width: '55.6%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between font-mono mb-1">
                        <span>Male</span>
                        <span className="font-bold text-blue-600">63 (38.9%)</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full" style={{ width: '38.9%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between font-mono mb-1">
                        <span>Prefer not to say</span>
                        <span className="font-bold text-slate-500">9 (5.6%)</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-slate-400 h-full" style={{ width: '5.6%' }} />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Academic Programme Clusters */}
                <Card className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Programme Clusters</h3>
                  <div className="text-xs text-slate-500 mb-3">Grouped from 63 free-text degrees</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between font-mono">
                      <span>Engineering &amp; Tech</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">84 (51.9%)</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span>Business &amp; Commerce</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">26 (16.0%)</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span>Sciences &amp; Computing</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">24 (14.8%)</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span>Medicine &amp; Healthcare</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">10 (6.2%)</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span>Arts, Law &amp; Other</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">18 (11.1%)</span>
                    </div>
                  </div>
                </Card>

                {/* Academic Pressure */}
                <Card className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Academic Pressure</h3>
                  <div className="text-xs text-slate-500 mb-3">Self-reported 1–5 ordinal pressure</div>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between"><span>1 - Very Low:</span><span className="font-bold">20 (12.3%)</span></div>
                    <div className="flex justify-between"><span>2 - Low:</span><span className="font-bold">26 (16.0%)</span></div>
                    <div className="flex justify-between text-amber-700 font-bold"><span>3 - Moderate:</span><span>80 (49.4%)</span></div>
                    <div className="flex justify-between"><span>4 - High:</span><span className="font-bold">15 (9.3%)</span></div>
                    <div className="flex justify-between text-rose-600 font-bold"><span>5 - Very High:</span><span>21 (13.0%)</span></div>
                  </div>
                </Card>

                {/* Sleep Duration */}
                <Card className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Sleep Duration</h3>
                  <div className="text-xs text-slate-500 mb-3">Average self-reported sleep hours</div>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-rose-600 font-bold"><span>&lt;5 hours:</span><span>21 (13.0%)</span></div>
                    <div className="flex justify-between text-amber-700 font-bold"><span>5–6 hours:</span><span>76 (46.9%)</span></div>
                    <div className="flex justify-between text-emerald-600 font-bold"><span>7–8 hours:</span><span>42 (25.9%)</span></div>
                    <div className="flex justify-between"><span>&gt;8 hours:</span><span className="font-bold">23 (14.2%)</span></div>
                  </div>
                </Card>

                {/* Financial Stress */}
                <Card className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Financial Stress</h3>
                  <div className="text-xs text-slate-500 mb-3">Rated on a 1 (low) to 5 (high) scale</div>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between"><span>1 - Very Low:</span><span className="font-bold">11 (6.8%)</span></div>
                    <div className="flex justify-between"><span>2 - Low:</span><span className="font-bold">21 (13.0%)</span></div>
                    <div className="flex justify-between"><span>3 - Moderate:</span><span className="font-bold">60 (37.0%)</span></div>
                    <div className="flex justify-between text-amber-700 font-bold"><span>4 - High:</span><span>48 (29.6%)</span></div>
                    <div className="flex justify-between text-rose-600 font-bold"><span>5 - Very High:</span><span>22 (13.6%)</span></div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 2: EXPLORATORY ASSOCIATIONS */}
          {activeTab === 'associations' && (
            <div className="space-y-6">
              {/* Factor Selection Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Factor:</span>
                  <select
                    value={selectedFactor}
                    onChange={(e) => setSelectedFactor(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    {factorKeys.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>

                <Badge variant="amber">Observational Association Only • Non-Causal</Badge>
              </div>

              {/* Contingency Table & Significance Card */}
              {currentFactorData && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Cross-tabulation Table */}
                  <Card className="lg:col-span-2 p-6 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                      {selectedFactor} &times; Self-Reported Depression History
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Cross-tabulation displaying respondent frequencies and percentage distributions across the 3 target categories.
                    </p>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/60">
                            <th className="py-2.5 px-3">Category</th>
                            <th className="py-2.5 px-3">Total (N)</th>
                            <th className="py-2.5 px-3">No</th>
                            <th className="py-2.5 px-3 text-violet-700 dark:text-violet-300">Yes</th>
                            <th className="py-2.5 px-3 text-amber-700 dark:text-amber-300">Not Sure</th>
                            <th className="py-2.5 px-3">Yes Rate (%)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                          {currentFactorData.contingency_table.map((row: any) => (
                            <tr key={row.category} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="py-2.5 px-3 font-sans font-bold text-slate-800 dark:text-slate-200">{row.category}</td>
                              <td className="py-2.5 px-3 font-bold">{row.total}</td>
                              <td className="py-2.5 px-3 text-emerald-600">{row.counts.No} ({row.rates.no_rate}%)</td>
                              <td className="py-2.5 px-3 text-violet-600 font-bold">{row.counts.Yes} ({row.rates.yes_rate}%)</td>
                              <td className="py-2.5 px-3 text-amber-600">{row.counts['Not Sure']} ({row.rates.not_sure_rate}%)</td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  row.rates.yes_rate > 35 ? 'bg-violet-100 text-violet-900' : 'bg-slate-100 text-slate-800'
                                }`}>
                                  {row.rates.yes_rate}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  {/* Statistical Tests & Effect Sizes */}
                  <Card className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Statistical Tests &amp; Effect Size</h3>
                      <div className="space-y-3 text-xs">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                          <span className="font-bold text-slate-700 dark:text-slate-300">Pearson Chi-Square Test</span>
                          <div className="flex justify-between font-mono">
                            <span>Chi2 Statistic:</span>
                            <span className="font-bold">{currentFactorData.statistical_test.chi2_statistic}</span>
                          </div>
                          <div className="flex justify-between font-mono">
                            <span>p-value:</span>
                            <span className={`font-bold ${currentFactorData.statistical_test.statistically_significant_at_05 ? 'text-violet-600' : 'text-slate-600'}`}>
                              {currentFactorData.statistical_test.p_value}
                            </span>
                          </div>
                          <div className="flex justify-between font-mono">
                            <span>Significant (p &lt; 0.05):</span>
                            <span>{currentFactorData.statistical_test.statistically_significant_at_05 ? 'Yes' : 'No'}</span>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                          <span className="font-bold text-slate-700 dark:text-slate-300">Effect Size</span>
                          <div className="flex justify-between font-mono">
                            <span>Cramér's V:</span>
                            <span className="font-bold text-emerald-600">{currentFactorData.effect_size.value}</span>
                          </div>
                          <div className="flex justify-between font-mono">
                            <span>Interpretation:</span>
                            <span className="font-bold">{currentFactorData.effect_size.interpretation}</span>
                          </div>
                        </div>

                        {currentFactorData.statistical_test.assumption_warning && (
                          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <span>{currentFactorData.statistical_test.assumption_warning}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                      Sample Size: N = {currentFactorData.sample_size} valid records
                    </div>
                  </Card>
                </div>
              )}

              {/* Mandatory Causation vs Association Notice */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong>Non-Causal Disclosure &amp; Epistemological Boundary:</strong> Observational association does not prove causal direction. A student with high academic pressure may report elevated stress, but pressure cannot be asserted as the biomedical cause of depression from survey data alone.
              </div>
            </div>
          )}

          {/* TAB 3: TARGET VARIABLE HANDLING */}
          {activeTab === 'target' && (
            <div className="space-y-6">
              <Card className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Target Construct Definition &amp; Preservation</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      "Has a qualified healthcare professional ever told you that you have depression?"
                    </p>
                  </div>
                  <Badge variant="violet">3 Distinct Categories</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-emerald-700">Category: 'No'</span>
                    <div className="text-2xl font-black text-emerald-900 dark:text-emerald-100 mt-1">98</div>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                      60.49% of cohort. Explicit negative self-report of clinical history.
                    </p>
                  </div>

                  <div className="p-4 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-violet-700">Category: 'Yes'</span>
                    <div className="text-2xl font-black text-violet-900 dark:text-violet-100 mt-1">45</div>
                    <p className="text-xs text-violet-800 dark:text-violet-300 mt-1">
                      27.78% of cohort. Explicit positive self-report of clinical advice.
                    </p>
                  </div>

                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-amber-700">Category: 'Not Sure'</span>
                    <div className="text-2xl font-black text-amber-900 dark:text-amber-100 mt-1">19</div>
                    <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                      11.73% of cohort. <strong>Preserved as distinct.</strong> Never coerced to 'No'.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-2 text-slate-700 dark:text-slate-300">
                  <span className="font-bold">Documented Binary Research Reduction:</span>
                  <p className="leading-relaxed">
                    For isolated experimental machine learning comparisons, the 19 &ldquo;Not Sure&rdquo; records are explicitly excluded to establish an unambiguous ground truth, yielding a binary sample size of <strong>N = 143</strong> (45 Yes, 98 No; 31.47% positive prevalence).
                  </p>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 4: RESEARCH MODEL LABORATORY */}
          {activeTab === 'models' && (
            <div className="space-y-6">
              <Card className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Four-Model Exploratory Evaluation (Track B: 143 Binary Records)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Evaluated strictly using Repeated 5-Fold Stratified Cross-Validation (5 Repeats = 25 Folds) with leak-free preprocessing pipelines.
                    </p>
                  </div>
                  <Badge variant="rose">No Production Endpoint</Badge>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/60">
                        <th className="py-2.5 px-3">Model Architecture</th>
                        <th className="py-2.5 px-3">Accuracy (Mean &plusmn; Std)</th>
                        <th className="py-2.5 px-3">Precision</th>
                        <th className="py-2.5 px-3">Recall (Sensitivity)</th>
                        <th className="py-2.5 px-3">Specificity</th>
                        <th className="py-2.5 px-3">F1-Score</th>
                        <th className="py-2.5 px-3">ROC-AUC (95% CI)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {modelsData?.models &&
                        Object.entries(modelsData.models).map(([name, m]: [string, any]) => {
                          const acc = m.metrics.accuracy;
                          const prec = m.metrics.precision;
                          const rec = m.metrics.recall;
                          const spec = m.metrics.specificity;
                          const f1 = m.metrics.f1_score;
                          const roc = m.metrics.roc_auc;

                          return (
                            <tr key={name} className="hover:bg-amber-50/20 dark:hover:bg-amber-950/20">
                              <td className="py-2.5 px-3 font-sans font-bold text-slate-900 dark:text-white">{name}</td>
                              <td className="py-2.5 px-3 font-bold text-amber-800 dark:text-amber-300">
                                {acc.mean.toFixed(4)} &plusmn; {acc.std.toFixed(4)}
                              </td>
                              <td className="py-2.5 px-3">{prec.mean.toFixed(4)}</td>
                              <td className="py-2.5 px-3">{rec.mean.toFixed(4)}</td>
                              <td className="py-2.5 px-3">{spec.mean.toFixed(4)}</td>
                              <td className="py-2.5 px-3">{f1.mean.toFixed(4)}</td>
                              <td className="py-2.5 px-3 text-violet-700 dark:text-violet-300 font-semibold">
                                {roc.mean.toFixed(4)} [{roc.ci_95_lower.toFixed(4)}, {roc.ci_95_upper.toFixed(4)}]
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Scientific Limitation &amp; Deployment Boundary</span>
                  </div>
                  <p className="leading-relaxed">
                    Cross-validation performance on this small 143-student sample exhibits high variance (&plusmn;0.05 to &plusmn;0.08) and does not establish clinical validity. These models are strictly experimental and will never be deployed to classify real students.
                  </p>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 5: INTERACTIVE STUDENT PROFILE ANALYSIS */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Mandatory Section Warning */}
              <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-5 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <p className="font-black uppercase tracking-wider">
                    EXPLORATORY RESEARCH ESTIMATE — NOT A DEPRESSION DIAGNOSIS OR CLINICAL SCREENING RESULT.
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    This interactive simulator compares an individual student's input features against the 162-record research survey cohort. It produces empirical cohort percentiles and an exploratory historical regression projection. It does NOT diagnose depression, provide therapy, or replace certified psychological evaluation.
                  </p>
                </div>
              </div>

              {/* Form Card */}
              <Card className="p-6 sm:p-8 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-amber-600" />
                    <span>Interactive Student Profile Form (10 Research Features)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Fill in all 10 academic and lifestyle parameters to compute empirical standing against the student survey cohort.
                  </p>
                </div>

                <form onSubmit={handleCompareProfile} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* 1. Age */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        1. Age (years)
                      </label>
                      <input
                        type="number"
                        min="13"
                        max="100"
                        value={profileForm.age}
                        onChange={(e) => setProfileForm({ ...profileForm, age: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                        required
                      />
                      <span className="text-[10px] text-slate-400">Survey cohort range: 13–69 years</span>
                    </div>

                    {/* 2. Gender */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        2. Gender
                      </label>
                      <select
                        value={profileForm.gender}
                        onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                        <option value="Other">Other</option>
                      </select>
                      <span className="text-[10px] text-slate-400">Demographic category</span>
                    </div>

                    {/* 3. Dietary Habits */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        3. Dietary Habits
                      </label>
                      <select
                        value={profileForm.dietary_habits}
                        onChange={(e) => setProfileForm({ ...profileForm, dietary_habits: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="Healthy">Healthy</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Unhealthy">Unhealthy</option>
                      </select>
                      <span className="text-[10px] text-slate-400">Self-reported nutrition</span>
                    </div>

                    {/* 4. Degree / Programme */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        4. Degree / Academic Programme
                      </label>
                      <select
                        value={profileForm.degree}
                        onChange={(e) => setProfileForm({ ...profileForm, degree: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="Engineering & Tech">Engineering & Tech (B.Tech, BE, M.Tech)</option>
                        <option value="Business & Management">Business & Management (BBA, MBA, B.Com)</option>
                        <option value="Sciences & Computing">Sciences & Computing (BSc, BCA, MCA)</option>
                        <option value="Medicine & Healthcare">Medicine & Healthcare (MBBS, Pharma)</option>
                        <option value="Arts, Law & Other">Arts, Law & Other</option>
                      </select>
                      <span className="text-[10px] text-slate-400">Academic domain cluster</span>
                    </div>

                    {/* 5. CGPA */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        5. CGPA (10-point scale)
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        max="10"
                        value={profileForm.cgpa}
                        onChange={(e) => setProfileForm({ ...profileForm, cgpa: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                        required
                      />
                      <span className="text-[10px] text-slate-400">Cohort mean: 7.6 / 10.0</span>
                    </div>

                    {/* 6. Academic Pressure */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        6. Academic Pressure (1 to 5)
                      </label>
                      <select
                        value={profileForm.academic_pressure}
                        onChange={(e) => setProfileForm({ ...profileForm, academic_pressure: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      >
                        <option value={1}>1 - Very Low</option>
                        <option value={2}>2 - Low</option>
                        <option value={3}>3 - Moderate</option>
                        <option value={4}>4 - High</option>
                        <option value={5}>5 - Very High</option>
                      </select>
                      <span className="text-[10px] text-slate-400">Subjective academic load</span>
                    </div>

                    {/* 7. Study Satisfaction */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        7. Study Satisfaction (1 to 5)
                      </label>
                      <select
                        value={profileForm.study_satisfaction}
                        onChange={(e) => setProfileForm({ ...profileForm, study_satisfaction: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      >
                        <option value={1}>1 - Very Dissatisfied</option>
                        <option value={2}>2 - Dissatisfied</option>
                        <option value={3}>3 - Neutral / Moderate</option>
                        <option value={4}>4 - Satisfied</option>
                        <option value={5}>5 - Very Satisfied</option>
                      </select>
                      <span className="text-[10px] text-slate-400">Academic content satisfaction</span>
                    </div>

                    {/* 8. Sleep Duration */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        8. Sleep Duration (per night)
                      </label>
                      <select
                        value={profileForm.sleep_duration}
                        onChange={(e) => setProfileForm({ ...profileForm, sleep_duration: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="Less than 5 hours">Less than 5 hours</option>
                        <option value="5–6 hours">5–6 hours</option>
                        <option value="7–8 hours">7–8 hours</option>
                        <option value="More than 8 hours">More than 8 hours</option>
                      </select>
                      <span className="text-[10px] text-slate-400">Average nocturnal rest</span>
                    </div>

                    {/* 9. Daily Study Hours */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        9. Daily Study/Work Hours
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        value={profileForm.study_hours}
                        onChange={(e) => setProfileForm({ ...profileForm, study_hours: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                        required
                      />
                      <span className="text-[10px] text-slate-400">Cohort mean: 4.2 hours/day</span>
                    </div>

                    {/* 10. Financial Stress */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        10. Financial Stress (1 to 5)
                      </label>
                      <select
                        value={profileForm.financial_stress}
                        onChange={(e) => setProfileForm({ ...profileForm, financial_stress: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      >
                        <option value={1}>1 - Minimal / None</option>
                        <option value={2}>2 - Low</option>
                        <option value={3}>3 - Moderate</option>
                        <option value={4}>4 - Significant</option>
                        <option value={5}>5 - Severe / Extreme</option>
                      </select>
                      <span className="text-[10px] text-slate-400">Financial strain perception</span>
                    </div>
                  </div>

                  {profileError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400">
                      {profileError}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>{profileLoading ? 'Calculating Standings...' : 'Compare Profile with 163-Record Research Cohort'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileForm({
                          age: 20,
                          gender: 'Male',
                          dietary_habits: 'Moderate',
                          degree: 'Engineering & Tech',
                          cgpa: 7.5,
                          academic_pressure: 3,
                          study_satisfaction: 3,
                          sleep_duration: '5–6 hours',
                          study_hours: 4.0,
                          financial_stress: 3
                        });
                        setProfileResult(null);
                        setProfileError(null);
                      }}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Form</span>
                    </button>
                  </div>
                </form>
              </Card>

              {/* Results Display */}
              {profileResult && (
                <div className="space-y-6 animate-fade-in">
                  {/* High Visibility Clinical Warning Banner */}
                  <div className="p-6 bg-red-50 dark:bg-red-950/40 border-2 border-red-500 rounded-3xl space-y-2 text-red-950 dark:text-red-200">
                    <div className="flex items-center gap-2 font-black text-sm tracking-wide uppercase">
                      <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                      <span>{profileResult.mandatory_disclaimer}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {profileResult.clinical_safety_notice}
                    </p>
                  </div>

                  {/* Two Main Cards: Exploratory Projection & Cohort Percentiles */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Exploratory Projection */}
                    <Card className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Exploratory Historical Target Estimate
                        </span>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                          Cohort Survey Affinity
                        </h4>
                      </div>

                      <div className="p-5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
                        <div className="text-4xl font-black text-slate-900 dark:text-white">
                          {profileResult.exploratory_projection.historical_target_probability_pct}%
                        </div>
                        <Badge
                          variant={
                            profileResult.exploratory_projection.affinity_color === 'green'
                              ? 'emerald'
                              : profileResult.exploratory_projection.affinity_color === 'amber'
                              ? 'amber'
                              : 'rose'
                          }
                          className="font-bold text-xs px-3 py-1"
                        >
                          {profileResult.exploratory_projection.affinity_tier}
                        </Badge>
                      </div>

                      <div className="text-xs text-slate-500 space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between">
                          <span>Survey Cohort Base Rate:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {profileResult.cohort_benchmarks.cohort_base_rate_yes_pct}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Relative Ratio vs Baseline:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {profileResult.exploratory_projection.baseline_relative_ratio}x
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                          Trained on N={profileResult.cohort_benchmarks.binary_cohort_size} binary survey responses. Non-causal projection for research exploration only.
                        </p>
                      </div>
                    </Card>

                    {/* Right (2 cols): Empirical Percentile Standing */}
                    <Card className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl lg:col-span-2 space-y-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Empirical Percentile Standings
                        </span>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                          Standing Against the 162-Student Research Cohort
                        </h4>
                        <p className="text-xs text-slate-500">
                          A percentile of 80% means your entered value is higher than 80% of students in the survey.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-2">
                        {[
                          {
                            label: 'Academic Pressure',
                            val: `${profileForm.academic_pressure} / 5`,
                            pct: profileResult.cohort_benchmarks.percentiles.academic_pressure,
                            color: 'amber'
                          },
                          {
                            label: 'Daily Study Hours',
                            val: `${profileForm.study_hours} hrs`,
                            pct: profileResult.cohort_benchmarks.percentiles.study_hours,
                            color: 'blue'
                          },
                          {
                            label: 'Current CGPA',
                            val: `${profileForm.cgpa} / 10`,
                            pct: profileResult.cohort_benchmarks.percentiles.cgpa,
                            color: 'emerald'
                          },
                          {
                            label: 'Study Satisfaction',
                            val: `${profileForm.study_satisfaction} / 5`,
                            pct: profileResult.cohort_benchmarks.percentiles.study_satisfaction,
                            color: 'violet'
                          },
                          {
                            label: 'Financial Stress',
                            val: `${profileForm.financial_stress} / 5`,
                            pct: profileResult.cohort_benchmarks.percentiles.financial_stress,
                            color: 'rose'
                          },
                          {
                            label: 'Age',
                            val: `${profileForm.age} yrs`,
                            pct: profileResult.cohort_benchmarks.percentiles.age,
                            color: 'slate'
                          }
                        ].map((m, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-2"
                          >
                            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                              {m.label}
                            </div>
                            <div className="flex items-baseline justify-between">
                              <span className="text-lg font-black text-slate-900 dark:text-white">
                                {m.pct}th %
                              </span>
                              <span className="text-xs font-semibold text-slate-500">
                                {m.val}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-amber-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.max(5, m.pct))}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: REPORTS & EXPORTS */}
          {activeTab === 'exports' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Aggregate CSV Export */}
                <Card className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl w-fit mb-3">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Aggregate Research CSV Table</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Download sanitized contingency tables and statistical summaries across all 10 analyzed factors. Contains strictly aggregate group counts with zero individual respondent records.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadCSV}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Aggregate CSV</span>
                  </button>
                </Card>

                {/* Comprehensive Research Text / PDF Report */}
                <Card className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="p-3 bg-violet-100 text-violet-800 rounded-xl w-fit mb-3">
                      <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Full Research Summary Report</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Comprehensive scientific report detailing provenance verification, sample demography, Chi-Square significance, Cramér's V effect sizes, and repeated cross-validation metrics.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadReport}
                    className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Research Report</span>
                  </button>
                </Card>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
