/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./App.tsx",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    black: '#000000',
                    dark: '#0a0a0a',
                    card: '#121212',
                    pink: '#ffffff',
                    cyan: '#cccccc',
                    gray: '#888888',
                    white: '#ffffff',
                },
                // Muting standard colors
                purple: {
                    500: '#333333',
                    600: '#222222',
                },
                green: {
                    500: '#ffffff',
                },
                red: {
                    500: '#999999',
                }
            },
            fontFamily: {
                serif: ['Merriweather', 'serif'],
                sans: ['Inter', 'sans-serif'],
                orbitron: ['Orbitron', 'sans-serif'],
                poppins: ['Poppins', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'grid-pattern': "linear-gradient(to right, #ffffff05 1px, transparent 1px), linear-gradient(to bottom, #ffffff05 1px, transparent 1px)",
            },
            animation: {
                'fade-in-down': 'fadeInDown 0.8s ease-out forwards',
                'float': 'float 5s ease-in-out infinite',
                'pulse-glow': 'pulseGlow 3s infinite',
                'scan-line': 'scanLine 2s linear infinite',
                'spin-slow': 'spin 12s linear infinite',
                'enter-up': 'enterUp 0.6s ease-out forwards',
                'marquee': 'marquee 20s linear infinite',
                'neon-flicker': 'neon-flicker 3s infinite alternate',
            },
            keyframes: {
                fadeInDown: {
                    '0%': { opacity: '0', transform: 'translateY(-20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                enterUp: {
                    '0%': { opacity: '0', transform: 'translateY(30px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                pulseGlow: {
                    '0%, 100%': { opacity: '0.6', filter: 'brightness(100%)' },
                    '50%': { opacity: '1', filter: 'brightness(150%)' },
                },
                scanLine: {
                    '0%': { top: '0%' },
                    '100%': { top: '100%' },
                },
                marquee: {
                    '0%': { transform: 'translateX(0%)' },
                    '100%': { transform: 'translateX(-100%)' },
                },
                'neon-flicker': {
                    '0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%': {
                        textShadow: '0 0 5px rgba(255, 255, 255, 0.3), 0 0 10px rgba(255, 255, 255, 0.3), 0 0 15px rgba(255, 255, 255, 0.3)',
                        opacity: '1',
                    },
                    '20%, 24%, 55%': {
                        textShadow: 'none',
                        opacity: '0.5',
                    }
                }
            }
        },
    },
    plugins: [],
}
