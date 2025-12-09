import Parse from 'parse';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Initialize Parse
Parse.initialize(
    process.env.VITE_PARSE_APPLICATION_ID || '',
    process.env.VITE_PARSE_JAVASCRIPT_KEY || ''
);
Parse.serverURL = 'https://parseapi.back4app.com/';

console.log('Parse initialized with:');
console.log('App ID:', process.env.VITE_PARSE_APPLICATION_ID?.substring(0, 10) + '...');
console.log('Server URL:', Parse.serverURL);

// Mock Machines Data
const MOCK_MACHINES = [
    { machineId: 'VM-001', location: '601 (Lobby)', status: 'online' },
    { machineId: 'VM-002', location: '2nd Floor', status: 'online' },
    { machineId: 'VM-003', location: 'Gym', status: 'online' }
];

// Mock Products Data (from ProductCatalog.tsx)
const MOCK_PRODUCTS = [
    {
        name: 'Neon Gummy Bears',
        description: 'Electrified fruit flavors that glow in the dark.',
        price: 3.50,
        image: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&q=80&w=500',
        stock: 12,
        slot: 'A1',
        category: 'Sweets',
        machine: 'VM-001'
    },
    {
        name: 'Cyber Chips (Spicy)',
        description: 'Crunchy potato synthesis with a firewall of spice.',
        price: 2.75,
        image: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&q=80&w=500',
        stock: 8,
        slot: 'A2',
        category: 'Savory',
        machine: 'VM-001'
    },
    {
        name: 'Quantum Cola',
        description: 'Zero sugar, 100% energy. Paradoxically refreshing.',
        price: 1.99,
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=500',
        stock: 15,
        slot: 'B1',
        category: 'Drinks',
        machine: 'VM-001'
    },
    {
        name: 'Void Water',
        description: 'Sourced from the edge of the universe. Pure hydration.',
        price: 4.50,
        image: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?auto=format&fit=crop&q=80&w=500',
        stock: 20,
        slot: 'B2',
        category: 'Drinks',
        machine: 'VM-001'
    },
    {
        name: 'Data Bytes (Pretzels)',
        description: 'Salted binary knots for efficient snacking.',
        price: 2.25,
        image: 'https://images.unsplash.com/photo-1599599810653-98fe0a1350e9?auto=format&fit=crop&q=80&w=500',
        stock: 5,
        slot: 'C1',
        category: 'Savory',
        machine: 'VM-001'
    },
    {
        name: 'Neural Bar',
        description: 'Protein packed block for brain optimization.',
        price: 3.00,
        image: 'https://images.unsplash.com/photo-1622483767128-342790b4d452?auto=format&fit=crop&q=80&w=500',
        stock: 15,
        slot: 'C2',
        category: 'Health',
        machine: 'VM-001'
    }
];

// Mock Orders Data (from AdminDashboard.tsx)
const MOCK_ORDERS = [
    {
        items: [
            { productId: 'temp-1', name: 'Neon Gummy Bears', quantity: 2, priceAtPurchase: 3.50 },
            { productId: 'temp-2', name: 'Data Bytes (Pretzels)', quantity: 1, priceAtPurchase: 2.25 }
        ],
        total: 9.25,
        status: 'completed',
        machine: 'VM-001',
        transactionId: 'BB1751656824134'
    },
    {
        items: [
            { productId: 'temp-3', name: 'Quantum Cola', quantity: 1, priceAtPurchase: 1.99 },
            { productId: 'temp-4', name: 'Cyber Chips (Spicy)', quantity: 1, priceAtPurchase: 2.75 }
        ],
        total: 4.74,
        status: 'completed',
        machine: 'VM-002',
        transactionId: 'BB1751656259106'
    },
    {
        items: [
            { productId: 'temp-3', name: 'Quantum Cola', quantity: 2, priceAtPurchase: 1.99 },
            { productId: 'temp-4', name: 'Cyber Chips (Spicy)', quantity: 1, priceAtPurchase: 2.75 }
        ],
        total: 6.73,
        status: 'completed',
        machine: 'VM-002',
        transactionId: 'BB1751656225396'
    },
    {
        items: [
            { productId: 'temp-1', name: 'Neon Gummy Bears', quantity: 1, priceAtPurchase: 3.50 },
            { productId: 'temp-3', name: 'Quantum Cola', quantity: 1, priceAtPurchase: 1.99 }
        ],
        total: 5.49,
        status: 'cancelled',
        machine: 'VM-001',
        transactionId: 'BB1751656199262'
    }
];

async function addMachine(data) {
    const Machine = Parse.Object.extend('Machine');
    const machine = new Machine();

    machine.set('machineId', data.machineId);
    machine.set('location', data.location);
    machine.set('status', data.status);
    machine.set('lastHeartbeat', new Date());

    const result = await machine.save();
    return {
        ...data,
        id: result.id
    };
}

async function addProduct(data) {
    const Product = Parse.Object.extend('Product');
    const product = new Product();

    product.set('name', data.name);
    product.set('slot', data.slot);
    product.set('price', data.price);
    product.set('stock', data.stock);
    product.set('category', data.category);
    product.set('image', data.image);
    product.set('description', data.description);
    product.set('machine', data.machine);

    const result = await product.save();
    return { ...data, id: result.id };
}

async function createOrder(data) {
    const Order = Parse.Object.extend('Order');
    const order = new Order();

    order.set('items', data.items);
    order.set('total', data.total);
    order.set('status', data.status);
    order.set('machine', data.machine);
    if (data.transactionId) order.set('transactionId', data.transactionId);

    const result = await order.save();
    return {
        ...data,
        id: result.id,
        createdAt: result.createdAt
    };
}

async function runMigration() {
    console.log('🚀 Starting migration to Back4App...\n');

    try {
        // Step 1: Migrate Machines
        console.log('📍 Migrating Machines...');
        for (const machine of MOCK_MACHINES) {
            const result = await addMachine(machine);
            console.log(`✅ Created machine: ${result.machineId} (${result.location})`);
        }
        console.log('');

        // Step 2: Migrate Products
        console.log('📦 Migrating Products...');
        const productIdMap = {};

        for (const product of MOCK_PRODUCTS) {
            const result = await addProduct(product);
            console.log(`✅ Created product: ${result.name} - Slot ${result.slot}`);
            // Store mapping for orders
            if (result.id) {
                productIdMap[product.name] = result.id;
            }
        }
        console.log('');

        // Step 3: Migrate Orders
        console.log('🛒 Migrating Orders...');
        for (const order of MOCK_ORDERS) {
            // Update productIds with real IDs from the database
            const updatedItems = order.items.map(item => ({
                ...item,
                productId: productIdMap[item.name] || item.productId
            }));

            const result = await createOrder({
                ...order,
                items: updatedItems
            });
            console.log(`✅ Created order: ${result.transactionId} - ${result.status} - ₹${result.total}`);
        }
        console.log('');

        console.log('✨ Migration completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - Machines: ${MOCK_MACHINES.length}`);
        console.log(`   - Products: ${MOCK_PRODUCTS.length}`);
        console.log(`   - Orders: ${MOCK_ORDERS.length}`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

// Run migration
runMigration()
    .then(() => {
        console.log('\n✅ All done! Your Back4App database is ready.');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Migration error:', error);
        process.exit(1);
    });
