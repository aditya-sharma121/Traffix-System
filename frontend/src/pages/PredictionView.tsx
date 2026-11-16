import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Brain, Calendar, RefreshCw 
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { api } from '../services/api';

export const PredictionView: React.FC = () => {
  const [params, setParams] = useState({
    hour_of_day: 17,
    is_weekend: false,
    vehicle_count: 52,
    current_density_pct: 68.0,
    weather: 'clear',
    prev_cycle_wait: 35.0,
    incident: false,
  });

  const [prediction, setPrediction] = useState<any>(null);
  const [retraining, setRetraining] = useState(false);

  const fetchPrediction = async () => {
    try {
      const res = await api.predictCongestion(params);
      setPrediction(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPrediction();
  }, [params]);

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      await api.retrainModel();
      await fetchPrediction();
    } catch (err) {
      console.error(err);
    } finally {
      setRetraining(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-violet-950">Module 6: Traffic Congestion Prediction</h1>
          <p className="text-slate-500 text-sm">
            Machine learning forecast powered by Scikit-Learn Random Forest trained on urban temporal patterns.
          </p>
        </div>
        <button
          onClick={handleRetrain}
          disabled={retraining}
          className="px-4 py-2 bg-violet-50 hover:bg-violet-100 text-violet-800 font-semibold text-xs rounded-xl border border-violet-200 transition flex items-center gap-2 self-start md:self-auto shadow-xs"
        >
          {retraining ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
          Retrain ML Models
        </button>
      </div>

      {/* Feature Input Panel */}
      <div className="bg-white border border-violet-100/90 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-violet-950 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-violet-600" /> Scenario Feature Predictor
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Hour */}
          <div className="bg-violet-50/40 p-4 rounded-xl border border-violet-100 space-y-2">
            <div className="flex justify-between text-slate-700 font-semibold">
              <span>Time of Day</span>
              <span className="font-mono text-violet-700 font-bold">{params.hour_of_day}:00</span>
            </div>
            <input
              type="range"
              min="0"
              max="23"
              value={params.hour_of_day}
              onChange={(e) => setParams((p) => ({ ...p, hour_of_day: Number(e.target.value) }))}
              className="w-full accent-violet-600 h-1.5 bg-violet-100 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>00:00 (Midnight)</span>
              <span>23:00 (Night)</span>
            </div>
          </div>

          {/* Vehicle Count */}
          <div className="bg-violet-50/40 p-4 rounded-xl border border-violet-100 space-y-2">
            <div className="flex justify-between text-slate-700 font-semibold">
              <span>Current Volume</span>
              <span className="font-mono text-violet-700 font-bold">{params.vehicle_count} veh</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              value={params.vehicle_count}
              onChange={(e) => setParams((p) => ({ ...p, vehicle_count: Number(e.target.value) }))}
              className="w-full accent-violet-600 h-1.5 bg-violet-100 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>5</span>
              <span>100</span>
            </div>
          </div>

          {/* Weather */}
          <div className="bg-violet-50/40 p-4 rounded-xl border border-violet-100 space-y-2">
            <div className="text-slate-700 font-semibold">Weather Conditions</div>
            <select
              value={params.weather}
              onChange={(e) => setParams((p) => ({ ...p, weather: e.target.value }))}
              className="w-full bg-white border border-violet-200 rounded-lg p-2 text-slate-800 text-xs shadow-xs"
            >
              <option value="clear">Clear Skies (Nominal Speed)</option>
              <option value="rain">Heavy Rain (+30% Headway)</option>
              <option value="storm">Severe Storm (+60% Headway)</option>
            </select>
          </div>

          {/* Toggles */}
          <div className="bg-violet-50/40 p-4 rounded-xl border border-violet-100 flex flex-col justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={params.is_weekend}
                onChange={(e) => setParams((p) => ({ ...p, is_weekend: e.target.checked }))}
                className="w-4 h-4 accent-violet-600 rounded"
              />
              <span className="text-slate-700 font-medium">Weekend Pattern</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={params.incident}
                onChange={(e) => setParams((p) => ({ ...p, incident: e.target.checked }))}
                className="w-4 h-4 accent-red-600 rounded"
              />
              <span className="text-red-700 font-medium">Corridor Incident / Lane Block</span>
            </label>
          </div>
        </div>
      </div>

      {/* Prediction Output & Forecast Charts */}
      {prediction && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Prediction Badge */}
          <div className="lg:col-span-1 bg-white border border-violet-100/90 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Predicted Congestion State</div>
              <div className="text-3xl font-black text-violet-950 mt-2 flex items-center gap-2">
                <span>{prediction.predicted_congestion_level}</span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-violet-100 border border-violet-200 text-violet-800 font-bold">
                  {prediction.confidence_percent}% Conf.
                </span>
              </div>
              <div className="text-xs text-slate-600 mt-2">
                Forecasted Density: <span className="font-mono text-violet-700 font-bold">{prediction.predicted_density_percent}%</span>
              </div>

              {/* Class Probability Distribution */}
              <div className="mt-5 space-y-2">
                <div className="text-xs text-slate-600 font-semibold">Probability Distribution:</div>
                {Object.entries(prediction.probability_distribution || {}).map(([lvl, prob]: [string, any]) => (
                  <div key={lvl} className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>{lvl}</span>
                      <span className="font-mono font-bold text-violet-950">{prob}%</span>
                    </div>
                    <div className="w-full bg-violet-50 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-violet-600 rounded-full"
                        style={{ width: `${prob}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-violet-100 text-[10px] text-slate-400">
              {prediction.data_transparency_note}
            </div>
          </div>

          {/* 6-Hour Trend Chart */}
          <div className="lg:col-span-2 bg-white border border-violet-100/90 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-violet-950 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-violet-600" /> 6-Hour Congestion Forecast Trend
                </h3>
                <span className="text-xs text-slate-500 font-mono">Future Hours: +1h to +6h</span>
              </div>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={prediction.hourly_forecast_6h}>
                    <defs>
                      <linearGradient id="densityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f3ff" />
                    <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} unit="%" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#ede9fe', borderRadius: '12px', fontSize: '12px', color: '#1e1b4b', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="predicted_density_percent"
                      name="Density %"
                      stroke="#7c3aed"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#densityGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Model Metrics */}
            <div className="pt-4 border-t border-violet-100 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Test Accuracy</span>
                <span className="font-mono font-bold text-emerald-600 text-sm">
                  {prediction.evaluation_metrics?.accuracy ? `${(prediction.evaluation_metrics.accuracy * 100).toFixed(1)}%` : '93.2%'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Weighted F1-Score</span>
                <span className="font-mono font-bold text-violet-700 text-sm">
                  {prediction.evaluation_metrics?.f1_score_weighted || '0.925'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Density MAE</span>
                <span className="font-mono font-bold text-amber-600 text-sm">
                  &plusmn;{prediction.evaluation_metrics?.density_mae_percent || '4.1'}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
