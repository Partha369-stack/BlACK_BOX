import React, { useState } from 'react';
import { LogoIcon, ArrowRightIcon } from '../Shared/Icons';
import Footer from '../Shared/Footer';
import { useNavigate } from 'react-router-dom';

const HelpCenter: React.FC = () => {
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const faqs = [
        { q: 'How do I pick up my order?', a: 'Once your purchase is complete, the machine will dispense your item immediately in the pickup bin.' },
        { q: 'Can I get a refund?', a: 'Yes, if the item was not dispensed or damaged, please contact support through the app for a full refund.' },
        { q: 'What payment methods are supported?', a: 'We accept all major credit cards, Apple Pay, Google Pay, and common UPI apps.' },
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
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-16">
                        <h1 className="text-5xl md:text-7xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 mb-6 uppercase tracking-tight">
                            Help Center
                        </h1>
                        <p className="text-xl text-brand-gray font-light max-w-2xl mx-auto">
                            How can we help you today?
                        </p>
                    </div>

                    <div className="bg-white/5 rounded-2xl p-8 border border-white/10 mb-12">
                        <h2 className="text-2xl font-orbitron font-bold text-white mb-6">Frequently Asked Questions</h2>
                        <div className="space-y-4">
                            {faqs.map((faq, idx) => (
                                <div key={idx} className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
                                    <button
                                        className="w-full flex justify-between items-center text-left text-lg font-bold text-white hover:text-brand-pink transition-colors py-2"
                                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                    >
                                        {faq.q}
                                        <ArrowRightIcon className={`w-5 h-5 transition-transform ${openFaq === idx ? 'rotate-90' : ''}`} />
                                    </button>
                                    {openFaq === idx && (
                                        <div className="mt-2 text-brand-gray leading-relaxed text-sm animate-fade-in">
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-brand-gray mb-4">Still need help?</p>
                        <button className="bg-brand-pink text-white px-8 py-3 rounded-full font-bold hover:bg-brand-pink/80 transition-all shadow-[0_0_15px_rgba(255,42,109,0.4)]">
                            Contact Support
                        </button>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
};

export default HelpCenter;
