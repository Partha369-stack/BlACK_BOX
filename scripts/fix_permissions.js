import Parse from 'parse/node.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from root
dotenv.config({ path: path.join(__dirname, '../.env') });

const appId = process.env.VITE_PARSE_APPLICATION_ID || process.env.PARSE_APP_ID;
const jsKey = process.env.VITE_PARSE_JAVASCRIPT_KEY || process.env.PARSE_JS_KEY;
const masterKey = process.env.PARSE_MASTER_KEY;
const serverURL = process.env.PARSE_SERVER_URL || 'https://parseapi.back4app.com/';

console.log(`Connecting to Parse Server at ${serverURL}`);
console.log(`App ID: ${appId}`);
console.log(`Master Key Found: ${masterKey ? 'YES' : 'NO'}`);

if (!masterKey) {
    console.error("Error: PARSE_MASTER_KEY not found in environment variables.");
    process.exit(1);
}

Parse.initialize(appId, jsKey, masterKey);
Parse.serverURL = serverURL;

async function fixPermissions() {
    console.log("\nFixing Class Level Permissions (CLPs)...");

    try {
        // Fix _User Class
        console.log("Updating _User class permissions...");
        const userSchema = new Parse.Schema('_User');

        // Get current just to be safe (though we will overwrite)
        try {
            await userSchema.get();
        } catch (e) {
            console.log("_User schema get failed (might be fine):", e.message);
        }

        // Set Public Read/Find Access
        const userCLP = {
            get: { "*": true },
            find: { "*": true },
            count: { "*": true },
            create: { "*": true },
            update: { "*": true },
            delete: { "*": true },
            addField: { "*": true },
            protectedFields: {} // Clear protected fields if any preventing access
        };

        userSchema.setCLP(userCLP);
        await userSchema.update();
        console.log("✅ _User class permissions updated (Public Read/Find enabled).");

        // Fix Order Class
        console.log("Updating Order class permissions...");
        const orderSchema = new Parse.Schema('Order');

        try {
            // Check if class exists by trying to get it
            await orderSchema.get();

            const orderCLP = {
                get: { "*": true },
                find: { "*": true },
                count: { "*": true },
                create: { "*": true },
                update: { "*": true },
                delete: { "*": true },
                addField: { "*": true }
            };

            orderSchema.setCLP(orderCLP);
            await orderSchema.update();
            console.log("✅ Order class permissions updated.");
        } catch (e) {
            if (e.code === 103) { // ClassName mismatch or missing
                console.log("Order class does not exist yet. Creating it...");
                try {
                    const Order = Parse.Object.extend("Order");
                    const o = new Order();
                    await o.save({ status: 'dummy' });
                    await o.destroy();
                    // Now try again
                    const orderCLP = {
                        get: { "*": true },
                        find: { "*": true },
                        count: { "*": true },
                        create: { "*": true },
                        update: { "*": true },
                        delete: { "*": true },
                        addField: { "*": true }
                    };
                    orderSchema.setCLP(orderCLP);
                    await orderSchema.update();
                    console.log("✅ Order class created and permissions updated.");
                } catch (err) {
                    console.log("Failed to create/update Order class:", err.message);
                }
            } else {
                console.log("⚠️ Failed to update Order permissions:", e.message);
            }
        }

    } catch (error) {
        console.error("❌ Error updating permissions:", error);
    }
}

fixPermissions();
