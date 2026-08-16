import React, { useEffect, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { X, Printer, Download, Building2 } from 'lucide-react';
import { Button } from './ui';

interface PrintPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onDownloadPdf?: () => void;
  brandName?: string;
}

export function PrintPreview({ isOpen, onClose, title, children, onDownloadPdf, brandName = "Constructfield" }: PrintPreviewProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleInternalDownload = async () => {
    if (onDownloadPdf) {
      onDownloadPdf();
      return;
    }
    
    if (!printRef.current) return;
    
    try {
      setIsGeneratingPdf(true);
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
      pdf.setProperties({
        title: title,
        author: brandName,
        creator: `${brandName} System`
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${title.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF', error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('print-modal-open');
    } else {
      document.body.classList.remove('print-modal-open');
    }
    return () => document.body.classList.remove('print-modal-open');
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print-modal-wrapper">
      <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl w-full max-w-5xl h-[90vh] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden print-modal-content">
        
        {/* Header - Not printed (Preview Controls) */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 no-print print-modal-header shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="bg-[#0B5FFF]/10 p-2 rounded-lg">
              <Printer className="h-5 w-5 text-[#0B5FFF]" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Print Preview</h2>
              <p className="text-xs text-slate-500">{title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleInternalDownload} disabled={isGeneratingPdf} variant="outline" className="gap-2 rounded-xl border-slate-200 dark:border-slate-700">
              <Download className="h-4 w-4" /> {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
            </Button>
            <Button onClick={handlePrint} className="gap-2 bg-[#0B5FFF] hover:bg-blue-600 text-white rounded-xl shadow-sm">
              <Printer className="h-4 w-4" /> Print Document
            </Button>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content - This is what gets printed */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-100 dark:bg-slate-950 print-modal-body">
          <div ref={printRef} className="bg-white mx-auto shadow-md rounded-xl max-w-4xl min-h-[1056px] w-full overflow-hidden print-content-container relative">
            
            {/* Branded Header (Only visible in Print / Print Preview) */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#0B5FFF]"></div>
            <div className="pt-10 px-10 pb-4 border-b border-slate-100 mb-6 flex justify-between items-end">
               <div className="flex items-center gap-2 text-slate-300">
                 <Building2 className="h-6 w-6 text-[#0B5FFF]" />
                 <span className="text-xl font-black tracking-tight text-slate-900">{brandName}</span>
               </div>
               <div className="text-right">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Official Document</p>
                 <p className="text-xs text-slate-500">{title}</p>
               </div>
            </div>

            {/* Actual injected document content */}
            <div className="px-10 pb-10">
              {children}
            </div>
            
            {/* Branded Footer */}
            <div className="px-10 py-6 mt-10 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
               <p>Generated by {brandName} System &copy; {new Date().getFullYear()}</p>
               
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
