import React from 'react';
import { LogoIcon } from './Icons';
import Footer from './Footer';
import { useNavigate } from 'react-router-dom';

const Press: React.FC = () => {
    const navigate = useNavigate();

    const news = [
        { date: 'Oct 24, 2024', title: 'Black Box Raises Series B to Expand Nationwide', source: 'TechCrunch' },
        { date: 'Sep 15, 2024', title: 'The Vending Machine Revolution is Here', source: 'Wired' },
        { date: 'Aug 01, 2024', title: 'How Black Box is Changing the Way We Snack', source: 'Forbes' },
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
                            Press
                        </h1>
                        <p className="text-xl text-brand-gray font-light max-w-2xl mx-auto">
                            Latest news and updates from the Black Box team.
                        </p>
                    </div>

                    <div className="space-y-8">
                        <h2 className="text-2xl font-orbitron font-bold text-white border-b border-white/10 pb-4">In The News</h2>
                        <div className="grid gap-6">
                            {news.map((item, idx) => (
                                <a key={idx} href="#" className="block bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-colors group">
                                    <div className="text-brand-pink text-sm font-mono mb-2">{item.date}</div>
                                    <h3 className="text-xl font-bold text-white group-hover:text-brand-cyan transition-colors mb-1">{item.title}</h3>
                                    <div className="text-brand-gray text-sm">Read on {item.source} &rarr;</div>
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="mt-16 bg-brand-cyan/5 border border-brand-cyan/20 p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">Media Kit</h3>
                            <p className="text-brand-gray text-sm">Download official logos, device mockups, and product shots.</p>
                        </div>
                        <button className="px-6 py-3 bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/50 rounded-lg hover:bg-brand-cyan hover:text-black transition-all font-bold">
                            Download Assets
                        </button>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Press;
