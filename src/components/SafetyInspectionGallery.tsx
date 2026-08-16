import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { SiteInspectionPhoto } from '../types';
import { Card, CardContent, Button, CustomSelect, Badge } from './ui';
import { CameraCapture } from './CameraCapture';
import { 
  Camera, 
  Upload, 
  Search, 
  Filter, 
  MapPin, 
  User, 
  Calendar, 
  X, 
  Download, 
  Trash2, 
  Eye, 
  Maximize2, 
  Tag, 
  Plus, 
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Globe
} from 'lucide-react';

export function SafetyInspectionGallery() {
  const { 
    siteInspectionPhotos, 
    addSiteInspectionPhoto, 
    deleteSiteInspectionPhoto, 
    projects, 
    currentUserProfile 
  } = useAppContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modal states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<SiteInspectionPhoto | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

  // Form state for new photo upload / capture
  const [photoForm, setPhotoForm] = useState<{
    title: string;
    projectId: string;
    category: SiteInspectionPhoto['category'];
    inspectorName: string;
    location: string;
    gpsLocation?: { lat: number; lng: number };
    notes: string;
    url: string;
  }>({
    title: '',
    projectId: projects[0]?.id || 'PRJ-001',
    category: 'General Site',
    inspectorName: currentUserProfile?.name || 'Lindokuhle Chris',
    location: '',
    notes: '',
    url: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter photos
  const filteredPhotos = siteInspectionPhotos.filter(photo => {
    const matchesSearch = 
      photo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      photo.inspectorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (photo.location && photo.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (photo.notes && photo.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesProject = selectedProject === 'all' || photo.projectId === selectedProject;
    const matchesCategory = selectedCategory === 'all' || photo.category === selectedCategory;

    return matchesSearch && matchesProject && matchesCategory;
  });

  const handleCapturePhoto = (dataUrl: string) => {
    setIsCameraOpen(false);

    // Get location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          saveCapturedPhoto(dataUrl, { lat, lng }, `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        },
        () => {
          saveCapturedPhoto(dataUrl);
        }
      );
    } else {
      saveCapturedPhoto(dataUrl);
    }
  };

  const saveCapturedPhoto = (
    url: string, 
    gpsLocation?: { lat: number; lng: number }, 
    defaultLocStr?: string
  ) => {
    setPhotoForm(prev => ({
      ...prev,
      url,
      gpsLocation: gpsLocation || prev.gpsLocation,
      location: prev.location || defaultLocStr || 'Site Zone Inspection Area'
    }));
    setIsUploadModalOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          saveCapturedPhoto(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoForm.url || !photoForm.title) return;

    const newPhoto: SiteInspectionPhoto = {
      id: `INSP-IMG-${Date.now()}`,
      projectId: photoForm.projectId,
      title: photoForm.title,
      category: photoForm.category,
      url: photoForm.url,
      capturedAt: new Date().toISOString(),
      inspectorName: photoForm.inspectorName || currentUserProfile?.name || 'Inspector',
      location: photoForm.location || 'Site Inspection Zone',
      gpsLocation: photoForm.gpsLocation,
      notes: photoForm.notes,
      tags: [photoForm.category, 'Site Inspection']
    };

    addSiteInspectionPhoto(newPhoto);
    setIsUploadModalOpen(false);
    setPhotoForm({
      title: '',
      projectId: projects[0]?.id || 'PRJ-001',
      category: 'General Site',
      inspectorName: currentUserProfile?.name || 'Lindokuhle Chris',
      location: '',
      notes: '',
      url: ''
    });
  };

  const getProjectName = (projId: string) => {
    const p = projects.find(proj => proj.id === projId);
    return p ? p.name : projId;
  };

  const getCategoryBadgeClass = (category: SiteInspectionPhoto['category']) => {
    switch (category) {
      case 'Working at Heights':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Excavation':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'PPE Compliance':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Scaffolding':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'Electrical':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'Hazard':
        return 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800';
      default:
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Header & Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Site Inspection Photo Gallery
            </h2>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:border-purple-800 dark:text-purple-300 font-semibold">
              {siteInspectionPhotos.length} Captured Photos
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Capture, verify, and view real-time timestamped site inspection photos with GPS location tags.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <Button
            onClick={() => setIsCameraOpen(true)}
            className="flex-1 lg:flex-none bg-[#0B5FFF] hover:bg-[#004ee6] text-white gap-2 shadow-sm font-semibold text-xs py-2 px-4 rounded-xl"
          >
            <Camera className="h-4 w-4" />
            <span>Take Inspection Photo</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 lg:flex-none border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 gap-2 font-semibold text-xs py-2 px-4 rounded-xl"
          >
            <Upload className="h-4 w-4 text-slate-500" />
            <span>Upload Photo</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by photo title, inspector, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]/20 focus:border-[#0B5FFF]"
          />
        </div>

        {/* Filter Project */}
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]/20 focus:border-[#0B5FFF]"
        >
          <option value="all">All Projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Filter Category */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]/20 focus:border-[#0B5FFF]"
        >
          <option value="all">All Categories</option>
          <option value="General Site">General Site</option>
          <option value="Working at Heights">Working at Heights</option>
          <option value="PPE Compliance">PPE Compliance</option>
          <option value="Scaffolding">Scaffolding</option>
          <option value="Electrical">Electrical</option>
          <option value="Excavation">Excavation</option>
          <option value="Hazard">Hazard Inspection</option>
          <option value="Housekeeping">Housekeeping</option>
        </select>
      </div>

      {/* Gallery Cards Grid */}
      {filteredPhotos.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl">
          <Camera className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No inspection photos found</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
            No inspection photos match your filters. Use the live camera or upload a photo to populate the safety inspection gallery.
          </p>
          <Button
            onClick={() => setIsCameraOpen(true)}
            className="bg-[#0B5FFF] text-white gap-2 text-xs rounded-xl"
          >
            <Camera className="h-4 w-4" /> Take Inspection Photo
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredPhotos.map((photo) => {
            const dateFormatted = new Date(photo.capturedAt).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <Card 
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-all cursor-pointer flex flex-col"
              >
                {/* Image Container with Hover Overlay */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950">
                  <img 
                    src={photo.url} 
                    alt={photo.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  
                  {/* Category & Project Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none z-10">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border backdrop-blur-md shadow-sm ${getCategoryBadgeClass(photo.category)}`}>
                      {photo.category}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/60 text-white backdrop-blur-md truncate max-w-[120px]">
                      {getProjectName(photo.projectId)}
                    </span>
                  </div>

                  {/* Watermark / GPS Tag */}
                  {photo.gpsLocation && (
                    <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-black/70 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-md font-mono">
                      <Globe className="h-3 w-3 text-emerald-400" />
                      <span>GPS Tagged</span>
                    </div>
                  )}

                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedPhoto(photo); }}
                      className="p-2.5 bg-white text-slate-800 rounded-full hover:bg-slate-100 shadow-md transition-transform hover:scale-110"
                      title="Inspect Photo"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const a = document.createElement('a');
                        a.href = photo.url;
                        a.download = `${photo.title.replace(/\s+/g, '_')}_${photo.id}.jpg`;
                        a.click();
                      }}
                      className="p-2.5 bg-white text-slate-800 rounded-full hover:bg-slate-100 shadow-md transition-transform hover:scale-110"
                      title="Download Photo"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingPhotoId(photo.id);
                      }}
                      className="p-2.5 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-md transition-transform hover:scale-110"
                      title="Delete Photo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Card Details */}
                <CardContent className="p-4 flex flex-col justify-between flex-1 gap-2">
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-[#0B5FFF] transition-colors">
                      {photo.title}
                    </h3>
                    {photo.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {photo.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 truncate font-medium text-slate-700 dark:text-slate-300">
                        <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {photo.inspectorName}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                        <Calendar className="h-3 w-3 shrink-0" />
                        {dateFormatted}
                      </span>
                    </div>

                    {photo.location && (
                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 truncate">
                        <MapPin className="h-3.5 w-3.5 text-red-500 shrink-0" />
                        <span className="truncate">{photo.location}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Live Camera Modal */}
      {isCameraOpen && (
        <CameraCapture
          onCapture={handleCapturePhoto}
          onCancel={() => setIsCameraOpen(false)}
          activityTag="SAFETY SITE INSPECTION"
        />
      )}

      {/* Upload & Photo Meta Form Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative flex flex-col gap-4">
            <button
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Camera className="h-5 w-5 text-[#0B5FFF]" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Save Site Inspection Photo
              </h3>
            </div>

            {/* Photo Preview Thumbnail */}
            {photoForm.url && (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800">
                <img src={photoForm.url} alt="Captured preview" className="w-full h-full object-cover" />
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] font-mono px-2 py-0.5 rounded backdrop-blur-sm">
                  Timestamp Watermark Embedded
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitPhoto} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                  Photo Title / Inspection Objective *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scaffolding Level 3 Tie-Back Verification"
                  value={photoForm.title}
                  onChange={(e) => setPhotoForm({ ...photoForm, title: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]/20 focus:border-[#0B5FFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                    Project *
                  </label>
                  <select
                    value={photoForm.projectId}
                    onChange={(e) => setPhotoForm({ ...photoForm, projectId: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]/20 focus:border-[#0B5FFF]"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                    Inspection Category *
                  </label>
                  <select
                    value={photoForm.category}
                    onChange={(e) => setPhotoForm({ ...photoForm, category: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]/20 focus:border-[#0B5FFF]"
                  >
                    <option value="General Site">General Site</option>
                    <option value="Working at Heights">Working at Heights</option>
                    <option value="PPE Compliance">PPE Compliance</option>
                    <option value="Scaffolding">Scaffolding</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Excavation">Excavation</option>
                    <option value="Hazard">Hazard</option>
                    <option value="Housekeeping">Housekeeping</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                    Inspector Name
                  </label>
                  <input
                    type="text"
                    value={photoForm.inspectorName}
                    onChange={(e) => setPhotoForm({ ...photoForm, inspectorName: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                    Location / Zone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Block A Level 2"
                    value={photoForm.location}
                    onChange={(e) => setPhotoForm({ ...photoForm, location: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                  Field Observations & Inspection Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Add details on compliance, equipment conditions, or safety observations..."
                  value={photoForm.notes}
                  onChange={(e) => setPhotoForm({ ...photoForm, notes: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]/20 focus:border-[#0B5FFF]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#0B5FFF] hover:bg-[#004ee6] text-white rounded-xl text-xs gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" /> Save Photo to Gallery
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="relative flex flex-col lg:flex-row w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-30 p-2 bg-black/60 text-white hover:bg-black rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Photo Display Viewport */}
            <div className="flex-1 bg-black flex items-center justify-center relative p-4 min-h-[300px] lg:min-h-[500px]">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title}
                className="max-h-[80vh] w-auto max-w-full object-contain rounded-xl"
              />
              <div className="absolute bottom-6 left-6 bg-black/80 text-white text-xs px-3 py-1.5 rounded-xl backdrop-blur-md font-mono border border-white/10">
                STAMPED: {new Date(selectedPhoto.capturedAt).toLocaleString()}
              </div>
            </div>

            {/* Details Overlay Panel */}
            <div className="w-full lg:w-80 p-6 bg-slate-900 text-slate-100 flex flex-col justify-between gap-6 border-t lg:border-t-0 lg:border-l border-slate-800 overflow-y-auto">
              <div className="flex flex-col gap-4">
                <div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border inline-block mb-2 ${getCategoryBadgeClass(selectedPhoto.category)}`}>
                    {selectedPhoto.category}
                  </span>
                  <h3 className="text-lg font-bold text-white leading-snug">
                    {selectedPhoto.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium">
                    Project: {getProjectName(selectedPhoto.projectId)}
                  </p>
                </div>

                <div className="space-y-3 text-xs text-slate-300 bg-slate-800/60 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-[#0B5FFF]" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Inspector</span>
                      <span className="font-semibold">{selectedPhoto.inspectorName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-400" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Captured Date</span>
                      <span className="font-medium">
                        {new Date(selectedPhoto.capturedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {selectedPhoto.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-red-400" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">Location Zone</span>
                        <span className="font-medium">{selectedPhoto.location}</span>
                      </div>
                    </div>
                  )}

                  {selectedPhoto.gpsLocation && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-emerald-400" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">GPS Coordinates</span>
                        <span className="font-mono text-[11px] text-emerald-300">
                          {typeof selectedPhoto.gpsLocation === 'string'
                            ? selectedPhoto.gpsLocation
                            : `${selectedPhoto.gpsLocation.lat.toFixed(5)}, ${selectedPhoto.gpsLocation.lng.toFixed(5)}`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {selectedPhoto.notes && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 mb-1">Field Observations</h4>
                    <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed">
                      {selectedPhoto.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-4 border-t border-slate-800">
                <Button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = selectedPhoto.url;
                    a.download = `${selectedPhoto.title.replace(/\s+/g, '_')}.jpg`;
                    a.click();
                  }}
                  className="w-full bg-[#0B5FFF] hover:bg-[#004ee6] text-white rounded-xl text-xs gap-2"
                >
                  <Download className="h-4 w-4" /> Download High-Res Image
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    deleteSiteInspectionPhoto(selectedPhoto.id);
                    setSelectedPhoto(null);
                  }}
                  className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl text-xs gap-2"
                >
                  <Trash2 className="h-4 w-4" /> Delete Photo
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingPhotoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl flex flex-col gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Delete Inspection Photo?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                This action cannot be undone. The photo will be permanently removed from the safety gallery.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setDeletingPhotoId(null)}
                className="flex-1 rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  deleteSiteInspectionPhoto(deletingPhotoId);
                  setDeletingPhotoId(null);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
