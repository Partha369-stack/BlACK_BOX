import Parse from 'parse/node.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env explicitly
dotenv.config({ path: join(__dirname, '../.env') });

const appId = process.env.VITE_PARSE_APPLICATION_ID;
const jsKey = process.env.VITE_PARSE_JAVASCRIPT_KEY;

if (!appId || !jsKey) {
    console.error('❌ Missing Parse Credentials in .env');
    process.exit(1);
}

Parse.initialize(appId, jsKey);
Parse.serverURL = 'https://parseapi.back4app.com/';

import fs from 'fs';

async function fetchSlots() {
    console.log('🔄 Connecting to Database...');
    const Product = Parse.Object.extend('Product');
    const query = new Parse.Query(Product);

    // Sort by name for easier reading
    query.ascending('name');
    query.limit(100);

    try {
        const results = await query.find();
        let output = `\n✅ Found ${results.length} Products in Database:\n`;
        output += '----------------------------------------------------------------\n';
        output += 'PRODUCT NAME                 | SLOT ID    | MACHINE\n';
        output += '----------------------------------------------------------------\n';

        results.forEach(p => {
            const name = (p.get('name') || 'Unknown').padEnd(28, ' ');
            const slot = (p.get('slot') || 'NULL').padEnd(10, ' ');
            const machine = p.get('machine') || '???';

            output += `${name} | ${slot} | ${machine}\n`;
        });
        output += '----------------------------------------------------------------\n';

        console.log(output);
        fs.writeFileSync('product_slots.txt', output); // Write to file explicitly

    } catch (error) {
        console.error('❌ Error fetching products:', error);
        fs.writeFileSync('product_slots.txt', 'Error: ' + error.toString());
    }
}

fetchSlots();
