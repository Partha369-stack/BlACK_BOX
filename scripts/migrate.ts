import Parse from 'parse';
import { ParseService } from '../services/parseService';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Initialize Parse (same as in parseService)
Parse.initialize(
    process.env.VITE_PARSE_APPLICATION_ID || '',
    process.env.VITE_PARSE_JAVASCRIPT_KEY || ''
);
Parse.serverURL = 'https://parseapi.back4app.com/';

// Mock Machines Data
const MOCK_MACHINES = [
    { machineId: 'VM-001', location: '601 (Lobby)', status: 'online' as const },
    { machineId: 'VM-002', location: '2nd Floor', status: 'online' as const },
    { machineId: 'VM-003', location: 'Gym', status: 'online' as const }
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
            { productId: 'temp-1', name: 'Chocolate Bar', quantity: 2, priceAtPurchase: 3.00 },
            { productId: 'temp-2', name: 'Pretzels', quantity: 1, priceAtPurchase: 2.25 }
        ],
        total: 12.50,
        status: 'completed' as const,
        machine: 'VM-001',
        transactionId: 'BB1751656824134'
    },
    {
        items: [
            { productId: 'temp-3', name: 'Energy Drink', quantity: 1, priceAtPurchase: 4.50 },
            { productId: 'temp-4', name: 'Cookies', quantity: 1, priceAtPurchase: 2.75 }
        ],
        total: 7.25,
        status: 'completed' as const,
        machine: 'VM-002',
        transactionId: 'BB1751656259106'
    },
    {
        items: [
            { productId: 'temp-3', name: 'Energy Drink', quantity: 1, priceAtPurchase: 4.50 },
            { productId: 'temp-4', name: 'Cookies', quantity: 2, priceAtPurchase: 2.75 }
        ],
        total: 10.00,
        status: 'completed' as const,
        machine: 'VM-002',
        transactionId: 'BB1751656225396'
    },
    {
        items: [
            { productId: 'temp-1', name: 'Chocolate Bar', quantity: 1, priceAtPurchase: 3.00 },
            { productId: 'temp-3', name: 'Energy Drink', quantity: 1, priceAtPurchase: 4.50 }
        ],
        total: 7.50,
        status: 'cancelled' as const,
        machine: 'VM-001',
        transactionId: 'BB1751656199262'
    }
];

async function runMigration() {
    console.log('🚀 Starting migration to Back4App...\n');

    try {
        // Step 1: Migrate Machines
        console.log('📍 Migrating Machines...');
        for (const machine of MOCK_MACHINES) {
            const result = await ParseService.addMachine(machine);
            console.log(`✅ Created machine: ${result.machineId} (${result.location})`);
        }
        console.log('');

        // Step 2: Migrate Products
        console.log('📦 Migrating Products...');
        const productIdMap: { [key: string]: string } = {};

        for (const product of MOCK_PRODUCTS) {
            const result = await ParseService.addProduct(product);
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

            const result = await ParseService.createOrder({
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
