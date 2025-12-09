
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

import { useNavigate } from 'react-router-dom';

interface ScannerProps {
  // No props needed
}

const Scanner: React.FC<ScannerProps> = () => {
  const navigate = useNavigate();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scannedId, setScannedId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrCodeRegionId = "qr-reader";

  const onBack = () => navigate('/');
  const onScanSuccess = (id: string) => navigate(`/machine/${id}`);

  useEffect(() => {
    const startScanner = async () => {
      try {
        // Initialize the scanner
        scannerRef.current = new Html5Qrcode(qrCodeRegionId);

        // Get available cameras
        const devices = await Html5Qrcode.getCameras();

        if (devices && devices.length > 0) {
          setHasPermission(true);

          // Prefer back camera if available
          const backCamera = devices.find(device =>
            device.label.toLowerCase().includes('back') ||
            device.label.toLowerCase().includes('rear')
          );
          const cameraId = backCamera ? backCamera.id : devices[0].id;

          // Start scanning
          await scannerRef.current.start(
            cameraId,
            {
              fps: 10, // Frames per second for scanning
              qrbox: { width: 250, height: 250 }, // Scanning box size
              aspectRatio: 1.0
            },
            (decodedText) => {
              // Success callback - QR code detected
              handleScanSuccess(decodedText);
            },
            (errorMessage) => {
              // Error callback - ignore, this fires constantly when no QR is detected
              // We only care about actual camera/permission errors
            }
          );
        } else {
          setHasPermission(false);
          setErrorMessage('No cameras found on this device.');
        }
      } catch (err) {
        setHasPermission(false);
        if (err instanceof Error) {
          if (err.message.includes('NotAllowedError') || err.message.includes('Permission')) {
            setErrorMessage('Camera access denied. Please enable camera permissions.');
          } else if (err.message.includes('NotFoundError')) {
            setErrorMessage('No camera found on this device.');
          } else {
            setErrorMessage('Unable to access camera. Please check your device settings.');
          }
        }
      }
    };

    startScanner();

    // Cleanup function
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch((err) => {
          console.error('Error stopping scanner:', err);
        });
      }
    };
  }, []);

  const handleScanSuccess = (decodedText: string) => {
    // Stop the scanner
    if (scannerRef.current) {
      scannerRef.current.stop().catch((err) => {
        console.error('Error stopping scanner:', err);
      });
    }

    // Set success state
    setScanSuccess(true);
    setScannedId(decodedText);

    // Navigate after success animation
    setTimeout(() => {
      onScanSuccess(decodedText);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">

      {/* Top Bar HUD */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black via-black/80 to-transparent">
        <button
          onClick={onBack}
          className="text-white/80 bg-white/5 backdrop-blur-md px-5 py-2 rounded-lg border border-white/10 text-sm font-mono tracking-wide hover:bg-white/10 hover:border-white/50 transition-all"
        >
          &lt; ABORT
        </button>
        <div className="flex items-center space-x-3 bg-white/5 px-4 py-2 rounded-full border border-white/5 backdrop-blur-sm">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="font-bold tracking-widest text-xs text-white">LIVE FEED</span>
        </div>
      </div>

      {/* Camera View */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-[#050505]">
        {hasPermission === false ? (
          <div className="text-center p-8 max-w-sm glass-panel rounded-2xl">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">Access Denied</h3>
            <p className="text-brand-gray mb-6 text-sm">{errorMessage || 'Camera permissions required for neural link.'}</p>
            <button onClick={onBack} className="bg-white text-black px-6 py-3 rounded-xl font-medium w-full hover:bg-white/90 transition-colors">
              Return to Base
            </button>
          </div>
        ) : (
          <>
            {/* QR Code Scanner Container */}
            <div className="relative w-full max-w-md mx-auto px-4">
              {/* Scanner element */}
              <div id={qrCodeRegionId} className="rounded-2xl overflow-hidden border-4 border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.3)]"></div>

              {/* Scanning Overlay UI */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* Animated Corners */}
                <div className="relative w-64 h-64">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-sm animate-pulse-glow"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-sm animate-pulse-glow" style={{ animationDelay: '0.2s' }}></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-sm animate-pulse-glow" style={{ animationDelay: '0.4s' }}></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-sm animate-pulse-glow" style={{ animationDelay: '0.6s' }}></div>
                </div>

                {scanSuccess && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300 border border-white/30 pointer-events-auto">
                    <div className="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-white font-mono font-bold text-lg tracking-widest uppercase">QR Code Detected</span>
                    <p className="text-white text-sm mt-2 font-mono">{scannedId}</p>
                    <p className="text-brand-gray text-xs mt-2 font-mono">Initializing protocol...</p>
                  </div>
                )}
              </div>
            </div>

            <p className="absolute bottom-24 text-white/90 bg-black/60 px-6 py-3 rounded-full backdrop-blur-md text-xs font-mono border border-white/10 tracking-widest uppercase">
              Align QR Code Within Frame
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Scanner;
