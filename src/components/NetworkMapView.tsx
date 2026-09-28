import React, { useState } from 'react';
import { 
  Map, 
  CircleDot, 
  GitCommit, 
  Truck, 
  Info, 
  Compass, 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  ArrowLeft,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Eye,
  Sliders,
  Filter,
  Smartphone,
  Phone
} from 'lucide-react';
import { Equipment, Manhole, Pipeline, IncidentTicket } from '../types/sewage';

interface NetworkMapViewProps {
  manholes: Manhole[];
  pipelines: Pipeline[];
  equipment: Equipment[];
  incidentTickets?: IncidentTicket[];
  onSelectManhole?: (manhole: Manhole) => void;
  onOpenMobileReport?: () => void;
}

type HeatmapMetric = 'all' | 'silt_blockage' | 'critical_only' | 'deep_manholes';

export const NetworkMapView: React.FC<NetworkMapViewProps> = ({
  manholes,
  pipelines,
  equipment,
  incidentTickets = [],
  onSelectManhole,
  onOpenMobileReport
}) => {
  const [selectedManhole, setSelectedManhole] = useState<Manhole | null>(manholes[2] || null);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<IncidentTicket | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showIncidents, setShowIncidents] = useState<boolean>(true);
  
  // Heatmap Controls State
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(0.75);
  const [heatmapMetric, setHeatmapMetric] = useState<HeatmapMetric>('all');
  const [showFleet, setShowFleet] = useState<boolean>(true);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'cleaned':
      case 'flushed':
        return '#10b981'; // emerald-500
      case 'in_progress':
        return '#06b6d4'; // cyan-500
      case 'critical':
        return '#f43f5e'; // rose-500
      default:
        return '#f59e0b'; // amber-500
    }
  };

  // Helper to compute heat intensity for a manhole (0 to 1)
  const getManholeHeatIntensity = (mh: Manhole): number => {
    if (heatmapMetric === 'critical_only') {
      return mh.status === 'critical' ? 1.0 : (mh.siltLevelPercent >= 70 ? 0.7 : 0);
    }
    if (heatmapMetric === 'deep_manholes') {
      return Math.min(Math.max((mh.depth - 1.5) / 5, 0), 1.0);
    }
    // Silt and blockage combined
    const siltWeight = mh.siltLevelPercent / 100;
    const isCriticalBonus = mh.status === 'critical' ? 0.25 : 0;
    const depthFactor = mh.depth > 3.5 ? 0.15 : 0;
    return Math.min(siltWeight + isCriticalBonus + depthFactor, 1.0);
  };

  // Compute heatmap gradient color based on intensity (0.0 to 1.0)
  const getHeatColor = (intensity: number): string => {
    if (intensity >= 0.75) return 'rgba(239, 68, 68, 0.85)'; // Intense red
    if (intensity >= 0.5) return 'rgba(249, 115, 22, 0.75)'; // Orange
    if (intensity >= 0.3) return 'rgba(234, 179, 8, 0.65)';  // Amber / yellow
    return 'rgba(56, 189, 248, 0.45)'; // Low intensity cyan / blue
  };

  // Compute overall zone blockage density stats
  const highRiskManholes = manholes.filter(m => m.status === 'critical' || m.siltLevelPercent >= 70);
  const highRiskLines = pipelines.filter(p => p.status === 'critical' || p.blockagePercent >= 60);

  return (
    <div className="space-y-6">
      
      {/* Header and Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Map className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-black text-white">المخطط الطبوغرافي والخريطة الحرارية (GIS Heatmap & Network)</h2>
              <span className="text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Flame className="w-3 h-3 text-rose-400 fill-rose-400" />
                تحليل الكثافة الحرارية
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              تمثيل طوبولوجي تفاعلي لخطوط ومطابق الصرف الصحي مزود بخريطة حرارية (Heatmap) توضح مناطق تركز الانسدادات ونسب الترسيب المرتفعة لتوجيه أساطيل التطهير للمناطق الأكثر إلحاحاً.
            </p>
          </div>

          {/* Quick Heatmap Toggle & Stats */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                showHeatmap 
                  ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-lg shadow-rose-950/50 border border-rose-400/40' 
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${showHeatmap ? 'fill-white animate-pulse' : ''}`} />
              <span>{showHeatmap ? 'الخريطة الحرارية: نشطة' : 'تفعيل الخريطة الحرارية'}</span>
            </button>

            <button
              onClick={() => setShowFleet(!showFleet)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                showFleet 
                  ? 'bg-slate-800 border border-cyan-500/50 text-cyan-300' 
                  : 'bg-slate-800/60 border border-slate-700 text-slate-500'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>مواقع المعدات</span>
            </button>

            <button
              onClick={() => setShowIncidents(!showIncidents)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                showIncidents 
                  ? 'bg-rose-950/80 border border-rose-500/60 text-rose-300 shadow-md shadow-rose-950/40' 
                  : 'bg-slate-800/60 border border-slate-700 text-slate-500'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-rose-400" />
              <span>بلاغات الموبايل ({incidentTickets.filter(t => t.status !== 'resolved').length})</span>
            </button>

            {onOpenMobileReport && (
              <button
                onClick={onOpenMobileReport}
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-cyan-950/50"
              >
                <span>+ بلاغ طارئ جديد</span>
              </button>
            )}
          </div>
        </div>

        {/* Heatmap Customization & Legend Subbar */}
        <div className="pt-3 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          
          {/* Heatmap Filters */}
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              معيار الكثافة:
            </span>
            <select
              value={heatmapMetric}
              onChange={(e) => setHeatmapMetric(e.target.value as HeatmapMetric)}
              disabled={!showHeatmap}
              className="bg-slate-850 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-medium focus:outline-none focus:border-cyan-500 disabled:opacity-40 cursor-pointer"
            >
              <option value="all">كافة معايير الخطورة (ترسيب + انسداد + عمق)</option>
              <option value="silt_blockage">نسبة الترسيب بالحمأة والشحوم (% Silt)</option>
              <option value="critical_only">البؤر والانسدادات الحرجة فقط (Critical Spots)</option>
              <option value="deep_manholes">المطابق العميقة (&gt; 3.5 م - كباش)</option>
            </select>

            {/* Opacity Slider */}
            {showHeatmap && (
              <div className="flex items-center gap-2 mr-3 bg-slate-850 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px]">الشفافية:</span>
                <input
                  type="range"
                  min="0.3"
                  max="1.0"
                  step="0.05"
                  value={heatmapOpacity}
                  onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
                  className="w-16 accent-rose-500 cursor-pointer"
                />
                <span className="text-[10px] font-mono text-slate-300">{Math.round(heatmapOpacity * 100)}%</span>
              </div>
            )}
          </div>

          {/* Color Gradient Legend */}
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-[11px]">مؤشر الكثافة الحرارية:</span>
            <div className="flex items-center gap-1 font-mono text-[10px]">
              <span className="text-cyan-400 font-semibold">منخفض</span>
              <div className="w-24 h-2.5 rounded-full bg-gradient-to-r from-sky-400 via-amber-400 to-rose-600 shadow-inner" />
              <span className="text-rose-400 font-black">حرج شديد</span>
            </div>
          </div>

        </div>

      </div>

      {/* Main Interactive Map & Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* SVG Interactive Topology Canvas (3 Columns) */}
        <div className="lg:col-span-3 bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-2xl relative overflow-hidden min-h-[540px] flex flex-col justify-between">
          
          {/* Zoom controls */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 bg-slate-900/90 border border-slate-700 p-1.5 rounded-xl shadow-lg">
            <button 
              onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 1.8))}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              title="تكبير"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.8))}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              title="تصغير"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setZoomLevel(1)}
              className="text-[10px] font-mono px-1 py-0.5 rounded text-cyan-400 hover:bg-slate-800 cursor-pointer"
              title="إعادة ضبط"
            >
              100%
            </button>
          </div>

          {/* Compass & Heatmap Alert Badge */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            {showHeatmap && (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-300 bg-rose-950/90 border border-rose-700/60 px-2.5 py-1 rounded-lg backdrop-blur-sm animate-pulse">
                <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                <span>رصد {highRiskManholes.length} مطابق حرجة و {highRiskLines.length} خطوط مسدودة</span>
              </div>
            )}
            
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>شمال جغرافي</span>
            </div>
          </div>

          {/* Interactive SVG Canvas */}
          <div className="w-full h-full flex-1 flex items-center justify-center overflow-auto p-4">
            <svg 
              viewBox="0 0 1000 650" 
              className="w-full h-[500px] select-none transition-transform duration-300"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
            >
              <defs>
                {/* Background Grid Pattern */}
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" opacity="0.6" />
                </pattern>
                
                {/* Flow Arrow Markers */}
                <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#06b6d4" opacity="0.8" />
                </marker>
                <marker id="arrow-critical" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" opacity="0.9" />
                </marker>

                {/* Heatmap Radial Gradients */}
                <radialGradient id="heat-critical" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                  <stop offset="35%" stopColor="#f97316" stopOpacity="0.5" />
                  <stop offset="70%" stopColor="#eab308" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </radialGradient>

                <radialGradient id="heat-high" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.75" />
                  <stop offset="45%" stopColor="#eab308" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                </radialGradient>

                <radialGradient id="heat-medium" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#eab308" stopOpacity="0.6" />
                  <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
                </radialGradient>

                <radialGradient id="heat-low" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </radialGradient>

                {/* Pipeline Heat Glow Filter */}
                <filter id="heat-blur" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="10" result="blur" />
                </filter>
              </defs>

              {/* Grid Background */}
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* ---------------- HEATMAP LAYER ---------------- */}
              {showHeatmap && (
                <g id="heatmap-layer" opacity={heatmapOpacity} className="transition-opacity duration-300">
                  
                  {/* Pipeline Heatmap Corridors */}
                  {pipelines.map((line) => {
                    const fromMh = manholes.find(m => m.code === line.fromManholeCode);
                    const toMh = manholes.find(m => m.code === line.toManholeCode);
                    if (!fromMh || !toMh) return null;

                    const x1 = fromMh.coordinates.x * 9.5 + 30;
                    const y1 = fromMh.coordinates.y * 5.8 + 30;
                    const x2 = toMh.coordinates.x * 9.5 + 30;
                    const y2 = toMh.coordinates.y * 5.8 + 30;

                    let heatStroke = '#06b6d4';
                    let heatWidth = 14;
                    if (line.blockagePercent >= 75 || line.status === 'critical') {
                      heatStroke = '#ef4444';
                      heatWidth = 36;
                    } else if (line.blockagePercent >= 50) {
                      heatStroke = '#f97316';
                      heatWidth = 26;
                    } else if (line.blockagePercent >= 30) {
                      heatStroke = '#eab308';
                      heatWidth = 18;
                    }

                    return (
                      <line
                        key={`heat-line-${line.id}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={heatStroke}
                        strokeWidth={heatWidth}
                        strokeLinecap="round"
                        opacity="0.65"
                        filter="url(#heat-blur)"
                      />
                    );
                  })}

                  {/* Manhole Heatmap Thermal Blobs */}
                  {manholes.map((mh) => {
                    const cx = mh.coordinates.x * 9.5 + 30;
                    const cy = mh.coordinates.y * 5.8 + 30;
                    const intensity = getManholeHeatIntensity(mh);
                    if (intensity <= 0.05) return null;

                    // Calculate radius according to intensity and depth
                    const radius = 35 + (intensity * 45) + (mh.depth > 3.5 ? 15 : 0);
                    let gradId = 'url(#heat-low)';
                    if (intensity >= 0.75) gradId = 'url(#heat-critical)';
                    else if (intensity >= 0.5) gradId = 'url(#heat-high)';
                    else if (intensity >= 0.25) gradId = 'url(#heat-medium)';

                    return (
                      <g key={`heat-blob-${mh.id}`}>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={radius}
                          fill={gradId}
                          pointerEvents="none"
                        />
                        {/* High risk hotspot pulsing ring */}
                        {intensity >= 0.75 && (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={radius * 0.6}
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="1.5"
                            strokeDasharray="4 4"
                            opacity="0.7"
                            className="animate-pulse"
                            pointerEvents="none"
                          />
                        )}
                      </g>
                    );
                  })}

                </g>
              )}

              {/* ---------------- PIPELINES PHYSICAL LAYER ---------------- */}
              {pipelines.map((line) => {
                const fromMh = manholes.find(m => m.code === line.fromManholeCode);
                const toMh = manholes.find(m => m.code === line.toManholeCode);
                if (!fromMh || !toMh) return null;

                const x1 = fromMh.coordinates.x * 9.5 + 30;
                const y1 = fromMh.coordinates.y * 5.8 + 30;
                const x2 = toMh.coordinates.x * 9.5 + 30;
                const y2 = toMh.coordinates.y * 5.8 + 30;

                const isSelected = selectedPipeline?.id === line.id;
                const strokeColor = getStatusColor(line.status);
                const strokeWidth = Math.max(line.diameter / 100, 3);

                return (
                  <g key={line.id} className="cursor-pointer" onClick={() => { setSelectedPipeline(line); setSelectedManhole(null); }}>
                    {/* Glow outline on selection */}
                    {isSelected && (
                      <line
                        x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke="#38bdf8"
                        strokeWidth={strokeWidth + 6}
                        opacity="0.8"
                        strokeLinecap="round"
                      />
                    )}

                    {/* The pipeline line */}
                    <line
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={line.status === 'in_progress' ? '8 4' : undefined}
                      strokeLinecap="round"
                      markerEnd={line.status === 'critical' ? 'url(#arrow-critical)' : 'url(#arrow)'}
                      className="transition-all hover:opacity-100"
                      opacity="0.9"
                    />

                    {/* Pipe Label */}
                    <text
                      x={(x1 + x2) / 2}
                      y={(y1 + y2) / 2 - 8}
                      fill="#e2e8f0"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="select-none pointer-events-none drop-shadow"
                    >
                      {line.code} {line.blockagePercent >= 60 ? `⚠️ ${line.blockagePercent}%` : `(Ø${line.diameter})`}
                    </text>
                  </g>
                );
              })}

              {/* ---------------- MANHOLES PHYSICAL LAYER ---------------- */}
              {manholes.map((mh) => {
                const cx = mh.coordinates.x * 9.5 + 30;
                const cy = mh.coordinates.y * 5.8 + 30;
                const isSelected = selectedManhole?.id === mh.id;
                const nodeColor = getStatusColor(mh.status);
                const isDeep = mh.depth >= 3.5;
                const isCritical = mh.status === 'critical' || mh.siltLevelPercent >= 70;

                return (
                  <g 
                    key={mh.id} 
                    className="cursor-pointer group" 
                    onClick={() => { setSelectedManhole(mh); setSelectedPipeline(null); }}
                  >
                    {/* Halo on selection */}
                    {isSelected && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={24}
                        fill="#06b6d4"
                        opacity="0.4"
                        className="animate-pulse"
                      />
                    )}

                    {/* Critical Alert Ping Indicator */}
                    {isCritical && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={20}
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="2"
                        className="animate-ping"
                        opacity="0.5"
                      />
                    )}

                    {/* Outer ring */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isDeep ? 16 : 13}
                      fill="#0f172a"
                      stroke={nodeColor}
                      strokeWidth={isDeep ? "3.5" : "2.5"}
                    />

                    {/* Center point */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isDeep ? 7 : 5}
                      fill={nodeColor}
                    />

                    {/* Node label */}
                    <text
                      x={cx}
                      y={cy + 24}
                      fill={isSelected ? '#38bdf8' : '#ffffff'}
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="select-none pointer-events-none drop-shadow"
                    >
                      {mh.code}
                    </text>
                    <text
                      x={cx}
                      y={cy + 35}
                      fill={isCritical ? '#fca5a5' : '#94a3b8'}
                      fontSize="9"
                      fontWeight={isCritical ? 'bold' : 'normal'}
                      fontFamily="sans-serif"
                      textAnchor="middle"
                      className="select-none pointer-events-none drop-shadow"
                    >
                      {mh.depth}م | {mh.siltLevelPercent}%
                    </text>
                  </g>
                );
              })}

              {/* ---------------- MACHINERY LIVE POSITIONS ---------------- */}
              {showFleet && (
                <>
                  <g transform="translate(180, 185)" className="cursor-pointer">
                    <rect width="70" height="22" rx="6" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
                    <text x="35" y="15" fill="#f59e0b" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      JET-01 🚛
                    </text>
                  </g>

                  <g transform="translate(420, 205)" className="cursor-pointer">
                    <rect width="80" height="22" rx="6" fill="#0f172a" stroke="#a855f7" strokeWidth="1.5" />
                    <text x="40" y="15" fill="#d8b4fe" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      GRAB-01 🏗️
                    </text>
                  </g>

                  <g transform="translate(680, 310)" className="cursor-pointer">
                    <rect width="75" height="22" rx="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                    <text x="37" y="15" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      VAC-01 🚚
                    </text>
                  </g>
                </>
              )}

              {/* ---------------- MOBILE INCIDENT DISTRESS BEACONS ---------------- */}
              {showIncidents && incidentTickets.filter(t => t.status !== 'resolved').map((ticket, idx) => {
                const mh = manholes.find(m => m.code === ticket.targetManholeCode);
                let bx = 220 + (idx % 4) * 160;
                let by = 180 + Math.floor(idx / 4) * 80;
                if (mh) {
                  bx = mh.coordinates.x * 9.5 + 45;
                  by = mh.coordinates.y * 5.8 + 15;
                }
                const isSelected = selectedTicket?.id === ticket.id;

                return (
                  <g 
                    key={`incident-pin-${ticket.id}`}
                    transform={`translate(${bx}, ${by})`}
                    className="cursor-pointer group"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      if (mh) {
                        setSelectedManhole(mh);
                        setSelectedPipeline(null);
                      }
                    }}
                  >
                    {/* Distress pulsing ring */}
                    <circle cx="0" cy="0" r="16" fill="#f43f5e" opacity="0.35" className="animate-ping" />
                    <circle cx="0" cy="0" r="11" fill="#be123c" stroke="#ffffff" strokeWidth="2" />
                    <text x="0" y="4" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                      🚨
                    </text>

                    {/* Tag badge with ticket number */}
                    <g transform="translate(-45, -26)">
                      <rect width="90" height="20" rx="6" fill="#450a0a" stroke="#f43f5e" strokeWidth="1.2" />
                      <text x="45" y="13.5" fill="#fecdd3" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                        {ticket.ticketNumber}
                      </text>
                    </g>
                  </g>
                );
              })}

            </svg>
          </div>

          <div className="pt-2 border-t border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 gap-2">
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>المناطق ذات التوهج الأحمر/البرتقالي تمثل أعلى كثافة ترسبات وأولوية قصوى لسيارات النافورة والكباش.</span>
            </span>
            <span className="font-mono text-slate-500">GIS Coordinate System: UTM / WGS84</span>
          </div>

        </div>

        {/* Selected Element Engineering Card (1 Column) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          
          {selectedTicket && (
            <div className="bg-gradient-to-r from-rose-950/60 to-slate-900 border border-rose-500/60 rounded-xl p-3.5 space-y-2.5 text-xs text-right">
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-rose-300 bg-rose-950 px-2 py-0.5 rounded border border-rose-500/40">
                  🚨 {selectedTicket.ticketNumber}
                </span>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-slate-400 hover:text-white text-[11px] cursor-pointer"
                >
                  ✕ إغلاق
                </button>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm">{selectedTicket.issueType}</h4>
                <p className="text-[11px] text-slate-300 mt-0.5">{selectedTicket.description}</p>
              </div>

              <div className="bg-slate-950/80 p-2 rounded-lg text-[10px] space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">الموقع:</span>
                  <span className="text-white font-medium">{selectedTicket.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">المُبلّغ:</span>
                  <span className="text-white font-medium">{selectedTicket.reporterName} ({selectedTicket.reporterRole})</span>
                </div>
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-slate-400">الهاتف:</span>
                  <a href={`tel:${selectedTicket.reporterPhone}`} className="text-cyan-400 font-mono flex items-center gap-1">
                    <Phone className="w-2.5 h-2.5" />
                    <span>{selectedTicket.reporterPhone}</span>
                  </a>
                </div>
              </div>

              {selectedTicket.recommendedAction && (
                <div className="text-[10px] text-amber-300 bg-amber-950/40 p-2 rounded border border-amber-500/30">
                  <span className="font-bold block">التوصية الهندسية:</span>
                  <span>{selectedTicket.recommendedAction}</span>
                </div>
              )}
            </div>
          )}

          <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>البيانات الهندسية للعنصر المحدد</span>
          </h3>

          {selectedManhole && (
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-white text-base bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
                  {selectedManhole.code}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  selectedManhole.status === 'critical' ? 'bg-rose-950 text-rose-300' :
                  selectedManhole.status === 'cleaned' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                }`}>
                  {selectedManhole.status === 'critical' ? 'حرج' : selectedManhole.status === 'cleaned' ? 'تم التطهير' : 'يحتاج تطهير'}
                </span>
              </div>

              {/* Heatmap Risk Meter for this manhole */}
              <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-rose-400" />
                    مستوى الخطورة في الخريطة الحرارية:
                  </span>
                  <span className={`font-black font-mono ${
                    selectedManhole.siltLevelPercent >= 70 ? 'text-rose-400' :
                    selectedManhole.siltLevelPercent >= 40 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {selectedManhole.siltLevelPercent >= 70 ? 'مرتفع جداً (حرج)' :
                     selectedManhole.siltLevelPercent >= 40 ? 'متوسط (تطهير وقائي)' : 'طبيعي'}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-500" 
                    style={{ width: `${selectedManhole.siltLevelPercent}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 bg-slate-850 p-3 rounded-xl border border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">العمق الإنشائي:</span>
                  <span className={`font-bold font-mono ${selectedManhole.depth >= 3.5 ? 'text-purple-300' : 'text-white'}`}>
                    {selectedManhole.depth} م {selectedManhole.depth >= 3.5 ? '(عميق - كباش)' : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">القطر الداخلي:</span>
                  <span className="font-bold text-white font-mono">{selectedManhole.diameter} مم</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">نسبة الترسيب:</span>
                  <span className="font-bold text-rose-400 font-mono">{selectedManhole.siltLevelPercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">نوع الغطاء:</span>
                  <span className="text-slate-200">{selectedManhole.coverType}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 block font-bold">الموقع والشارع:</span>
                <p className="text-slate-300 text-xs font-medium">{selectedManhole.location}</p>
                <p className="text-[10px] text-slate-500">{selectedManhole.zone}</p>
              </div>

              <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-amber-400 font-bold block text-[11px]">المعدة الموصى بها:</span>
                <p className="text-slate-300 text-[11px]">
                  {selectedManhole.depth >= 3.5 ? 'كباش هيدروليكي (Grab Crane) مع مهمات دخول الأماكن المغلقة' : 'نافورة ضغط عالي مع طلمبة كسح'}
                </p>
              </div>

              {selectedManhole.notes && (
                <div className="text-[11px] text-slate-400 bg-slate-850 p-2.5 rounded-lg border border-slate-800">
                  {selectedManhole.notes}
                </div>
              )}
            </div>
          )}

          {selectedPipeline && (
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-amber-400 text-base bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
                  {selectedPipeline.code}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  selectedPipeline.status === 'critical' ? 'bg-rose-950 text-rose-300' :
                  selectedPipeline.status === 'flushed' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                }`}>
                  {selectedPipeline.status === 'critical' ? 'سدد حرج' : selectedPipeline.status === 'flushed' ? 'تم التمليس' : 'يحتاج تمليس'}
                </span>
              </div>

              {/* Heatmap corridor risk */}
              <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-400" />
                    كثافة انسداد الخط:
                  </span>
                  <span className={`font-black font-mono ${
                    selectedPipeline.blockagePercent >= 60 ? 'text-rose-400' :
                    selectedPipeline.blockagePercent >= 35 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {selectedPipeline.blockagePercent}% {selectedPipeline.blockagePercent >= 60 ? '(بؤرة حرجة)' : ''}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-600" 
                    style={{ width: `${selectedPipeline.blockagePercent}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 bg-slate-850 p-3 rounded-xl border border-slate-800 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">من المطبق:</span>
                  <span className="text-cyan-400 font-bold">{selectedPipeline.fromManholeCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">إلى المطبق:</span>
                  <span className="text-amber-400 font-bold">{selectedPipeline.toManholeCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">الطول:</span>
                  <span className="font-bold text-white">{selectedPipeline.length} م.ط</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">القطر الاسمي:</span>
                  <span className="font-bold text-white">Ø{selectedPipeline.diameter} مم</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">معدل الانحدار:</span>
                  <span className="text-slate-200">{selectedPipeline.slopePercent}%</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 block font-bold">مادة الماسورة ونوع الرواسب:</span>
                <p className="text-slate-200">{selectedPipeline.material}</p>
                <p className="text-amber-300 text-[11px]">{selectedPipeline.sedimentType}</p>
              </div>

              <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-cyan-400 font-bold block text-[11px]">طريقة التمليس الهندسية:</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">{selectedPipeline.recommendedMethod}</p>
              </div>
            </div>
          )}

          {!selectedManhole && !selectedPipeline && (
            <div className="text-center py-12 text-slate-500 text-xs">
              حدد مطبقاً أو خطاً على الخريطة لعرض تفاصيله الفنية.
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
