
import Parse from 'parse/node';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from parent directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const appId = process.env.VITE_PARSE_APPLICATION_ID;
const jsKey = process.env.VITE_PARSE_JAVASCRIPT_KEY;

console.log('App ID found:', !!appId);
console.log('JS Key found:', !!jsKey);

if (!appId || !jsKey) {
    console.error('Missing Parse keys in .env');
    process.exit(1);
}

Parse.initialize(appId, jsKey);
Parse.serverURL = 'https://parseapi.back4app.com/';

async function checkProducts() {
    console.log('Fetching products...');
    const Product = Parse.Object.extend('Product');
    const query = new Parse.Query(Product);

    try {
        const results = await query.find();
        console.log(`Found ${results.length} products.`);

        results.forEach(p => {
            console.log(`Product ID: ${p.id}`);
            console.log(`  Name: ${p.get('name')}`);
            console.log(`  Machine: ${p.get('machine')}`);
            console.log('---');
        });
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

checkProducts();
