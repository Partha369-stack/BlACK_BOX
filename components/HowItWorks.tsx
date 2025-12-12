import React from 'react';

// Import generated images
import scanImage from '../assets/scan.jpg';
import pickImage from '../assets/pick.jpg';
import payImage from '../assets/pay.jpg';

const HowItWorks: React.FC = () => {
    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8 relative z-10">
            <div className="mb-8 text-center animate-fade-in-up">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2 tracking-wide font-orbitron opacity-90">
                    HOW IT WORKS
                </h3>
                <div className="h-0.5 w-12 bg-white/30 mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative max-w-5xl mx-auto">
                {/* Connector Line (Desktop) */}
                <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2 z-0"></div>

                {/* Step 1 */}
                <div className="group relative z-10">
                    <div className="relative glass-panel rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 border-white/10 hover:border-white/30 bg-black/40 h-64 flex flex-col items-center justify-center p-6 text-center">
                        {/* Background Image */}
                        <div className="absolute inset-0 z-0">
                            <img
                                src={scanImage}
                                alt="Scan Code"
                                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-all duration-500"
                            />
                            <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors duration-500"></div>
                        </div>

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center mb-4 shadow-lg">
                                <span className="font-mono font-bold text-sm text-white">01</span>
                            </div>

                            <h4 className="text-lg font-bold text-white mb-2 font-orbitron tracking-wide group-hover:text-cyan-400 transition-colors">Scan Code</h4>
                            <p className="text-gray-100 opacity-60 group-hover:opacity-100 transition-opacity duration-300 font-medium text-sm leading-relaxed font-poppins max-w-[200px] drop-shadow-md">
                                Find the QR code located prominently on the vending machine.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Step 2 */}
                <div className="group relative z-10 [animation-delay:150ms]">
                    <div className="relative glass-panel rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 border-white/10 hover:border-white/30 bg-black/40 h-64 flex flex-col items-center justify-center p-6 text-center">
                        <div className="absolute inset-0 z-0">
                            <img
                                src={pickImage}
                                alt="Pick Snacks"
                                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-all duration-500"
                            />
                            <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors duration-500"></div>
                        </div>

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center mb-4 shadow-lg">
                                <span className="font-mono font-bold text-sm text-white">02</span>
                            </div>

                            <h4 className="text-lg font-bold text-white mb-2 font-orbitron tracking-wide group-hover:text-purple-400 transition-colors">Pick Snacks</h4>
                            <p className="text-gray-100 opacity-60 group-hover:opacity-100 transition-opacity duration-300 font-medium text-sm leading-relaxed font-poppins max-w-[200px] drop-shadow-md">
                                Browse the digital inventory and select your favorite items.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Step 3 */}
                <div className="group relative z-10 [animation-delay:300ms]">
                    <div className="relative glass-panel rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 border-white/10 hover:border-white/30 bg-black/40 h-64 flex flex-col items-center justify-center p-6 text-center">
                        <div className="absolute inset-0 z-0">
                            <img
                                src={payImage}
                                alt="Instant Pay"
                                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-all duration-500"
                            />
                            <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors duration-500"></div>
                        </div>

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center mb-4 shadow-lg">
                                <span className="font-mono font-bold text-sm text-white">03</span>
                            </div>

                            <h4 className="text-lg font-bold text-white mb-2 font-orbitron tracking-wide group-hover:text-green-400 transition-colors">Instant Pay</h4>
                            <p className="text-gray-100 opacity-60 group-hover:opacity-100 transition-opacity duration-300 font-medium text-sm leading-relaxed font-poppins max-w-[200px] drop-shadow-md">
                                Pay via UPI and collect your purchase immediately.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default HowItWorks;
