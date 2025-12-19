const https = require('https');

// ==============================================================================
// BACK4APP CREDENTIALS (EMBEDDED DIRECTLY)
// ==============================================================================

const APP_ID = 'EU1h6y0JiM2uJfF7nJaBTGpgWyZHjkfRT6XXcLwy';
const MASTER_KEY = 'P4ax8vgVNqSPzDmCIzZZk87BhkPrqpxHmvQZJk2g';

// ==============================================================================
// DEMO PRODUCTS DATA
// ==============================================================================

const DEMO_PRODUCTS = [
    // Sweets
    {
        name: 'KitKat Chocolate',
        slot: 'A1',
        price: 20,
        stock: 15,
        category: 'Sweets',
        description: 'Crispy wafer fingers covered with chocolate',
        machine: 'VM-001',
        image: 'https://images.unsplash.com/photo-1606312619070-d48b4caa9fdb?auto=format&fit=crop&q=80&w=400'
    },
    {
        name: 'Dairy Milk',
        slot: 'A2',
        price: 25,
        stock: 20,
        category: 'Sweets',
        description: 'Classic milk chocolate bar',
        machine: 'VM-001',
        image: 'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&q=80&w=400'
    },
    {
        name: '5 Star',
        slot: 'A3',
        price: 10,
        stock: 25,
        category: 'Sweets',
        description: 'Caramel and chocolate bar',
        machine: 'VM-001',
        image: 'https://images.unsplash.com/photo-1481391243133-f96216dcb5d2?auto=format&fit=crop&q=80&w=400'
    },
    {
        name: 'Gems',
        slot: 'A4',
        price: 15,
        stock: 18,
        category: 'Sweets',
        description: 'Colorful chocolate buttons',
        machine: 'VM-001',
        image: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&q=80&w=400'
    },
    {
        name: 'Eclairs',
        slot: 'A5',
        price: 5,
        stock: 30,
        category: 'Sweets',
        description: 'Chocolate toffee candy',
        machine: 'VM-001',
        image: 'https://images.unsplash.com/photo-1481391243133-f96216dcb5d2?auto=format&fit=crop&q=80&w=400'
    },

    // Savory
    {
        name: 'Lays Classic',
        slot: 'B1',
        price: 20,
        stock: 22,
        category: 'Savory',
        description: 'Classic salted potato chips',
        machine: 'VM-001',
        image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&q=80&w=400'
    },
    {
        name: 'Kurkure',
        slot: 'B2',
        price: 20,
        stock: 18,
        category: 'Savory',
        description: 'Crunchy corn puffs',
        machine: 'VM-001',
        image: 'https://images.unsplash.com/photo-1600952841320-db92ec4047ca?auto=format&fit=crop&q=80&w=400'
    },
    {
        name: 'Uncle Chips',
        slot: 'B3',
        price: 15,
        stock: 20,
        category: 'Savory',
        description: 'Crispy potato chips',
        machine: 'VM-001',
        image: 'https://images.unsplash.com/photo-1528751014936-863e6e7a319c?auto=format&fit=crop&q=80&w=400'
    },
    {
        name: 'Bingo Mad Angles',
        slot: 'B4',
        price: 20,
        stock: 16,
        category: 'Savory',
        description: 'Triangular masala chips',
        machine: 'VM-001',
        image: 'https://images.unsplash.com/photo-1613919113640-d46a51b77f21?auto=format&fit=crop&q=80&w=400'
    },
    {
        name: 'Haldirams Bhujia',
        slot: 'B5',
        price: 25,
        stock: 14,
        category: 'Savory',
        description: 'Classic Indian namkeen',
        machine: 'VM-001',
        image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=400'
    },

    // Drinks
    {
        name: 'Coca Cola',
        slot: 'C1',
        price: 40,
        stock: 12,
        category: 'Drinks',
        description: 'Classic cola drink',
        machine: 'VM-001',
        image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&q=80&w=400'
    },
    {
        name: 'Sprite',
        slot: 'C2',
        price: 40,
        stock: 12,
        category: 'Drinks',
        description: 'Lemon-lime refreshment',
        machine: 'VM-001',
        image: 'https://images.unsplash.com/photo-1625740981355-68f8e807adef?auto=format&fit=crop&q=80&w=400'
    },
    {
        name: 'Thumbs Up',
        slot: 'C3',
        price: 40,
        stock: 10,
        category: 'Drinks',
        description: 'Strong cola flavor',
        machine: 'VM-001',
        image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&q=80&w=400'
    },
    {
        name: 'Pepsi',
        slot: 'C4',
        price: 40,
        stock: 11,
        category: 'Drinks',
        description: 'Popular cola beverage',
        machine: 'VM-001',
        image: 'https://images.unsplash.com/photo-1629203849820-fdd70d49c38e?auto=format&fit=crop&q=80&w=400'
    },
    {
        name: 'Maaza',
        slot: 'C5',
        price: 35,
        stock: 13,
        category: 'Drinks',
        description: 'Mango juice drink',
        machine: 'VM-001',
        image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&q=80&w=400'
    },
    {
        name: 'Frooti',
        slot: 'C6',
        price: 35,
        stock: 14,
        category: 'Drinks',
        description: 'Fresh mango juice',
        machine: 'VM-001',
        image: 'https://images.unsplash.com/photo-1622597467836-f3c7ca9d2d8e?auto=format&fit=crop&q=80&w=400'
    },

    // Health
    {
        name: 'Britannia Nutri Choice',
        slot: 'D1',
        price: 30,
        stock: 10,
        category: 'Health',
        description: 'Healthy oats cookies',
        machine: 'VM-001',
        image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=400'
    },
    {
        name: 'Dark Fantasy',
        slot: 'D2',
        price: 35,
        stock: 12,
        category: 'Health',
        description: 'Premium chocolate cookies',
        machine: 'VM-001',
        image: 'https://images.unsplash.com/photo-1548365328-8c6db3220e4c?auto=format&fit=crop&q=80&w=400'
    },
    {
        name: 'Sunfeast Marie',
        slot: 'D3',
        price: 20,
        stock: 15,
        category: 'Health',
        description: 'Light tea-time biscuits',
        machine: 'VM-001',
        image: 'https://images.unsplash.com/photo-1590080876876-5d8ab1615bf1?auto=format&fit=crop&q=80&w=400'
    },
    {
        name: 'Good Day',
        slot: 'D4',
        price: 25,
        stock: 16,
        category: 'Health',
        description: 'Butter cookies',
        machine: 'VM-001',
        image: 'https://images.unsplash.com/photo-1603033833734-1c4c1e0e4974?auto=format&fit=crop&q=80&w=400'
    }
];

// ==============================================================================
// HTTP REQUEST HELPER
// ==============================================================================

function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'parseapi.back4app.com',
            path: path,
            method: method,
            headers: {
                'X-Parse-Application-Id': APP_ID,
                'X-Parse-Master-Key': MASTER_KEY,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let json;
                try {
                    json = JSON.parse(data);
                } catch (e) {
                    return reject(new Error('Invalid JSON: ' + data));
                }

                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(json);
                } else {
                    reject({ statusCode: res.statusCode, error: json });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

// ==============================================================================
// CREATE DEMO PRODUCTS
// ==============================================================================

async function createDemoProducts() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║           DEMO PRODUCT CREATION SCRIPT                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`App ID: ${APP_ID}`);
    console.log(`Total Products to Create: ${DEMO_PRODUCTS.length}`);
    console.log('');

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process in batches of 10
    const BATCH_SIZE = 10;

    for (let i = 0; i < DEMO_PRODUCTS.length; i += BATCH_SIZE) {
        const batch = DEMO_PRODUCTS.slice(i, i + BATCH_SIZE);

        const requests = batch.map(product => ({
            method: 'POST',
            path: '/classes/Product',
            body: product
        }));

        try {
            console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1}...`);

            const result = await request(
                'POST',
                '/batch',
                { requests }
            );

            // Count successes and errors
            if (Array.isArray(result)) {
                for (let j = 0; j < result.length; j++) {
                    const item = result[j];
                    const product = batch[j];

                    if (item.success) {
                        successCount++;
                        console.log(`  ✓ Created: ${product.name} (${product.slot})`);
                    } else if (item.error) {
                        errorCount++;
                        errors.push({ product: product.name, error: item.error });
                        console.log(`  ✗ Failed: ${product.name} - ${item.error.error || item.error.code}`);
                    }
                }
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (err) {
            console.error(`\n  ✗ Batch error:`, err);
            errorCount += batch.length;
            errors.push({ batch: i / BATCH_SIZE + 1, error: err });
        }
    }

    // ==========================================
    // FINAL SUMMARY
    // ==========================================
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║              PRODUCT CREATION COMPLETE                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`✓ Successfully created: ${successCount} products`);
    console.log(`✗ Failed: ${errorCount} products`);
    console.log('');

    if (errors.length > 0) {
        console.log('📋 Errors:');
        errors.forEach((err, idx) => {
            console.log(`  ${idx + 1}. ${err.product || 'Batch ' + err.batch}: ${JSON.stringify(err.error)}`);
        });
        console.log('');
    }

    console.log('📋 Next Steps:');
    console.log('  1. Check your Back4App dashboard to verify products');
    console.log('  2. Test product display in your application');
    console.log('  3. Adjust stock levels as needed');
    console.log('');
}

// Run the script
createDemoProducts().catch(error => {
    console.error('\n❌ FATAL ERROR:', error);
    process.exit(1);
});
