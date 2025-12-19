const fs = require('fs');
console.log('Script started...');

// Using require for Parse
const Parse = require('parse/node');

// ==============================================================================
// CONFIGURATION
// ==============================================================================

// 1. OLD APP CREDENTIALS (THE SOURCE)
const OLD_APP_ID = 'O3wWUu6Ivb60an3IzOgYcwF3UnQMsDGP0fGhdeHn';
const OLD_JS_KEY = '96pOM0VFfsxBctoW5EIh6QiWfNBs4pNqMt4aIgqU';   // Optional if using Master Key
const OLD_MASTER_KEY = 'xnX2PdhD7qW9rVO6cA6wepjpZxVwd3BmuOEDICKn'; // REQUIRED to read everything (User passwords, ACLs)

// 2. NEW APP CREDENTIALS (THE DESTINATION)
const NEW_APP_ID = 'EU1h6y0JiM2uJfF7nJaBTGpgWyZHjkfRT6XXcLwy';
const NEW_JS_KEY = '9pbqejB0usAOn6B6x0I9kmzpiuAq0RrrQ6j1yQXo';
const NEW_MASTER_KEY = 'P4ax8vgVNqSPzDmCIzZZk87BhkPrqpxHmvQZJk2g';

// 3. CLASSES TO MIGRATE (In Dependency Order)
const CLASSES = [
    '_User',
    '_Role',
    'Machine',
    'Product',
    'Order',
    'Transaction',
    'Logs'
];

const BACKUP_DIR = './migration_backup';

// ==============================================================================
// HELPERS
// ==============================================================================

async function fetchAllObjects(className) {
    console.log(`[READ] Fetching all object from ${className}...`);
    let allObjects = [];
    const query = new Parse.Query(className);
    query.limit(100);
    query.ascending('createdAt');

    let lastCreatedAt = null;
    let hasMore = true;

    while (hasMore) {
        if (lastCreatedAt) {
            query.greaterThan('createdAt', lastCreatedAt);
        }

        try {
            const results = await query.find({ useMasterKey: true });
            if (results.length === 0) {
                hasMore = false;
            } else {
                allObjects = allObjects.concat(results);
                lastCreatedAt = results[results.length - 1].createdAt;
                process.stdout.write(`\rFound ${allObjects.length} objects...`);
            }
        } catch (error) {
            if (error.code === 103) {
                console.log(`Class ${className} does not exist (skipping).`);
                return [];
            }
            console.error(`Error fetching ${className}:`, error);
            throw error;
        }
    }
    console.log(`\n[READ] Done. Total ${className}: ${allObjects.length}`);
    return allObjects;
}

function cleanForImport(parseObj) {
    const json = parseObj.toJSON();
    delete json.className;
    return json;
}

async function batchUpload(className, objects) {
    if (objects.length === 0) return;

    console.log(`[WRITE] Uploading ${objects.length} objects to ${className}...`);
    const BATCH_SIZE = 50;
    const endpointPath = className === '_User' ? '/classes/_User' : `/classes/${className}`;

    for (let i = 0; i < objects.length; i += BATCH_SIZE) {
        const chunk = objects.slice(i, i + BATCH_SIZE);

        const requests = chunk.map(obj => {
            const body = cleanForImport(obj);
            return {
                method: 'POST',
                path: endpointPath,
                body: body
            };
        });

        try {
            // Use native fetch (Node 18+)
            const response = await fetch('https://parseapi.back4app.com/batch', {
                method: 'POST',
                headers: {
                    'X-Parse-Application-Id': NEW_APP_ID,
                    'X-Parse-Master-Key': NEW_MASTER_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ requests })
            });

            const result = await response.json();

            if (!response.ok) {
                console.error('Batch failed:', result);
            } else {
                if (Array.isArray(result)) {
                    const errors = result.filter(r => r.error);
                    if (errors.length > 0) {
                        console.error(`Batch had ${errors.length} errors. First one:`, errors[0]);
                    }
                } else if (result.error) {
                    console.error('Batch Request failed:', result.error);
                }
            }

            process.stdout.write(`\rProcessed ${Math.min(i + BATCH_SIZE, objects.length)}/${objects.length}`);

        } catch (err) {
            console.error('Network Error during batch:', err);
        }
    }
    console.log(`\n[WRITE] Finished ${className}.`);
}

// ==============================================================================
// MAIN
// ==============================================================================

async function main() {
    if (OLD_APP_ID.includes('INSERT')) {
        console.error('ERROR: Missing Credentials in script.');
        process.exit(1);
    }

    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR);
    }

    // 1. Initialize Old App
    Parse.initialize(OLD_APP_ID, OLD_JS_KEY, OLD_MASTER_KEY);
    Parse.serverURL = 'https://parseapi.back4app.com';

    console.log('=== STARTING MIGRATION (CommonJS) ===');

    // 2. Fetch All Data (Read Phase)
    const database = {};

    for (const className of CLASSES) {
        // Skip Role/Transaction if not critical, but let's try all
        try {
            const objects = await fetchAllObjects(className);
            database[className] = objects;

            fs.writeFileSync(
                `${BACKUP_DIR}/${className}.json`,
                JSON.stringify(objects.map(o => o.toJSON()), null, 2)
            );
        } catch (e) {
            console.error(`Failed to fetch ${className}:`, e.message);
        }
    }

    console.log('=== READ COMPLETE. STARTING WRITE ===');
    console.log('Waiting 5 seconds before writing to NEW app...');
    await new Promise(r => setTimeout(r, 5000));

    // 3. Upload Data (Write Phase)
    for (const className of CLASSES) {
        if (database[className]) {
            await batchUpload(className, database[className]);
        }
    }

    console.log('=== MIGRATION COMPLETE ===');
    console.log('Please verify data in your new Dashboard.');
}

main();
