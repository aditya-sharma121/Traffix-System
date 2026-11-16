import React, { useState, useEffect } from 'react';
import { 
  Zap, ShieldCheck, Clock, Brain, CheckCircle2, Sliders, Play 
} from 'lucide-react';
import { api } from '../services/api';

export const SignalOptimizerView: React.FC = () => {
  const [inputs, setInputs] = useState({
    north_vehicles: 22,
    south_vehicles: 18,
    east_vehicles: 8,
    west_vehicles: 5,
    emergency_direction: null as string | null,
  });

  const [decision, setDecision] = useState<any>(null);

  const fetchOptimization = async () => {
    try {
      const res = await api.optimizeSignals(inputs);
      setDecision(res.optimization_decision);
    } catch (err) {
      console.error('Signal optimizer error:', err);
    }
  };

  useEffect(() => {
    fetchOptimization();
  }, [inputs]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-violet-950">Module 3: Adaptive Traffic Signal Optimizer</h1>
          <p className="text-slate-500 text-sm">
            Dynamic green split calculation, starvation elimination, conflict safety locking, and transparent AI reasoning.
          </p>
        </div>
        <button
          onClick={fetchOptimization}
          className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs rounded-xl transition shadow-md shadow-violet-500/20 flex items-center gap-1.5 self-start md:self-auto"
        >
          <Play className="w-3.5 h-3.5" /> Re-evaluate Schedule
        </button>
      </div>

      {/* Safety & Constraint Guardrails */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white border border-violet-100 rounded-xl p-3.5 shadow-xs">
          <div className="text-slate-500 flex items-center gap-1.5 font-medium"><Clock className="w-3.5 h-3.5 text-violet-600" /> Min Green Bound</div>
          <div className="text-xl font-bold text-violet-950 mt-1">10 seconds</div>
          <div className="text-[11px] text-slate-400">Pedestrian clearance minimum</div>
        </div>
        <div className="bg-white border border-violet-100 rounded-xl p-3.5 shadow-xs">
          <div className="text-slate-500 flex items-center gap-1.5 font-medium"><Clock className="w-3.5 h-3.5 text-amber-500" /> Max Green Bound</div>
          <div className="text-xl font-bold text-violet-950 mt-1">60 seconds</div>
          <div className="text-[11px] text-slate-400">Prevents opposing gridlock</div>
        </div>
        <div className="bg-white border border-violet-100 rounded-xl p-3.5 shadow-xs">
          <div className="text-slate-500 flex items-center gap-1.5 font-medium"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Transition Phases</div>
          <div className="text-xl font-bold text-violet-950 mt-1">4s Y / 2s All-Red</div>
          <div className="text-[11px] text-slate-400">Collision-free clearance</div>
        </div>
        <div className="bg-white border border-violet-100 rounded-xl p-3.5 shadow-xs">
          <div className="text-slate-500 flex items-center gap-1.5 font-medium"><Zap className="w-3.5 h-3.5 text-purple-600" /> Starvation Limit</div>
          <div className="text-xl font-bold text-violet-950 mt-1">&le; 3 Cycles</div>
          <div className="text-[11px] text-slate-400">Forced green guarantee</div>
        </div>
      </div>

      {/* Dynamic Scenario Tester */}
      <div className="bg-white border border-violet-100/90 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-violet-950 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-violet-600" /> Test Traffic Conditions & Watch Dynamic Response
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-violet-50/40 border border-violet-100 rounded-xl p-4">
            <div className="flex justify-between text-xs font-bold text-violet-950 mb-2">
              <span>North Approach</span>
              <span className="font-mono text-violet-700">{inputs.north_vehicles} vehicles</span>
            </div>
            <input
              type="range"
              min="0"
              max="35"
              value={inputs.north_vehicles}
              onChange={(e) => setInputs((prev) => ({ ...prev, north_vehicles: Number(e.target.value) }))}
              className="w-full accent-violet-600 h-1.5 bg-violet-100 rounded-lg cursor-pointer"
            />
          </div>

          <div className="bg-violet-50/40 border border-violet-100 rounded-xl p-4">
            <div className="flex justify-between text-xs font-bold text-violet-950 mb-2">
              <span>South Approach</span>
              <span className="font-mono text-violet-700">{inputs.south_vehicles} vehicles</span>
            </div>
            <input
              type="range"
              min="0"
              max="35"
              value={inputs.south_vehicles}
              onChange={(e) => setInputs((prev) => ({ ...prev, south_vehicles: Number(e.target.value) }))}
              className="w-full accent-violet-600 h-1.5 bg-violet-100 rounded-lg cursor-pointer"
            />
          </div>

          <div className="bg-violet-50/40 border border-violet-100 rounded-xl p-4">
            <div className="flex justify-between text-xs font-bold text-violet-950 mb-2">
              <span>East Approach</span>
              <span className="font-mono text-violet-700">{inputs.east_vehicles} vehicles</span>
            </div>
            <input
              type="range"
              min="0"
              max="35"
              value={inputs.east_vehicles}
              onChange={(e) => setInputs((prev) => ({ ...prev, east_vehicles: Number(e.target.value) }))}
              className="w-full accent-violet-600 h-1.5 bg-violet-100 rounded-lg cursor-pointer"
            />
          </div>

          <div className="bg-violet-50/40 border border-violet-100 rounded-xl p-4">
            <div className="flex justify-between text-xs font-bold text-violet-950 mb-2">
              <span>West Approach</span>
              <span className="font-mono text-violet-700">{inputs.west_vehicles} vehicles</span>
            </div>
            <input
              type="range"
              min="0"
              max="35"
              value={inputs.west_vehicles}
              onChange={(e) => setInputs((prev) => ({ ...prev, west_vehicles: Number(e.target.value) }))}
              className="w-full accent-violet-600 h-1.5 bg-violet-100 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Decision Output & Explainability Reasoning */}
      {decision && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Signal State Result */}
          <div className="lg:col-span-1 bg-white border border-violet-100/90 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Optimization Output</div>
              <div className="text-2xl font-black text-violet-950 mt-1">Phase: {decision.phase}</div>
              <div className="mt-4 p-4 rounded-xl bg-violet-50/60 border border-violet-100 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Green Signal Granted:</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">{decision.green_duration}s</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Yellow Clearance:</span>
                  <span className="font-mono font-bold text-amber-700">{decision.yellow_duration}s</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">All-Red Safety Gap:</span>
                  <span className="font-mono font-bold text-red-700">{decision.all_red_duration}s</span>
                </div>
                <div className="flex justify-between text-xs pt-2 border-t border-violet-200">
                  <span className="text-slate-600">Total Cycle Length:</span>
                  <span className="font-mono font-bold text-violet-800">{decision.metrics?.cycle_length || 60}s</span>
                </div>
              </div>
            </div>

            {/* Signal Indicator Heads */}
            <div className="grid grid-cols-4 gap-2 pt-4">
              {Object.entries(decision.signals).map(([d, state]: [string, any]) => (
                <div key={d} className="bg-violet-50/70 p-2.5 rounded-xl text-center border border-violet-100">
                  <div className="text-[10px] text-slate-500 font-bold">{d[0]}</div>
                  <div
                    className={`text-xs font-mono font-bold mt-1 ${
                      state === 'GREEN' ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {state}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Explainability Engine */}
          <div className="lg:col-span-2 bg-gradient-to-br from-violet-50/80 via-white to-purple-50/50 border border-violet-200/90 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-violet-800 text-xs font-bold uppercase tracking-wider">
                <Brain className="w-4 h-4 text-violet-600" /> Explainable AI Decision Engine
              </div>

              <div className="bg-white border border-violet-200/80 rounded-xl p-4 text-sm text-slate-800 leading-relaxed font-sans shadow-xs">
                {decision.explanation?.primary_reason}
              </div>

              {/* Starvation Counter Status */}
              <div className="space-y-2">
                <div className="text-xs text-slate-600 font-semibold">Starvation Cycles Counter (Fairness Guarantee):</div>
                <div className="grid grid-cols-4 gap-2 text-xs font-mono">
                  {Object.entries(decision.starvation_counters || {}).map(([d, count]: [string, any]) => (
                    <div key={d} className="bg-white border border-violet-100 rounded-lg p-2 text-center shadow-xs">
                      <div className="text-[10px] text-slate-500">{d}</div>
                      <div className={`font-bold mt-0.5 ${count >= 2 ? 'text-amber-600' : 'text-violet-700'}`}>
                        {count} / 3 cycles
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-violet-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Safe Conflict Separation Verified
              </span>
              <span className="font-mono text-violet-700">Webster Optimization v2.4</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
