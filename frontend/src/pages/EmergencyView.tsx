import React, { useState, useEffect } from 'react';
import { ShieldAlert, Siren, Play } from 'lucide-react';
import { api } from '../services/api';

export const EmergencyView: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [direction, setDirection] = useState('NORTH');
  const [vehicleType, setVehicleType] = useState('ambulance');
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await api.getEmergencyStatus();
      setStatus(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleTrigger = async () => {
    setLoading(true);
    try {
      await api.triggerEmergency(direction, vehicleType);
      await fetchStatus();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setLoading(true);
    try {
      await api.clearEmergency();
      await fetchStatus();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-violet-950">Module 5: Emergency Vehicle Priority Protocol</h1>
        <p className="text-slate-500 text-sm">
          Dynamic preemption corridor clearance granting rapid non-stop passage to first responders.
        </p>
      </div>

      {/* Main Preemption Status Banner */}
      <div
        className={`rounded-2xl p-6 border shadow-sm transition-all ${
          status?.active_emergency
            ? 'bg-gradient-to-r from-red-50 via-white to-red-50 border-red-300 animate-pulse'
            : 'bg-white border-violet-100/90'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`p-3.5 rounded-2xl ${
                status?.active_emergency ? 'bg-red-600 text-white' : 'bg-violet-50 text-violet-600'
              }`}
            >
              <Siren className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    status?.active_emergency ? 'bg-red-500 animate-ping' : 'bg-emerald-500'
                  }`}
                />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {status?.active_emergency ? 'PREEMPTION LOCK ACTIVE' : 'MONITORING STANDBY'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-violet-950 mt-1">
                {status?.active_emergency
                  ? `Rapid Corridor Granted to ${status.direction} (${status.vehicle_type.toUpperCase()})`
                  : 'Traffic Signals Operating in Normal Adaptive Mode'}
              </h2>
            </div>
          </div>

          {status?.active_emergency ? (
            <div className="flex items-center gap-3">
              <div className="bg-red-50 px-4 py-2 rounded-xl border border-red-200 text-center font-mono">
                <span className="text-[10px] text-red-700 block uppercase font-bold">Remaining Preemption</span>
                <span className="text-2xl font-black text-red-950">{status.remaining_preemption_seconds}s</span>
              </div>
              <button
                onClick={handleClear}
                disabled={loading}
                className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition shadow-sm"
              >
                Clear Corridor Now
              </button>
            </div>
          ) : (
            <span className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-medium">
              Zero Preemption Congestion
            </span>
          )}
        </div>
      </div>

      {/* Manual Emergency Dispatcher */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-violet-100/90 rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-violet-950 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600" /> Dispatch Emergency Vehicle
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Approaching Direction</label>
              <div className="grid grid-cols-4 gap-2">
                {(['NORTH', 'SOUTH', 'EAST', 'WEST'] as const).map((dir) => (
                  <button
                    key={dir}
                    onClick={() => setDirection(dir)}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      direction === dir
                        ? 'bg-red-50 border-red-400 text-red-700 shadow-xs'
                        : 'bg-violet-50/40 border-violet-100 text-slate-600 hover:text-violet-950 hover:bg-violet-50'
                    }`}
                  >
                    {dir}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Vehicle Category</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full bg-violet-50/40 border border-violet-200 rounded-xl p-2.5 text-xs text-slate-800"
              >
                <option value="ambulance">Ambulance (EMS Medical Priority)</option>
                <option value="fire_engine">Fire Engine (Rescue Service Priority)</option>
                <option value="police">Police Interceptor (Emergency Response)</option>
              </select>
            </div>

            <button
              onClick={handleTrigger}
              disabled={loading}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition shadow-md shadow-red-500/20 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" /> Engage Priority Signal Preemption
            </button>
          </div>
        </div>

        {/* Safety Transition Log */}
        <div className="bg-white border border-violet-100/90 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <h2 className="text-base font-bold text-violet-950 mb-3">Preemption Event & Safety Audit Log</h2>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {status?.recent_events && status.recent_events.length > 0 ? (
                status.recent_events.map((ev: any, i: number) => (
                  <div key={i} className="p-2.5 bg-violet-50/40 border border-violet-100 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                      <span>{ev.timestamp}</span>
                      <span className={ev.status === 'ACTIVE_PREEMPTION' ? 'text-red-600 font-bold' : 'text-emerald-700 font-bold'}>
                        {ev.status}
                      </span>
                    </div>
                    <div className="text-slate-700">{ev.message}</div>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-xs py-8 text-center">No emergency events logged yet.</div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-violet-100 text-[11px] text-slate-500">
            {status?.transparency_note}
          </div>
        </div>
      </div>
    </div>
  );
};
