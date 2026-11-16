import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, RotateCcw, ShieldAlert, Car, Map, Compass, BrainCircuit, CheckCircle2, AlertTriangle, ArrowRightLeft
} from 'lucide-react';
import { api } from '../services/api';
import type { SimulationState } from '../services/api';
import { VirtualIntersectionCanvas } from '../components/VirtualIntersectionCanvas';
import { RealGoogleMapView } from '../components/RealGoogleMapView';

export const VirtualIntersectionView: React.FC = () => {
  const [state, setState] = useState<SimulationState | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [mode, setMode] = useState<'adaptive' | 'fixed'>('adaptive');
  const [selectedDirection, setSelectedDirection] = useState('NORTH');
  const [selectedVehicleType, setSelectedVehicleType] = useState('car');
  const [selectedTurn, setSelectedTurn] = useState('STRAIGHT');
  const [viewMode, setViewMode] = useState<'junction_canvas' | 'real_google_map'>('junction_canvas');

  useEffect(() => {
    let timer: any;
    const fetchState = async () => {
      try {
        const s = await api.getSimulationState();
        setState(s);
        setMode(s.mode as any);
        if (s.total_spawned > 0) {
          setHasStarted(true);
        }
      } catch (err) {
        console.error('Sim poll error:', err);
      }
    };

    fetchState();
    timer = setInterval(fetchState, 300);
    return () => clearInterval(timer);
  }, []);

  const handleTogglePlay = async () => {
    try {
      if (isRunning) {
        await api.pauseSimulation();
        setIsRunning(false);
      } else {
        await api.startSimulation();
        setIsRunning(true);
        setHasStarted(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = async () => {
    try {
      const res = await api.resetSimulation();
      setState(res.state);
      setIsRunning(false);
      setHasStarted(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSwitchMode = async (newMode: 'adaptive' | 'fixed') => {
    try {
      await api.setSimulationMode(newMode);
      setMode(newMode);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSpawn = async (dir?: string) => {
    const direction = dir || selectedDirection;
    try {
      await api.spawnSimulationVehicle(direction, selectedVehicleType, selectedTurn);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEmergencyTrigger = async (dir: string = 'NORTH') => {
    try {
      await api.triggerSimulationEmergency(dir);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & View Switcher Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-violet-950">Module 4: Virtual 4-Way Traffic Intersection</h1>
          <p className="text-slate-500 text-sm">
            Physics-grounded car-following simulation executing dynamic Webster signal decisions.
          </p>
        </div>

        {/* Global Controls & Graphic View Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Switcher: Junction Simulation vs Real Google Map */}
          <div className="bg-white border border-violet-200 rounded-xl p-1 flex items-center shadow-xs">
            <button
              onClick={() => setViewMode('junction_canvas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'junction_canvas'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-violet-950'
              }`}
            >
              <Compass className="w-3.5 h-3.5" /> 4-Way Junction
            </button>
            <button
              onClick={() => setViewMode('real_google_map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'real_google_map'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-violet-950'
              }`}
            >
              <Map className="w-3.5 h-3.5" /> Real Google Map
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="bg-white border border-violet-200 rounded-xl p-1 flex items-center shadow-xs">
            <button
              onClick={() => handleSwitchMode('adaptive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                mode === 'adaptive'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-violet-950'
              }`}
            >
              TRAFFIQ Adaptive
            </button>
            <button
              onClick={() => handleSwitchMode('fixed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                mode === 'fixed'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-violet-950'
              }`}
            >
              Fixed Baseline (30s)
            </button>
          </div>

          <button
            onClick={handleTogglePlay}
            className={`px-4 py-2 font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-sm ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : hasStarted
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                : 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-500/20'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isRunning ? 'Pause' : hasStarted ? 'Resume' : 'Start Simulation'}
          </button>

          <button
            onClick={handleReset}
            className="p-2 bg-white hover:bg-violet-50 text-slate-700 rounded-xl border border-violet-200 transition shadow-xs flex items-center gap-1 text-xs font-semibold"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4 text-violet-700" />
            <span className="hidden sm:inline text-slate-600">Reset</span>
          </button>
        </div>
      </div>

      {/* Main Simulation Viewport & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Graphic Display (Left 8 Cols) */}
        <div className="lg:col-span-8 bg-white border border-violet-100/90 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center">
          {viewMode === 'junction_canvas' ? (
            <VirtualIntersectionCanvas state={state} onSpawn={handleSpawn} />
          ) : (
            <RealGoogleMapView state={state} />
          )}
        </div>

        {/* Control & Live Telemetry Panel (Right 4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Signal Status Telemetry */}
          <div className="bg-white border border-violet-100/90 rounded-2xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Signal Phase</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-violet-50 border border-violet-200 text-violet-700 font-bold">
                {state?.phase || 'NS_GREEN'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-violet-50/50 p-3 rounded-xl border border-violet-100">
                <div className="text-[11px] text-slate-500 font-medium">Countdown</div>
                <div className="text-2xl font-black font-mono text-violet-950 mt-1">
                  {state?.time_remaining || 0}s
                </div>
              </div>
              <div className="bg-violet-50/50 p-3 rounded-xl border border-violet-100">
                <div className="text-[11px] text-slate-500 font-medium">Allocated Green</div>
                <div className="text-2xl font-black font-mono text-emerald-600 mt-1">
                  {state?.allocated_green || 20}s
                </div>
              </div>
            </div>

            {/* Approach Light Grid */}
            <div className="pt-2">
              <div className="text-xs text-slate-600 font-semibold mb-2">Live Signal Heads:</div>
              <div className="grid grid-cols-4 gap-2">
                {(['NORTH', 'SOUTH', 'EAST', 'WEST'] as const).map((dir) => {
                  const s = state?.signals?.[dir] || 'RED';
                  return (
                    <div key={dir} className="bg-violet-50/60 p-2 rounded-lg text-center border border-violet-100">
                      <div className="text-[10px] text-slate-500 font-bold">{dir[0]}</div>
                      <div
                        className={`text-xs font-bold font-mono mt-0.5 ${
                          s === 'GREEN'
                            ? 'text-emerald-600'
                            : s === 'YELLOW'
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}
                      >
                        {s}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Clearance Guard & Transition Safety Indicator */}
            <div className="pt-2 border-t border-violet-100">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-violet-600" /> Clearance Guard:
                </span>
                {state?.intersection_cleared !== false ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Junction Cleared
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold animate-pulse">
                    <AlertTriangle className="w-3 h-3 text-amber-600" /> All-Red Held (Clearing)
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                Transition: GREEN → YELLOW (4s) → ALL RED (3s + Clearance) → NEXT GREEN
              </div>
            </div>
          </div>

          {/* Real AI Decision Reasoning Display */}
          <div className="bg-white border border-violet-100/90 rounded-2xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-violet-950 uppercase tracking-wider flex items-center gap-1.5">
                <BrainCircuit className="w-4 h-4 text-violet-600" /> Adaptive Signal Reasoning
              </span>
              <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-200">
                Webster Split
              </span>
            </div>

            <div className="bg-violet-50/50 p-3 rounded-xl border border-violet-100/80 text-xs text-slate-700 space-y-2">
              <p className="leading-relaxed font-medium">
                {state?.last_decision?.explanation?.primary_reason || 
                 (mode === 'adaptive' 
                  ? 'Dynamic Webster optimizer evaluates real-time queue PCU and starvation aging to compute non-conflicting green split.' 
                  : 'Fixed baseline timing mode: static 30s cycle without traffic density adaptation.')}
              </p>
              {state?.last_decision?.metrics && (
                <div className="grid grid-cols-3 gap-1 pt-1 border-t border-violet-200/50 font-mono text-[11px] text-violet-900">
                  <div>
                    <span className="text-slate-400 text-[9px] block">NS Demand</span>
                    {state.last_decision.metrics.ns_pcu} PCU
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] block">EW Demand</span>
                    {state.last_decision.metrics.ew_pcu} PCU
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] block">Cycle Length</span>
                    {state.last_decision.metrics.cycle_length}s
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Spawn Controller */}
          <div className="bg-white border border-violet-100/90 rounded-2xl p-5 space-y-3 shadow-sm">
            <span className="text-xs font-bold text-violet-950 uppercase tracking-wider flex items-center gap-2">
              <Car className="w-4 h-4 text-violet-600" /> Spawn Vehicle Manually
            </span>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-[11px] text-slate-500 mb-1 block font-medium">Direction</label>
                <select
                  value={selectedDirection}
                  onChange={(e) => setSelectedDirection(e.target.value)}
                  className="w-full bg-violet-50/40 border border-violet-200 rounded-lg p-2 text-slate-800 text-xs"
                >
                  <option value="NORTH">North (N)</option>
                  <option value="SOUTH">South (S)</option>
                  <option value="EAST">East (E)</option>
                  <option value="WEST">West (W)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-500 mb-1 block font-medium">Type</label>
                <select
                  value={selectedVehicleType}
                  onChange={(e) => setSelectedVehicleType(e.target.value)}
                  className="w-full bg-violet-50/40 border border-violet-200 rounded-lg p-2 text-slate-800 text-xs"
                >
                  <option value="car">Car (1.0)</option>
                  <option value="bus">Bus (2.5)</option>
                  <option value="truck">Truck (3.0)</option>
                  <option value="motorcycle">Motorcycle</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-500 mb-1 block font-medium">Turning</label>
                <select
                  value={selectedTurn}
                  onChange={(e) => setSelectedTurn(e.target.value)}
                  className="w-full bg-violet-50/40 border border-violet-200 rounded-lg p-2 text-slate-800 text-xs"
                >
                  <option value="STRAIGHT">Straight</option>
                  <option value="RIGHT">Right Turn</option>
                  <option value="LEFT">Left Turn</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => handleSpawn()}
              className="w-full py-2.5 bg-violet-50 hover:bg-violet-100 text-violet-800 font-semibold text-xs rounded-xl border border-violet-200 transition flex items-center justify-center gap-1.5"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-violet-600" /> Inject Vehicle into Simulation
            </button>
          </div>

          {/* Emergency Dispatch Button */}
          <div className="bg-gradient-to-br from-red-50/60 via-white to-red-50/30 border border-red-200/90 rounded-2xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-red-700 font-bold text-xs uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-red-600" /> Emergency Preemption Test
            </div>
            <p className="text-xs text-slate-500">
              Immediately spawn an ambulance and observe dynamic green wave preemption override.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleEmergencyTrigger('NORTH')}
                className="py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-1.5"
              >
                Ambulance (North)
              </button>
              <button
                onClick={() => handleEmergencyTrigger('WEST')}
                className="py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-1.5"
              >
                Ambulance (West)
              </button>
            </div>
          </div>

          {/* Live Cumulative Counters */}
          <div className="bg-white border border-violet-100/90 rounded-2xl p-4 grid grid-cols-2 gap-2 text-xs shadow-sm">
            <div>
              <span className="text-slate-500">Total Spawned:</span>
              <div className="font-mono font-bold text-violet-950 text-base mt-0.5">{state?.total_spawned || 0}</div>
            </div>
            <div>
              <span className="text-slate-500">Total Cleared:</span>
              <div className="font-mono font-bold text-emerald-600 text-base mt-0.5">{state?.total_cleared || 0}</div>
            </div>
            <div className="pt-2 border-t border-violet-100">
              <span className="text-slate-500">Avg Wait Time:</span>
              <div className="font-mono font-bold text-violet-800 text-base mt-0.5">{state?.avg_wait_time || 0}s</div>
            </div>
            <div className="pt-2 border-t border-violet-100">
              <span className="text-slate-500">Throughput:</span>
              <div className="font-mono font-bold text-slate-900 text-base mt-0.5">{state?.throughput_vpm || 0} vpm</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
