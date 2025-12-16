
import React from 'react';
import { Product } from '../../types';
import { PlusIcon, MinusIcon } from '../Shared/Icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

interface ProductCardProps {
    product: Product;
    quantity: number;
    onUpdateQuantity: (id: string, delta: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, quantity, onUpdateQuantity }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id: machineId } = useParams<{ id: string }>();

    const isOutOfStock = product.stock <= 0;
    const isLowStock = product.stock > 0 && product.stock < 5;

    const handleAddToCart = (delta: number) => {
        // Check if user is authenticated before adding to cart
        if (!user && delta > 0 && quantity === 0) {
            // Redirect to login with return URL
            const currentPath = `/machine/${machineId}`;
            navigate(`/login?returnTo=${encodeURIComponent(currentPath)}`);
            return;
        }
        onUpdateQuantity(product.id, delta);
    };

    return (
        <div className={`group relative glass-panel rounded-2xl p-3 md:p-5 flex flex-col h-full transition-all duration-300 ${quantity > 0 ? 'border-white/50 bg-white/5' : 'hover:bg-white/5 border-white/10'}`}>

            {/* Image Area */}
            <div className="relative aspect-square mb-4 overflow-hidden rounded-xl bg-black/20">
                <img
                    src={product.image}
                    alt={`${product.name} - ${product.description}`}
                    loading="lazy"
                    className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${isOutOfStock ? 'grayscale opacity-50' : ''}`}
                />
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Sold Out Overlay */}
                {isOutOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                        <span className="text-white font-bold font-sans uppercase tracking-widest text-sm border-2 border-white px-3 py-1">Sold Out</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-grow flex flex-col">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="font-sans font-bold text-white text-sm md:text-base leading-tight pr-2">{product.name}</h3>
                    <span className="font-mono text-white font-bold text-sm md:text-base">₹{product.price.toFixed(2)}</span>
                </div>

                {/* Slot & Stock Info (Moved here) */}
                <div className="flex items-center gap-3 text-xs font-mono mb-3">
                    <span className="bg-white/10 px-2 py-0.5 rounded text-brand-gray border border-white/5 tracking-wider">
                        {product.slot}
                    </span>
                    {!isOutOfStock && (
                        <span className={`${isLowStock ? 'text-white/80' : 'text-brand-gray/70'}`}>
                            {isLowStock ? `Only ${product.stock} left` : `${product.stock} in stock`}
                        </span>
                    )}
                </div>

                <p className="text-xs text-brand-gray font-sans mb-4 line-clamp-2 flex-grow hidden md:block">
                    {product.description}
                </p>

                {/* Controls */}
                <div className="mt-auto pt-3 border-t border-white/5">
                    {quantity === 0 ? (
                        <button
                            onClick={() => handleAddToCart(1)}
                            disabled={isOutOfStock}
                            className={`w-full py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-medium font-sans transition-all duration-300 flex items-center justify-center gap-2
                    ${isOutOfStock
                                    ? 'bg-white/5 text-white/20 cursor-not-allowed'
                                    : 'bg-white/10 text-white hover:bg-white hover:text-black hover:shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                                }`}
                        >
                            {isOutOfStock ? 'UNAVAILABLE' : 'ADD TO CART'}
                        </button>
                    ) : (
                        <div className="flex items-center justify-between bg-black/40 rounded-lg p-1 border border-white/30">
                            <button
                                onClick={() => handleAddToCart(-1)}
                                className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded bg-white/5 text-white hover:bg-white/20 transition-colors active:scale-95"
                            >
                                <MinusIcon />
                            </button>

                            <span className="font-mono font-bold text-white w-6 md:w-8 text-center text-sm">
                                {quantity}
                            </span>

                            <button
                                onClick={() => handleAddToCart(1)}
                                disabled={quantity >= product.stock}
                                className={`w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded bg-white text-black transition-colors active:scale-95 shadow-[0_0_10px_rgba(255,255,255,0.3)]
                            ${quantity >= product.stock ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/90'}
                        `}
                            >
                                <PlusIcon />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
