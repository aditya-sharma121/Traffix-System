import React from 'react';
import { 
  Code, CheckSquare, Layers, Terminal 
} from 'lucide-react';

export const DocumentationView: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-violet-950">System Architecture & Technical Documentation</h1>
        <p className="text-slate-500 text-sm">
          Complete engineering blueprint, mathematical formulations, REST API contracts, and hackathon verification steps.
        </p>
      </div>

      {/* Architecture Overview */}
      <div className="bg-white border border-violet-100/90 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-violet-950 flex items-center gap-2">
          <Layers className="w-5 h-5 text-violet-600" /> High-Level System Architecture
        </h2>
        <div className="bg-slate-950 p-4 rounded-xl border border-violet-900/50 font-mono text-xs text-violet-200 leading-relaxed overflow-x-auto shadow-inner">
{`+-----------------------------------------------------------------------------------------+
|                                    TRAFFIQ PLATFORM                                     |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|   [Uploaded Footage / Camera Stream]              [Emergency Dispatch / Manual Override] |
|                  │                                                  │                   |
|                  ▼                                                  ▼                   |
|   +─────────────────────────────+                 +─────────────────────────────────+   |
|   |   Computer Vision Pipeline  |                 |    Emergency Priority Engine    |   |
|   |  - YOLOv8 / OpenCV Detector |                 |   - Corridor Preemption Lock    |   |
|   |  - Centroid Tracker         |                 |   - Conflict Separation Guard   |   |
|   +──────────────┬──────────────+                 +────────────────┬────────────────+   |
|                  │                                                 │                    |
|                  ▼                                                 │                    |
|   +─────────────────────────────+                                  │                    |
|   |   Traffic Density Analyzer  |                                  │                    |
|   |  - PCU Directional Capacity |                                  │                    |
|   |  - Spatial Queue Estimation |                                  │                    |
|   +──────────────┬──────────────+                                  │                    |
|                  │                                                 │                    |
|                  ▼                                                 ▼                    |
|   +─────────────────────────────────────────────────────────────────────────────────+   |
|   |                      Dynamic Adaptive Signal Optimizer                          |   |
|   |  - Webster Delay Minimization Formula       - Starvation Elimination Aging      |   |
|   |  - Min (10s) / Max (60s) Constraints        - 4s Yellow / 2s All-Red Safety     |   |
|   +──────────────────────────────────────┬──────────────────────────────────────────+   |
|                                          │                                              |
|                  ┌───────────────────────┴───────────────────────┐                      |
|                  ▼                                               ▼                      |
|   +─────────────────────────────+                 +─────────────────────────────────+   |
|   | 4-Way Virtual Intersection  |                 | Congestion Prediction (ML)      |   |
|   |  - Intelligent Driver Model |                 |  - Random Forest Regressor/Clf  |   |
|   |  - Signal Adherence Physics |                 |  - 6-Hour Temporal Forecasting  |   |
|   +─────────────────────────────+                 +─────────────────────────────────+   |
|                                                                                         |
+-----------------------------------------------------------------------------------------+`}
        </div>
      </div>

      {/* Mathematical Formulations */}
      <div className="bg-white border border-violet-100/90 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-violet-950 flex items-center gap-2">
          <Code className="w-5 h-5 text-violet-600" /> Core Mathematical Formulations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-violet-50/50 p-4 rounded-xl border border-violet-100 space-y-2">
            <span className="font-bold text-violet-900 uppercase tracking-wider block">1. Directional PCU Load</span>
            <p className="text-slate-600">
              Each detected vehicle class is converted to Passenger Car Units (PCU):
            </p>
            <div className="font-mono bg-white border border-violet-200 p-2.5 rounded-lg text-violet-950 font-bold shadow-xs">
              PCU_dir = 1.0·N_car + 2.5·N_bus + 3.0·N_truck + 0.5·N_moto
            </div>
          </div>

          <div className="bg-violet-50/50 p-4 rounded-xl border border-violet-100 space-y-2">
            <span className="font-bold text-violet-900 uppercase tracking-wider block">2. Phase Pressure with Starvation</span>
            <p className="text-slate-600">
              Opposing phase pressure incorporates wait cycles (S_i) to prevent starvation:
            </p>
            <div className="font-mono bg-white border border-violet-200 p-2.5 rounded-lg text-violet-950 font-bold shadow-xs">
              Pressure_NS = (PCU_N + PCU_S) + 2.5·(S_N + S_S)
            </div>
          </div>

          <div className="bg-violet-50/50 p-4 rounded-xl border border-violet-100 space-y-2">
            <span className="font-bold text-violet-900 uppercase tracking-wider block">3. Dynamic Green Allocation</span>
            <p className="text-slate-600">
              Cycle length C dynamically scales between 50s and 120s:
            </p>
            <div className="font-mono bg-white border border-violet-200 p-2.5 rounded-lg text-violet-950 font-bold shadow-xs">
              G_phase = clamp(round(C · (P_target / P_total)), 10s, 60s)
            </div>
          </div>

          <div className="bg-violet-50/50 p-4 rounded-xl border border-violet-100 space-y-2">
            <span className="font-bold text-violet-900 uppercase tracking-wider block">4. CO2 Emission Reduction</span>
            <p className="text-slate-600">
              Calculated from aggregate vehicle idling delay elimination:
            </p>
            <div className="font-mono bg-white border border-violet-200 p-2.5 rounded-lg text-violet-950 font-bold shadow-xs">
              CO2_saved (kg) = (Delta_Delay / 60s) · 0.0024 kg/min · Throughput
            </div>
          </div>
        </div>
      </div>

      {/* REST API Endpoints Reference */}
      <div className="bg-white border border-violet-100/90 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-violet-950 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-violet-600" /> Key REST API Endpoints
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-violet-50 text-violet-900 uppercase text-[10px] font-bold">
              <tr>
                <th className="py-3 px-3 rounded-l-lg">Method</th>
                <th className="py-3 px-3">Endpoint</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3 rounded-r-lg">Payload / Response</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-100 text-slate-700">
              <tr className="hover:bg-violet-50/30">
                <td className="py-2.5 px-3 text-violet-700 font-bold">POST</td>
                <td className="py-2.5 px-3">/api/detection/upload</td>
                <td className="py-2.5 px-3 font-sans">Processes video file via OpenCV & YOLO</td>
                <td className="py-2.5 px-3 text-slate-500">multipart/form-data</td>
              </tr>
              <tr className="hover:bg-violet-50/30">
                <td className="py-2.5 px-3 text-violet-700 font-bold">POST</td>
                <td className="py-2.5 px-3">/api/detection/sample-generate</td>
                <td className="py-2.5 px-3 font-sans">Generates & analyzes synthetic sample video</td>
                <td className="py-2.5 px-3 text-slate-500">JSON results</td>
              </tr>
              <tr className="hover:bg-violet-50/30">
                <td className="py-2.5 px-3 text-emerald-700 font-bold">POST</td>
                <td className="py-2.5 px-3">/api/signals/optimize</td>
                <td className="py-2.5 px-3 font-sans">Webster dynamic signal optimization</td>
                <td className="py-2.5 px-3 text-slate-500">&#123;north, south, east, west&#125;</td>
              </tr>
              <tr className="hover:bg-violet-50/30">
                <td className="py-2.5 px-3 text-red-600 font-bold">POST</td>
                <td className="py-2.5 px-3">/api/signals/emergency-override</td>
                <td className="py-2.5 px-3 font-sans">Engages priority preemption corridor</td>
                <td className="py-2.5 px-3 text-slate-500">&#123;direction, vehicle_type&#125;</td>
              </tr>
              <tr className="hover:bg-violet-50/30">
                <td className="py-2.5 px-3 text-blue-700 font-bold">GET</td>
                <td className="py-2.5 px-3">/api/simulation/state</td>
                <td className="py-2.5 px-3 font-sans">Live 4-way intersection state & vehicles</td>
                <td className="py-2.5 px-3 text-slate-500">JSON SimulationState</td>
              </tr>
              <tr className="hover:bg-violet-50/30">
                <td className="py-2.5 px-3 text-purple-700 font-bold">POST</td>
                <td className="py-2.5 px-3">/api/prediction/predict</td>
                <td className="py-2.5 px-3 font-sans">Random forest congestion forecast</td>
                <td className="py-2.5 px-3 text-slate-500">&#123;hour, weather, density&#125;</td>
              </tr>
              <tr className="hover:bg-violet-50/30">
                <td className="py-2.5 px-3 text-amber-700 font-bold">POST</td>
                <td className="py-2.5 px-3">/api/analytics/benchmark</td>
                <td className="py-2.5 px-3 font-sans">Side-by-side Fixed vs Adaptive benchmark</td>
                <td className="py-2.5 px-3 text-slate-500">&#123;duration_steps, intensity&#125;</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Hackathon Demonstration Checklist */}
      <div className="bg-white border border-violet-100/90 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-violet-950 flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-emerald-600" /> Hackathon Demonstration Walkthrough
        </h2>

        <div className="space-y-3 text-xs">
          <div className="flex items-start gap-3 p-3 bg-violet-50/40 rounded-xl border border-violet-100">
            <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-800 font-bold flex items-center justify-center shrink-0">1</span>
            <div>
              <div className="font-bold text-violet-950">System Health & Overview Dashboard</div>
              <div className="text-slate-600 mt-0.5">Show active adaptive status, live KPI cards, and direction pulse gauges.</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-violet-50/40 rounded-xl border border-violet-100">
            <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-800 font-bold flex items-center justify-center shrink-0">2</span>
            <div>
              <div className="font-bold text-violet-950">AI Detection & Video Analysis</div>
              <div className="text-slate-600 mt-0.5">Click "Generate & Analyze Demo Video" or upload footage. Demonstrate frame bounding boxes and directional density calculation.</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-violet-50/40 rounded-xl border border-violet-100">
            <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-800 font-bold flex items-center justify-center shrink-0">3</span>
            <div>
              <div className="font-bold text-violet-950">Signal Optimization & AI Explainability</div>
              <div className="text-slate-600 mt-0.5">Show Webster dynamic green time calculation, starvation counters, and natural language reasoning explanation.</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-violet-50/40 rounded-xl border border-violet-100">
            <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-800 font-bold flex items-center justify-center shrink-0">4</span>
            <div>
              <div className="font-bold text-violet-950">Interactive 4-Way Virtual Intersection</div>
              <div className="text-slate-600 mt-0.5">Start virtual simulation, watch vehicles obey signals, decelerate at red lights, and accelerate through green lights.</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-violet-50/40 rounded-xl border border-violet-100">
            <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-800 font-bold flex items-center justify-center shrink-0">5</span>
            <div>
              <div className="font-bold text-violet-950">Emergency Vehicle Preemption Dispatch</div>
              <div className="text-slate-600 mt-0.5">Click "Ambulance", watch all conflicting lights lock RED while the emergency approach gets continuous GREEN.</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-violet-50/40 rounded-xl border border-violet-100">
            <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-800 font-bold flex items-center justify-center shrink-0">6</span>
            <div>
              <div className="font-bold text-violet-950">Scientific Performance Benchmark</div>
              <div className="text-slate-600 mt-0.5">Run seeded comparison against fixed-time baseline to display measurable delay reduction and throughput charts.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
