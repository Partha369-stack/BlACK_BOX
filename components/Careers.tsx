import React from 'react';
import { LogoIcon, ArrowRightIcon } from './Icons';
import Footer from './Footer';
import { useNavigate } from 'react-router-dom';

const Careers: React.FC = () => {
    const navigate = useNavigate();

    const openings = [
        { title: 'Frontend Engineer', type: 'Full-time', location: 'Remote', dept: 'Engineering' },
        { title: 'IoT Specialist', type: 'Full-time', location: 'Los Angeles, CA', dept: 'Hardware' },
        { title: 'Product Designer', type: 'Contract', location: 'New York, NY', dept: 'Design' },
    ];

    return (
        <div className="min-h-screen bg-brand-black text-white flex flex-col font-sans selection:bg-brand-pink selection:text-white">
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

            <main className="flex-grow pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <h1 className="text-5xl md:text-7xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 mb-6 uppercase tracking-tight">
                            Careers
                        </h1>
                        <p className="text-xl text-brand-gray font-light max-w-2xl mx-auto">
                            Build the future of retail with us.
                        </p>
                    </div>

                    <div className="grid gap-6">
                        {openings.map((job, idx) => (
                            <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between hover:bg-white/10 transition-all group cursor-pointer">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-brand-cyan transition-colors">{job.title}</h3>
                                    <div className="flex gap-4 text-sm text-brand-gray">
                                        <span>{job.dept}</span>
                                        <span>&bull;</span>
                                        <span>{job.type}</span>
                                        <span>&bull;</span>
                                        <span>{job.location}</span>
                                    </div>
                                </div>
                                <button className="mt-4 md:mt-0 px-6 py-2 rounded-full border border-white/20 hover:bg-white hover:text-black transition-all text-sm font-bold">
                                    Apply Now
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 text-center text-brand-gray/60">
                        <p>Don't see a role for you? Email us at careers@blackbox.io</p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Careers;
