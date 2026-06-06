import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.0 },
      /* verbose= */ false
    );
    
    scannerRef.current.render(
      (decodedText) => {
        // Stop scanning after a successful read
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
        }
        onScan(decodedText);
      },
      (error) => {
        // ignore errors (it triggers on every frame that doesn't have a code)
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-2">
          <h2 className="font-semibold text-ink-900">Scan Barcode</h2>
          <button className="btn btn-ghost btn-sm p-1.5 h-auto" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="p-4 bg-black">
          <div id="reader" style={{ width: '100%', border: 'none' }}></div>
        </div>
        <div className="px-4 py-3 text-sm text-center text-ink-500 border-t border-surface-2 bg-surface-1">
          Hold a product barcode up to your camera.
        </div>
      </div>
    </div>
  );
}
