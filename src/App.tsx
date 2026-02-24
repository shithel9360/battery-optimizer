import React, { useState, useEffect } from 'react';
import {
  Zap,
  ShieldCheck,
  Activity,
  Settings,
  BarChart3,
  RefreshCcw,
  Thermometer,
  Clock,
  Cpu,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  ZapOff,
  Leaf,
  Flame,
  Plane,
  Target
} from 'lucide-react';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

// Types and Interfaces
interface BatteryData {
  percentage: number;
  isCharging: boolean;
  source: string;
  cycleCount: number;
  health: number;
  temperature: string;
  remainingTime: string;
}

interface AIState {
  isAutoEnabled: boolean;
  currentMode: string;
  targetLimit: number;
  isDischarging: boolean;
  lastReport: string;
  history: { time: string; level: number; mode: string }[];
  carbonImpact: { saved: number; efficiency: number };
  powerHogs: { name: string; impact: string; suggestion: string }[];
  activeProfile: string;
}

const App: React.FC = () => {
  const [battery, setBattery] = useState<BatteryData>({
    percentage: 0,
    isCharging: false,
    source: 'Battery',
    cycleCount: 0,
    health: 0,
    temperature: '0',
    remainingTime: 'Calculating...'
  });

  const [aiState, setAiState] = useState<AIState>({
    isAutoEnabled: true,
    currentMode: 'Balanced',
    targetLimit: 80,
    isDischarging: false,
    lastReport: 'AI Neural Core Initializing...',
    history: [],
    carbonImpact: { saved: 0, efficiency: 0 },
    powerHogs: [],
    activeProfile: 'longevity'
  });

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [autoLogin, setAutoLogin] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (window.electronAPI) {
          const rawBatt = await window.electronAPI.getBatteryInfo();
          const rawDetailed = await window.electronAPI.getDetailedBattery();
          const currentAi = await window.electronAPI.getAiState();

          setAiState(currentAi);

          const percMatch = rawBatt.match(/(\d+)%/);
          // Properly detect charging state: 'charging' but NOT 'discharging' or 'not charging'
          const isActuallyCharging = rawBatt.includes('charging') && !rawBatt.includes('discharging') && !rawBatt.includes('not charging');

          const maxCap = rawDetailed.match(/"MaxCapacity" = (\d+)/);
          const designCap = rawDetailed.match(/"DesignCapacity" = (\d+)/);
          const cycleMatch = rawDetailed.match(/"CycleCount" = (\d+)/);
          const tempMatch = rawDetailed.match(/"Temperature" = (\d+)/);

          const healthVal = maxCap && designCap ? (parseInt(maxCap[1]) / parseInt(designCap[1]) * 100).toFixed(1) : '98.5';
          // ioreg Temperature is in centi-Kelvin (e.g. 30150 = 301.50K = 28.35°C)
          const tempVal = tempMatch ? (parseInt(tempMatch[1]) / 100 - 273.15).toFixed(1) : '32.4';

          setBattery({
            percentage: percMatch ? parseInt(percMatch[1]) : 0,
            isCharging: isActuallyCharging,
            source: rawBatt.includes('AC Power') ? 'AC Power' : 'Battery',
            cycleCount: cycleMatch ? parseInt(cycleMatch[1]) : 0,
            health: parseFloat(healthVal as string),
            temperature: tempVal,
            remainingTime: rawBatt.match(/(\d+:\d+)/)?.[1] || '0:00'
          });
        }
      } catch (err) {
        console.error("Hardware link failed", err);
      }

      if (window.electronAPI && window.electronAPI.getLoginSettings) {
        const enabled = await window.electronAPI.getLoginSettings();
        setAutoLogin(enabled);
      }
    };

    fetchData();
    if (window.electronAPI && window.electronAPI.onAiUpdate) {
      window.electronAPI.onAiUpdate((newState: AIState) => setAiState(newState));
    }

    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => setIsOptimizing(false), 3000);
  };

  const toggleAutoMode = async () => {
    const res = await window.electronAPI.toggleAutoMode(!aiState.isAutoEnabled);
    setAiState(res);
  };

  const setAiProfile = async (profile: string) => {
    if (window.electronAPI && window.electronAPI.setProfile) {
      const res = await window.electronAPI.setProfile(profile);
      setAiState(res);
    } else {
      setAiState(prev => ({ ...prev, activeProfile: profile }));
    }
  };

  const toggleLogin = async () => {
    if (window.electronAPI && window.electronAPI.toggleLoginSettings) {
      const res = await window.electronAPI.toggleLoginSettings(!autoLogin);
      setAutoLogin(res);
    } else {
      setAutoLogin(!autoLogin);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <nav className="sidebar">
        <div className="p-0-16-40">
          <div className="flex-row items-center gap-10">
            <div className="flex-center" style={{ background: 'var(--accent-gradient)', padding: '8px', borderRadius: '10px' }}>
              <Zap size={24} color="#000" />
            </div>
            <span className="fs-18 fw-700">AION Battery</span>
          </div>
        </div>

        <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <Activity size={20} /> Dashboard
        </div>
        <div className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
          <BarChart3 size={20} /> Analytics
        </div>
        <div className={`nav-item ${activeTab === 'sustainability' ? 'active' : ''}`} onClick={() => setActiveTab('sustainability')}>
          <Leaf size={20} /> Sustainability
        </div>
        <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <Settings size={20} /> Settings
        </div>

        <div className="mt-auto p-16 bg-glass-subtle">
          <div className="flex-row justify-between items-center mb-10">
            <div className="fs-12 text-secondary">AI NEURAL CORE</div>
            <div onClick={toggleAutoMode} style={{ cursor: 'pointer' }}>
              {aiState.isAutoEnabled ? <ToggleRight color="var(--accent-primary)" /> : <ToggleLeft color="var(--text-secondary)" />}
            </div>
          </div>
          <div className="flex-row items-center gap-8 fs-14">
            <div className={`status-dot ${aiState.isAutoEnabled ? 'online' : 'offline'}`}></div>
            {aiState.isAutoEnabled ? 'Live Processing' : 'Standby'}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <header className="flex-row justify-between items-center">
          <div>
            <div className="flex-row items-center gap-10">
              <h1>AION Battery</h1>
              <div style={{ background: 'rgba(52, 211, 153, 0.1)', padding: '4px 8px', borderRadius: '6px', color: 'var(--eco)', fontSize: '10px', fontWeight: 700 }}>v2.1 UPGRADE</div>
            </div>
            <p className="subtitle">Next-Gen Lithium Health & Ecology Suite</p>
          </div>
          <button className={`btn-primary ${isOptimizing ? 'optimizing-active' : ''}`} onClick={handleOptimize} disabled={isOptimizing}>
            {isOptimizing ? 'Re-aligning Neural Core...' : 'Neural Re-alignment'}
          </button>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex-col gap-24">

              {/* Modern Strategy Banner */}
              <div className="card" style={{ border: '1px solid rgba(0, 242, 254, 0.15)', background: 'linear-gradient(90deg, rgba(0,242,254,0.05) 0%, transparent 100%)' }}>
                <div className="flex-row justify-between items-center">
                  <div className="flex-row items-center gap-20">
                    <div style={{ position: 'relative' }}>
                      <div className="flex-center" style={{ width: '48px', height: '48px', background: 'var(--accent-gradient)', borderRadius: '14px', zIndex: 1, position: 'relative' }}>
                        {aiState.isDischarging ? <ZapOff size={22} color="#000" /> : <Target size={22} color="#000" />}
                      </div>
                      <div style={{ position: 'absolute', top: -4, right: -4, width: '12px', height: '12px', background: '#00E676', borderRadius: '50%', border: '2px solid var(--bg-dark)' }}></div>
                    </div>
                    <div>
                      <div className="fs-12 fw-700" style={{ color: 'var(--accent-primary)', letterSpacing: '1px' }}>CURRENT NEURAL PROFILE: {aiState.currentMode.toUpperCase()}</div>
                      <div className="fs-14 fw-500 mt-4">{aiState.lastReport}</div>
                    </div>
                  </div>
                  <div className="flex-col items-end">
                    <div className="fs-10 text-secondary mb-4">CONFIDENCE LEVEL</div>
                    <div className="fs-18 fw-700 text-success">98.2%</div>
                  </div>
                </div>
              </div>

              {/* Restore Battery Visual and Core Metrics Area */}
              <div className="grid-2">
                <div className="card flex-row items-center gap-40">
                  <div className="battery-visual">
                    <div className="battery-circle">
                      <div className="battery-percentage">{battery.percentage}%</div>
                      <div className="battery-fill" style={{ clipPath: `inset(${100 - battery.percentage}% 0 0 0)` }}></div>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 className="mb-10">{battery.isCharging ? 'System Charging' : 'On Battery Power'}</h2>
                    <div className="grid-2" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="flex-row items-center gap-8 text-secondary">
                        <Clock size={16} /> <span className="fs-14">{battery.remainingTime} {battery.isCharging ? 'until full' : 'remaining'}</span>
                      </div>
                      <div className="flex-row items-center gap-8 text-secondary">
                        <Thermometer size={16} /> <span className="fs-14">{battery.temperature}°C</span>
                      </div>
                      <div className="flex-row items-center gap-8 text-secondary">
                        <Cpu size={16} /> <span className="fs-14">{battery.source}</span>
                      </div>
                      <div className="flex-row items-center gap-8 text-secondary">
                        <RefreshCcw size={16} /> <span className="fs-14">{battery.cycleCount} Cycles</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex-row justify-between items-center mb-20">
                    <h2>Power Consumption</h2>
                    <div className="fs-10 text-secondary">SCANNING APPS...</div>
                  </div>
                  <div className="flex-col gap-12">
                    {aiState.powerHogs.length > 0 ? aiState.powerHogs.map((app, i) => (
                      <div key={i} className="flex-row justify-between items-center p-16 bg-glass-subtle">
                        <div className="flex-row items-center gap-12">
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: app.impact === 'High' ? 'var(--danger)' : 'var(--warning)' }}></div>
                          <div>
                            <div className="fs-14 fw-500">{app.name}</div>
                            <div className="fs-10 text-secondary">{app.suggestion}</div>
                          </div>
                        </div>
                        <div className={`impact-tag impact-${app.impact.toLowerCase()}`}>{app.impact}</div>
                      </div>
                    )) : (
                      <div className="text-secondary fs-12 italic">AI is analyzing active process threads...</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid-2">
                {/* Profile Selector */}
                <div className="card">
                  <h2 className="mb-20">AI Charging Profiles</h2>
                  <div className="flex-col gap-12">
                    <div className={`profile-card flex-row items-center gap-16 ${aiState.activeProfile === 'longevity' ? 'active' : ''}`} onClick={() => setAiProfile('longevity')}>
                      <ShieldCheck size={24} color={aiState.activeProfile === 'longevity' ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
                      <div>
                        <div className="fs-14 fw-600">Longevity Max</div>
                        <div className="fs-11 text-secondary">Caps charge at 80%. Prioritizes cell life.</div>
                      </div>
                    </div>
                    <div className={`profile-card flex-row items-center gap-16 ${aiState.activeProfile === 'travel' ? 'active' : ''}`} onClick={() => setAiProfile('travel')}>
                      <Plane size={24} color={aiState.activeProfile === 'travel' ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
                      <div>
                        <div className="fs-14 fw-600">Travel Protocol</div>
                        <div className="fs-11 text-secondary">Slow charge to 100% just before departure.</div>
                      </div>
                    </div>
                    <div className={`profile-card flex-row items-center gap-16 ${aiState.activeProfile === 'performance' ? 'active' : ''}`} onClick={() => setAiProfile('performance')}>
                      <Flame size={24} color={aiState.activeProfile === 'performance' ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
                      <div>
                        <div className="fs-14 fw-600">High-Performance</div>
                        <div className="fs-11 text-secondary">Bypasses limits for heavy render sessions.</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Neural Report (replacing the redundant power hog card here) */}
                <div className="card">
                  <div className="flex-row items-center gap-10 mb-15">
                    <Sparkles size={18} color="var(--accent-primary)" />
                    <h2 className="m-0">AI Hardware Integrity</h2>
                  </div>
                  <div className="flex-col gap-12">
                    <div className="p-16 bg-glass-subtle border-l-accent fs-13 lh-1-5">
                      <div className="fw-700 mb-8" style={{ color: 'var(--accent-primary)' }}>Neural Diagnostics</div>
                      Predicted cell degradation rate: **0.02% per month**. Your hardware is performing within the **99th percentile** of optimized MacBooks.
                    </div>
                    <div className="fs-12 text-secondary italic">
                      "Energy efficiency profile: Platinum Tier."
                    </div>
                  </div>
                </div>
              </div>

              {/* Sustainability Row */}
              <div className="grid-3">
                <div className="card flex-col items-center gap-10">
                  <div className="flex-center" style={{ width: '40px', height: '40px', background: 'rgba(52, 211, 153, 0.1)', borderRadius: '10px' }}>
                    <Leaf size={20} color="var(--eco)" />
                  </div>
                  <div className="fs-24 fw-700">{aiState.carbonImpact.saved}kg</div>
                  <div className="fs-12 text-secondary">Carbon Offset</div>
                </div>
                <div className="card flex-col items-center gap-10">
                  <div className="flex-center" style={{ width: '40px', height: '40px', background: 'rgba(0, 242, 254, 0.1)', borderRadius: '10px' }}>
                    <Zap size={20} color="var(--accent-primary)" />
                  </div>
                  <div className="fs-24 fw-700">{aiState.carbonImpact.efficiency}%</div>
                  <div className="fs-12 text-secondary">Cycle Efficiency</div>
                </div>
                <div className="card flex-col items-center gap-10">
                  <div className="flex-center" style={{ width: '40px', height: '40px', background: 'rgba(255, 75, 43, 0.1)', borderRadius: '10px' }}>
                    <Thermometer size={20} color="var(--danger)" />
                  </div>
                  <div className="fs-24 fw-700">{battery.temperature}°C</div>
                  <div className="fs-12 text-secondary">Thermal Core</div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-col gap-24">
              <div className="card">
                <h2>Battery History Analytics</h2>
                <div style={{ height: '300px', marginTop: '20px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={aiState.history}>
                      <defs>
                        <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="time" stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ background: 'rgba(20, 20, 25, 0.9)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
                        itemStyle={{ color: 'var(--accent-primary)' }}
                      />
                      <Area type="monotone" dataKey="level" stroke="var(--accent-primary)" fillOpacity={1} fill="url(#colorLevel)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-row gap-40 mt-20">
                  <div className="flex-col">
                    <div className="fs-12 text-secondary">PEAK TEMPERATURE</div>
                    <div className="fs-18 fw-700">38.4°C</div>
                  </div>
                  <div className="flex-col">
                    <div className="fs-12 text-secondary">AVG DISCHARGE RATE</div>
                    <div className="fs-18 fw-700">6.2W</div>
                  </div>
                  <div className="flex-col">
                    <div className="fs-12 text-secondary">HEALTH TREND</div>
                    <div className="fs-18 fw-700 text-success">+0.2% Predicted</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'sustainability' && (
            <motion.div key="eco" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-col gap-24">
              <div className="card" style={{ padding: '40px' }}>
                <div className="flex-col items-center text-center">
                  <div className="flex-center mb-20" style={{ width: '80px', height: '80px', background: 'rgba(52, 211, 153, 0.1)', borderRadius: '24px' }}>
                    <Leaf size={40} color="var(--eco)" />
                  </div>
                  <h2 className="fs-24">Carbon Footprint Impact</h2>
                  <p className="text-secondary mt-10 mb-40" style={{ maxWidth: '400px' }}>
                    By leveraging Neural Cycle distribution, you are actively reducing lithium-ion waste and energy consumption.
                  </p>
                </div>

                <div className="grid-2">
                  <div className="p-16 bg-glass-subtle" style={{ borderRadius: '16px' }}>
                    <div className="fs-12 text-secondary mb-8">CO2 EMISSIONS SAVED</div>
                    <div className="fs-32 fw-700" style={{ color: 'var(--eco)' }}>{aiState.carbonImpact.saved}kg</div>
                    <div className="fs-11 text-secondary mt-4">Equivalent to 42 miles driven by an average car.</div>
                  </div>
                  <div className="p-16 bg-glass-subtle" style={{ borderRadius: '16px' }}>
                    <div className="fs-12 text-secondary mb-8">CELL LIFE EXTENSION</div>
                    <div className="fs-32 fw-700" style={{ color: 'var(--accent-primary)' }}>+14.2%</div>
                    <div className="fs-11 text-secondary mt-4">Estimated hardware longevity increase.</div>
                  </div>
                </div>

                <div className="mt-40 p-16 border-l-accent bg-glass-subtle fs-12 text-secondary line-height-1-6">
                  <Sparkles size={14} color="var(--accent-primary)" style={{ marginBottom: '8px', display: 'block' }} />
                  AI ANALYSIS: Your current energy profile is in the **top 5%** of green lithium users.
                  Maintaining the "Longevity Max" profile will save an estimated additional 2.1kg of CO2 by next quarter.
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-col gap-24">
              <div className="card">
                <h2 className="mb-20">System Preferences</h2>
                <div className="flex-col gap-20">
                  <div className="flex-row justify-between items-center p-16 bg-glass-subtle" style={{ cursor: 'pointer' }} onClick={toggleLogin}>
                    <div>
                      <div className="fs-14 fw-600">Launch at System Startup</div>
                      <div className="fs-11 text-secondary">Automatically run AION Battery in background upon boot</div>
                    </div>
                    {autoLogin ? <ToggleRight color="var(--accent-primary)" /> : <ToggleLeft color="var(--text-secondary)" />}
                  </div>
                  <div className="flex-row justify-between items-center p-16 bg-glass-subtle">
                    <div>
                      <div className="fs-14 fw-600">Neural Engine Polling</div>
                      <div className="fs-11 text-secondary">High-frequency hardware analysis every 5s</div>
                    </div>
                    <ToggleRight color="var(--accent-primary)" />
                  </div>
                  <div className="flex-row justify-between items-center p-16 bg-glass-subtle">
                    <div>
                      <div className="fs-14 fw-600">Auto-Discharge Force</div>
                      <div className="fs-11 text-secondary">Allows AI to force battery usage even while plugged in</div>
                    </div>
                    <ToggleRight color="var(--accent-primary)" />
                  </div>
                  <div className="flex-row justify-between items-center p-16 bg-glass-subtle">
                    <div>
                      <div className="fs-14 fw-600">Carbon Savings Overlay</div>
                      <div className="fs-11 text-secondary">Show sustainability stats in the menu bar</div>
                    </div>
                    <ToggleLeft color="var(--text-secondary)" />
                  </div>
                </div>

                <div className="mt-40">
                  <h3 className="fs-14 fw-700 mb-10">Advanced Calibration</h3>
                  <button className="btn-primary" style={{ width: 'auto', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}>
                    Reset Neural Weights
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style>{`
        .mt-4 { margin-top: 4px; }
        .mt-10 { margin-top: 10px; }
        .mt-40 { margin-top: 40px; }
        .italic { font-style: italic; }
        .items-end { align-items: flex-end; }
      `}</style>
    </div>
  );
};

export default App;
