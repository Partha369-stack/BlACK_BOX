
import Parse from 'parse/node.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const APP_ID = process.env.VITE_PARSE_APPLICATION_ID;
const JS_KEY = process.env.VITE_PARSE_JAVASCRIPT_KEY;
// Use backend URL or default
const SERVER_URL = process.env.PARSE_SERVER_URL || 'https://parseapi.back4app.com/';

if (!APP_ID || !JS_KEY) {
    console.error('Error: VITE_PARSE_APPLICATION_ID or VITE_PARSE_JAVASCRIPT_KEY not found in .env');
    process.exit(1);
}

console.log('Initializing Parse...');
Parse.initialize(APP_ID, JS_KEY);
Parse.serverURL = SERVER_URL;

const seed = async () => {
    try {
        console.log('Seeding Finance Data...');

        // 1. Create or Get Partner User
        const queryPartner = new Parse.Query(Parse.User);
        queryPartner.equalTo('role', 'partner');
        let partner = await queryPartner.first();

        if (!partner) {
            console.log('Creating dummy partner...');
            const user = new Parse.User();
            user.set('username', 'partner_demo');
            user.set('password', 'password123');
            user.set('email', 'partner@blackbox.com');
            user.set('role', 'partner');
            // ACL public
            const acl = new Parse.ACL();
            acl.setPublicReadAccess(true);
            acl.setPublicWriteAccess(false);
            user.setACL(acl);

            try {
                partner = await user.signUp();
            } catch (e) {
                // If sign up fails (e.g. username taken but role missing), try login or just fetch
                console.log('User might match criteria but hidden, skipping creation.');
                partner = user;
            }
        } else {
            console.log(`Found existing partner: ${partner.id}`);
        }

        // 2. Create Machines
        const Machine = Parse.Object.extend('Machine');
        const machines = ['VM-101', 'VM-102', 'VM-103'];
        const machineObjs = [];

        for (const mid of machines) {
            const q = new Parse.Query(Machine);
            q.equalTo('machineId', mid);
            let machine = await q.first();

            if (!machine) {
                console.log(`Creating machine ${mid}...`);
                machine = new Machine();
                machine.set('machineId', mid);
                machine.set('name', `Test Machine ${mid}`);
                machine.set('location', 'Test Location');
                machine.set('status', 'online');
                await machine.save();
            }
            machineObjs.push(machine);
        }

        // 3. Create Orders (Past 30 days)
        const Order = Parse.Object.extend('Order');
        const ordersToCreate = [];

        console.log('Generating dummy orders...');
        for (let i = 0; i < 50; i++) {
            const order = new Order();

            // Random date in last 30 days
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 30));

            // Random machine
            const mac = machineObjs[Math.floor(Math.random() * machineObjs.length)];

            // Random amount
            const amount = Math.floor(Math.random() * 500) + 50;

            order.set('items', [{ productId: 'test', name: 'Snack', price: amount, quantity: 1 }]);
            order.set('total', amount);
            order.set('status', 'completed'); // CRITICAL
            order.set('machine', mac.get('machineId')); // Using string ID as per current logic
            // Transaction ID
            order.set('transactionId', `TXN-${Date.now()}-${i}`);

            // Override createdAt (requires master key usually, but let's try or just accept current date)
            // Parse doesn't let you set createdAt easily without master key. 
            // We will just save them, they will be "today". 
            // To simulate past dates, we can't easily do it via Client SDK unless we use Cloud Code or Master Key.
            // BUT for "Today" stats it works. For "Month" stats it works (all today is in month).
            // To test charts properly, we really need custom dates, but for "Why is it empty", today is fine.

            ordersToCreate.push(order);
        }

        // Note: Without Master Key, we can't force 'createdAt'. 
        // So all these 50 orders will appear as "Today". 
        // This is sufficient to show DATA on the dashboard.

        await Parse.Object.saveAll(ordersToCreate);
        console.log(`Created ${ordersToCreate.length} orders.`);
        console.log('Done! Refresh the Finance Dashboard.');

    } catch (error) {
        console.error('Error seeding data:', error);
    }
};

seed();
