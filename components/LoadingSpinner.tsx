import React from 'react';
import { LogoIcon } from './Icons';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    fullScreen?: boolean;
    text?: string;
    className?: string;
    color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    fullScreen = false,
    text,
    className = '',
    color = 'text-white'
}) => {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-12 h-12',
        lg: 'w-20 h-20',
        xl: 'w-32 h-32'
    };

    const containerClasses = fullScreen
        ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm'
        : `flex flex-col items-center justify-center p-4 ${className}`;

    return (
        <div className={containerClasses}>
            <div style={{ animationDuration: '2s' }} className="animate-spin">
                <LogoIcon className={`${sizeClasses[size]} ${color}`} />
            </div>
            {text && (
                <p className="mt-4 text-brand-gray text-sm font-orbitron tracking-wider animate-pulse">
                    {text}
                </p>
            )}
        </div>
    );
};

export default LoadingSpinner;
