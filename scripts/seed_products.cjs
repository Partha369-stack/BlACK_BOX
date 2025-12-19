const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const Parse = require('parse/node');

// Initialize Parse
Parse.initialize(
    process.env.VITE_PARSE_APPLICATION_ID,
    process.env.VITE_PARSE_JAVASCRIPT_KEY,
    process.env.VITE_PARSE_MASTER_KEY
);
Parse.serverURL = 'https://parseapi.back4app.com/';

// Sample product data
const sampleProducts = [
    // Sweets - VM-001
    {
        name: 'KitKat Chocolate',
        slot: 'A1',
        price: 30,
        stock: 15,
        category: 'Sweets',
        machine: 'VM-001',
        description: 'Classic chocolate wafer bar',
        image: 'https://images.unsplash.com/photo-1606312619070-d48b4ceb3e40?auto=format&fit=crop&q=80&w=200'
    },
    {
        name: 'Dairy Milk',
        slot: 'A2',
        price: 35,
        stock: 20,
        category: 'Sweets',
        machine: 'VM-001',
        description: 'Creamy milk chocolate',
        image: 'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&q=80&w=200'
    },
    {
        name: 'Snickers Bar',
        slot: 'A3',
        price: 40,
        stock: 12,
        category: 'Sweets',
        machine: 'VM-001',
        description: 'Peanut chocolate candy bar',
        image: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&q=80&w=200'
    },
    {
        name: 'Ferrero Rocher',
        slot: 'A4',
        price: 50,
        stock: 8,
        category: 'Sweets',
        machine: 'VM-001',
        description: 'Premium hazelnut chocolate',
        image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&q=80&w=200'
    },

    // Savory - VM-001
    {
        name: 'Lays Classic',
        slot: 'B1',
        price: 20,
        stock: 25,
        category: 'Savory',
        machine: 'VM-001',
        description: 'Classic salted potato chips',
        image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&q=80&w=200'
    },
    {
        name: 'Kurkure Masala',
        slot: 'B2',
        price: 20,
        stock: 18,
        category: 'Savory',
        machine: 'VM-001',
        description: 'Spicy crunchy snack',
        image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&q=80&w=200'
    },
    {
        name: 'Pringles Original',
        slot: 'B3',
        price: 80,
        stock: 10,
        category: 'Savory',
        machine: 'VM-001',
        description: 'Stackable potato crisps',
        image: 'https://images.unsplash.com/photo-1613919113640-25732ec5e61f?auto=format&fit=crop&q=80&w=200'
    },
    {
        name: 'Bingo Mad Angles',
        slot: 'B4',
        price: 20,
        stock: 22,
        category: 'Savory',
        machine: 'VM-001',
        description: 'Tangy tomato chips',
        image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&q=80&w=200'
    },

    // Drinks - VM-001
    {
        name: 'Coca Cola',
        slot: 'C1',
        price: 40,
        stock: 30,
        category: 'Drinks',
        machine: 'VM-001',
        description: 'Classic cola drink',
        image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&q=80&w=200'
    },
    {
        name: 'Sprite',
        slot: 'C2',
        price: 40,
        stock: 28,
        category: 'Drinks',
        machine: 'VM-001',
        description: 'Lemon-lime soda',
        image: 'https://images.unsplash.com/photo-1625740550580-a7ae6e7e4ae3?auto=format&fit=crop&q=80&w=200'
    },
    {
        name: 'Red Bull',
        slot: 'C3',
        price: 125,
        stock: 15,
        category: 'Drinks',
        machine: 'VM-001',
        description: 'Energy drink',
        image: 'https://images.unsplash.com/photo-1608181715050-7c1bb4aa86fa?auto=format&fit=crop&q=80&w=200'
    },
    {
        name: 'Bisleri Water',
        slot: 'C4',
        price: 20,
        stock: 40,
        category: 'Drinks',
        machine: 'VM-001',
        description: 'Packaged drinking water',
        image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=200'
    },

    // Health - VM-001
    {
        name: 'Protein Bar',
        slot: 'D1',
        price: 100,
        stock: 12,
        category: 'Health',
        machine: 'VM-001',
        description: 'High protein snack bar',
        image: 'https://images.unsplash.com/photo-1570831739435-6601aa3fa4fb?auto=format&fit=crop&q=80&w=200'
    },
    {
        name: 'Granola Mix',
        slot: 'D2',
        price: 60,
        stock: 10,
        category: 'Health',
        machine: 'VM-001',
        description: 'Healthy oats and nuts mix',
        image: 'https://images.unsplash.com/photo-1590080876695-2d2a55ed3e67?auto=format&fit=crop&q=80&w=200'
    },
    {
        name: 'Mixed Nuts Pack',
        slot: 'D3',
        price: 80,
        stock: 14,
        category: 'Health',
        machine: 'VM-001',
        description: 'Assorted roasted nuts',
        image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&q=80&w=200'
    },
];

async function seedProducts() {
    console.log('🌱 Starting product seeding...\n');

    const Product = Parse.Object.extend('Product');
    let successCount = 0;
    let errorCount = 0;

    for (const productData of sampleProducts) {
        try {
            const product = new Product();

            product.set('name', productData.name);
            product.set('slot', productData.slot);
            product.set('price', productData.price);
            product.set('stock', productData.stock);
            product.set('category', productData.category);
            product.set('machine', productData.machine);
            product.set('description', productData.description);
            product.set('image', productData.image);

            // Set ACL for public read, authenticated write
            const acl = new Parse.ACL();
            acl.setPublicReadAccess(true);
            acl.setPublicWriteAccess(true); // Allow public write for seeding
            product.setACL(acl);

            await product.save(null, { useMasterKey: true });
            console.log(`✅ Added: ${productData.name} (${productData.slot}) - ${productData.machine}`);
            successCount++;
        } catch (error) {
            console.error(`❌ Failed to add ${productData.name}:`, error.message);
            errorCount++;
        }
    }

    console.log(`\n📊 Seeding Complete!`);
    console.log(`   ✅ Success: ${successCount} products`);
    console.log(`   ❌ Failed: ${errorCount} products`);
}

// Run the seeder
seedProducts()
    .then(() => {
        console.log('\n✨ All done! Check your Back4App dashboard.\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Seeding failed:', error);
        process.exit(1);
    });
