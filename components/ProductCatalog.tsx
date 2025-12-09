
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Product, CartItem } from '../types';
import { LogoIcon, CartIcon, UserIcon, QRIcon, ArrowRightIcon } from './Icons';
import ProductCard from './ProductCard';
import Cart from './Cart';
import LoadingSpinner from './LoadingSpinner';
import Footer from './Footer';
import { ParseService } from '../services/parseService';
import { useAuth } from '../contexts/AuthContext';
import { websocketService } from '../services/websocketService';

import { useParams, useNavigate } from 'react-router-dom';

interface ProductCatalogProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

const ProductCatalog: React.FC<ProductCatalogProps> = ({ cart, setCart }) => {
  const { id: machineId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const onBack = () => navigate('/');
  const onScanClick = () => navigate('/scanner');
  const onAdminClick = () => navigate('/admin');
  const onProfileClick = () => {
    if (user) {
      navigate('/profile');
    } else {
      navigate(`/login?returnTo=${encodeURIComponent(`/machine/${machineId}`)}`);
    }
  };
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugData, setDebugData] = useState<any[] | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [machineStatus, setMachineStatus] = useState<{
    status: string;
    name: string;
    wsConnected: boolean;
  }>({ status: 'offline', name: 'Unknown', wsConnected: false });

  // Derived state
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Fetch and subscribe to machine status
  useEffect(() => {
    const fetchMachineStatus = async () => {
      if (!machineId) return;

      try {
        const machine = await ParseService.getMachineById(machineId);
        if (machine) {
          setMachineStatus({
            status: machine.status || 'offline',
            name: machine.name || machineId,
            wsConnected: machine.wsConnected || false
          });
        }
      } catch (error) {
        console.error('Failed to fetch machine status:', error);
      }
    };

    fetchMachineStatus();

    // Subscribe to WebSocket updates
    const handleStatusUpdate = (data: any) => {
      if (data.machineId === machineId) {
        setMachineStatus(prev => ({
          ...prev,
          status: data.status,
          wsConnected: data.connected
        }));
      }
    };

    websocketService.connect();
    websocketService.on('machineStatus', handleStatusUpdate);

    // Refresh status every 10 seconds
    const interval = setInterval(fetchMachineStatus, 10000);

    return () => {
      websocketService.off('machineStatus', handleStatusUpdate);
      clearInterval(interval);
    };
  }, [machineId]);

  // Fetch products from Back4App
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);

        console.log('Fetching products for machine:', machineId);
        const data = await ParseService.getProducts();
        setDebugData(data);
        console.log('Fetched products:', data);

        // Convert ProductData to Product type
        const productsWithMachineFilter = data
          .filter(p => {
            const match = !machineId || p.machine === machineId;
            if (!match) {
              console.log(`Product ${p.name} (Machine: ${p.machine}) did not match ${machineId}`);
            }
            return match;
          })
          .map(p => ({
            id: p.id!,
            name: p.name,
            description: p.description || '',
            price: p.price,
            image: p.image,
            stock: p.stock,
            slot: p.slot,
            category: p.category
          }));
        console.log('Filtered products:', productsWithMachineFilter);
        setProducts(productsWithMachineFilter);

      } catch (error) {
        console.error('Failed to load products:', error);
        setError('Failed to load products. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [machineId]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleUpdateQuantity = (id: string, delta: number) => {
    // Prevent adding to cart if machine is not online
    if (delta > 0 && machineStatus.status !== 'online') {
      toast.error(
        `Cannot add items to cart. Machine is currently ${machineStatus.status.toUpperCase()}. Please try again when the machine is online.`,
        {
          duration: 5000,
          icon: '⚠️',
        }
      );
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === id);
      const product = products.find(p => p.id === id);

      if (!product) return prevCart;

      if (existingItem) {
        const newQuantity = existingItem.quantity + delta;

        // Remove item if quantity goes to 0
        if (newQuantity <= 0) {
          return prevCart.filter(item => item.id !== id);
        }

        // Cap at stock
        if (newQuantity > product.stock) {
          return prevCart;
        }

        return prevCart.map(item =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        );
      } else if (delta > 0) {
        // Add new item
        return [...prevCart, { ...product, quantity: 1 }];
      }

      return prevCart;
    });

    if (delta > 0) {
      // Optional: Trigger a small toast or visual cue here
    }
  };

  const handleRemoveItem = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleClearCart = () => {
    setCart([]);
  }

  return (
    <div className="min-h-screen bg-brand-black text-white relative font-sans">

      {/* Sticky Header with Sub-header */}
      <header className="fixed top-0 left-0 w-full z-40 bg-black/40 backdrop-blur-xl border-b border-white/10 flex flex-col shadow-lg transition-all duration-300 supports-[backdrop-filter]:bg-black/20">

        {/* Top Nav Bar */}
        <div className={`max-w-7xl mx-auto px-4 md:px-8 w-full flex items-center justify-between transition-all duration-300 ${scrolled ? 'py-2' : 'py-3 md:py-4'}`}>

          {/* Left: Logo & Back */}
          <div className="flex items-center gap-2 md:gap-4 z-20">
            {/* Back Arrow */}
            <button onClick={onBack} className="text-white/70 hover:text-white transition-colors">
              <ArrowRightIcon className="w-5 h-5 md:w-6 md:h-6 rotate-180" />
            </button>

            <div className="flex items-center gap-2 cursor-pointer group" onClick={onBack}>
              <LogoIcon className="w-8 h-8 md:w-10 md:h-10 text-brand-pink transition-transform duration-700 ease-in-out group-hover:rotate-[360deg]" />
              <div className="flex flex-col">
                <span className="font-orbitron force-orbitron font-bold text-sm md:text-lg tracking-widest text-white leading-none transition-colors duration-300 group-hover:text-brand-cyan" style={{ fontFamily: "'Orbitron', sans-serif" }}>BLACK BOX</span>
                <span className="font-orbitron force-orbitron text-[8px] md:text-[10px] tracking-[0.2em] text-brand-cyan uppercase leading-none transition-colors duration-300 group-hover:text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>Think Out of Box</span>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 md:gap-4 z-20">
            {/* Scanner */}
            <button
              onClick={onScanClick}
              className="flex p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/5 hover:border-brand-cyan/50"
              title="Scan new machine"
            >
              <QRIcon className="w-5 h-5 md:w-6 md:h-6 !stroke-[6]" />
            </button>

            {/* Profile */}
            <button
              onClick={onProfileClick}
              className={`relative flex items-center justify-center rounded-full text-white transition-all overflow-hidden ${user && user.get('profilePicture')
                ? 'p-0 hover:ring-2 hover:ring-brand-pink/50'
                : 'p-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20'
                }`}
              title={user ? user.get('username') || user.get('email') : 'Login'}
            >
              {user && user.get('profilePicture') ? (
                <img
                  src={user.get('profilePicture')}
                  alt="Profile"
                  className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover"
                />
              ) : (
                <UserIcon className="w-5 h-5 md:w-6 md:h-6" />
              )}
            </button>

            {/* Cart */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-full bg-brand-pink text-white hover:bg-brand-pink/80 transition-all shadow-[0_0_15px_rgba(255,42,109,0.3)] hover:shadow-[0_0_20px_rgba(255,42,109,0.5)] group"
            >
              <CartIcon className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-brand-pink text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Sub-Header: Machine Status (Behaves like header) */}
        <div className="w-full bg-white/5 border-t border-white/5 py-1.5 flex justify-center items-center">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase text-brand-gray tracking-widest font-sans">
              {machineStatus.status === 'online' ? 'Connected to' :
                machineStatus.status === 'maintenance' ? 'Maintenance' :
                  'Offline'}
            </span>
            <div className={`w-1.5 h-1.5 rounded-full shadow-lg ${machineStatus.status === 'online' && machineStatus.wsConnected
              ? 'bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]'
              : machineStatus.status === 'maintenance'
                ? 'bg-yellow-500 shadow-[0_0_8px_#eab308]'
                : 'bg-red-500 shadow-[0_0_8px_#ef4444]'
              }`}></div>
            <span className="font-mono font-bold text-white text-xs tracking-wider">{machineId || 'BOX-UNKNOWN'}</span>
            {machineStatus.status !== 'online' && (
              <span className="text-[9px] text-red-400 font-medium">({machineStatus.status.toUpperCase()})</span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-36 pb-12 px-4 md:px-8 max-w-7xl mx-auto min-h-[80vh]">

        {/* Page Title */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-2xl md:text-3xl font-sans font-bold text-white mb-2 tracking-tight">Select Your Fuel</h1>
          <p className="text-brand-gray text-sm md:text-base font-sans">Browse the inventory for {machineId}. Tap [+] to add to cart.</p>
        </div>

        {/* Product Grid - 2 cols Mobile, 4 cols Desktop */}
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-20">
            <LoadingSpinner size="lg" text="Loading products..." />
          </div>

        ) : error ? (
          <div className="col-span-full text-center py-20">
            <p className="text-red-500 text-lg mb-2">{error}</p>
            <button onClick={() => window.location.reload()} className="text-brand-cyan hover:underline">Retry</button>
          </div>
        ) : products.length === 0 ? (
          <div className="col-span-full text-center py-20">
            <p className="text-brand-gray text-lg">No products available for this machine.</p>
            <p className="text-brand-gray text-sm mt-2">Machine ID: {machineId}</p>

            {/* DEBUG SECTION */}
            <div className="mt-8 p-4 bg-gray-900 rounded text-left overflow-auto max-h-60">
              <p className="text-yellow-500 font-mono text-xs mb-2">DEBUG INFO:</p>
              <p className="text-gray-400 text-xs font-mono">Total Products Fetched (Pre-filter): {debugData?.length ?? 'N/A'}</p>
              <p className="text-gray-400 text-xs font-mono mt-2">First Product Sample:</p>
              <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap">
                {debugData && debugData.length > 0 ? JSON.stringify(debugData[0], null, 2) : 'No data'}
              </pre>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {products.map(product => {
              const cartItem = cart.find(item => item.id === product.id);
              const quantity = cartItem ? cartItem.quantity : 0;

              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  quantity={quantity}
                  onUpdateQuantity={handleUpdateQuantity}
                />
              );
            })}
          </div>
        )}
      </main>

      <Footer onAdminClick={onAdminClick} />

      {/* Cart Drawer */}
      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        machineStatus={machineStatus.status}
      />

    </div>
  );
};

export default ProductCatalog;
