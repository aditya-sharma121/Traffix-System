import React, { useState } from 'react';
import { Car, Gauge, Clock, Compass, Info } from 'lucide-react';
import { api } from '../services/api';

export const DensityView: React.FC = () => {
  const [counts, setCounts] = useState({
    north: 16,
    south: 14,
    east: 7,
    west: 5,
  });

  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculateDensity = async () => {
    setLoading(true);
    try {
      const res = await api.optimizeSignals({
        north_vehicles: counts.north,
        south_vehicles: counts.south,
        east_vehicles: counts.east,
        west_vehicles: counts.west,
      });
      setAnalysisResult(res.density_analysis);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    calculateDensity();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-violet-950">Module 2: Traffic Density & Queue Analysis</h1>
        <p className="text-slate-500 text-sm">
          Directional Passenger Car Unit (PCU) capacity modeling, spatial queue length estimation, and delay metrics.
        </p>
      </div>

      {/* Interactive Direction Slider Controls */}
      <div className="bg-white border border-violet-100/90 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-violet-950 flex items-center gap-2">
            <Compass className="w-4 h-4 text-violet-600" /> Directional Traffic Load Simulator
          </h2>
          <button
            onClick={calculateDensity}
            disabled={loading}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs rounded-xl transition shadow-sm"
          >
            Recalculate Analysis
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(['north', 'south', 'east', 'west'] as const).map((dir) => (
            <div key={dir} className="bg-violet-50/40 border border-violet-100/80 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold uppercase text-violet-950">{dir} Vehicles</span>
                <span className="font-mono font-bold text-violet-700 text-sm">{counts[dir]}</span>
              </div>
              <input
                type="range"
                min="0"
                max="35"
                value={counts[dir]}
                onChange={(e) => {
                  setCounts((prev) => ({ ...prev, [dir]: Number(e.target.value) }));
                }}
                className="w-full accent-violet-600 h-1.5 bg-violet-100 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>0</span>
                <span>Saturation (35)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Direction Gauges */}
      {analysisResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(analysisResult.directions).map(([dName, data]: [string, any]) => {
            const isSevere = data.congestion_level === 'Severe';
            const isHigh = data.congestion_level === 'High';
            const isMedium = data.congestion_level === 'Medium';

            const cardBorder = isSevere
              ? 'border-red-200 bg-red-50/30'
              : isHigh
              ? 'border-amber-200 bg-amber-50/30'
              : isMedium
              ? 'border-violet-200 bg-violet-50/30'
              : 'border-emerald-200 bg-emerald-50/30';

            const badgeColor = isSevere
              ? 'bg-red-100 text-red-800 border-red-200'
              : isHigh
              ? 'bg-amber-100 text-amber-800 border-amber-200'
              : isMedium
              ? 'bg-violet-100 text-violet-800 border-violet-200'
              : 'bg-emerald-100 text-emerald-800 border-emerald-200';

            return (
              <div
                key={dName}
                className={`bg-white border rounded-2xl p-5 space-y-4 shadow-sm transition-all ${cardBorder}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-extrabold text-violet-950">{dName}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${badgeColor}`}>
                    {data.congestion_level}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-3xl font-black text-violet-950 font-mono">{data.density_percent}%</div>
                  <div className="text-xs text-slate-500 font-medium">Approach Saturation Ratio</div>
                  <div className="w-full bg-violet-100 rounded-full h-2 overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isSevere ? 'bg-red-500' : isHigh ? 'bg-amber-500' : isMedium ? 'bg-violet-600' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, data.density_percent)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-violet-100 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span className="flex items-center gap-1.5"><Car className="w-3.5 h-3.5 text-slate-400" /> PCU Load:</span>
                    <span className="font-mono font-bold text-violet-950">{data.pcu} PCU</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5 text-slate-400" /> Queue Length:</span>
                    <span className="font-semibold text-slate-900">{data.estimated_queue_length_m} m</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> Delay Estimate:</span>
                    <span className="font-semibold text-amber-700">{data.estimated_wait_time_sec}s</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Methodology Info Card */}
      <div className="bg-violet-50/60 border border-violet-200/80 rounded-2xl p-6 text-xs text-slate-600 space-y-3 shadow-xs">
        <h3 className="text-sm font-bold text-violet-950 flex items-center gap-2">
          <Info className="w-4 h-4 text-violet-600" /> PCU & Queue Estimation Methodology
        </h3>
        <p>
          Standard urban traffic capacity applies Passenger Car Equivalent Units (PCU) to reflect relative road space and acceleration delays:
          <span className="text-violet-950 font-semibold"> Car = 1.0 PCU</span>,{' '}
          <span className="text-violet-950 font-semibold">Bus = 2.5 PCU</span>,{' '}
          <span className="text-violet-950 font-semibold">Truck = 3.0 PCU</span>, and{' '}
          <span className="text-violet-950 font-semibold">Motorcycle = 0.5 PCU</span>.
        </p>
        <p>
          Queue lengths are estimated assuming an average 6.5 meter effective vehicle footprint (chassis length plus safe stop-and-go headway gap). Waiting time is dynamically calculated incorporating saturation ratio and Webster delay propagation.
        </p>
      </div>
    </div>
  );
};
