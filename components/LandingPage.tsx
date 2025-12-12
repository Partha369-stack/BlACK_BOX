
import React, { useState, useEffect } from 'react';
import { LogoIcon, QRIcon, ArrowRightIcon, XIcon } from './Icons';
import Footer from './Footer';
import BackgroundAnimation from './BackgroundAnimation';
import HowItWorks from './HowItWorks';

import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LandingPageProps {
  // No props needed now
}

const LandingPage: React.FC<LandingPageProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [machineId, setMachineId] = useState('');
  const [error, setError] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Check for error message from navigation state
  useEffect(() => {
    if (location.state?.error) {
      setNotification(location.state.error);
      // Clear the state to prevent showing the message again on refresh
      window.history.replaceState({}, document.title);

      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [location]);


  // Timer removed in favor of hover interaction

  const onScanClick = () => navigate('/scanner');
  const onAdminClick = () => navigate('/admin');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedId = machineId.trim();

    // Validation
    if (!trimmedId) {
      setError('Please enter a machine ID');
      return;
    }

    if (trimmedId.length < 3) {
      setError('Machine ID must be at least 3 characters');
      return;
    }

    if (!/^[A-Z0-9-]+$/i.test(trimmedId)) {
      setError('Machine ID can only contain letters, numbers, and hyphens');
      return;
    }

    navigate(`/machine/${trimmedId.toUpperCase()}`);
  };

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-brand-black text-white">

      {/* --- New Canvas Background Animation --- */}
      <BackgroundAnimation />

      {/* --- CSS Overlay for Ambient Gradient (adds depth behind canvas) --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-radial from-white/10 via-brand-black/80 to-brand-black"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
      </div>

      {/* --- Header --- */}
      <header className="absolute top-0 left-0 right-0 z-50 px-6 py-6 flex justify-between items-center">
        <div className="text-xl font-orbitron font-bold text-white tracking-wider hidden md:block opacity-0">
          BLACK BOX
        </div>
        {/* Profile icon removed from header */}
      </header>

      {/* Notification Banner */}
      {notification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[60] animate-enter-down">
          <div className="bg-red-500/10 border border-red-500/30 backdrop-blur-xl rounded-xl px-6 py-4 shadow-[0_0_30px_rgba(239,68,68,0.2)] flex items-center gap-4 max-w-md">
            <div className="flex-1">
              <p className="text-red-200 text-sm font-medium">{notification}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="p-1 hover:bg-red-500/20 rounded-lg transition-colors"
            >
              <XIcon className="w-4 h-4 text-red-300" />
            </button>
          </div>
        </div>
      )}

      {/* --- Main Content --- */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 pt-24 pb-12 text-center relative z-10 w-full max-w-7xl mx-auto">

        {/* Floating Logo */}
        {/* Floating Logo - with Spin/Flip Animation */}
        <div
          className="mb-10 animate-float relative group cursor-pointer [perspective:1000px]"
          onClick={() => user && navigate('/profile')}
        >


          <div className={`w-24 h-24 md:w-32 md:h-32 relative transition-all duration-700 [transform-style:preserve-3d] ${user ? 'group-hover:[transform:rotateY(180deg)]' : ''}`}>

            {/* Front Face: Logo */}
            <div className="absolute inset-0 [backface-visibility:hidden] w-full h-full flex items-center justify-center">
              <LogoIcon className="w-24 h-24 md:w-32 md:h-32 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
            </div>

            {/* Back Face: Profile */}
            {user && (
              <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] w-full h-full rounded-full overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.3)] border-2 border-white/50 bg-black">
                {user.get('profilePicture') ? (
                  <img
                    src={user.get('profilePicture')}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-white/20 to-brand-black flex items-center justify-center text-3xl font-bold">
                    {user.get('username')?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Headlines */}
        <div className="space-y-4 mb-12 animate-fade-in-down">
          <h1
            className="text-6xl md:text-8xl font-black text-white tracking-tight mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] uppercase font-orbitron force-orbitron"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            Black Box
          </h1>
          <p
            className="text-xl md:text-2xl text-brand-gray/90 font-normal tracking-[0.2em] uppercase opacity-90 text-glow font-orbitron force-orbitron animate-tracking-expand"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            Think Out of Box
          </p>
        </div>

        <p className="max-w-lg text-brand-gray text-lg mb-16 leading-relaxed animate-enter-up [animation-delay:200ms] font-light font-poppins">
          Scan a machine QR code to browse available snacks and make your purchase.
        </p>

        {/* --- Action Cluster --- */}
        <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center animate-enter-up [animation-delay:400ms]">

          {/* Scanner Button */}
          <div className="mb-12 group relative cursor-pointer" onClick={onScanClick}>
            {/* Rotating rings */}
            <div className="absolute inset-0 rounded-3xl border border-white/30 scale-110 group-hover:scale-125 transition-transform duration-500 opacity-0 group-hover:opacity-100"></div>
            <div className="absolute inset-0 rounded-3xl border border-white/20 rotate-45 scale-90 group-hover:rotate-90 group-hover:scale-110 transition-all duration-700 opacity-0 group-hover:opacity-100"></div>

            {/* Main card */}
            <div className="relative glass-panel rounded-3xl p-8 hover:bg-white/5 transition-all duration-300 border-white/20 hover:border-white/50 shadow-[0_0_0_1px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] bg-black/40 backdrop-blur-xl">
              <div className="relative overflow-hidden">
                <QRIcon className="w-24 h-24 md:w-32 md:h-32 text-white group-hover:text-white transition-colors duration-300" />
                {/* Scan line effect */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-white/80 shadow-[0_0_10px_#ffffff] animate-scan-line opacity-0 group-hover:opacity-100"></div>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <p className="text-sm font-bold tracking-widest text-white uppercase group-hover:text-white transition-colors font-orbitron">
                Tap to Scan
              </p>
              <p className="text-xs text-brand-gray font-poppins">
                Locate QR on machine
              </p>
            </div>
          </div>

          {/* Input Field - Futuristic Style */}
          <div className="w-full max-w-sm px-6 mb-20 relative z-20">
            <div className="flex items-center gap-4 mb-6 opacity-60">
              <div className="h-px bg-gradient-to-r from-transparent to-white/20 flex-1"></div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-brand-gray font-semibold font-orbitron">Or Enter ID</span>
              <div className="h-px bg-gradient-to-l from-transparent to-white/20 flex-1"></div>
            </div>

            <form className="relative group" onSubmit={handleSubmit}>
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${error ? 'from-white to-white' : 'from-white/50 to-white/20'} rounded-xl opacity-30 group-hover:opacity-100 blur transition duration-500`}></div>
              <div className={`relative flex items-center bg-black rounded-xl p-1 transition-all duration-300 border ${error ? 'border-white/50' : 'border-white/10 group-hover:border-transparent'}`}>
                <input
                  type="text"
                  value={machineId}
                  onChange={(e) => {
                    setMachineId(e.target.value);
                    setError(''); // Clear error on input
                  }}
                  placeholder="Machine ID (e.g. BOX-82)"
                  className="flex-1 bg-transparent border-none text-white text-base px-4 py-3 focus:outline-none placeholder-brand-gray/30 font-mono tracking-wider"
                  aria-invalid={!!error}
                  aria-describedby={error ? "machine-id-error" : undefined}
                />
                <button
                  type="submit"
                  className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 group-hover:text-white"
                  aria-label="Submit Machine ID"
                >
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
              </div>
              {error && (
                <p id="machine-id-error" className="text-white border border-white/30 bg-black/50 p-2 rounded text-xs mt-2 font-mono animate-enter-up" role="alert">
                  ⚠ {error}
                </p>
              )}
            </form>
          </div>

          {/* Separate Cards for Instructions */}
          <div className="w-full max-w-6xl mx-auto animate-enter-up [animation-delay:600ms] mt-8">
            <HowItWorks />
          </div>

        </div>
      </main>

      <Footer onAdminClick={onAdminClick} />
    </div>
  );
};

export default LandingPage;
