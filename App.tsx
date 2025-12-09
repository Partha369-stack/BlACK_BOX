import React, { useState, Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { CartItem } from './types';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load components for code splitting
const LandingPage = lazy(() => import('./components/LandingPage'));
const Scanner = lazy(() => import('./components/Scanner'));
const ProductCatalog = lazy(() => import('./components/ProductCatalog'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const Login = lazy(() => import('./components/Login'));
const Register = lazy(() => import('./components/Register'));
const ForgotPassword = lazy(() => import('./components/ForgotPassword'));
const Profile = lazy(() => import('./components/Profile'));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));
const About = lazy(() => import('./components/About'));
const Careers = lazy(() => import('./components/Careers'));
const Press = lazy(() => import('./components/Press'));
const HelpCenter = lazy(() => import('./components/HelpCenter'));
const Terms = lazy(() => import('./components/Terms'));
const Privacy = lazy(() => import('./components/Privacy'));

const App: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);

  return (
    <div className="min-h-screen bg-brand-black text-white font-sans selection:bg-white selection:text-black">
      <Suspense fallback={<LoadingSpinner fullScreen text="Loading..." size="lg" />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="/scanner" element={<Scanner />} />
          <Route
            path="/machine/:id"
            element={<ProductCatalog cart={cart} setCart={setCart} />}
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/about" element={<About />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/press" element={<Press />} />
          <Route path="/help-center" element={<HelpCenter />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
      </Suspense>
    </div>
  );
};

export default App;
