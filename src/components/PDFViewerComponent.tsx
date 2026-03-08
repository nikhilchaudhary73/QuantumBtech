import React, { useEffect, useState } from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import type { RenderPageProps } from '@react-pdf-viewer/core';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import '@react-pdf-viewer/core/lib/styles/index.css';

interface PDFViewerComponentProps {
  url: string;
  isPurchased?: boolean;
  buyLink?: string;
}

const PDFViewerComponent: React.FC<PDFViewerComponentProps> = ({ url, isPurchased = true, buyLink }) => {
  const [isBlurred, setIsBlurred] = useState(false);

  useEffect(() => {
    // Disable right click globally when this component is mounted
    const disableContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    
    // Disable text selection
    const disableSelect = (e: Event) => {
      e.preventDefault();
      return false;
    };

    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => setIsBlurred(false);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent PrintScreen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
      }
      // Prevent Ctrl+P, Ctrl+S
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 's')) {
        e.preventDefault();
      }
      // Prevent Mac Screenshot shortcuts Commands+Shift+S/3/4/5
      if (e.metaKey && e.shiftKey && ['s','3','4','5'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', disableContextMenu);
    document.addEventListener('selectstart', disableSelect);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', disableContextMenu);
      document.removeEventListener('selectstart', disableSelect);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const renderPage = (props: RenderPageProps) => {
    let maxAllowed = 3;
    if (props.doc.numPages > 10 && props.doc.numPages <= 20) maxAllowed = 4;
    else if (props.doc.numPages > 20) maxAllowed = 5;

    if (!isPurchased && props.pageIndex >= maxAllowed) {
      return (
        <div
          style={{ height: `${props.height}px`, width: `${props.width}px` }}
          className="flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800"
        >
          <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 m-4 max-w-sm">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={32} className="text-indigo-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Page Locked</h3>
            <p className="text-sm text-slate-500 mb-6">
              You've reached the end of the preview. Buy this PDF to view all {props.doc.numPages} pages and download it.
            </p>
            {buyLink && (
              <Link 
                to={buyLink} 
                className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                Buy PDF to View All
              </Link>
            )}
          </div>
        </div>
      );
    }

    return (
      <div style={{ width: `${props.width}px`, height: `${props.height}px`, position: 'relative' }}>
        <div {...props.canvasLayer.attrs}>{props.canvasLayer.children}</div>
        <div {...props.textLayer.attrs}>{props.textLayer.children}</div>
        <div {...props.annotationLayer.attrs}>{props.annotationLayer.children}</div>
      </div>
    );
  };

  return (
    <div className="h-[80vh] w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-white relative">
      <div 
        className="absolute inset-0 z-50 pointer-events-none" 
        style={{ userSelect: 'none' }}
      >
        {/* Transparent overlay to block easy inspection/interaction if extremely strict protection is needed */}
      </div>
      
      <Worker workerUrl="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js">
        <div className={`w-full h-full transition-all duration-300 ${isBlurred ? 'blur-md pointer-events-none' : ''}`}>
          {isBlurred && (
            <div className="absolute inset-0 flex items-center justify-center z-[60] bg-white/50">
              <div className="bg-slate-900 text-white px-6 py-3 rounded-lg font-bold shadow-xl">
                 Viewing Interrupted
              </div>
            </div>
          )}
          <Viewer
            fileUrl={url}
            plugins={[]} // Empty plugins -> no default Layout -> NO toolbar, NO download button
            renderPage={renderPage}
          />
        </div>
      </Worker>
    </div>
  );
};

export default PDFViewerComponent;
