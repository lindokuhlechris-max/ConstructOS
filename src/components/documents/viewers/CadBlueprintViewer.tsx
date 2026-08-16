import React, { useState, useRef } from 'react';
import { Layers, ZoomIn, ZoomOut, RefreshCw, Maximize2, Download, Eye, Compass, Move, Ruler, CheckSquare, Square } from 'lucide-react';
import { DocumentItem } from '../../../types';
import { Button } from '../../ui';

interface CadBlueprintViewerProps {
  document: DocumentItem;
  src?: string | null;
  onDownload: () => void;
}

export function CadBlueprintViewer({ document: doc, onDownload }: CadBlueprintViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Layer Visibility Filters
  const [showGrids, setShowGrids] = useState(true);
  const [showWalls, setShowWalls] = useState(true);
  const [showMep, setShowMep] = useState(true);
  const [showElectrical, setShowElectrical] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(true);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#0B1528] overflow-hidden shadow-xs text-slate-100 select-none">
      {/* Top CAD Control Bar */}
      <div className="px-4 py-2.5 bg-[#0F1E38] border-b border-blue-900/60 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Layers className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-blue-100 truncate">{doc.title}</div>
            <div className="text-[10px] text-blue-400/80 font-mono flex items-center gap-1.5">
              <span>{doc.fileName}</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">CAD Vector Engine</span>
              <span>•</span>
              <span>Scale 1:50</span>
            </div>
          </div>
        </div>

        {/* Pan / Zoom Toolbar */}
        <div className="flex items-center gap-1.5 bg-[#0B1528] p-1 rounded-xl border border-blue-900/80">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            title="Zoom Out"
            className="p-1.5 hover:bg-blue-900/50 rounded-lg text-blue-300 hover:text-white disabled:opacity-40"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          
          <span className="text-xs font-mono font-bold px-1.5 text-blue-300 min-w-[45px] text-center">
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={zoom >= 3.5}
            title="Zoom In"
            className="p-1.5 hover:bg-blue-900/50 rounded-lg text-blue-300 hover:text-white disabled:opacity-40"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-blue-800 mx-0.5" />

          <button
            onClick={handleReset}
            title="Reset Canvas View"
            className="p-1.5 hover:bg-blue-900/50 rounded-lg text-blue-300 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        <Button
          size="sm"
          onClick={onDownload}
          className="h-8 px-3 rounded-lg text-xs font-bold gap-1.5 bg-[#0B5FFF] hover:bg-blue-600 text-white shadow-xs"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export Drawing</span>
        </Button>
      </div>

      {/* Layer Filter Toolbar */}
      <div className="px-4 py-1.5 bg-[#0A1224] border-b border-blue-950/80 flex items-center gap-4 text-xs font-mono text-slate-300 overflow-x-auto">
        <span className="text-[10px] font-bold uppercase text-blue-400 tracking-wider shrink-0 flex items-center gap-1">
          <Compass className="h-3 w-3" /> CAD Layers:
        </span>

        <button
          onClick={() => setShowGrids(!showGrids)}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors shrink-0 ${
            showGrids ? 'bg-blue-900/60 text-blue-200 border border-blue-700' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {showGrids ? <CheckSquare className="h-3 w-3 text-blue-400" /> : <Square className="h-3 w-3" />}
          <span>Grid (A-E / 1-8)</span>
        </button>

        <button
          onClick={() => setShowWalls(!showWalls)}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors shrink-0 ${
            showWalls ? 'bg-blue-900/60 text-blue-200 border border-blue-700' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {showWalls ? <CheckSquare className="h-3 w-3 text-blue-400" /> : <Square className="h-3 w-3" />}
          <span>Walls & Core</span>
        </button>

        <button
          onClick={() => setShowMep(!showMep)}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors shrink-0 ${
            showMep ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {showMep ? <CheckSquare className="h-3 w-3 text-emerald-400" /> : <Square className="h-3 w-3" />}
          <span>HVAC & Plumbing</span>
        </button>

        <button
          onClick={() => setShowElectrical(!showElectrical)}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors shrink-0 ${
            showElectrical ? 'bg-amber-950/70 text-amber-300 border border-amber-800' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {showElectrical ? <CheckSquare className="h-3 w-3 text-amber-400" /> : <Square className="h-3 w-3" />}
          <span>Electrical Conduits</span>
        </button>

        <button
          onClick={() => setShowDimensions(!showDimensions)}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors shrink-0 ${
            showDimensions ? 'bg-purple-950/70 text-purple-300 border border-purple-800' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {showDimensions ? <CheckSquare className="h-3 w-3 text-purple-400" /> : <Square className="h-3 w-3" />}
          <span>Dimensions (mm)</span>
        </button>
      </div>

      {/* Blueprint Drawing Viewport */}
      <div
        className={`relative flex-1 min-h-[460px] max-h-[580px] overflow-hidden bg-[#070D18] flex items-center justify-center ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Background Engineering Grid */}
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, #1E3A8A 1px, transparent 1px),
              linear-gradient(to bottom, #1E3A8A 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        />

        {/* Blueprint Vector Graphic */}
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
          className="relative pointer-events-none select-none"
        >
          <svg
            width="720"
            height="460"
            viewBox="0 0 720 460"
            className="drop-shadow-[0_0_20px_rgba(11,95,255,0.2)]"
          >
            {/* Outer Drawing Border */}
            <rect x="20" y="20" width="680" height="420" fill="none" stroke="#2563EB" strokeWidth="2" />
            <rect x="25" y="25" width="670" height="410" fill="none" stroke="#1D4ED8" strokeWidth="0.8" />

            {/* Grid Lines & Axis Bubbles */}
            {showGrids && (
              <g stroke="#3B82F6" strokeWidth="0.75" strokeDasharray="6,4" opacity="0.8">
                {/* Vertical Grids 1 to 6 */}
                <line x1="100" y1="40" x2="100" y2="400" />
                <line x1="200" y1="40" x2="200" y2="400" />
                <line x1="320" y1="40" x2="320" y2="400" />
                <line x1="440" y1="40" x2="440" y2="400" />
                <line x1="560" y1="40" x2="560" y2="400" />

                {/* Horizontal Grids A to D */}
                <line x1="60" y1="90" x2="620" y2="90" />
                <line x1="60" y1="180" x2="620" y2="180" />
                <line x1="60" y1="280" x2="620" y2="280" />
                <line x1="60" y1="370" x2="620" y2="370" />

                {/* Column Axis Markers */}
                <circle cx="100" cy="45" r="10" fill="#0F172A" stroke="#60A5FA" strokeWidth="1.2" />
                <text x="100" y="49" fill="#93C5FD" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">1</text>
                
                <circle cx="200" cy="45" r="10" fill="#0F172A" stroke="#60A5FA" strokeWidth="1.2" />
                <text x="200" y="49" fill="#93C5FD" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">2</text>
                
                <circle cx="320" cy="45" r="10" fill="#0F172A" stroke="#60A5FA" strokeWidth="1.2" />
                <text x="320" y="49" fill="#93C5FD" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">3</text>
                
                <circle cx="440" cy="45" r="10" fill="#0F172A" stroke="#60A5FA" strokeWidth="1.2" />
                <text x="440" y="49" fill="#93C5FD" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">4</text>
                
                <circle cx="560" cy="45" r="10" fill="#0F172A" stroke="#60A5FA" strokeWidth="1.2" />
                <text x="560" y="49" fill="#93C5FD" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">5</text>

                {/* Row Axis Markers */}
                <circle cx="65" cy="90" r="10" fill="#0F172A" stroke="#60A5FA" strokeWidth="1.2" />
                <text x="65" y="94" fill="#93C5FD" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">A</text>
                
                <circle cx="65" cy="180" r="10" fill="#0F172A" stroke="#60A5FA" strokeWidth="1.2" />
                <text x="65" y="184" fill="#93C5FD" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">B</text>
                
                <circle cx="65" cy="280" r="10" fill="#0F172A" stroke="#60A5FA" strokeWidth="1.2" />
                <text x="65" y="284" fill="#93C5FD" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">C</text>
                
                <circle cx="65" cy="370" r="10" fill="#0F172A" stroke="#60A5FA" strokeWidth="1.2" />
                <text x="65" y="374" fill="#93C5FD" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">D</text>
              </g>
            )}

            {/* Architectural Walls, Shear Core & Columns */}
            {showWalls && (
              <g fill="#1E293B" stroke="#93C5FD" strokeWidth="2.5">
                {/* External Building Perimeter */}
                <polygon points="100,90 560,90 560,370 100,370" fill="rgba(30, 58, 138, 0.15)" stroke="#60A5FA" strokeWidth="3" />

                {/* Elevator Shear Core */}
                <rect x="290" y="150" width="80" height="90" fill="#1E293B" stroke="#93C5FD" strokeWidth="2" />
                <line x1="290" y1="150" x2="370" y2="240" stroke="#64748B" strokeWidth="1" />
                <line x1="370" y1="150" x2="290" y2="240" stroke="#64748B" strokeWidth="1" />
                <text x="330" y="200" fill="#CBD5E1" fontSize="9" fontWeight="bold" textAnchor="middle">CORE / LIFT</text>

                {/* Interior Partition Walls */}
                <line x1="200" y1="90" x2="200" y2="220" stroke="#60A5FA" strokeWidth="2" />
                <line x1="200" y1="260" x2="200" y2="370" stroke="#60A5FA" strokeWidth="2" />
                <line x1="440" y1="90" x2="440" y2="240" stroke="#60A5FA" strokeWidth="2" />
                <line x1="440" y1="280" x2="440" y2="370" stroke="#60A5FA" strokeWidth="2" />

                {/* Structural Reinforced Columns */}
                {[
                  [100, 90], [200, 90], [320, 90], [440, 90], [560, 90],
                  [100, 180], [560, 180],
                  [100, 280], [560, 280],
                  [100, 370], [200, 370], [320, 370], [440, 370], [560, 370]
                ].map(([cx, cy], i) => (
                  <rect key={i} x={cx - 7} y={cy - 7} width="14" height="14" fill="#3B82F6" stroke="#93C5FD" strokeWidth="1" />
                ))}
              </g>
            )}

            {/* MEP (HVAC Ducts & Plumbing Lines) */}
            {showMep && (
              <g stroke="#10B981" strokeWidth="1.5" fill="none" strokeDasharray="4,2">
                <path d="M 120,130 L 270,130 L 270,200 L 420,200 L 530,200" />
                <path d="M 140,320 L 270,320 L 420,320 L 520,320" />
                <rect x="255" y="122" width="16" height="16" fill="rgba(16, 185, 129, 0.2)" stroke="#10B981" />
                <text x="263" y="134" fill="#34D399" fontSize="8" fontWeight="bold" textAnchor="middle">AHU</text>
                <text x="180" y="124" fill="#34D399" fontSize="8" fontFamily="monospace">DUCT 400x250</text>
              </g>
            )}

            {/* Electrical Conduits & Fixtures */}
            {showElectrical && (
              <g stroke="#F59E0B" strokeWidth="1.2" fill="none">
                <circle cx="150" cy="140" r="4" fill="#F59E0B" />
                <circle cx="260" cy="140" r="4" fill="#F59E0B" />
                <circle cx="390" cy="140" r="4" fill="#F59E0B" />
                <circle cx="500" cy="140" r="4" fill="#F59E0B" />
                <path d="M 150,140 Q 200,160 260,140 T 390,140 T 500,140" strokeDasharray="3,3" />
                <text x="150" y="160" fill="#FBBF24" fontSize="8" textAnchor="middle">DB-L1</text>
              </g>
            )}

            {/* Dimensions */}
            {showDimensions && (
              <g stroke="#C084FC" strokeWidth="1" fill="#E9D5FF" fontSize="9" fontFamily="monospace">
                {/* Top Total Dimension */}
                <line x1="100" y1="65" x2="560" y2="65" />
                <line x1="100" y1="60" x2="100" y2="70" />
                <line x1="560" y1="60" x2="560" y2="70" />
                <text x="330" y="60" textAnchor="middle" fontWeight="bold">46,000 mm (46.0m)</text>

                {/* Left Total Dimension */}
                <line x1="40" y1="90" x2="40" y2="370" />
                <line x1="35" y1="90" x2="45" y2="90" />
                <line x1="35" y1="370" x2="45" y2="370" />
                <text x="30" y="235" textAnchor="middle" transform="rotate(-90 30 235)" fontWeight="bold">28,000 mm (28.0m)</text>
              </g>
            )}

            {/* Engineering Title Block */}
            <g transform="translate(430, 310)">
              <rect x="0" y="0" width="260" height="115" fill="#0A1224" stroke="#3B82F6" strokeWidth="1.5" />
              <line x1="0" y1="30" x2="260" y2="30" stroke="#1E3A8A" strokeWidth="1" />
              <line x1="0" y1="60" x2="260" y2="60" stroke="#1E3A8A" strokeWidth="1" />
              <line x1="0" y1="90" x2="260" y2="90" stroke="#1E3A8A" strokeWidth="1" />
              <line x1="130" y1="60" x2="130" y2="115" stroke="#1E3A8A" strokeWidth="1" />

              <text x="10" y="20" fill="#93C5FD" fontSize="11" fontWeight="bold" fontFamily="sans-serif">CONSTRUCTOS PROJECT CAD</text>
              <text x="10" y="48" fill="#FFFFFF" fontSize="10" fontWeight="bold">{doc.title.slice(0, 30)}</text>
              <text x="10" y="78" fill="#94A3B8" fontSize="8" fontFamily="monospace">SCALE: 1:50 @ A1</text>
              <text x="140" y="78" fill="#94A3B8" fontSize="8" fontFamily="monospace">REV: {doc.version}</text>
              <text x="10" y="105" fill="#94A3B8" fontSize="8" fontFamily="monospace">DWG: {doc.id}</text>
              <text x="140" y="105" fill="#34D399" fontSize="8" fontWeight="bold" fontFamily="monospace">STATUS: {doc.status}</text>
            </g>
          </svg>
        </div>

        {/* Bottom Helper Indicator */}
        <div className="absolute bottom-3 left-3 text-[10px] font-mono px-3 py-1 rounded-full bg-[#0F1E38]/90 border border-blue-800/80 text-blue-300 backdrop-blur-xs flex items-center gap-2">
          <Move className="h-3 w-3 text-blue-400" />
          <span>Click & drag to pan blueprint • Use buttons to zoom</span>
        </div>
      </div>
    </div>
  );
}
