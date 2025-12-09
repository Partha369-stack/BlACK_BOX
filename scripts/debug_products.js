
import Parse from 'parse/node.js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load .env from current directory
dotenv.config();

const appId = process.env.VITE_PARSE_APPLICATION_ID;
const jsKey = process.env.VITE_PARSE_JAVASCRIPT_KEY;

const logFile = 'debug_output.txt';
const log = (msg) => {
    fs.appendFileSync(logFile, msg + '\n');
};

if (!appId || !jsKey) {
    log('Missing Parse keys in .env');
    process.exit(1);
}

Parse.initialize(appId, jsKey);
Parse.serverURL = 'https://parseapi.back4app.com/';

async function checkProducts() {
    log('Fetching products...');
    const Product = Parse.Object.extend('Product');
    const query = new Parse.Query(Product);

    try {
        const results = await query.find();
        log(`Found ${results.length} products.`);

        results.forEach(p => {
            log(`Product ID: ${p.id}`);
            log(`  Name: ${p.get('name')}`);

            log(`  Machine: '${p.get('machine')}'`);

            log('---');
        });
    } catch (error) {
        log('Error fetching products: ' + error);
    }
}

// Clear previous log
fs.writeFileSync(logFile, '');
checkProducts();
