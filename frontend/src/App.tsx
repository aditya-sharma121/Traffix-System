import React, { useState } from 'react';
import { 
  LayoutDashboard, Video, BarChart2, Zap, Compass, Siren, TrendingUp, Network, Award, BookOpen, Menu, X, Cpu
} from 'lucide-react';
import { OverviewView } from './pages/OverviewView';
import { DetectionView } from './pages/DetectionView';
import { DensityView } from './pages/DensityView';
import { SignalOptimizerView } from './pages/SignalOptimizerView';
import { VirtualIntersectionView } from './pages/VirtualIntersectionView';
import { EmergencyView } from './pages/EmergencyView';
import { PredictionView } from './pages/PredictionView';
import { MultiJunctionView } from './pages/MultiJunctionView';
import { PerformanceView } from './pages/PerformanceView';
import { DocumentationView } from './pages/DocumentationView';

type Tab = 
  | 'overview' 
  | 'detection' 
  | 'density' 
  | 'signals' 
  | 'intersection' 
  | 'emergency' 
  | 'prediction' 
  | 'corridor' 
  | 'analytics' 
  | 'docs';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'detection', label: 'AI Vehicle Detection', icon: Video, badge: 'CV' },
    { id: 'density', label: 'Traffic Density', icon: BarChart2 },
    { id: 'signals', label: 'Signal Optimizer', icon: Zap, badge: 'Core' },
    { id: 'intersection', label: 'Virtual 4-Way Junction', icon: Compass, badge: 'Sim' },
    { id: 'emergency', label: 'Emergency Priority', icon: Siren, highlight: true },
    { id: 'prediction', label: 'Congestion Prediction', icon: TrendingUp, badge: 'ML' },
    { id: 'corridor', label: 'Multi-Junction Grid', icon: Network },
    { id: 'analytics', label: 'Performance Analytics', icon: Award },
    { id: 'docs', label: 'Docs & Architecture', icon: BookOpen },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewView onNavigate={(tab) => setActiveTab(tab as Tab)} />;
      case 'detection':
        return <DetectionView onApplyTimings={() => setActiveTab('intersection')} />;
      case 'density':
        return <DensityView />;
      case 'signals':
        return <SignalOptimizerView />;
      case 'intersection':
        return <VirtualIntersectionView />;
      case 'emergency':
        return <EmergencyView />;
      case 'prediction':
        return <PredictionView />;
      case 'corridor':
        return <MultiJunctionView />;
      case 'analytics':
        return <PerformanceView />;
      case 'docs':
        return <DocumentationView />;
      default:
        return <OverviewView onNavigate={(tab) => setActiveTab(tab as Tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] text-slate-800 flex flex-col md:flex-row font-sans selection:bg-violet-200 selection:text-violet-900">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-violet-100 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-purple-600 flex items-center justify-center font-black text-white text-sm shadow-md shadow-violet-500/20">
            TQ
          </div>
          <span className="font-extrabold text-violet-950 tracking-wider">TRAFFIQ</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-500 hover:text-violet-900"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-white border-r border-violet-100 shadow-sm flex flex-col shrink-0 z-30`}
      >
        {/* Brand */}
        <div className="p-5 border-b border-violet-100 hidden md:flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/25 font-black text-white text-base">
              TQ
            </div>
            <div>
              <div className="font-extrabold text-violet-950 tracking-wider text-base">TRAFFIQ</div>
              <div className="text-[10px] text-violet-600 font-medium tracking-tight">AI Traffic Manager</div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as Tab);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-violet-100/80 text-violet-950 border border-violet-200 shadow-sm'
                    : 'text-slate-600 hover:text-violet-950 hover:bg-violet-50/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-violet-700' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-violet-200/80 text-violet-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {item.highlight && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-violet-100 bg-violet-50/40 text-[11px] text-slate-500 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">System Mode</span>
            <span className="text-violet-700 font-mono font-bold">Autonomous</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Environment</span>
            <span className="text-violet-600 font-mono">Software-Only</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-violet-100 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-violet-950 uppercase tracking-wider">
              {navItems.find((n) => n.id === activeTab)?.label}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="hidden sm:flex items-center gap-1.5 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Backend Connected: :8000</span>
            </div>
            <div className="hidden lg:flex items-center gap-1.5 text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-lg font-sans font-medium">
              <Cpu className="w-3.5 h-3.5 text-violet-600" />
              <span>Webster Optimization Engine</span>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <div className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
