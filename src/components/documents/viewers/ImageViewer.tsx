import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCw, RefreshCw, Maximize2, ExternalLink, Download, Image as ImageIcon } from 'lucide-react';
import { DocumentItem } from '../../../types';
import { Button } from '../../ui';

interface ImageViewerProps {
  document: DocumentItem;
  src: string;
  onDownload: () => void;
}

export function ImageViewer({ document: doc, src, onDownload }: ImageViewerProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
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
    <div className="flex flex-col h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 overflow-hidden select-none">
      {/* Viewer Action Controls Bar */}
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 text-white flex-wrap">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-purple-400" />
          <span className="text-xs font-bold text-slate-200 truncate max-w-xs">{doc.fileName}</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            {doc.fileSizeFormatted || ''}
          </span>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            title="Zoom Out"
            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          
          <span className="text-xs font-mono font-bold px-1.5 text-purple-300 min-w-[45px] text-center">
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={zoom >= 4}
            title="Zoom In"
            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />

          <button
            onClick={handleRotate}
            title="Rotate 90° Clockwise"
            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={handleReset}
            title="Reset View"
            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-blue-400 hover:underline inline-flex items-center gap-1 hover:text-blue-300"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Direct Tab</span>
          </a>
        </div>
      </div>

      {/* Interactive Image Viewport */}
      <div
        className={`relative flex-1 min-h-[420px] max-h-[600px] flex items-center justify-center p-6 overflow-hidden ${
          zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={src}
          alt={doc.title}
          draggable={false}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            maxHeight: '480px',
            maxWidth: '100%'
          }}
          className="object-contain rounded-lg shadow-2xl pointer-events-auto select-none"
        />

        {zoom > 1 && (
          <div className="absolute bottom-3 right-3 text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 backdrop-blur-xs">
            Drag to pan image
          </div>
        )}
      </div>
    </div>
  );
}
