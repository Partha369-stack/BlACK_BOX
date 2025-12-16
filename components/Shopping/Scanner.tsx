
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

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
  const [isScanning, setIsScanning] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrCodeRegionId = "qr-reader";

  const onBack = () => navigate('/');
  const onScanSuccess = (id: string) => navigate(`/machine/${id}`);

  useEffect(() => {
    const startScanner = async () => {
      try {
        // Initialize the scanner with QR code format only for better performance
        scannerRef.current = new Html5Qrcode(qrCodeRegionId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false
        });

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
              fps: 30,
              qrbox: { width: 250, height: 250 }, // Focused scanning region
              aspectRatio: window.innerHeight / window.innerWidth, // Match screen aspect ratio
              experimentalFeatures: {
                useBarCodeDetectorIfSupported: true
              }
            } as any, // Type cast to support experimentalFeatures
            (decodedText) => {
              // Success callback - QR code detected
              handleScanSuccess(decodedText);
            },
            (errorMessage) => {
              // Error callback - ignore, this fires constantly when no QR is detected
              // We only care about actual camera/permission errors
            }
          );

          // Set scanning state to true after successful start
          setIsScanning(true);
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
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().then(() => {
          setIsScanning(false);
        }).catch((err) => {
          console.error('Error stopping scanner:', err);
        });
      }
    };
  }, []);

  const handleScanSuccess = (decodedText: string) => {
    // Stop the scanner only if it's running
    if (scannerRef.current && isScanning) {
      scannerRef.current.stop().then(() => {
        setIsScanning(false);
      }).catch((err) => {
        console.error('Error stopping scanner:', err);
      });
    }

    // Set success state
    setScanSuccess(true);
    setScannedId(decodedText);

    // Navigate after success animation
    setTimeout(() => {
      // Check if it's a full URL
      const isUrl = /^(http|https):\/\//i.test(decodedText);

      if (isUrl) {
        // Check if it's an internal link to /machine/
        if (decodedText.includes('/machine/')) {
          const parts = decodedText.split('/machine/');
          if (parts.length > 1) {
            // Extract ID from URL (handle query params or trailing slashes)
            const id = parts[1].split(/[/?#]/)[0];
            if (id) {
              navigate(`/machine/${id}`);
              return;
            }
          }
        }

        // If it's a URL but not our internal machine format (e.g., qrco.de redirect)
        // Redirect the window to let the browser handle the redirect chain
        window.location.href = decodedText;
      } else {
        // Assume it's a raw Machine ID
        navigate(`/machine/${decodedText}`);
      }
    }, 1500);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3.0));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 1.0));
  };

  // Pinch-to-zoom gesture support
  const initialPinchDistanceRef = useRef<number | null>(null);

  const getDistance = (touch1: React.Touch, touch2: React.Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Two fingers detected - start pinch gesture
      initialPinchDistanceRef.current = getDistance(e.touches[0], e.touches[1]);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistanceRef.current !== null) {
      e.preventDefault(); // Prevent default zoom/scroll behavior

      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialPinchDistanceRef.current;

      // Update zoom level based on pinch scale
      setZoomLevel(prev => {
        const newZoom = prev * scale;
        return Math.min(Math.max(newZoom, 1.0), 3.0);
      });

      // Update initial distance for smooth continuous zooming
      initialPinchDistanceRef.current = currentDistance;
    }
  };

  const handleTouchEnd = () => {
    initialPinchDistanceRef.current = null;
  };

  // Check for Google Vision support
  const [isGoogleVision, setIsGoogleVision] = useState(false);

  useEffect(() => {
    if ('BarcodeDetector' in window) {
      setIsGoogleVision(true);
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      {/* CSS to Force Full Screen Video */}
      <style>{`
        #qr-reader {
          width: 100% !important;
          height: 100% !important;
          border: none !important;
        }
        #qr-reader video {
          object-fit: cover;
          width: 100% !important;
          height: 100% !important;
          border-radius: 0 !important;
          z-index: 1 !important;
        }
      `}</style>

      {/* ... (Top Bar is already there, skipping) ... */}

      {/* Camera View */}
      <div className="relative w-full h-full bg-black">
        {hasPermission === false ? (
          /* Permission Error View */
          <div className="absolute inset-0 flex items-center justify-center bg-black p-8 z-50">
            {/* ... keeping permission error UI the same ... */}
            <div className="text-center max-w-sm">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Camera Access Required</h3>
              <p className="text-white/50 mb-8 font-light">{errorMessage || 'Please enable camera access to scan codes.'}</p>
              <button
                onClick={onBack}
                className="bg-white text-black px-8 py-3 rounded-full font-medium active:scale-95 transition-transform"
              >
                Go Back
              </button>
            </div>
          </div>
        ) : (
          <div
            className="w-full h-full relative"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* The actual scanner element - full screen at z-0 */}
            <div
              id={qrCodeRegionId}
              className="w-full h-full transition-transform duration-200 ease-out origin-center relative z-0"
              style={{ transform: `scale(${zoomLevel})` }}
            ></div>

            {/* Google Lens Style Overlay - z-10 */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-20">

              {/* Dynamic Lens Focus Area */}
              <div className="relative w-64 h-64 md:w-80 md:h-80 transition-all duration-500 ease-out">
                {/* Clean Corners */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/90 rounded-tl-2xl shadow-[0_0_15px_rgba(255,255,255,0.3)]"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/90 rounded-tr-2xl shadow-[0_0_15px_rgba(255,255,255,0.3)]"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/90 rounded-bl-2xl shadow-[0_0_15px_rgba(255,255,255,0.3)]"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/90 rounded-br-2xl shadow-[0_0_15px_rgba(255,255,255,0.3)]"></div>

                {/* Central "Searching" Dots */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-3">
                  <div className="w-1.5 h-1.5 bg-white/80 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-white/80 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-white/80 rounded-full animate-bounce"></div>
                </div>
              </div>

              {/* Minimalist Instructions */}
              <div className="absolute bottom-24 bg-black/40 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/10 shadow-lg">
                <p className="text-white/90 text-sm font-medium tracking-wide">
                  Search with your camera
                </p>
              </div>
            </div>

            {/* Zoom Controls Side Bar */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6 z-30">
              <div className="bg-black/40 backdrop-blur-md rounded-full p-2 flex flex-col gap-4 border border-white/10">
                <button
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 3.0}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xl hover:bg-white/20 transition-colors disabled:opacity-30"
                >
                  +
                </button>
                <div className="text-center text-xs font-mono text-white/80 py-1 border-t border-b border-white/10">
                  {zoomLevel.toFixed(1)}x
                </div>
                <button
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 1.0}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xl hover:bg-white/20 transition-colors disabled:opacity-30"
                >
                  -
                </button>
              </div>
            </div>

            {scanSuccess && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xl z-50 flex flex-col items-center justify-center animate-in fade-in duration-200">
                <div className="p-4 bg-white rounded-full mb-6 animate-bounce-short">
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Scanned!</h2>
                <div className="px-6 py-2 bg-white/10 rounded-lg max-w-[80%] mx-auto">
                  <p className="text-blue-300 font-mono text-sm truncate">{scannedId}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Scanner;
