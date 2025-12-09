import React, { useState, useEffect, useRef } from 'react';
import { ParseService, ProductData } from '../../services/parseService';
import LoadingSpinner from '../LoadingSpinner';
import {
    SearchIcon,
    ChevronDownIcon,
    PlusIcon,
    MinusIcon,
    EditIcon,
    TrashIcon,
    XIcon,
    UploadIcon
} from '../Icons';

const InventoryView: React.FC = () => {
    // Data State
    const [products, setProducts] = useState<ProductData[]>([]);
    const [machines, setMachines] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch Products and Machines on Mount
    useEffect(() => {
        loadProducts();
        loadMachines();
    }, []);

    const loadProducts = async () => {
        setIsLoading(true);
        try {
            const data = await ParseService.getProducts();
            setProducts(data);
        } catch (error) {
            console.error("Failed to load products", error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMachines = async () => {
        try {
            const data = await ParseService.getMachines();
            setMachines(data);
        } catch (error) {
            console.error("Failed to load machines", error);
        }
    };

    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [machineFilter, setMachineFilter] = useState('All');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Upload & Edit State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);

    // Modal Form State
    const [newProduct, setNewProduct] = useState({
        name: '',
        slot: '',
        price: '',
        stock: '',
        category: 'Sweets',
        description: '',
        machine: 'VM-001'
    });

    const handleStockChange = async (id: string, delta: number) => {
        const product = products.find(p => p.id === id);
        if (!product) return;

        const newStock = Math.max(0, product.stock + delta);

        // Optimistic update
        setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));

        try {
            await ParseService.updateProduct(id, { stock: newStock });
        } catch (error) {
            console.error("Failed to update stock", error);
            // Revert on failure
            setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: product.stock } : p));
        }
    };

    const handlePriceChange = async (id: string, newPrice: string) => {
        const price = parseFloat(newPrice);
        if (isNaN(price) || price < 0) return;

        const product = products.find(p => p.id === id);
        if (!product) return;

        // Optimistic update
        setProducts(prev => prev.map(p => p.id === id ? { ...p, price } : p));

        try {
            await ParseService.updateProduct(id, { price });
        } catch (error) {
            console.error("Failed to update price", error);
            // Revert on failure
            setProducts(prev => prev.map(p => p.id === id ? { ...p, price: product.price } : p));
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                await ParseService.deleteProduct(id);
                setProducts(prev => prev.filter(p => p.id !== id));
            } catch (error) {
                console.error("Failed to delete product", error);
                alert("Failed to delete product. Please try again.");
            }
        }
    }

    const openAddModal = () => {
        setNewProduct({ name: '', slot: '', price: '', stock: '', category: 'Sweets', description: '', machine: 'VM-001' });
        setImagePreview('');
        setIsEditing(false);
        setCurrentId(null);
        setIsAddModalOpen(true);
    };

    const openEditModal = (product: any) => {
        setNewProduct({
            name: product.name,
            slot: product.slot,
            price: product.price.toString(),
            stock: product.stock.toString(),
            category: product.category,
            description: product.description || '',
            machine: product.machine || 'VM-001'
        });
        setImagePreview(product.image);
        setIsEditing(true);
        setCurrentId(product.id);
        setIsAddModalOpen(true);
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();

        const productData: ProductData = {
            name: newProduct.name,
            slot: newProduct.slot,
            price: parseFloat(newProduct.price) || 0,
            stock: parseInt(newProduct.stock) || 0,
            category: newProduct.category,
            image: imagePreview || 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&q=80&w=100',
            description: newProduct.description,
            machine: newProduct.machine
        };

        try {
            if (isEditing && currentId) {
                await ParseService.updateProduct(currentId, productData);
                setProducts(prev => prev.map(p => p.id === currentId ? { ...p, ...productData, id: currentId } : p));
            } else {
                const newP = await ParseService.addProduct(productData);
                setProducts(prev => [...prev, newP]);
            }
            setIsAddModalOpen(false);
        } catch (error) {
            console.error("Failed to save product", error);
            alert("Failed to save product. Please try again.");
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.slot.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
        const matchesMachine = machineFilter === 'All' || p.machine === machineFilter;
        return matchesSearch && matchesCategory && matchesMachine;
    });

    return (
        <div className="space-y-6">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-2 bg-[#050505] border border-white/10 px-4 py-2.5 rounded-xl w-full md:w-96 focus-within:border-white/50 transition-colors shadow-sm">
                    <SearchIcon className="w-5 h-5 text-brand-gray" />
                    <input
                        type="text"
                        placeholder="Search products by name or slot..."
                        className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-brand-gray/50 font-sans"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    {/* Category Filter */}
                    <div className="relative group">
                        <select
                            className="appearance-none bg-[#050505] border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 pr-10 hover:border-white/30 focus:border-white transition-colors outline-none cursor-pointer h-full"
                            style={{ colorScheme: 'dark' }}
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="All" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>All Categories</option>
                            <option value="Sweets" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Sweets</option>
                            <option value="Savory" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Savory</option>
                            <option value="Drinks" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Drinks</option>
                            <option value="Health" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Health</option>
                        </select>
                        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray pointer-events-none" />
                    </div>

                    {/* Machine Filter */}
                    <div className="relative group">
                        <select
                            className="appearance-none bg-[#050505] border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 pr-10 hover:border-white/30 focus:border-white transition-colors outline-none cursor-pointer h-full"
                            style={{ colorScheme: 'dark' }}
                            value={machineFilter}
                            onChange={(e) => setMachineFilter(e.target.value)}
                        >
                            <option value="All" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>All Machines</option>
                            {machines.map(machine => (
                                <option key={machine.id} value={machine.machineId} style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>
                                    {machine.machineId} ({machine.location})
                                </option>
                            ))}
                        </select>
                        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray pointer-events-none" />
                    </div>

                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white text-black rounded-xl hover:bg-white/90 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.3)] text-sm font-bold whitespace-nowrap"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Add Product
                    </button>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-[#050505] border border-white/10 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-xs text-brand-gray font-medium uppercase tracking-wider border-b border-white/10">
                                <th className="px-6 py-4 font-orbitron">Product</th>
                                <th className="px-6 py-4 font-orbitron">Slot</th>
                                <th className="px-6 py-4 font-orbitron">Machine</th>
                                <th className="px-6 py-4 font-orbitron">Category</th>
                                <th className="px-6 py-4 font-orbitron">Price (₹)</th>
                                <th className="px-6 py-4 font-orbitron">Stock Level</th>
                                <th className="px-6 py-4 font-orbitron">Status</th>
                                <th className="px-6 py-4 font-orbitron text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <LoadingSpinner size="lg" />
                                            <p className="mt-4 text-brand-gray text-sm animate-pulse">Loading inventory...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredProducts.length > 0 ? (
                                filteredProducts.map(product => (
                                    <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-white/10 overflow-hidden flex-shrink-0">
                                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-sans font-bold text-white text-sm">{product.name}</span>
                                                    {product.description && <span className="text-[10px] text-brand-gray max-w-[150px] truncate">{product.description}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-white font-bold">{product.slot}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-white font-mono">{product.machine || 'N/A'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-brand-gray">{product.category}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                <span className="text-brand-gray text-sm">₹</span>
                                                <input
                                                    type="number"
                                                    className="bg-transparent border-b border-white/20 w-16 text-white font-mono text-sm focus:border-white outline-none py-1"
                                                    value={product.price}
                                                    onChange={(e) => handlePriceChange(product.id, e.target.value)}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleStockChange(product.id, -1)}
                                                    className="w-6 h-6 rounded flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
                                                >
                                                    <MinusIcon className="w-3 h-3" />
                                                </button>
                                                <span className="font-mono text-white w-8 text-center">{product.stock}</span>
                                                <button
                                                    onClick={() => handleStockChange(product.id, 1)}
                                                    className="w-6 h-6 rounded flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
                                                >
                                                    <PlusIcon className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {product.stock === 0 ? (
                                                <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 text-brand-gray border border-white/10">Out of Stock</span>
                                            ) : product.stock < 5 ? (
                                                <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white border border-white/20">Low Stock</span>
                                            ) : (
                                                <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white border border-white/20">In Stock</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(product)}
                                                    className="p-2 text-brand-gray hover:text-white transition-colors" title="Edit Item"
                                                >
                                                    <EditIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="p-2 text-brand-gray hover:text-red-500 transition-colors" title="Delete Item"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center opacity-50">
                                            <SearchIcon className="w-12 h-12 mb-3 text-brand-gray" />
                                            <p className="text-white text-lg font-medium">No products found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Product Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
                    <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-enter-up flex flex-col max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white font-orbitron">{isEditing ? 'Edit Product' : 'Add New Product'}</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-brand-gray hover:text-white">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProduct} className="space-y-4">

                            {/* Image Upload Area */}
                            <div className="w-full h-32 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center relative hover:border-brand-pink/50 transition-colors cursor-pointer group bg-white/5 overflow-hidden"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {imagePreview ? (
                                    <>
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">Change Image</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="p-3 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors mb-2">
                                            <UploadIcon className="w-6 h-6 text-brand-gray group-hover:text-white" />
                                        </div>
                                        <span className="text-xs text-brand-gray group-hover:text-white transition-colors">Click to upload image</span>
                                    </>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-brand-gray uppercase mb-1">Product Name</label>
                                <input
                                    type="text" required
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-brand-pink outline-none transition-colors"
                                    value={newProduct.name}
                                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-brand-gray uppercase mb-1">Description</label>
                                <textarea
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-brand-pink outline-none transition-colors resize-none h-20"
                                    value={newProduct.description}
                                    onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-brand-gray uppercase mb-1">Machine</label>
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-brand-pink outline-none transition-colors"
                                    style={{ colorScheme: 'dark' }}
                                    value={newProduct.machine}
                                    onChange={e => setNewProduct({ ...newProduct, machine: e.target.value })}
                                >
                                    {machines.length > 0 ? (
                                        machines.map(machine => (
                                            <option key={machine.id} value={machine.machineId} style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>
                                                {machine.machineId} ({machine.location})
                                            </option>
                                        ))
                                    ) : (
                                        <option value="VM-001" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>VM-001 (Lobby)</option>
                                    )}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-brand-gray uppercase mb-1">Slot ID</label>
                                    <input
                                        type="text" required placeholder="e.g. D1"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-brand-pink outline-none transition-colors"
                                        value={newProduct.slot}
                                        onChange={e => setNewProduct({ ...newProduct, slot: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-brand-gray uppercase mb-1">Category</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-brand-pink outline-none transition-colors"
                                        style={{ colorScheme: 'dark' }}
                                        value={newProduct.category}
                                        onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                                    >
                                        <option value="Sweets" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Sweets</option>
                                        <option value="Savory" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Savory</option>
                                        <option value="Drinks" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Drinks</option>
                                        <option value="Health" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Health</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-brand-gray uppercase mb-1">Price (₹)</label>
                                    <input
                                        type="number" required step="0.01" min="0"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-brand-pink outline-none transition-colors"
                                        value={newProduct.price}
                                        onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-brand-gray uppercase mb-1">Initial Stock</label>
                                    <input
                                        type="number" required min="0"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-brand-pink outline-none transition-colors"
                                        value={newProduct.stock}
                                        onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-brand-pink text-white font-bold py-3 rounded-xl mt-4 hover:bg-brand-pink/90 transition-all shadow-[0_0_15px_rgba(255,42,109,0.3)]">
                                {isEditing ? 'Save Changes' : 'Add to Inventory'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryView;
