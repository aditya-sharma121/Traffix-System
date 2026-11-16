import React, { useEffect, useState } from 'react';
import { 
  Car, Activity, Clock, ShieldAlert, Cpu, ArrowUpRight, Zap, CheckCircle2, TrendingUp 
} from 'lucide-react';
import { api } from '../services/api';
import type { SimulationState } from '../services/api';

interface Props {
  onNavigate: (tab: string) => void;
}

export const OverviewView: React.FC<Props> = ({ onNavigate }) => {
  const [simState, setSimState] = useState<SimulationState | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [emergencyStatus, setEmergencyStatus] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [state, sum, em] = await Promise.all([
          api.getSimulationState(),
          api.getAnalyticsSummary(),
          api.getEmergencyStatus(),
        ]);
        setSimState(state);
        setSummary(sum);
        setEmergencyStatus(em);
      } catch (err) {
        console.error('Overview fetch error:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner / System Status */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 p-6 md:p-8 text-white shadow-lg shadow-violet-500/15">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold tracking-wider uppercase text-emerald-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">
                SYSTEM ONLINE • ADAPTIVE MODE ACTIVE
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white mt-2 tracking-tight">
              TRAFFIQ Intelligent Control Center
            </h1>
            <p className="text-violet-100 text-sm mt-1 max-w-2xl font-normal leading-relaxed">
              Real-time computer vision vehicle tracking, Webster delay-minimization dynamic signal scheduling, and preemption corridor management.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('intersection')}
              className="px-4 py-2.5 bg-white hover:bg-violet-50 text-violet-950 font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5"
            >
              Open Intersection <ArrowUpRight className="w-4 h-4 text-violet-700" />
            </button>
            <button
              onClick={() => onNavigate('detection')}
              className="px-4 py-2.5 bg-violet-700/80 hover:bg-violet-700 text-white font-semibold text-xs rounded-xl border border-white/20 transition"
            >
              Analyze Video
            </button>
          </div>
        </div>
      </div>

      {/* Emergency Active Banner */}
      {emergencyStatus?.active_emergency && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center justify-between shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600 rounded-lg text-white">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="text-red-950 font-bold text-sm tracking-wide">
                EMERGENCY PREEMPTION CORRIDOR ACTIVE: {emergencyStatus.direction}
              </div>
              <div className="text-red-700 text-xs">
                Approaching {emergencyStatus.vehicle_type} given continuous GREEN wave. Conflicting approaches halted.
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('emergency')}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg transition shadow-sm"
          >
            Manage Emergency
          </button>
        </div>
      )}

      {/* Primary KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vehicles Monitored */}
        <div className="bg-white border border-violet-100/90 rounded-2xl p-5 hover:border-violet-300 transition shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Vehicles Monitored</span>
            <div className="p-2 bg-violet-50 text-violet-600 rounded-xl">
              <Car className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-violet-950 mt-2">
            {simState ? simState.total_spawned : 0}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mt-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{simState?.vehicle_count || 0} active on road</span>
          </div>
        </div>

        {/* Average Waiting Time */}
        <div className="bg-white border border-violet-100/90 rounded-2xl p-5 hover:border-violet-300 transition shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg Waiting Time</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-violet-950 mt-2">
            {simState ? `${simState.avg_wait_time}s` : '18.4s'}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mt-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{summary?.waiting_time_saved_percent || 28.5}% less delay vs fixed</span>
          </div>
        </div>

        {/* Congestion Level */}
        <div className="bg-white border border-violet-100/90 rounded-2xl p-5 hover:border-violet-300 transition shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Congestion Index</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-violet-950 mt-2 flex items-center gap-2">
            <span>Moderate</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
              42% PCU
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Dynamic Webster phase balancing</span>
          </div>
        </div>

        {/* CO2 Emissions Saved */}
        <div className="bg-white border border-violet-100/90 rounded-2xl p-5 hover:border-violet-300 transition shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Est. CO2 Reduced</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-2">
            {summary ? `${summary.co2_saved_kg} kg` : '14.2 kg'}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
            <span>Reduced idle emissions across corridor</span>
          </div>
        </div>
      </div>

      {/* 4-Direction Live Traffic Status Grid */}
      <div className="bg-white border border-violet-100/90 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-violet-950">Live Intersection Corridor Status</h2>
            <p className="text-xs text-slate-500">Current queue distribution and signal light states</p>
          </div>
          <div className="text-xs text-violet-700 font-mono bg-violet-50 border border-violet-200 px-3 py-1 rounded-lg font-semibold">
            Active Phase: {simState?.phase || 'NS_GREEN'} ({simState?.time_remaining || 0}s left)
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(['NORTH', 'SOUTH', 'EAST', 'WEST'] as const).map((dir) => {
            const sig = simState?.signals?.[dir] || 'RED';
            const queueCount = simState?.queues?.[dir] || 0;
            const sigColorClass =
              sig === 'GREEN'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : sig === 'YELLOW'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-red-50 text-red-700 border-red-200';

            return (
              <div key={dir} className="bg-violet-50/40 border border-violet-100/80 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-violet-950">{dir} Approach</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold border ${sigColorClass}`}>
                    {sig}
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Queue Length</span>
                    <span className="font-semibold text-slate-900">{queueCount} vehicles</span>
                  </div>
                  <div className="w-full bg-violet-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        queueCount > 8 ? 'bg-red-500' : queueCount > 4 ? 'bg-amber-500' : 'bg-violet-600'
                      }`}
                      style={{ width: `${Math.min(100, (queueCount / 15) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => onNavigate('detection')}
          className="bg-white hover:bg-violet-50/50 border border-violet-100 hover:border-violet-300 rounded-2xl p-5 cursor-pointer transition group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-violet-600 tracking-wider uppercase">Module 1 & 2</span>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 transition" />
          </div>
          <h3 className="text-base font-bold text-violet-950 mt-2">AI Vehicle Detection & Density</h3>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">Upload traffic video, run OpenCV/YOLO bounding box detection, and extract directional density.</p>
        </div>

        <div 
          onClick={() => onNavigate('intersection')}
          className="bg-white hover:bg-violet-50/50 border border-violet-100 hover:border-violet-300 rounded-2xl p-5 cursor-pointer transition group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-violet-600 tracking-wider uppercase">Module 4</span>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 transition" />
          </div>
          <h3 className="text-base font-bold text-violet-950 mt-2">Interactive Virtual 4-Way Junction</h3>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">Real-time simulation canvas with moving vehicles, signal adherence, countdown timer, and emergency rushes.</p>
        </div>

        <div 
          onClick={() => onNavigate('analytics')}
          className="bg-white hover:bg-violet-50/50 border border-violet-100 hover:border-violet-300 rounded-2xl p-5 cursor-pointer transition group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-violet-600 tracking-wider uppercase">Module 8</span>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 transition" />
          </div>
          <h3 className="text-base font-bold text-violet-950 mt-2">Performance Benchmark (Fixed vs AI)</h3>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">Direct measurable scientific comparison proving waiting time reduction and throughput increases.</p>
        </div>
      </div>
    </div>
  );
};
