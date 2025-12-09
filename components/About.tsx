import React from 'react';
import { ArrowRightIcon, LogoIcon } from './Icons';
import Footer from './Footer';
import { useNavigate } from 'react-router-dom';

const About: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-brand-black text-white flex flex-col font-sans selection:bg-brand-pink selection:text-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center bg-black/50 backdrop-blur-md border-b border-white/5">
                <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
                    <LogoIcon className="w-8 h-8 md:w-10 md:h-10 text-brand-pink transition-transform duration-700 ease-in-out group-hover:rotate-[360deg]" />
                    <div className="flex flex-col">
                        <span className="font-orbitron font-bold text-lg tracking-widest text-white leading-none transition-colors duration-300 group-hover:text-brand-cyan">BLACK BOX</span>
                        <span className="font-poppins text-[10px] tracking-[0.2em] text-brand-cyan uppercase leading-none transition-colors duration-300 group-hover:text-white">Think Out of Box</span>
                    </div>
                </div>
                <button onClick={() => navigate('/')} className="text-sm font-bold text-white hover:text-brand-pink transition-colors">
                    Back to Home
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-grow pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-20">
                        <h1 className="text-5xl md:text-7xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 mb-6 uppercase tracking-tight">
                            About Us
                        </h1>
                        <p className="text-xl text-brand-gray font-light max-w-2xl mx-auto leading-relaxed">
                            We are redefining the future of automated retail with seamless, futuristic, and efficient storage solutions.
                        </p>
                    </div>

                    {/* Content Blocks */}
                    <div className="space-y-16">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <h2 className="text-2xl font-orbitron font-bold text-brand-pink mb-4 uppercase tracking-wider">Our Mission</h2>
                                <p className="text-brand-gray/80 leading-relaxed text-lg">
                                    To eliminate friction in the buying process and provide a vending experience that feels like magic. Black Box combines state-of-the-art IoT technology with sleek design to deliver products instantly and securely.
                                </p>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-8 border border-white/10 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-brand-pink/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="text-8xl font-black text-white/5 absolute -bottom-4 -right-4 font-orbitron">MISSION</div>
                                <div className="relative z-10 w-full h-48 bg-gradient-to-br from-gray-800 to-black rounded-lg flex items-center justify-center">
                                    <LogoIcon className="w-24 h-24 text-white/20" />
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-12 items-center md:flex-row-reverse">
                            <div className="bg-white/5 rounded-2xl p-8 border border-white/10 relative overflow-hidden group md:order-1">
                                <div className="absolute inset-0 bg-brand-cyan/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="text-8xl font-black text-white/5 absolute -bottom-4 -right-4 font-orbitron">VISION</div>
                                <div className="relative z-10 w-full h-48 bg-gradient-to-br from-gray-800 to-black rounded-lg flex items-center justify-center">
                                    <div className="text-6xl font-orbitron font-bold text-white/20">XXX</div>
                                </div>
                            </div>
                            <div className="md:order-2">
                                <h2 className="text-2xl font-orbitron font-bold text-brand-cyan mb-4 uppercase tracking-wider">The Vision</h2>
                                <p className="text-brand-gray/80 leading-relaxed text-lg">
                                    A world where you never have to wait in line or fumble for change. A Black Box on every corner, powered by the cloud, providing exactly what you need, when you need it.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-24 text-center">
                        <h3 className="text-xl font-orbitron font-bold text-white mb-6 uppercase">Join the Movement</h3>
                        <button onClick={() => navigate('/careers')} className="bg-white text-black font-bold py-3 px-8 rounded-full hover:bg-brand-pink hover:text-white transition-all duration-300 flex items-center gap-2 mx-auto shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,42,109,0.6)]">
                            View Careers <ArrowRightIcon className="w-5 h-5" />
                        </button>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
};

export default About;
