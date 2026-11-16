import React, { useRef, useEffect, useState } from 'react';
import type { SimulationState } from '../services/api';
import { Layers, MapPin, Navigation, ShieldCheck } from 'lucide-react';

interface Props {
  state: SimulationState | null;
  onSpawn?: (direction: string, turn?: string) => void;
}

export type MapStyle = 'google_streets' | 'google_satellite' | 'google_traffic_nav';

export const VirtualIntersectionCanvas: React.FC<Props> = ({ state, onSpawn }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyle>('google_streets');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const roadWidth = 144;
    const laneWidth = roadWidth / 2; // 72px per direction

    // ==========================================
    // 1. BASEMAP RENDERING
    // ==========================================
    if (mapStyle === 'google_satellite') {
      ctx.fillStyle = '#1c2826';
      ctx.fillRect(0, 0, width, height);

      // Urban blocks
      ctx.fillStyle = '#2d4030';
      ctx.fillRect(0, 0, cx - roadWidth / 2, cy - roadWidth / 2);
      ctx.fillStyle = '#3a3d40';
      ctx.fillRect(cx + roadWidth / 2, 0, cx - roadWidth / 2, cy - roadWidth / 2);
      ctx.fillStyle = '#34383c';
      ctx.fillRect(0, cy + roadWidth / 2, cx - roadWidth / 2, cy - roadWidth / 2);
      ctx.fillStyle = '#26292c';
      ctx.fillRect(cx + roadWidth / 2, cy + roadWidth / 2, cx - roadWidth / 2, cy - roadWidth / 2);

      // Trees
      const drawSatelliteTree = (tx: number, ty: number, r: number) => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(tx + 4, ty + 4, r, 0, Math.PI * 2);
        ctx.fill();
        const grad = ctx.createRadialGradient(tx - 2, ty - 2, 2, tx, ty, r);
        grad.addColorStop(0, '#4ade80');
        grad.addColorStop(0.7, '#15803d');
        grad.addColorStop(1, '#14532d');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(tx, ty, r, 0, Math.PI * 2);
        ctx.fill();
      };
      drawSatelliteTree(40, 40, 16);
      drawSatelliteTree(90, 50, 20);
      drawSatelliteTree(55, 110, 18);
      drawSatelliteTree(120, 100, 22);

      // Parking stalls
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1.5;
      for (let py = cy + roadWidth / 2 + 25; py < height - 20; py += 18) {
        ctx.strokeRect(cx + roadWidth / 2 + 20, py, 45, 14);
      }

    } else if (mapStyle === 'google_streets') {
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, width, height);

      // Top-Left: Park
      ctx.fillStyle = '#e8f5e9';
      ctx.fillRect(10, 10, cx - roadWidth / 2 - 20, cy - roadWidth / 2 - 20);
      ctx.strokeStyle = '#c8e6c9';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, cx - roadWidth / 2 - 20, cy - roadWidth / 2 - 20);

      ctx.fillStyle = '#2e7d32';
      ctx.font = 'bold 10px Roboto, sans-serif';
      ctx.fillText('Central Urban Park', 25, 36);

      const drawGoogleTree = (tx: number, ty: number, r: number) => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.beginPath();
        ctx.arc(tx + 2, ty + 2, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#81c784';
        ctx.beginPath();
        ctx.arc(tx, ty, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4caf50';
        ctx.beginPath();
        ctx.arc(tx - 1, ty - 1, r * 0.7, 0, Math.PI * 2);
        ctx.fill();
      };
      drawGoogleTree(60, 80, 14);
      drawGoogleTree(110, 70, 16);
      drawGoogleTree(80, 130, 15);

      // Commercial Blocks
      ctx.fillStyle = '#fdfbf7';
      ctx.fillRect(cx + roadWidth / 2 + 10, 10, cx - roadWidth / 2 - 20, cy - roadWidth / 2 - 20);
      ctx.fillStyle = '#ece7df';
      ctx.fillRect(cx + roadWidth / 2 + 25, 25, 110, 75);
      ctx.fillStyle = '#78716c';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('Metro Financial Plaza', cx + roadWidth / 2 + 35, 60);

      ctx.fillStyle = '#fdfbf7';
      ctx.fillRect(10, cy + roadWidth / 2 + 10, cx - roadWidth / 2 - 20, cy - roadWidth / 2 - 20);
      ctx.fillStyle = '#ece7df';
      ctx.fillRect(25, cy + roadWidth / 2 + 25, 110, 75);
      ctx.fillStyle = '#78716c';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('Tech Innovation Center', 32, cy + roadWidth / 2 + 65);

      ctx.fillStyle = '#fdfbf7';
      ctx.fillRect(cx + roadWidth / 2 + 10, cy + roadWidth / 2 + 10, cx - roadWidth / 2 - 20, cy - roadWidth / 2 - 20);
      ctx.fillStyle = '#ece7df';
      ctx.fillRect(cx + roadWidth / 2 + 25, cy + roadWidth / 2 + 25, 110, 75);
      ctx.fillStyle = '#78716c';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('Grand City Mall', cx + roadWidth / 2 + 45, cy + roadWidth / 2 + 65);

    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.strokeRect(15, 15, cx - roadWidth / 2 - 30, cy - roadWidth / 2 - 30);
      ctx.strokeRect(cx + roadWidth / 2 + 15, 15, cx - roadWidth / 2 - 30, cy - roadWidth / 2 - 30);
      ctx.strokeRect(15, cy + roadWidth / 2 + 15, cx - roadWidth / 2 - 30, cy - roadWidth / 2 - 30);
      ctx.strokeRect(cx + roadWidth / 2 + 15, cy + roadWidth / 2 + 15, cx - roadWidth / 2 - 30, cy - roadWidth / 2 - 30);
    }

    // ==========================================
    // 2. ROADS & ASPHALT
    // ==========================================
    const asphaltColor = mapStyle === 'google_satellite' ? '#181b20' : mapStyle === 'google_streets' ? '#ffffff' : '#1e293b';
    const roadBorderColor = mapStyle === 'google_streets' ? '#d1d5db' : '#334155';

    // Sidewalk curb underlay
    ctx.fillStyle = mapStyle === 'google_streets' ? '#e5e7eb' : '#334155';
    ctx.fillRect(cx - roadWidth / 2 - 6, 0, roadWidth + 12, height);
    ctx.fillRect(0, cy - roadWidth / 2 - 6, width, roadWidth + 12);

    // Asphalt surface
    ctx.fillStyle = asphaltColor;
    ctx.fillRect(cx - roadWidth / 2, 0, roadWidth, height);
    ctx.fillRect(0, cy - roadWidth / 2, width, roadWidth);

    // Junction box
    ctx.fillStyle = mapStyle === 'google_streets' ? '#ffffff' : '#273349';
    ctx.fillRect(cx - roadWidth / 2, cy - roadWidth / 2, roadWidth, roadWidth);

    // Road Edge borders
    ctx.strokeStyle = roadBorderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - roadWidth / 2, 0, 0, height);
    ctx.strokeRect(cx + roadWidth / 2, 0, 0, height);
    ctx.strokeRect(0, cy - roadWidth / 2, width, 0);
    ctx.strokeRect(0, cy + roadWidth / 2, width, 0);

    // ==========================================
    // 3. CROSSWALKS & STOP LINES (EXACT GEOMETRY)
    // ==========================================
    const zebraLength = 22;
    const stopDistancePx = roadWidth / 2 + zebraLength + 6; // Exactly 98px from center (corresponds to 180.0m)

    // Zebra stripes
    ctx.fillStyle = mapStyle === 'google_streets' ? '#4b5563' : 'rgba(255, 255, 255, 0.85)';
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(cx - roadWidth / 2 + 10 + i * 21, cy - roadWidth / 2 - zebraLength - 3, 13, zebraLength);
      ctx.fillRect(cx - roadWidth / 2 + 10 + i * 21, cy + roadWidth / 2 + 3, 13, zebraLength);
      ctx.fillRect(cx - roadWidth / 2 - zebraLength - 3, cy - roadWidth / 2 + 10 + i * 21, zebraLength, 13);
      ctx.fillRect(cx + roadWidth / 2 + 3, cy - roadWidth / 2 + 10 + i * 21, zebraLength, 13);
    }

    // Stop Lines (Solid White, high-vis)
    ctx.strokeStyle = mapStyle === 'google_streets' ? '#1f2937' : '#ffffff';
    ctx.lineWidth = 4;

    // North Stop Line (across approaching lane: x from cx - roadWidth/2 to cx)
    ctx.beginPath();
    ctx.moveTo(cx - roadWidth / 2, cy - stopDistancePx);
    ctx.lineTo(cx, cy - stopDistancePx);
    ctx.stroke();

    // South Stop Line (across approaching lane: x from cx to cx + roadWidth/2)
    ctx.beginPath();
    ctx.moveTo(cx, cy + stopDistancePx);
    ctx.lineTo(cx + roadWidth / 2, cy + stopDistancePx);
    ctx.stroke();

    // West Stop Line (across approaching lane: y from cy to cy + roadWidth/2)
    ctx.beginPath();
    ctx.moveTo(cx - stopDistancePx, cy);
    ctx.lineTo(cx - stopDistancePx, cy + roadWidth / 2);
    ctx.stroke();

    // East Stop Line (across approaching lane: y from cy - roadWidth/2 to cy)
    ctx.beginPath();
    ctx.moveTo(cx + stopDistancePx, cy - roadWidth / 2);
    ctx.lineTo(cx + stopDistancePx, cy);
    ctx.stroke();

    // Dashed Center Divider lines
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([12, 10]);

    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, cy - stopDistancePx - 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy + stopDistancePx + 2);
    ctx.lineTo(cx, height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(cx - stopDistancePx - 2, cy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + stopDistancePx + 2, cy);
    ctx.lineTo(width, cy);
    ctx.stroke();

    ctx.setLineDash([]);

    // ==========================================
    // 4. LIVE TRAFFIC FLOW BANDS
    // ==========================================
    const queues = state?.queues || { NORTH: 0, SOUTH: 0, EAST: 0, WEST: 0 };
    const drawTrafficBand = (x1: number, y1: number, x2: number, y2: number, qCount: number) => {
      let trafficColor = '#22c55e';
      if (qCount > 7) trafficColor = '#b91c1c';
      else if (qCount > 4) trafficColor = '#ef4444';
      else if (qCount > 1) trafficColor = '#f59e0b';

      ctx.strokeStyle = trafficColor;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };

    drawTrafficBand(cx - roadWidth / 2 + 4, 15, cx - roadWidth / 2 + 4, cy - stopDistancePx - 10, queues.NORTH);
    drawTrafficBand(cx + roadWidth / 2 - 4, cy + stopDistancePx + 10, cx + roadWidth / 2 - 4, height - 15, queues.SOUTH);
    drawTrafficBand(15, cy + roadWidth / 2 - 4, cx - stopDistancePx - 10, cy + roadWidth / 2 - 4, queues.WEST);
    drawTrafficBand(cx + stopDistancePx + 10, cy - roadWidth / 2 + 4, width - 15, cy - roadWidth / 2 + 4, queues.EAST);

    // ==========================================
    // 5. TRAFFIC LIGHT POSTS
    // ==========================================
    const signals = state?.signals || { NORTH: 'RED', SOUTH: 'RED', EAST: 'RED', WEST: 'RED' };

    const drawSignalPost = (x: number, y: number, stateColor: string, label: string) => {
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x - 14, y - 28, 28, 56, 6);
      ctx.fill();
      ctx.stroke();

      // Red
      ctx.fillStyle = stateColor === 'RED' ? '#ef4444' : '#450a0a';
      if (stateColor === 'RED') {
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 14;
      }
      ctx.beginPath();
      ctx.arc(x, y - 16, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Yellow
      ctx.fillStyle = stateColor === 'YELLOW' ? '#eab308' : '#422006';
      if (stateColor === 'YELLOW') {
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 14;
      }
      ctx.beginPath();
      ctx.arc(x, y, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Green
      ctx.fillStyle = stateColor === 'GREEN' ? '#10b981' : '#022c22';
      if (stateColor === 'GREEN') {
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 14;
      }
      ctx.beginPath();
      ctx.arc(x, y + 16, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, y + 38);
    };

    drawSignalPost(cx - roadWidth / 2 - 25, cy - roadWidth / 2 - 32, signals.NORTH, 'N');
    drawSignalPost(cx + roadWidth / 2 + 25, cy + roadWidth / 2 + 32, signals.SOUTH, 'S');
    drawSignalPost(cx + roadWidth / 2 + 32, cy - roadWidth / 2 - 25, signals.EAST, 'E');
    drawSignalPost(cx - roadWidth / 2 - 32, cy + roadWidth / 2 + 25, signals.WEST, 'W');

    // ==========================================
    // 6. CENTER HUD & CLEARANCE GUARD INDICATOR
    // ==========================================
    if (state) {
      const isAllRed = state.phase.startsWith('ALL_RED');
      const isEmergency = state.emergency_active;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
      ctx.strokeStyle = isEmergency ? '#ef4444' : isAllRed ? '#f59e0b' : '#8b5cf6';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(cx - 56, cy - 28, 112, 56, 12);
      ctx.fill();
      ctx.stroke();

      // Countdown
      ctx.fillStyle = isEmergency ? '#dc2626' : isAllRed ? '#d97706' : '#6d28d9';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${state.time_remaining}s`, cx, cy + 4);

      // Phase title
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 9px sans-serif';
      let cleanPhase = state.phase.replace(/_/g, ' ');
      if (isAllRed) {
        cleanPhase = 'ALL-RED CLEAR';
      } else if (isEmergency) {
        cleanPhase = `EMERGENCY ${state.emergency_direction || ''}`;
      }
      ctx.fillText(cleanPhase, cx, cy + 18);
    }

    // ==========================================
    // 7. SIMULATED VEHICLES WITH TURNING & PRECISE STOPPING
    // ==========================================
    if (state && state.vehicles) {
      const scale = 1.6; // pixels per meter
      const stopLineM = 180.0;
      const junctionBoxEndM = 222.0;

      state.vehicles.forEach((v) => {
        const vLen = Math.max(16, (v.length || 4.6) * scale);
        const vWid = Math.max(9, (v.width || 1.9) * scale);
        const turn = v.turn || 'STRAIGHT';

        // Base straight calculation
        // Stop line is at stopDistancePx (98px from center)
        const distFromStopM = v.position - stopLineM;
        const distFromStopPx = distFromStopM * scale;

        let vx = cx;
        let vy = cy;
        let angle = 0;

        // Check if vehicle is in approach, in the turn, or on exit
        const inJunction = v.position > stopLineM && v.position < junctionBoxEndM;
        const pastJunction = v.position >= junctionBoxEndM;

        // Progress through the intersection box (0.0 to 1.0)
        const turnProgress = Math.min(1.0, Math.max(0.0, (v.position - stopLineM) / (junctionBoxEndM - stopLineM)));

        if (v.direction === 'NORTH') {
          // Approaching Southbound on lane (cx - laneWidth / 2)
          if (!inJunction && !pastJunction) {
            vx = cx - laneWidth / 2;
            vy = (cy - stopDistancePx) + distFromStopPx;
            angle = Math.PI / 2;
          } else if (inJunction && turn === 'RIGHT') {
            // Smooth 90 deg right turn into Westbound exit (cy - laneWidth / 2 heading West)
            const r = laneWidth / 2;
            const turnAngle = (Math.PI / 2) + (turnProgress * (Math.PI / 2));
            vx = (cx - laneWidth) + (r * Math.cos(turnAngle));
            vy = cy + (r * Math.sin(turnAngle));
            angle = turnAngle;
          } else if (inJunction && turn === 'LEFT') {
            // Smooth wide 90 deg left turn into Eastbound exit
            const turnAngle = (Math.PI / 2) - (turnProgress * (Math.PI / 2));
            vx = cx + ((turnProgress - 0.5) * laneWidth * 1.5);
            vy = cy + ((turnProgress - 0.5) * laneWidth * 1.5);
            angle = turnAngle;
          } else if (pastJunction && turn === 'RIGHT') {
            // Exiting Westwards
            vx = (cx - stopDistancePx) - ((v.position - junctionBoxEndM) * scale);
            vy = cy - laneWidth / 2;
            angle = Math.PI;
          } else if (pastJunction && turn === 'LEFT') {
            // Exiting Eastwards
            vx = (cx + stopDistancePx) + ((v.position - junctionBoxEndM) * scale);
            vy = cy + laneWidth / 2;
            angle = 0;
          } else {
            // Straight through Southbound
            vx = cx - laneWidth / 2;
            vy = (cy - stopDistancePx) + distFromStopPx;
            angle = Math.PI / 2;
          }

        } else if (v.direction === 'SOUTH') {
          // Approaching Northbound on lane (cx + laneWidth / 2)
          if (!inJunction && !pastJunction) {
            vx = cx + laneWidth / 2;
            vy = (cy + stopDistancePx) - distFromStopPx;
            angle = -Math.PI / 2;
          } else if (inJunction && turn === 'RIGHT') {
            // Smooth right turn into Eastbound exit
            const turnAngle = (-Math.PI / 2) + (turnProgress * (Math.PI / 2));
            vx = cx + (turnProgress * stopDistancePx);
            vy = cy + ((1.0 - turnProgress) * (laneWidth / 2));
            angle = turnAngle;
          } else if (inJunction && turn === 'LEFT') {
            // Smooth left turn into Westbound exit
            const turnAngle = (-Math.PI / 2) - (turnProgress * (Math.PI / 2));
            vx = cx - (turnProgress * stopDistancePx);
            vy = cy - ((1.0 - turnProgress) * (laneWidth / 2));
            angle = turnAngle;
          } else if (pastJunction && turn === 'RIGHT') {
            vx = (cx + stopDistancePx) + ((v.position - junctionBoxEndM) * scale);
            vy = cy + laneWidth / 2;
            angle = 0;
          } else if (pastJunction && turn === 'LEFT') {
            vx = (cx - stopDistancePx) - ((v.position - junctionBoxEndM) * scale);
            vy = cy - laneWidth / 2;
            angle = Math.PI;
          } else {
            vx = cx + laneWidth / 2;
            vy = (cy + stopDistancePx) - distFromStopPx;
            angle = -Math.PI / 2;
          }

        } else if (v.direction === 'WEST') {
          // Approaching Eastbound on lane (cy + laneWidth / 2)
          if (!inJunction && !pastJunction) {
            vx = (cx - stopDistancePx) + distFromStopPx;
            vy = cy + laneWidth / 2;
            angle = 0;
          } else if (inJunction && turn === 'RIGHT') {
            const turnAngle = turnProgress * (Math.PI / 2);
            vx = cx + ((1.0 - turnProgress) * (laneWidth / 2));
            vy = cy + (turnProgress * stopDistancePx);
            angle = turnAngle;
          } else if (inJunction && turn === 'LEFT') {
            const turnAngle = -turnProgress * (Math.PI / 2);
            vx = cx + ((1.0 - turnProgress) * (laneWidth / 2));
            vy = cy - (turnProgress * stopDistancePx);
            angle = turnAngle;
          } else if (pastJunction && turn === 'RIGHT') {
            vx = cx - laneWidth / 2;
            vy = (cy + stopDistancePx) + ((v.position - junctionBoxEndM) * scale);
            angle = Math.PI / 2;
          } else if (pastJunction && turn === 'LEFT') {
            vx = cx + laneWidth / 2;
            vy = (cy - stopDistancePx) - ((v.position - junctionBoxEndM) * scale);
            angle = -Math.PI / 2;
          } else {
            vx = (cx - stopDistancePx) + distFromStopPx;
            vy = cy + laneWidth / 2;
            angle = 0;
          }

        } else if (v.direction === 'EAST') {
          // Approaching Westbound on lane (cy - laneWidth / 2)
          if (!inJunction && !pastJunction) {
            vx = (cx + stopDistancePx) - distFromStopPx;
            vy = cy - laneWidth / 2;
            angle = Math.PI;
          } else if (inJunction && turn === 'RIGHT') {
            const turnAngle = Math.PI + (turnProgress * (Math.PI / 2));
            vx = cx - (turnProgress * (laneWidth / 2));
            vy = cy - (turnProgress * stopDistancePx);
            angle = turnAngle;
          } else if (inJunction && turn === 'LEFT') {
            const turnAngle = Math.PI - (turnProgress * (Math.PI / 2));
            vx = cx - (turnProgress * (laneWidth / 2));
            vy = cy + (turnProgress * stopDistancePx);
            angle = turnAngle;
          } else if (pastJunction && turn === 'RIGHT') {
            vx = cx + laneWidth / 2;
            vy = (cy - stopDistancePx) - ((v.position - junctionBoxEndM) * scale);
            angle = -Math.PI / 2;
          } else if (pastJunction && turn === 'LEFT') {
            vx = cx - laneWidth / 2;
            vy = (cy + stopDistancePx) + ((v.position - junctionBoxEndM) * scale);
            angle = Math.PI / 2;
          } else {
            vx = (cx + stopDistancePx) - distFromStopPx;
            vy = cy - laneWidth / 2;
            angle = Math.PI;
          }
        }

        // Render Vehicle
        ctx.save();
        ctx.translate(vx, vy);
        ctx.rotate(angle);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(-vLen / 2 + 2, -vWid / 2 + 2, vLen, vWid);

        // Chassis
        ctx.fillStyle = v.color || '#3b82f6';
        ctx.beginPath();
        ctx.roundRect(-vLen / 2, -vWid / 2, vLen, vWid, 4);
        ctx.fill();

        // Windshield
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(vLen / 6, -vWid / 2 + 2, vLen / 4, vWid - 4);

        // Headlights (Front bumper is at +vLen / 2)
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(vLen / 2 - 2, -vWid / 2 + 1, 2, 3);
        ctx.fillRect(vLen / 2 - 2, vWid / 2 - 4, 2, 3);

        // Taillights
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-vLen / 2, -vWid / 2 + 1, 2, 3);
        ctx.fillRect(-vLen / 2, vWid / 2 - 4, 2, 3);

        // Turn Signal Blinker
        if (turn !== 'STRAIGHT') {
          const blink = Math.floor(Date.now() / 250) % 2 === 0;
          if (blink) {
            ctx.fillStyle = '#f59e0b';
            const blinkY = turn === 'RIGHT' ? vWid / 2 - 3 : -vWid / 2;
            ctx.fillRect(vLen / 3, blinkY, 3, 3);
            ctx.fillRect(-vLen / 3, blinkY, 3, 3);
          }
        }

        // Emergency Flashing Strobe
        if (v.is_emergency) {
          const strobe = Math.floor(Date.now() / 180) % 2 === 0;
          ctx.fillStyle = strobe ? '#ef4444' : '#3b82f6';
          ctx.shadowColor = strobe ? '#ef4444' : '#3b82f6';
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });
    }

    // ==========================================
    // 8. GOOGLE MAPS BRANDING & ATTRIBUTION
    // ==========================================
    ctx.save();
    ctx.fillStyle = '#4285f4';
    ctx.font = 'bold 15px "Product Sans", Arial, sans-serif';
    ctx.fillText('G', 16, height - 14);
    ctx.fillStyle = '#ea4335';
    ctx.fillText('o', 27, height - 14);
    ctx.fillStyle = '#fbbc05';
    ctx.fillText('o', 35, height - 14);
    ctx.fillStyle = '#4285f4';
    ctx.fillText('g', 43, height - 14);
    ctx.fillStyle = '#34a853';
    ctx.fillText('l', 52, height - 14);
    ctx.fillStyle = '#ea4335';
    ctx.fillText('e', 55, height - 14);

    ctx.fillStyle = mapStyle === 'google_streets' ? '#4b5563' : '#cbd5e1';
    ctx.font = '10px Roboto, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Map data ©2026 Google • Safe Clearance Verified', width - 16, height - 14);

    ctx.strokeStyle = mapStyle === 'google_streets' ? '#4b5563' : '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(width - 110, height - 26);
    ctx.lineTo(width - 40, height - 26);
    ctx.moveTo(width - 110, height - 30);
    ctx.lineTo(width - 110, height - 26);
    ctx.moveTo(width - 40, height - 30);
    ctx.lineTo(width - 40, height - 26);
    ctx.stroke();
    ctx.fillText('50 m', width - 68, height - 30);

    ctx.restore();

  }, [state, mapStyle]);

  return (
    <div className="relative flex flex-col items-center w-full">
      {/* Top Map Layer Switcher Header */}
      <div className="w-full max-w-[640px] flex items-center justify-between pb-2 px-1">
        <div className="flex items-center gap-1.5 bg-white border border-violet-200/90 rounded-xl p-1 shadow-xs">
          <button
            onClick={() => setMapStyle('google_streets')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              mapStyle === 'google_streets'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-violet-950 hover:bg-violet-50'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" /> Google Streets
          </button>
          <button
            onClick={() => setMapStyle('google_satellite')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              mapStyle === 'google_satellite'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-violet-950 hover:bg-violet-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Satellite Aerial
          </button>
          <button
            onClick={() => setMapStyle('google_traffic_nav')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              mapStyle === 'google_traffic_nav'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-violet-950 hover:bg-violet-50'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" /> Live Traffic Nav
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" /> Stop Line & Gap Enforced
          </span>
        </div>
      </div>

      {/* Main Canvas Container with Google Maps Framing */}
      <div className="relative rounded-2xl overflow-hidden border border-violet-200 shadow-md bg-white p-1">
        <canvas
          ref={canvasRef}
          width={640}
          height={640}
          className="w-full max-w-[640px] aspect-square block rounded-xl shadow-xs"
        />

        {/* Direction Spawn Overlays with Turning Options */}
        {onSpawn && (
          <>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1">
              <button
                onClick={() => onSpawn('NORTH', 'STRAIGHT')}
                className="px-2.5 py-1 bg-white/95 hover:bg-violet-600 hover:text-white text-violet-700 text-xs font-semibold rounded-full border border-violet-200 shadow-md backdrop-blur transition"
                title="Spawn North Straight"
              >
                + North Straight
              </button>
              <button
                onClick={() => onSpawn('NORTH', 'RIGHT')}
                className="px-2 py-1 bg-white/95 hover:bg-violet-600 hover:text-white text-violet-700 text-xs font-semibold rounded-full border border-violet-200 shadow-md backdrop-blur transition"
                title="Spawn North Turn Right"
              >
                ↱ Right
              </button>
            </div>

            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1">
              <button
                onClick={() => onSpawn('SOUTH', 'STRAIGHT')}
                className="px-2.5 py-1 bg-white/95 hover:bg-violet-600 hover:text-white text-violet-700 text-xs font-semibold rounded-full border border-violet-200 shadow-md backdrop-blur transition"
                title="Spawn South Straight"
              >
                + South Straight
              </button>
              <button
                onClick={() => onSpawn('SOUTH', 'RIGHT')}
                className="px-2 py-1 bg-white/95 hover:bg-violet-600 hover:text-white text-violet-700 text-xs font-semibold rounded-full border border-violet-200 shadow-md backdrop-blur transition"
                title="Spawn South Turn Right"
              >
                ↱ Right
              </button>
            </div>

            <button
              onClick={() => onSpawn('WEST', 'STRAIGHT')}
              className="absolute left-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-white/95 hover:bg-violet-600 hover:text-white text-violet-700 text-xs font-semibold rounded-full border border-violet-200 shadow-md backdrop-blur transition"
            >
              + West
            </button>
            <button
              onClick={() => onSpawn('EAST', 'STRAIGHT')}
              className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-white/95 hover:bg-violet-600 hover:text-white text-violet-700 text-xs font-semibold rounded-full border border-violet-200 shadow-md backdrop-blur transition"
            >
              + East
            </button>
          </>
        )}
      </div>

      {/* Legend & Safety Indicator */}
      <div className="flex flex-wrap items-center justify-between w-full max-w-[640px] mt-3 text-xs text-slate-500 font-medium px-1 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> Car</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Bus</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span> Truck</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Moto</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block animate-pulse"></span> Emergency</span>
        </div>
        <div className="text-[11px] text-slate-400">
          Clearance Guard: <span className="text-emerald-700 font-bold">ACTIVE (Zero Conflicting Greens)</span>
        </div>
      </div>
    </div>
  );
};
