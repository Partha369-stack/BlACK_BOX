import Parse from 'parse/node.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env 
dotenv.config({ path: path.join(__dirname, '../.env') });

const appId = process.env.VITE_PARSE_APPLICATION_ID || process.env.PARSE_APP_ID;
const jsKey = process.env.VITE_PARSE_JAVASCRIPT_KEY || process.env.PARSE_JS_KEY;
const masterKey = process.env.PARSE_MASTER_KEY;
const serverURL = process.env.PARSE_SERVER_URL || 'https://parseapi.back4app.com/';

if (!masterKey) {
    console.error("Error: PARSE_MASTER_KEY not found.");
    process.exit(1);
}

Parse.initialize(appId, jsKey, masterKey);
Parse.serverURL = serverURL;

async function fixUserACLs() {
    console.log("Starting User ACL Fix...");

    try {
        const query = new Parse.Query(Parse.User);
        query.limit(1000);
        // Query using Master Key to see everyone
        const users = await query.find({ useMasterKey: true });

        console.log(`Found ${users.length} users in database (via Master Key).`);

        for (const user of users) {
            const currentACL = user.getACL() || new Parse.ACL(user);

            // Set Public Read Access
            currentACL.setPublicReadAccess(true);
            // currentACL.setRoleReadAccess('admin', true); // Alternative if we had roles set up perfectly

            user.setACL(currentACL);

            // Save using Master Key
            await user.save(null, { useMasterKey: true });
            console.log(`Updated ACL for user: ${user.get('username') || user.id}`);
        }

        console.log("\n✅ Successfully updated all user ACLs to Public Read.");

    } catch (error) {
        console.error("❌ Error fixing ACLs:", error);
    }
}

fixUserACLs();
