
import Parse from 'parse/node.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const APP_ID = process.env.VITE_PARSE_APPLICATION_ID;
const JS_KEY = process.env.VITE_PARSE_JAVASCRIPT_KEY;
const SERVER_URL = process.env.PARSE_SERVER_URL || 'https://parseapi.back4app.com/';

Parse.initialize(APP_ID, JS_KEY);
Parse.serverURL = SERVER_URL;

const inspect = async () => {
    try {
        console.log('Fetching latest order...');
        const Order = Parse.Object.extend('Order');
        const query = new Parse.Query(Order);
        query.descending('createdAt');
        query.limit(1);

        const order = await query.first();

        if (!order) {
            console.log('No orders found in the database at all.');
        } else {
            console.log('Found latest order. JSON structure:');
            console.log(JSON.stringify(order.toJSON(), null, 2));
            console.log('-----------------------------------');
            console.log('Status field value:', order.get('status'));
            console.log('CreatedAt:', order.createdAt);
        }
    } catch (error) {
        console.error('Error inspecting:', error);
    }
};

inspect();
