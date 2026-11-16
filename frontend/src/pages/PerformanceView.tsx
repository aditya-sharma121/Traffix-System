import React, { useState, useEffect } from 'react';
import { 
  BarChart2, Clock, RefreshCw, Zap 
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';
import { api } from '../services/api';
import type { BenchmarkResult } from '../services/api';

export const PerformanceView: React.FC = () => {
  const [intensity, setIntensity] = useState<'medium' | 'high' | 'asymmetric'>('medium');
  const [durationSteps] = useState<number>(120);
  const [benchmark, setBenchmark] = useState<BenchmarkResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const runTest = async (chosenIntensity = intensity) => {
    setLoading(true);
    try {
      const res = await api.runBenchmark(durationSteps, chosenIntensity);
      setBenchmark(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTest();
  }, []);

  const chartData = benchmark?.timeline?.steps?.map((step, idx) => ({
    time: `${step * 0.5}s`,
    fixedQueue: benchmark.timeline.fixed_queue[idx],
    adaptiveQueue: benchmark.timeline.adaptive_queue[idx],
    fixedWait: benchmark.timeline.fixed_wait[idx],
    adaptiveWait: benchmark.timeline.adaptive_wait[idx],
  })) || [];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-violet-950">Module 8: Performance Analytics & Benchmarking</h1>
          <p className="text-slate-500 text-sm">
            Empirical comparative evaluation: Traditional Fixed-Time Signals vs TRAFFIQ Adaptive Control.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <select
            value={intensity}
            onChange={(e) => {
              const val = e.target.value as any;
              setIntensity(val);
              runTest(val);
            }}
            className="bg-white border border-violet-200 rounded-xl px-3 py-2 text-xs text-slate-800 shadow-xs"
          >
            <option value="medium">Balanced Traffic Scenario</option>
            <option value="high">High Peak Rush Hour</option>
            <option value="asymmetric">Asymmetric Corridor (Heavy NS)</option>
          </select>

          <button
            onClick={() => runTest()}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold text-xs rounded-xl transition shadow-md shadow-violet-500/20 flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            Run Seeded Benchmark
          </button>
        </div>
      </div>

      {/* Benchmark Summary Improvement Cards */}
      {benchmark && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Waiting Time Reduction */}
          <div className="bg-white border border-violet-100 rounded-2xl p-5 shadow-sm">
            <span className="text-xs uppercase font-bold text-slate-500">Waiting Time Saved</span>
            <div className="text-3xl font-black text-emerald-600 mt-2">
              {benchmark.improvements.waiting_time_reduction_percent}%
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Fixed: <span className="text-slate-700 font-semibold">{benchmark.fixed_time_results.avg_waiting_time_sec}s</span> &rarr; TRAFFIQ:{' '}
              <span className="text-emerald-700 font-bold">{benchmark.traffiq_adaptive_results.avg_waiting_time_sec}s</span>
            </div>
          </div>

          {/* Queue Length Reduction */}
          <div className="bg-white border border-violet-100 rounded-2xl p-5 shadow-sm">
            <span className="text-xs uppercase font-bold text-slate-500">Queue Reduction</span>
            <div className="text-3xl font-black text-violet-700 mt-2">
              {benchmark.improvements.queue_reduction_percent}%
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Avg queue dropped from <span className="text-slate-700 font-semibold">{benchmark.fixed_time_results.avg_queue_length}</span> to{' '}
              <span className="text-violet-700 font-bold">{benchmark.traffiq_adaptive_results.avg_queue_length}</span>
            </div>
          </div>

          {/* Throughput Increase */}
          <div className="bg-white border border-violet-100 rounded-2xl p-5 shadow-sm">
            <span className="text-xs uppercase font-bold text-slate-500">Throughput Gain</span>
            <div className="text-3xl font-black text-purple-600 mt-2">
              +{benchmark.improvements.throughput_increase_percent}%
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {benchmark.traffiq_adaptive_results.vehicles_cleared} vehicles cleared vs {benchmark.fixed_time_results.vehicles_cleared}
            </div>
          </div>

          {/* CO2 Emissions Saved */}
          <div className="bg-white border border-violet-100 rounded-2xl p-5 shadow-sm">
            <span className="text-xs uppercase font-bold text-slate-500">CO2 Emissions Saved</span>
            <div className="text-3xl font-black text-emerald-600 mt-2">
              {benchmark.improvements.co2_emissions_saved_kg} kg
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Calculated via vehicle idle reduction coefficient
            </div>
          </div>
        </div>
      )}

      {/* Comparison Timeline Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Queue Length Comparison */}
        <div className="bg-white border border-violet-100/90 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-violet-950 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-violet-600" /> Queue Length Over Time (Vehicles)
            </h3>
            <span className="text-xs text-slate-500 font-mono">Identical Arrival Stream</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f3ff" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#ede9fe', borderRadius: '12px', fontSize: '12px', color: '#1e1b4b', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="fixedQueue"
                  name="Fixed-Time Signal"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="adaptiveQueue"
                  name="TRAFFIQ Adaptive"
                  stroke="#7c3aed"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Average Delay / Waiting Time Comparison */}
        <div className="bg-white border border-violet-100/90 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-violet-950 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" /> Average Vehicle Delay (Seconds)
            </h3>
            <span className="text-xs text-slate-500 font-mono">Delay Accumulation</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f3ff" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} unit="s" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#ede9fe', borderRadius: '12px', fontSize: '12px', color: '#1e1b4b', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="fixedWait"
                  name="Fixed-Time Delay"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="adaptiveWait"
                  name="TRAFFIQ Adaptive Delay"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Measurable Comparison Table */}
      {benchmark && (
        <div className="bg-white border border-violet-100/90 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-violet-950 mb-4">Detailed Performance Comparison Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-violet-50 text-violet-900 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4 rounded-l-lg">Metric Parameter</th>
                  <th className="py-3 px-4">Traditional Fixed-Time</th>
                  <th className="py-3 px-4">TRAFFIQ Adaptive</th>
                  <th className="py-3 px-4 rounded-r-lg">Measured Difference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-violet-100">
                <tr className="hover:bg-violet-50/40">
                  <td className="py-3 px-4 font-semibold text-slate-800">Average Waiting Time</td>
                  <td className="py-3 px-4 text-slate-600">{benchmark.fixed_time_results.avg_waiting_time_sec}s</td>
                  <td className="py-3 px-4 text-emerald-700 font-bold">{benchmark.traffiq_adaptive_results.avg_waiting_time_sec}s</td>
                  <td className="py-3 px-4 text-emerald-700 font-bold">-{benchmark.improvements.waiting_time_reduction_percent}% delay</td>
                </tr>
                <tr className="hover:bg-violet-50/40">
                  <td className="py-3 px-4 font-semibold text-slate-800">Average Queue Length</td>
                  <td className="py-3 px-4 text-slate-600">{benchmark.fixed_time_results.avg_queue_length} vehicles</td>
                  <td className="py-3 px-4 text-violet-700 font-bold">{benchmark.traffiq_adaptive_results.avg_queue_length} vehicles</td>
                  <td className="py-3 px-4 text-violet-700 font-bold">-{benchmark.improvements.queue_reduction_percent}% queue</td>
                </tr>
                <tr className="hover:bg-violet-50/40">
                  <td className="py-3 px-4 font-semibold text-slate-800">Total Cleared Vehicles</td>
                  <td className="py-3 px-4 text-slate-600">{benchmark.fixed_time_results.vehicles_cleared}</td>
                  <td className="py-3 px-4 text-purple-700 font-bold">{benchmark.traffiq_adaptive_results.vehicles_cleared}</td>
                  <td className="py-3 px-4 text-purple-700 font-bold">+{benchmark.improvements.throughput_increase_percent}% throughput</td>
                </tr>
                <tr className="hover:bg-violet-50/40">
                  <td className="py-3 px-4 font-semibold text-slate-800">Total Delay Accumulation</td>
                  <td className="py-3 px-4 text-slate-600">{benchmark.fixed_time_results.total_delay_sec}s</td>
                  <td className="py-3 px-4 text-emerald-700 font-bold">{benchmark.traffiq_adaptive_results.total_delay_sec}s</td>
                  <td className="py-3 px-4 text-emerald-700 font-bold">
                    {Math.round(benchmark.fixed_time_results.total_delay_sec - benchmark.traffiq_adaptive_results.total_delay_sec)}s saved
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
