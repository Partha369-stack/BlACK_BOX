#!/usr/bin/env node

/**
 * Admin Promotion Script
 * This script promotes a user to admin role by their email address
 * 
 * Usage: node scripts/promote-to-admin.js <email>
 * Example: node scripts/promote-to-admin.js black369box@gmail.com
 */

require('dotenv').config();
const Parse = require('parse/node');

// Initialize Parse
Parse.initialize(
    process.env.PARSE_APP_ID,
    process.env.PARSE_JS_KEY
);
Parse.serverURL = process.env.PARSE_SERVER_URL;

async function promoteToAdmin(email) {
    try {
        console.log(`🔍 Searching for user with email: ${email}...`);

        // Query for the user by email
        const query = new Parse.Query(Parse.User);
        query.equalTo('email', email);

        const user = await query.first({ useMasterKey: true });

        if (!user) {
            console.error(`❌ Error: No user found with email: ${email}`);
            console.log('\n💡 Tip: Make sure the email is correct and the user exists in Back4App');
            process.exit(1);
        }

        console.log(`✅ Found user: ${user.get('username')} (${user.get('email')})`);

        // Check current role
        const currentRole = user.get('role') || 'user';
        console.log(`📋 Current role: ${currentRole}`);

        if (currentRole === 'admin') {
            console.log('ℹ️  User is already an admin!');
            process.exit(0);
        }

        // Update role to admin
        user.set('role', 'admin');
        await user.save(null, { useMasterKey: true });

        console.log(`🎉 Success! User ${user.get('username')} has been promoted to admin.`);
        console.log('\n✨ You can now access the admin dashboard at /admin');
        console.log('⚠️  Note: You may need to log out and log back in for changes to take effect.\n');

    } catch (error) {
        console.error('❌ Error promoting user to admin:', error.message);

        if (error.code === 209) {
            console.log('\n💡 Invalid session token. This script needs to use Master Key.');
            console.log('   Please ensure PARSE_MASTER_KEY is set in your .env file.');
        } else if (error.code === 119) {
            console.log('\n💡 Permission denied. This operation requires Master Key.');
            console.log('   Add PARSE_MASTER_KEY to your .env file from Back4App dashboard.');
        }

        process.exit(1);
    }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
    console.error('❌ Error: Email address is required\n');
    console.log('Usage: node scripts/promote-to-admin.js <email>');
    console.log('Example: node scripts/promote-to-admin.js black369box@gmail.com\n');
    process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
    console.error('❌ Error: Invalid email format\n');
    process.exit(1);
}

// Run the promotion
promoteToAdmin(email);
