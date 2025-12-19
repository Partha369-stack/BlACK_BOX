const https = require('https');

// ==============================================================================
// CONFIGURATION
// ==============================================================================

const OLD_APP_ID = 'O3wWUu6Ivb60an3IzOgYcwF3UnQMsDGP0fGhdeHn';
const OLD_MASTER_KEY = 'xnX2PdhD7qW9rVO6cA6wepjpZxVwd3BmuOEDICKn';

const NEW_APP_ID = 'EU1h6y0JiM2uJfF7nJaBTGpgWyZHjkfRT6XXcLwy';
const NEW_MASTER_KEY = 'P4ax8vgVNqSPzDmCIzZZk87BhkPrqpxHmvQZJk2g';

const API_BASE = 'parseapi.back4app.com';

// ==============================================================================
// HELPERS
// ==============================================================================

function request(method, path, appId, masterKey, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: API_BASE,
            path: path,
            method: method,
            headers: {
                'X-Parse-Application-Id': appId,
                'X-Parse-Master-Key': masterKey,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                let json;
                try {
                    json = JSON.parse(data);
                } catch (e) {
                    return reject('Invalid JSON response: ' + data);
                }

                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(json);
                } else {
                    reject({ statusCode: res.statusCode, error: json });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function getSchemas(appId, masterKey) {
    const response = await request('GET', '/schemas', appId, masterKey);
    return response.results;
}

// ==============================================================================
// MAIN LOGIC
// ==============================================================================

async function main() {
    console.log('=== SCHEMA REPLICATION STARTED ===');

    try {
        // 1. Fetch Schemas from OLD App
        console.log(`[READ] Fetching schemas from OLD App (${OLD_APP_ID})...`);
        const oldSchemas = await getSchemas(OLD_APP_ID, OLD_MASTER_KEY);
        console.log(`Found ${oldSchemas.length} classes:`, oldSchemas.map(s => s.className).join(', '));

        // 2. Pass 1: Create Empty Classes (Shells) in NEW App
        // This ensures that when we add Pointer fields in Pass 2, the target classes already exist.
        console.log('\n[PASS 1] Creating Class Shells...');

        for (const schema of oldSchemas) {
            const className = schema.className;

            // Skip system classes that we can't "create" (though we will update them later)
            // _User and _Role usually exist by default, but we should verify. 
            // Attempting to create _User will likely fail with 409, which is fine.

            if (className.startsWith('_')) {
                // System class, skip creation, wait for update
                continue;
            }

            try {
                // Create with minimal fields (just valid class name)
                await request('POST', `/schemas/${className}`, NEW_APP_ID, NEW_MASTER_KEY, {
                    className: className,
                    fields: {}
                });
                console.log(`  + Created ${className}`);
            } catch (err) {
                if (err.statusCode === 409 || (err.error && err.error.code === 103)) {
                    console.log(`  * ${className} already exists (skipping creation)`);
                } else {
                    console.error(`  ! Failed to create ${className}:`, err);
                }
            }
        }

        // 3. Pass 2: Update Classes with Fields (ACLs, Pointers, Relations)
        console.log('\n[PASS 2] Updating Fields & Pointers...');

        for (const schema of oldSchemas) {
            const className = schema.className;
            console.log(`  > Processing ${className}...`);

            // Prepare fields for update
            // We need to exclude system fields that cannot be modified via Schema API
            const fieldsToAdd = {};
            const systemFields = ['objectId', 'createdAt', 'updatedAt', 'ACL', 'email', 'username', 'password', 'emailVerified', 'authData'];

            for (const [fieldName, fieldDef] of Object.entries(schema.fields)) {
                if (systemFields.includes(fieldName)) continue;
                // Add to payload
                fieldsToAdd[fieldName] = fieldDef;
            }

            if (Object.keys(fieldsToAdd).length === 0) {
                console.log(`    No custom fields to add.`);
                continue;
            }

            // Update the schema
            try {
                // schema endpoint uses PUT for updates
                await request('PUT', `/schemas/${className}`, NEW_APP_ID, NEW_MASTER_KEY, {
                    className: className,
                    fields: fieldsToAdd,
                    classLevelPermissions: schema.classLevelPermissions // Also copy CLPs!
                });
                console.log(`    Success: Updated fields & CLPs.`);
            } catch (err) {
                console.error(`    ! Failed to update ${className}:`, JSON.stringify(err));
            }
        }

        console.log('\n=== SCHEMA REPLICATION COMPLETE ===');
        console.log('Please verify in your New App Dashboard.');

    } catch (error) {
        console.error('\nFATAL ERROR:', error);
    }
}

main();
