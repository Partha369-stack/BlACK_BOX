import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ParseService } from '../services/parseService';

const ProfileCompletion: React.FC = () => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Get returnTo from location state
    const returnTo = (location.state as any)?.from?.pathname || '/';

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        // Check if profile is already complete
        const existingName = user.get('name');
        const existingPhone = user.get('phone');

        if (existingName && existingPhone) {
            // Profile already complete, redirect
            navigate(returnTo, { replace: true });
            return;
        }

        // Pre-fill name from Google if available
        if (existingName) {
            setName(existingName);
        }
    }, [user, navigate, returnTo]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('Name is required');
            return;
        }

        if (!phone.trim()) {
            setError('Phone number is required');
            return;
        }

        setLoading(true);

        try {
            await ParseService.updateUserProfile({ name, phone });
            navigate(returnTo, { replace: true });
        } catch (err: any) {
            setError(err.message || 'Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return null;
    }

    const profilePicture = user.get('profilePicture');
    const email = user.get('email');

    return (
        <div className="min-h-screen bg-brand-black flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Complete Your Profile
                    </h1>
                    <p className="text-gray-400">Just a few more details to get started</p>
                </div>

                {/* Card */}
                <div className="bg-black border border-white rounded-2xl p-8 shadow-2xl">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* User Info Display */}
                    <div className="mb-6 flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
                        {profilePicture && (
                            <img
                                src={profilePicture}
                                alt="Profile"
                                className="w-16 h-16 rounded-full border-2 border-white/30"
                            />
                        )}
                        <div className="flex-1">
                            <p className="text-white font-medium">{email}</p>
                            <p className="text-gray-400 text-sm">Signed in with Google</p>
                        </div>
                    </div>

                    {/* Profile Completion Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                                Full Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-black border border-white/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all"
                                placeholder="Enter your full name"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                                Phone Number
                            </label>
                            <input
                                id="phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-black border border-white/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all"
                                placeholder="Enter your phone number"
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-white text-black font-semibold rounded-lg shadow-lg hover:bg-gray-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Completing Profile...' : 'Continue'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-400">
                        <p>This information helps us provide better service</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileCompletion;
