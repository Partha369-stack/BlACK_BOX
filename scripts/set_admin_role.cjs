/**
 * Set Admin Role Script
 * 
 * This script grants admin access to a user by setting their role field to 'admin'
 * in the Back4App database using the REST API.
 * 
 * Usage: node scripts/set_admin_role.cjs <email>
 * Example: node scripts/set_admin_role.cjs black369box@gmail.com
 */

const https = require('https');

// ==============================================================================
// CONFIGURATION - Update these with your Back4App credentials
// ==============================================================================

const APP_ID = 'EU1h6y0JiM2uJfF7nJaBTGpgWyZHjkfRT6XXcLwy';
const MASTER_KEY = 'P4ax8vgVNqSPzDmCIzZZk87BhkPrqpxHmvQZJk2g'; // Required for updating user roles

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
// SET ADMIN ROLE FUNCTION
// ==============================================================================

async function setAdminRole(email) {
    console.log(`\n🔍 Searching for user with email: ${email}...`);

    try {
        // Step 1: Find user by email
        const query = new URLSearchParams({
            where: JSON.stringify({ email: email })
        });

        const users = await request('GET', `/users?${query}`);

        if (!users.results || users.results.length === 0) {
            console.error(`❌ Error: No user found with email: ${email}`);
            console.log('\nPlease check the email address and try again.');
            return false;
        }

        const user = users.results[0];
        console.log(`✅ Found user:`);
        console.log(`   - Username: ${user.username}`);
        console.log(`   - Email: ${user.email}`);
        console.log(`   - Current role: ${user.role || 'user (default)'}`);

        // Check if already admin
        if (user.role === 'admin') {
            console.log(`\n✨ User is already an admin!`);
            return true;
        }

        // Step 2: Update user role to admin
        console.log(`\n🔧 Setting role to 'admin'...`);

        await request('PUT', `/users/${user.objectId}`, {
            role: 'admin'
        });

        console.log(`✅ SUCCESS! User ${email} now has admin access!`);
        console.log(`\n📝 Next steps:`);
        console.log(`   1. User should log out of the application`);
        console.log(`   2. Log back in to refresh the session`);
        console.log(`   3. Navigate to /admin to access the admin dashboard`);
        console.log('');

        return true;

    } catch (error) {
        console.error(`\n❌ Error setting admin role:`);

        if (error.error) {
            console.error(`   Status: ${error.statusCode}`);
            console.error(`   Error:`, error.error);
        } else {
            console.error(`  `, error.message || error);
        }

        if (error.statusCode === 206 || (error.error && error.error.code === 206)) {
            console.log('\n💡 Tip: Permission denied. Make sure MASTER_KEY is correct in the script.');
        }

        return false;
    }
}

// ==============================================================================
// MAIN EXECUTION
// ==============================================================================

const email = process.argv[2];

if (!email) {
    console.error(`\n❌ Error: Email address is required`);
    console.log(`\nUsage: node scripts/set_admin_role.cjs <email>`);
    console.log(`Example: node scripts/set_admin_role.cjs black369box@gmail.com\n`);
    process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
    console.error(`\n❌ Error: Invalid email format: ${email}\n`);
    process.exit(1);
}

// Run the script
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║           BACK4APP ADMIN ROLE SETTER                      ║');
console.log('╚════════════════════════════════════════════════════════════╝');

setAdminRole(email).then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('\n❌ FATAL ERROR:', error);
    process.exit(1);
});
