
import React, { useState, useEffect, useRef } from 'react';
import { CartItem } from '../types';
import { XIcon, TrashIcon, PlusIcon, MinusIcon, CheckIcon } from './Icons';
import LoadingSpinner from './LoadingSpinner';
import { ParseService } from '../services/parseService';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { config } from '../config';

interface CartProps {
    isOpen: boolean;
    onClose: () => void;
    items: CartItem[];
    onUpdateQuantity: (id: string, delta: number) => void;
    onRemoveItem: (id: string) => void;
    onClearCart: () => void;
    machineStatus: string;
}

interface DispensingItem {
    id: string;
    name: string;
    image: string;
    quantity: number;
    dispensed: number;
    status: 'pending' | 'dispensing' | 'complete';
}

const Cart: React.FC<CartProps> = ({ isOpen, onClose, items, onUpdateQuantity, onRemoveItem, onClearCart, machineStatus }) => {
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [paymentDone, setPaymentDone] = useState(false);
    const [dispensing, setDispensing] = useState(false);
    const [dispensingItems, setDispensingItems] = useState<DispensingItem[]>([]);
    const [currentDispenseIndex, setCurrentDispenseIndex] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const { id: machineId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Ref to prevent multiple simultaneous dispense requests
    const isDispensingRef = useRef(false);

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + tax;

    // Real-time dispensing synchronized with ESP32
    useEffect(() => {
        if (!dispensing || dispensingItems.length === 0 || isDispensingRef.current) return;

        const currentItem = dispensingItems[currentDispenseIndex];
        if (!currentItem) return;

        if (currentItem.status === 'complete') {
            // Move to next item or complete
            if (currentDispenseIndex < dispensingItems.length - 1) {
                setCurrentDispenseIndex(prev => prev + 1);
            } else {
                // All items dispensed
                setTimeout(() => {
                    setIsComplete(true);
                    setDispensing(false);
                }, 1000);
            }
            return;
        }

        // Mark current item as dispensing
        if (currentItem.status === 'pending') {
            setDispensingItems(prev => prev.map((item, idx) =>
                idx === currentDispenseIndex ? { ...item, status: 'dispensing' as const } : item
            ));
        }

        // Dispense one unit at a time by calling the backend
        if (currentItem.dispensed < currentItem.quantity) {
            const dispenseOneUnit = async () => {
                // Lock to prevent simultaneous requests
                if (isDispensingRef.current) return;
                isDispensingRef.current = true;

                try {
                    const response = await fetch(`${config.apiUrl}/machines/${machineId || 'VM-001'}/dispense`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            items: [{
                                productId: currentItem.id,
                                name: currentItem.name,
                                quantity: 1 // Dispense one at a time
                            }]
                        })
                    });

                    if (response.ok) {
                        // Successfully dispensed one unit, update UI
                        setDispensingItems(prev => prev.map((item, idx) =>
                            idx === currentDispenseIndex
                                ? {
                                    ...item,
                                    dispensed: item.dispensed + 1,
                                    status: item.dispensed + 1 === item.quantity ? 'complete' as const : 'dispensing' as const
                                }
                                : item
                        ));
                    } else {
                        console.error('Dispense failed:', await response.text());
                        // Still update UI even on failure to prevent hanging
                        setDispensingItems(prev => prev.map((item, idx) =>
                            idx === currentDispenseIndex
                                ? {
                                    ...item,
                                    dispensed: item.dispensed + 1,
                                    status: item.dispensed + 1 === item.quantity ? 'complete' as const : 'dispensing' as const
                                }
                                : item
                        ));
                    }
                } catch (err) {
                    console.error('Failed to dispense:', err);
                    // Still update UI to prevent hanging
                    setDispensingItems(prev => prev.map((item, idx) =>
                        idx === currentDispenseIndex
                            ? {
                                ...item,
                                dispensed: item.dispensed + 1,
                                status: item.dispensed + 1 === item.quantity ? 'complete' as const : 'dispensing' as const
                            }
                            : item
                    ));
                } finally {
                    // Unlock after request completes
                    isDispensingRef.current = false;
                }
            };

            dispenseOneUnit();
        }
    }, [dispensing, dispensingItems, currentDispenseIndex, machineId]);

    const handleCheckout = async () => {
        // Check if user is authenticated before proceeding with checkout
        if (!user) {
            onClose(); // Close cart drawer
            const currentPath = `/machine/${machineId}`;
            navigate(`/login?returnTo=${encodeURIComponent(currentPath)}`);
            return;
        }

        // Check if machine is online before checkout
        if (machineStatus !== 'online') {
            alert(`Cannot complete checkout. Machine is currently ${machineStatus.toUpperCase()}. Please try again when the machine is online.`);
            return;
        }

        setIsCheckingOut(true);

        try {
            // 1. Fetch fresh product data to validate stock
            const currentProducts = await ParseService.getProducts();
            const outOfStockItems: string[] = [];

            // 2. Validate stock for all items
            for (const item of items) {
                const product = currentProducts.find(p => p.id === item.id);
                if (!product) {
                    outOfStockItems.push(`${item.name} (Product not found)`);
                    continue;
                }
                if (product.stock < item.quantity) {
                    outOfStockItems.push(`${item.name} (Only ${product.stock} left)`);
                }
            }

            // 3. Abort if any items are out of stock
            if (outOfStockItems.length > 0) {
                alert(`Cannot complete purchase. The following items are out of stock:\n${outOfStockItems.join('\n')}`);
                setIsCheckingOut(false);
                return;
            }

            // 4. Create order in Back4App
            const orderItems = items.map(item => ({
                productId: item.id,
                name: item.name,
                quantity: item.quantity,
                priceAtPurchase: item.price
            }));

            const transactionId = `BB${Date.now()}`;

            await ParseService.createOrder({
                items: orderItems,
                total: total,
                status: 'completed',
                machine: machineId || 'VM-001',
                transactionId: transactionId,
                userId: user?.id,
                userName: user?.get('name') || user?.get('username'),
                userEmail: user?.get('email')
            });

            // 5. Update stock levels for each product
            for (const item of items) {
                const product = currentProducts.find(p => p.id === item.id);
                if (product) {
                    await ParseService.updateProduct(item.id, {
                        stock: product.stock - item.quantity
                    });
                }
            }

            setIsCheckingOut(false);
            setPaymentDone(true);

            // Show payment confirmation for 2 seconds, then start dispensing
            setTimeout(() => {
                setPaymentDone(false);
                setDispensing(true);

                // Initialize dispensing items - UI will trigger actual dispenses via useEffect
                const dispenseItems: DispensingItem[] = items.map(item => ({
                    id: item.id,
                    name: item.name,
                    image: item.image,
                    quantity: item.quantity,
                    dispensed: 0,
                    status: 'pending' as const
                }));
                setDispensingItems(dispenseItems);
                setCurrentDispenseIndex(0);
            }, 2000);

        } catch (error) {
            console.error('Checkout failed:', error);
            setIsCheckingOut(false);
            alert('Checkout failed. Please try again.');
        }
    };

    const handleCloseSuccess = () => {
        setIsComplete(false);
        setDispensing(false);
        setDispensingItems([]);
        setCurrentDispenseIndex(0);
        onClearCart();
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={!dispensing ? onClose : undefined}
            ></div>

            {/* Drawer */}
            <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#0a0a0a] border-l border-white/10 z-[60] shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/50 backdrop-blur-md">
                    <h2 className="text-xl font-sans font-bold text-white tracking-wide">
                        {dispensing ? 'Dispensing...' : paymentDone ? 'Payment Complete' : `Your Cart (${items.length})`}
                    </h2>
                    {!dispensing && !paymentDone && (
                        <button onClick={onClose} className="p-2 text-brand-gray hover:text-white transition-colors">
                            <XIcon />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Payment Confirmation Screen */}
                    {paymentDone ? (
                        <div className="h-full flex flex-col items-center justify-center text-center animate-enter-up">
                            <div className="w-24 h-24 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mb-6 animate-pulse">
                                <CheckIcon className="w-12 h-12 text-green-500" />
                            </div>
                            <h3 className="text-3xl font-sans font-bold text-white mb-3">Payment Done!</h3>
                            <p className="text-xl text-green-400 font-mono mb-2">₹{total.toFixed(2)}</p>
                            <p className="text-brand-gray font-sans">Starting dispensing...</p>
                        </div>
                    )
                        /* Dispensing Screen */
                        : dispensing ? (
                            <div className="h-full flex flex-col">
                                {/* Current dispensing item */}
                                {dispensingItems[currentDispenseIndex] && (
                                    <div className="flex-1 flex flex-col items-center justify-center">
                                        <div className="w-full max-w-sm space-y-6 animate-enter-up">
                                            {/* Product Image */}
                                            <div className="w-40 h-40 mx-auto bg-black/40 rounded-2xl overflow-hidden border-2 border-white/20 shadow-lg">
                                                <img
                                                    src={dispensingItems[currentDispenseIndex].image}
                                                    alt={dispensingItems[currentDispenseIndex].name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>

                                            {/* Product Name */}
                                            <h3 className="text-2xl font-sans font-bold text-white text-center">
                                                {dispensingItems[currentDispenseIndex].name}
                                            </h3>

                                            {/* Overall Progress */}
                                            <div className="text-center space-y-1 bg-white/5 rounded-lg p-3 border border-white/10">
                                                <p className="text-xs text-brand-gray font-sans uppercase tracking-wide">
                                                    Item {currentDispenseIndex + 1} of {dispensingItems.length}
                                                </p>
                                                <p className="text-sm text-white font-mono">
                                                    Total Progress: {currentDispenseIndex}/{dispensingItems.length} items
                                                </p>
                                            </div>

                                            {/* Current Item Progress */}
                                            <div className="text-center space-y-2">
                                                <p className="text-lg text-white font-mono">
                                                    Dispensing {dispensingItems[currentDispenseIndex].dispensed} of {dispensingItems[currentDispenseIndex].quantity}
                                                </p>

                                                {/* Progress Bar */}
                                                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500 ease-out relative overflow-hidden"
                                                        style={{
                                                            width: `${(dispensingItems[currentDispenseIndex].dispensed / dispensingItems[currentDispenseIndex].quantity) * 100}%`
                                                        }}
                                                    >
                                                        <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                                                    </div>
                                                </div>

                                                {/* Time Estimate */}
                                                {(() => {
                                                    const remainingInCurrentItem = dispensingItems[currentDispenseIndex].quantity - dispensingItems[currentDispenseIndex].dispensed;
                                                    const remainingInOtherItems = dispensingItems
                                                        .slice(currentDispenseIndex + 1)
                                                        .reduce((sum, item) => sum + item.quantity, 0);
                                                    const totalRemaining = remainingInCurrentItem + remainingInOtherItems;
                                                    const estimatedSeconds = totalRemaining * 1.5; // 1.5s per item

                                                    return (
                                                        <p className="text-xs text-brand-gray font-mono">
                                                            ⏱ Estimated time: ~{estimatedSeconds.toFixed(0)}s remaining
                                                        </p>
                                                    );
                                                })()}
                                            </div>

                                            {/* Dispense Animation Icon */}
                                            <div className="flex justify-center">
                                                <div className="relative">
                                                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center animate-pulse">
                                                        <span className="text-4xl">📦</span>
                                                    </div>
                                                    <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Queue Preview */}
                                {dispensingItems.length > 1 && (
                                    <div className="mt-6 pt-6 border-t border-white/10">
                                        <p className="text-xs text-brand-gray font-sans mb-3 uppercase tracking-wide">Up Next</p>
                                        <div className="space-y-2 max-h-32 overflow-y-auto">
                                            {dispensingItems.map((item, idx) => {
                                                if (idx <= currentDispenseIndex) return null;
                                                return (
                                                    <div key={item.id} className="flex items-center gap-3 bg-white/5 p-2 rounded-lg">
                                                        <div className="w-10 h-10 bg-black/40 rounded overflow-hidden flex-shrink-0">
                                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-white font-sans truncate">{item.name}</p>
                                                            <p className="text-xs text-brand-gray font-mono">Qty: {item.quantity}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                            /* Complete Screen */
                            : isComplete ? (
                                <div className="h-full flex flex-col items-center justify-center text-center animate-enter-up">
                                    <div className="w-20 h-20 rounded-full bg-white/20 border border-white/50 flex items-center justify-center mb-6 text-white">
                                        <CheckIcon className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-2xl font-sans font-bold text-white mb-2">All Items Dispensed!</h3>
                                    <p className="text-brand-gray mb-8 max-w-xs mx-auto font-sans">Please collect your items from the tray below.</p>
                                    <button
                                        onClick={handleCloseSuccess}
                                        className="bg-white text-black font-bold py-3 px-8 rounded-lg hover:bg-gray-200 transition-colors font-sans uppercase"
                                    >
                                        Done
                                    </button>
                                </div>
                            )
                                /* Cart Items */
                                : items.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                            <span className="text-2xl">🛒</span>
                                        </div>
                                        <p className="text-brand-gray font-sans">Your cart is empty.</p>
                                        <button onClick={onClose} className="mt-4 text-white hover:underline text-sm font-sans">Start Browsing</button>
                                    </div>
                                ) : (
                                    items.map(item => (
                                        <div key={item.id} className="group flex gap-4 bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/30 transition-colors">
                                            <div className="w-20 h-20 bg-black/40 rounded-lg overflow-hidden flex-shrink-0">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 flex flex-col justify-between">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-white text-sm line-clamp-1 font-sans">{item.name}</h4>
                                                    <button
                                                        onClick={() => onRemoveItem(item.id)}
                                                        className="text-brand-gray hover:text-white transition-colors p-1"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <p className="text-white font-mono text-xs">₹{(item.price * item.quantity).toFixed(2)}</p>

                                                <div className="flex items-center gap-3 mt-2">
                                                    <button
                                                        onClick={() => onUpdateQuantity(item.id, -1)}
                                                        className="w-6 h-6 rounded flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
                                                    >
                                                        <MinusIcon className="w-3 h-3" />
                                                    </button>
                                                    <span className="text-sm font-mono font-bold w-4 text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => onUpdateQuantity(item.id, 1)}
                                                        className="w-6 h-6 rounded flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
                                                    >
                                                        <PlusIcon className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                </div>

                {/* Footer */}
                {!isComplete && !dispensing && !paymentDone && items.length > 0 && (
                    <div className="p-6 border-t border-white/10 bg-black/50 backdrop-blur-md">
                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between text-sm text-brand-gray font-sans">
                                <span>Subtotal</span>
                                <span className="font-mono text-white">₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-brand-gray font-sans">
                                <span>Tax (8%)</span>
                                <span className="font-mono text-white">₹{tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-white/10">
                                <span className="font-sans">Total</span>
                                <span className="font-mono text-white">₹{total.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={isCheckingOut}
                            className="w-full bg-white hover:bg-white/90 text-black font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:shadow-[0_0_30px_rgba(255,255,255,0.6)] transition-all duration-300 font-sans tracking-wider flex items-center justify-center gap-2 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCheckingOut ? (
                                <>
                                    <LoadingSpinner size="md" color="text-black" />
                                    <span className="ml-2">PROCESSING...</span>
                                </>
                            ) : (
                                <>PAY NOW</>
                            )}
                        </button>
                    </div>
                )}

            </div>
        </>
    );
};

export default Cart;
