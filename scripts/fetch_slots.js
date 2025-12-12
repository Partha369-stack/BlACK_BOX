const Parse = require('parse/node');
require('dotenv').config();

const appId = process.env.VITE_PARSE_APPLICATION_ID;
const jsKey = process.env.VITE_PARSE_JAVASCRIPT_KEY;

if (!appId || !jsKey) {
    console.error('❌ Missing Parse Credentials in .env');
    process.exit(1);
}

Parse.initialize(appId, jsKey);
Parse.serverURL = 'https://parseapi.back4app.com/';

async function fetchSlots() {
    console.log('🔄 Connecting to Database...');
    const Product = Parse.Object.extend('Product');
    const query = new Parse.Query(Product);

    // Optional: Filter by VM-001 if needed, but fetching all is safer to see everything
    // query.equalTo('machine', 'VM-001'); 

    try {
        const results = await query.find();
        console.log(`\n✅ Found ${results.length} Products in Database:\n`);
        console.log('--------------------------------------------------');
        console.log('PRODUCT NAME                 | SLOT ID');
        console.log('--------------------------------------------------');

        results.forEach(p => {
            const name = p.get('name').padEnd(28, ' ');
            const slot = p.get('slot') || 'NULL';
            const machine = p.get('machine') || '???';

            // Only show info relevant to this machine if possible, or just all
            console.log(`${name} | ${slot}  (Machine: ${machine})`);
        });
        console.log('--------------------------------------------------\n');
    } catch (error) {
        console.error('❌ Error fetching products:', error);
    }
}

fetchSlots();
