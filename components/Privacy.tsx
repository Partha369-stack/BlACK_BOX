import React from 'react';
import { LogoIcon } from './Icons';
import Footer from './Footer';
import { useNavigate } from 'react-router-dom';

const Privacy: React.FC = () => {
    const navigate = useNavigate();

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
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-orbitron font-black text-white mb-8">Privacy Policy</h1>
                    <div className="prose prose-invert prose-lg text-brand-gray">
                        <p>Last updated: December 2025</p>
                        <p>This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.</p>

                        <h3>1. Information Collection And Use</h3>
                        <p>We collect several different types of information for various purposes to provide and improve our Service to you.</p>

                        <h3>2. Types of Data Collected</h3>
                        <p><strong>Personal Data:</strong> While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you ("Personal Data").</p>

                        <h3>3. Use of Data</h3>
                        <p>Black Box Inc uses the collected data for various purposes:</p>
                        <ul>
                            <li>To provide and maintain the Service</li>
                            <li>To notify you about changes to our Service</li>
                            <li>To provide customer care and support</li>
                        </ul>

                        <p>...</p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Privacy;
