import React, { useState, useEffect, useRef } from 'react';
import { ParseService, ProductData } from '../../services/parseService';
import LoadingSpinner from '../Shared/LoadingSpinner';
import {
    SearchIcon,
    ChevronDownIcon,
    PlusIcon,
    MinusIcon,
    EditIcon,
    TrashIcon,
    XIcon,
    UploadIcon
} from '../Shared/Icons';

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

    // Multi-select state
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [isBulkStockModalOpen, setIsBulkStockModalOpen] = useState(false);
    const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);
    const [isBulkMachineModalOpen, setIsBulkMachineModalOpen] = useState(false);
    const [bulkStock, setBulkStock] = useState('');
    const [bulkPrice, setBulkPrice] = useState('');
    const [bulkMachine, setBulkMachine] = useState('VM-001');
    const [isBulkOperating, setIsBulkOperating] = useState(false);

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
        } catch (error: any) {
            console.error("Failed to save product", error);

            // Show detailed error message based on error code
            let errorMessage = "Failed to save product. ";

            if (error.code === 119) {
                errorMessage += "You don't have permission to create products. Please check your admin role.";
            } else if (error.code === 209) {
                errorMessage += "Invalid session. Please log out and log back in.";
            } else if (error.code === 100) {
                errorMessage += "Connection error. Please check your internet connection.";
            } else if (error.message) {
                errorMessage += error.message;
            } else {
                errorMessage += "Please try again or contact support.";
            }

            alert(errorMessage);
        }
    };

    // Multi-select handlers
    const handleSelectProduct = (id: string) => {
        setSelectedProducts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedProducts.size === filteredProducts.length) {
            setSelectedProducts(new Set());
        } else {
            setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
        }
    };

    const handleDeselectAll = () => {
        setSelectedProducts(new Set());
    };

    const handleBulkDelete = async () => {
        setIsBulkOperating(true);
        try {
            const deletePromises = Array.from(selectedProducts).map(id =>
                ParseService.deleteProduct(id)
            );
            await Promise.all(deletePromises);
            setProducts(prev => prev.filter(p => !selectedProducts.has(p.id)));
            setSelectedProducts(new Set());
            setIsBulkDeleteModalOpen(false);
        } catch (error) {
            console.error("Failed to delete products", error);
            alert("Failed to delete some products. Please try again.");
        } finally {
            setIsBulkOperating(false);
        }
    };

    const handleBulkStockUpdate = async () => {
        const stock = parseInt(bulkStock);
        if (isNaN(stock) || stock < 0) {
            alert("Please enter a valid stock number.");
            return;
        }

        setIsBulkOperating(true);
        try {
            const updatePromises = Array.from(selectedProducts).map(id =>
                ParseService.updateProduct(id, { stock })
            );
            await Promise.all(updatePromises);
            setProducts(prev => prev.map(p =>
                selectedProducts.has(p.id) ? { ...p, stock } : p
            ));
            setSelectedProducts(new Set());
            setIsBulkStockModalOpen(false);
            setBulkStock('');
        } catch (error) {
            console.error("Failed to update stock", error);
            alert("Failed to update stock for some products. Please try again.");
        } finally {
            setIsBulkOperating(false);
        }
    };

    const handleBulkPriceUpdate = async () => {
        const price = parseFloat(bulkPrice);
        if (isNaN(price) || price < 0) {
            alert("Please enter a valid price.");
            return;
        }

        setIsBulkOperating(true);
        try {
            const updatePromises = Array.from(selectedProducts).map(id =>
                ParseService.updateProduct(id, { price })
            );
            await Promise.all(updatePromises);
            setProducts(prev => prev.map(p =>
                selectedProducts.has(p.id) ? { ...p, price } : p
            ));
            setSelectedProducts(new Set());
            setIsBulkPriceModalOpen(false);
            setBulkPrice('');
        } catch (error) {
            console.error("Failed to update price", error);
            alert("Failed to update price for some products. Please try again.");
        } finally {
            setIsBulkOperating(false);
        }
    };

    const handleBulkMachineAssign = async () => {
        setIsBulkOperating(true);
        try {
            const updatePromises = Array.from(selectedProducts).map(id =>
                ParseService.updateProduct(id, { machine: bulkMachine })
            );
            await Promise.all(updatePromises);
            setProducts(prev => prev.map(p =>
                selectedProducts.has(p.id) ? { ...p, machine: bulkMachine } : p
            ));
            setSelectedProducts(new Set());
            setIsBulkMachineModalOpen(false);
        } catch (error) {
            console.error("Failed to assign machine", error);
            alert("Failed to assign machine for some products. Please try again.");
        } finally {
            setIsBulkOperating(false);
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

            {/* Bulk Actions Toolbar */}
            {selectedProducts.size > 0 && (
                <div className="bg-gradient-to-r from-brand-pink/10 to-purple-600/10 border border-brand-pink/30 rounded-xl p-4 backdrop-blur-sm animate-enter-up shadow-[0_0_20px_rgba(255,42,109,0.2)]">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-brand-pink/20 flex items-center justify-center">
                                <span className="text-brand-pink font-bold text-sm">{selectedProducts.size}</span>
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm">
                                    {selectedProducts.size} product{selectedProducts.size > 1 ? 's' : ''} selected
                                </p>
                                <button
                                    onClick={handleDeselectAll}
                                    className="text-brand-gray hover:text-white text-xs transition-colors"
                                >
                                    Deselect all
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setIsBulkStockModalOpen(true)}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors border border-white/20 hover:border-white/40"
                            >
                                Update Stock
                            </button>
                            <button
                                onClick={() => setIsBulkPriceModalOpen(true)}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors border border-white/20 hover:border-white/40"
                            >
                                Update Price
                            </button>
                            <button
                                onClick={() => setIsBulkMachineModalOpen(true)}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors border border-white/20 hover:border-white/40"
                            >
                                Assign Machine
                            </button>
                            <button
                                onClick={() => setIsBulkDeleteModalOpen(true)}
                                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium transition-colors border border-red-500/30 hover:border-red-500/50"
                            >
                                Delete Selected
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Inventory Table */}
            <div className="bg-[#050505] border border-white/10 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-xs text-brand-gray font-medium uppercase tracking-wider border-b border-white/10">
                                <th className="px-6 py-4 w-12">
                                    <input
                                        type="checkbox"
                                        checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 rounded border-white/20 bg-white/10 text-brand-pink focus:ring-brand-pink focus:ring-offset-0 cursor-pointer"
                                        style={{ accentColor: '#ff2a6d' }}
                                    />
                                </th>
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
                                    <td colSpan={9} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <LoadingSpinner size="lg" />
                                            <p className="mt-4 text-brand-gray text-sm animate-pulse">Loading inventory...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredProducts.length > 0 ? (
                                filteredProducts.map(product => (
                                    <tr
                                        key={product.id}
                                        className={`hover:bg-white/5 transition-colors group ${selectedProducts.has(product.id) ? 'bg-brand-pink/5 border-l-4 border-brand-pink' : ''
                                            }`}
                                    >
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedProducts.has(product.id)}
                                                onChange={() => handleSelectProduct(product.id)}
                                                className="w-4 h-4 rounded border-white/20 bg-white/10 text-brand-pink focus:ring-brand-pink focus:ring-offset-0 cursor-pointer"
                                                style={{ accentColor: '#ff2a6d' }}
                                            />
                                        </td>
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
                                    <td colSpan={9} className="px-6 py-12 text-center">
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

            {/* Bulk Delete Modal */}
            {isBulkDeleteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsBulkDeleteModalOpen(false)}></div>
                    <div className="relative bg-[#0a0a0a] border border-red-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-enter-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white font-orbitron">Delete Products</h3>
                            <button onClick={() => setIsBulkDeleteModalOpen(false)} className="text-brand-gray hover:text-white">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <p className="text-brand-gray mb-6">
                            Are you sure you want to delete <span className="text-red-500 font-bold">{selectedProducts.size}</span> product{selectedProducts.size > 1 ? 's' : ''}? This action cannot be undone.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsBulkDeleteModalOpen(false)}
                                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors border border-white/10"
                                disabled={isBulkOperating}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                disabled={isBulkOperating}
                                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isBulkOperating ? <LoadingSpinner size="sm" /> : null}
                                {isBulkOperating ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Stock Update Modal */}
            {isBulkStockModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsBulkStockModalOpen(false)}></div>
                    <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-enter-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white font-orbitron">Update Stock</h3>
                            <button onClick={() => setIsBulkStockModalOpen(false)} className="text-brand-gray hover:text-white">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <p className="text-brand-gray mb-4">
                            Set stock level for <span className="text-brand-pink font-bold">{selectedProducts.size}</span> selected product{selectedProducts.size > 1 ? 's' : ''}:
                        </p>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-brand-gray uppercase mb-2">New Stock Level</label>
                            <input
                                type="number"
                                min="0"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-brand-pink outline-none transition-colors"
                                value={bulkStock}
                                onChange={(e) => setBulkStock(e.target.value)}
                                placeholder="Enter stock quantity"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsBulkStockModalOpen(false)}
                                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors border border-white/10"
                                disabled={isBulkOperating}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkStockUpdate}
                                disabled={isBulkOperating}
                                className="flex-1 px-4 py-3 bg-brand-pink hover:bg-brand-pink/90 text-white rounded-xl transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isBulkOperating ? <LoadingSpinner size="sm" /> : null}
                                {isBulkOperating ? 'Updating...' : 'Update'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Price Update Modal */}
            {isBulkPriceModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsBulkPriceModalOpen(false)}></div>
                    <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-enter-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white font-orbitron">Update Price</h3>
                            <button onClick={() => setIsBulkPriceModalOpen(false)} className="text-brand-gray hover:text-white">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <p className="text-brand-gray mb-4">
                            Set price for <span className="text-brand-pink font-bold">{selectedProducts.size}</span> selected product{selectedProducts.size > 1 ? 's' : ''}:
                        </p>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-brand-gray uppercase mb-2">New Price (₹)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-brand-pink outline-none transition-colors"
                                value={bulkPrice}
                                onChange={(e) => setBulkPrice(e.target.value)}
                                placeholder="Enter price"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsBulkPriceModalOpen(false)}
                                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors border border-white/10"
                                disabled={isBulkOperating}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkPriceUpdate}
                                disabled={isBulkOperating}
                                className="flex-1 px-4 py-3 bg-brand-pink hover:bg-brand-pink/90 text-white rounded-xl transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isBulkOperating ? <LoadingSpinner size="sm" /> : null}
                                {isBulkOperating ? 'Updating...' : 'Update'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Machine Assignment Modal */}
            {isBulkMachineModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsBulkMachineModalOpen(false)}></div>
                    <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-enter-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white font-orbitron">Assign Machine</h3>
                            <button onClick={() => setIsBulkMachineModalOpen(false)} className="text-brand-gray hover:text-white">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <p className="text-brand-gray mb-4">
                            Assign <span className="text-brand-pink font-bold">{selectedProducts.size}</span> selected product{selectedProducts.size > 1 ? 's' : ''} to a machine:
                        </p>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-brand-gray uppercase mb-2">Select Machine</label>
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-brand-pink outline-none transition-colors"
                                style={{ colorScheme: 'dark' }}
                                value={bulkMachine}
                                onChange={(e) => setBulkMachine(e.target.value)}
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

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsBulkMachineModalOpen(false)}
                                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors border border-white/10"
                                disabled={isBulkOperating}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkMachineAssign}
                                disabled={isBulkOperating}
                                className="flex-1 px-4 py-3 bg-brand-pink hover:bg-brand-pink/90 text-white rounded-xl transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isBulkOperating ? <LoadingSpinner size="sm" /> : null}
                                {isBulkOperating ? 'Assigning...' : 'Assign'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryView;
