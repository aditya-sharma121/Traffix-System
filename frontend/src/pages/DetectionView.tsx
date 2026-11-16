import React, { useState, useEffect } from 'react';
import { 
  Upload, Play, AlertCircle, RefreshCw, Car, Bus, Truck, Bike, ShieldAlert, Cpu, Sparkles 
} from 'lucide-react';
import { api } from '../services/api';
import type { DetectionResult } from '../services/api';

interface Props {
  onApplyTimings?: (result: DetectionResult) => void;
}

export const DetectionView: React.FC<Props> = ({ onApplyTimings }) => {
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [frameSkip, setFrameSkip] = useState<number>(2);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);

  useEffect(() => {
    api.getLatestDetection().then((data) => {
      if (data) setResult(data);
    });
  }, []);

  const handleFileUpload = async (fileToUpload: File) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.uploadVideo(fileToUpload, frameSkip, 150);
      setResult(res);
      if (onApplyTimings) onApplyTimings(res);
    } catch (err: any) {
      setError(err.message || 'Error processing uploaded video.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSample = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.generateSampleVideo();
      setResult(res);
      if (onApplyTimings) onApplyTimings(res);
    } catch (err: any) {
      setError(err.message || 'Error generating sample traffic video.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-violet-950">Module 1: AI Vehicle Detection & Tracking</h1>
          <p className="text-slate-500 text-sm">
            Analyze uploaded traffic footage or generated aerial streams using OpenCV computer vision & YOLO.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateSample}
            disabled={loading}
            className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold text-xs rounded-xl transition shadow-md shadow-violet-500/20 flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-violet-200" />}
            Generate & Analyze Demo Video
          </button>
        </div>
      </div>

      {/* Model Transparency Note */}
      <div className="bg-violet-50/70 border border-violet-200/90 rounded-2xl p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-600 text-white rounded-xl shadow-xs">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-violet-950 text-xs font-bold">Active Computer Vision Engine</div>
            <div className="text-slate-600 text-xs mt-0.5">
              Engine: <span className="text-violet-700 font-mono font-semibold">{result ? result.model_engine : 'OpenCV Adaptive CV + Centroid Tracker'}</span> (CPU Optimized, No External Hardware Required)
            </div>
          </div>
        </div>
        <span className="text-xs px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full font-semibold">
          Zero Fabricated Data
        </span>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Box & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white border border-violet-100/90 rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-violet-950 flex items-center gap-2">
            <Upload className="w-4 h-4 text-violet-600" /> Upload Traffic Footage
          </h2>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                const file = e.dataTransfer.files[0];
                setSelectedFile(file);
                handleFileUpload(file);
              }
            }}
            className="border-2 border-dashed border-violet-200 hover:border-violet-500 bg-violet-50/30 rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[160px]"
            onClick={() => document.getElementById('video-upload-input')?.click()}
          >
            <Upload className="w-8 h-8 text-violet-400 mb-2" />
            <div className="text-sm font-semibold text-violet-950">
              {selectedFile ? selectedFile.name : 'Choose video or drag & drop'}
            </div>
            <div className="text-xs text-slate-500 mt-1">MP4, AVI, MOV (Up to 100MB)</div>
            <input
              id="video-upload-input"
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  setSelectedFile(file);
                  handleFileUpload(file);
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Frame Skipping (Laptop Performance)</span>
              <span className="font-mono text-violet-700 font-bold">{frameSkip}x</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={frameSkip}
              onChange={(e) => setFrameSkip(Number(e.target.value))}
              className="w-full accent-violet-600 h-1.5 bg-violet-100 rounded-lg cursor-pointer"
            />
          </div>

          {loading && (
            <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl flex items-center gap-2 text-xs text-violet-800">
              <RefreshCw className="w-4 h-4 animate-spin text-violet-600" />
              <span>Analyzing video frames with background subtraction & tracking...</span>
            </div>
          )}
        </div>

        {/* Video / Frame Detection Canvas */}
        <div className="lg:col-span-2 bg-white border border-violet-100/90 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-violet-950 flex items-center gap-2">
              <Play className="w-4 h-4 text-violet-600" /> Processed Detection Visualizer
            </h2>
            {result && (
              <span className="text-xs text-slate-500 font-mono">
                {result.processed_frames} frames processed at {result.processing_fps} FPS
              </span>
            )}
          </div>

          {result && result.sample_frames_history && result.sample_frames_history.length > 0 ? (
            <div className="space-y-4">
              <div className="relative w-full aspect-video bg-slate-950 rounded-xl overflow-hidden border border-violet-200 flex items-center justify-center shadow-inner">
                <svg className="w-full h-full" viewBox="0 0 640 480">
                  <rect x="0" y="0" width="640" height="480" fill="#0f172a" />
                  <rect x="260" y="0" width="120" height="480" fill="#1e293b" />
                  <rect x="0" y="180" width="640" height="120" fill="#1e293b" />
                  <rect x="260" y="180" width="120" height="120" fill="#334155" />

                  {result.sample_frames_history[currentFrameIndex]?.vehicles.map((v, idx) => {
                    const [x1, y1, x2, y2] = v.bbox;
                    const bw = Math.max(10, x2 - x1);
                    const bh = Math.max(10, y2 - y1);
                    const color = v.is_emergency ? '#ef4444' : v.class_name === 'bus' ? '#f59e0b' : '#a78bfa';

                    return (
                      <g key={idx}>
                        <rect
                          x={x1}
                          y={y1}
                          width={bw}
                          height={bh}
                          fill="rgba(167, 139, 250, 0.2)"
                          stroke={color}
                          strokeWidth="2"
                          rx="4"
                        />
                        <rect x={x1} y={Math.max(0, y1 - 16)} width={Math.max(60, bw)} height="16" fill={color} rx="2" />
                        <text
                          x={x1 + 3}
                          y={Math.max(12, y1 - 4)}
                          fill="#ffffff"
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="sans-serif"
                        >
                          {v.class_name} #{v.id}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-md border border-violet-200 text-xs text-violet-950 font-semibold shadow-sm">
                  Frame {result.sample_frames_history[currentFrameIndex]?.frame || 1} • {result.sample_frames_history[currentFrameIndex]?.vehicles.length || 0} Vehicles Detected
                </div>
              </div>

              {/* Frame Slider */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-medium">Scrub Sample Frames:</span>
                <input
                  type="range"
                  min="0"
                  max={result.sample_frames_history.length - 1}
                  value={currentFrameIndex}
                  onChange={(e) => setCurrentFrameIndex(Number(e.target.value))}
                  className="flex-1 accent-violet-600 h-1.5 bg-violet-100 rounded-lg cursor-pointer"
                />
                <span className="text-xs font-mono text-violet-700 font-bold">
                  {currentFrameIndex + 1}/{result.sample_frames_history.length}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-64 rounded-xl border border-dashed border-violet-200 bg-violet-50/20 flex flex-col items-center justify-center text-slate-400">
              <Play className="w-10 h-10 mb-2 opacity-40 text-violet-400" />
              <p className="text-sm">Click "Generate & Analyze Demo Video" or upload footage above.</p>
            </div>
          )}
        </div>
      </div>

      {/* Detection Results Breakdown */}
      {result && (
        <div className="space-y-6">
          {/* Class distribution cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white border border-violet-100 rounded-xl p-3 flex items-center gap-3 shadow-xs">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Car className="w-5 h-5" /></div>
              <div>
                <div className="text-xs text-slate-500">Cars</div>
                <div className="text-xl font-bold text-violet-950">{result.class_distribution.car || 0}</div>
              </div>
            </div>
            <div className="bg-white border border-violet-100 rounded-xl p-3 flex items-center gap-3 shadow-xs">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Bus className="w-5 h-5" /></div>
              <div>
                <div className="text-xs text-slate-500">Buses</div>
                <div className="text-xl font-bold text-violet-950">{result.class_distribution.bus || 0}</div>
              </div>
            </div>
            <div className="bg-white border border-violet-100 rounded-xl p-3 flex items-center gap-3 shadow-xs">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Truck className="w-5 h-5" /></div>
              <div>
                <div className="text-xs text-slate-500">Trucks</div>
                <div className="text-xl font-bold text-violet-950">{result.class_distribution.truck || 0}</div>
              </div>
            </div>
            <div className="bg-white border border-violet-100 rounded-xl p-3 flex items-center gap-3 shadow-xs">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Bike className="w-5 h-5" /></div>
              <div>
                <div className="text-xs text-slate-500">Motorcycles</div>
                <div className="text-xl font-bold text-violet-950">{result.class_distribution.motorcycle || 0}</div>
              </div>
            </div>
            <div className="bg-white border border-violet-100 rounded-xl p-3 flex items-center gap-3 shadow-xs">
              <div className="p-2 bg-red-50 text-red-600 rounded-lg"><ShieldAlert className="w-5 h-5" /></div>
              <div>
                <div className="text-xs text-slate-500">Emergency</div>
                <div className="text-xl font-bold text-red-600">{result.class_distribution.emergency || 0}</div>
              </div>
            </div>
          </div>

          {/* Direction Density Analysis Table */}
          <div className="bg-white border border-violet-100/90 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-violet-950 mb-4">Direction-Wise Traffic Density & Queue Estimates</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-violet-50 text-violet-900 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="py-3 px-4 rounded-l-lg">Direction</th>
                    <th className="py-3 px-4">Vehicle Count</th>
                    <th className="py-3 px-4">PCU Load</th>
                    <th className="py-3 px-4">Density %</th>
                    <th className="py-3 px-4">Congestion Level</th>
                    <th className="py-3 px-4">Est. Queue Length</th>
                    <th className="py-3 px-4 rounded-r-lg">Est. Wait Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-violet-100">
                  {Object.entries(result.latest_density_analysis.directions).map(([dir, info]) => {
                    const badgeClass =
                      info.congestion_level === 'Low'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : info.congestion_level === 'Medium'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : info.congestion_level === 'High'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-red-50 text-red-700 border-red-200';

                    return (
                      <tr key={dir} className="hover:bg-violet-50/40 transition">
                        <td className="py-3 px-4 font-bold text-violet-950">{dir}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{info.vehicle_count}</td>
                        <td className="py-3 px-4 font-mono font-bold text-violet-700">{info.pcu} PCU</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-700">{info.density_percent}%</span>
                            <div className="w-16 bg-violet-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full bg-violet-600 rounded-full"
                                style={{ width: `${info.density_percent}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${badgeClass}`}>
                            {info.congestion_level}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{info.estimated_queue_length_m} m</td>
                        <td className="py-3 px-4 font-mono text-amber-700 font-bold">{info.estimated_wait_time_sec}s</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
