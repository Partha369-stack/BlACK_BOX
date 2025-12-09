import React from 'react';
import { LogoIcon } from './Icons';
import Footer from './Footer';
import { useNavigate } from 'react-router-dom';

const Terms: React.FC = () => {
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
                    <h1 className="text-4xl md:text-5xl font-orbitron font-black text-white mb-8">Terms of Service</h1>
                    <div className="prose prose-invert prose-lg text-brand-gray">
                        <p>Last updated: December 2025</p>
                        <p>Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the Black Box mobile application (the "Service") operated by Black Box Inc ("us", "we", or "our").</p>

                        <h3>1. Accounts</h3>
                        <p>When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>

                        <h3>2. Intellectual Property</h3>
                        <p>The Service and its original content, features and functionality are and will remain the exclusive property of Black Box Inc and its licensors.</p>

                        <h3>3. Links To Other Web Sites</h3>
                        <p>Our Service may contain links to third-party web sites or services that are not owned or controlled by Black Box Inc.</p>

                        <h3>4. Termination</h3>
                        <p>We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>

                        <p>...</p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Terms;
