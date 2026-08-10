import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCcw, Upload } from 'lucide-react';
import { Button } from './ui';

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
  onCancel: () => void;
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const startCamera = useCallback(async () => {
    try {
      // Stop existing stream if any
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError(null);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access the live camera stream. You can upload a photo file below.');
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      // Cleanup on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        
        // Stop stream before calling onCapture
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        
        onCapture(dataUrl);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          onCapture(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="relative flex flex-col items-center w-full max-w-lg">
        {/* Header Controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              if (stream) {
                stream.getTracks().forEach(track => track.stop());
              }
              onCancel();
            }}
            className="bg-black/50 text-white hover:bg-black/70 rounded-full"
          >
            <X className="h-6 w-6" />
          </Button>
          <span className="text-xs font-semibold text-white/90 bg-black/50 px-3 py-1 rounded-full">
            Site Progress Camera
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleCamera}
            className="bg-black/50 text-white hover:bg-black/70 rounded-full"
            title="Switch Camera"
          >
            <RefreshCcw className="h-5 w-5" />
          </Button>
        </div>

        {/* Video Viewfinder */}
        <div className="relative w-full aspect-[3/4] md:aspect-[4/3] bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center">
          {error ? (
            <div className="flex flex-col items-center justify-center p-6 text-center text-slate-300 gap-3">
              <p className="text-sm">{error}</p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 rounded-xl gap-2 text-xs"
              >
                <Upload className="h-4 w-4" /> Upload Photo File
              </Button>
            </div>
          ) : (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Hidden Canvas & File Input */}
        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Bottom Controls */}
        <div className="mt-6 flex items-center justify-center gap-6 w-full">
          <Button
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            className="text-white hover:bg-white/10 rounded-xl text-xs gap-1.5 px-3 py-2"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Photo</span>
          </Button>

          <button 
            onClick={handleCapture}
            disabled={!!error}
            className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-slate-300 hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_0_4px_rgba(255,255,255,0.2)]"
            title="Take Photo"
          >
            <div className="w-16 h-16 rounded-full border border-slate-200 flex items-center justify-center">
              <Camera className="h-8 w-8 text-slate-800" />
            </div>
          </button>

          <div className="w-24"></div> {/* Balance spacer */}
        </div>
      </div>
    </div>
  );
}

