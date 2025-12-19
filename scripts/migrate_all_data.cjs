const fs = require('fs');
const https = require('https');

// ==============================================================================
// CONFIGURATION
// ==============================================================================

// OLD APP (SOURCE)
const OLD_APP_ID = 'O3wWUu6Ivb60an3IzOgYcwF3UnQMsDGP0fGhdeHn';
const OLD_MASTER_KEY = 'xnX2PdhD7qW9rVO6cA6wepjpZxVwd3BmuOEDICKn';

// NEW APP (DESTINATION)
const NEW_APP_ID = 'EU1h6y0JiM2uJfF7nJaBTGpgWyZHjkfRT6XXcLwy';
const NEW_MASTER_KEY = 'P4ax8vgVNqSPzDmCIzZZk87BhkPrqpxHmvQZJk2g';

// Classes to migrate (in dependency order - independent classes first)
const CLASSES_TO_MIGRATE = [
    '_User',       // Users first (no dependencies)
    '_Role',       // Roles second
    'Machine',     // Machines (no dependencies)
    'Product',     // Products (depends on Machine via pointer)
    'Order',       // Orders (depends on User, Product)
    'Transaction', // Transactions (depends on Order, User)
    'Logs'         // Logs last
];

const BACKUP_DIR = './data_export';
const BATCH_SIZE = 50;

// ==============================================================================
// HTTP REQUEST HELPER
// ==============================================================================

function request(method, path, appId, masterKey, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'parseapi.back4app.com',
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
// FETCH ALL DATA FROM OLD APP
// ==============================================================================

async function fetchAllFromClass(className, appId, masterKey) {
    console.log(`\n[EXPORT] Fetching ${className}...`);

    let allResults = [];
    let skip = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore) {
        try {
            const query = new URLSearchParams({
                limit: limit.toString(),
                skip: skip.toString(),
                order: 'createdAt'
            });

            const result = await request(
                'GET',
                `/classes/${className}?${query}`,
                appId,
                masterKey
            );

            if (result.results && result.results.length > 0) {
                allResults = allResults.concat(result.results);
                skip += result.results.length;
                process.stdout.write(`\r  Found ${allResults.length} objects...`);

                // If we got less than limit, we're done
                if (result.results.length < limit) {
                    hasMore = false;
                }
            } else {
                hasMore = false;
            }
        } catch (error) {
            if (error.error && error.error.code === 103) {
                console.log(`  Class ${className} does not exist (skipping)`);
                return [];
            }
            console.error(`\n  Error fetching ${className}:`, error);
            throw error;
        }
    }

    console.log(`\n  ✓ Exported ${allResults.length} ${className} objects`);
    return allResults;
}

// ==============================================================================
// IMPORT DATA TO NEW APP (WITH OBJECTID PRESERVATION)
// ==============================================================================

async function importDataToClass(className, objects, appId, masterKey) {
    if (!objects || objects.length === 0) {
        console.log(`\n[IMPORT] ${className}: No data to import`);
        return;
    }

    console.log(`\n[IMPORT] Uploading ${objects.length} ${className} objects...`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process in batches
    for (let i = 0; i < objects.length; i += BATCH_SIZE) {
        const batch = objects.slice(i, i + BATCH_SIZE);

        const requests = batch.map(obj => {
            // Clean the object for import
            const cleanObj = { ...obj };

            // Remove className if present
            delete cleanObj.className;

            // Keep objectId, createdAt, updatedAt for preservation
            // Parse will use these if provided with master key

            return {
                method: 'POST',
                path: `/classes/${className}`,
                body: cleanObj
            };
        });

        try {
            const result = await request(
                'POST',
                '/batch',
                appId,
                masterKey,
                { requests }
            );

            // Count successes and errors
            if (Array.isArray(result)) {
                for (const item of result) {
                    if (item.success) {
                        successCount++;
                    } else if (item.error) {
                        errorCount++;
                        errors.push(item.error);
                    }
                }
            }

            process.stdout.write(`\r  Progress: ${Math.min(i + BATCH_SIZE, objects.length)}/${objects.length} | ✓ ${successCount} | ✗ ${errorCount}`);

        } catch (err) {
            console.error(`\n  Batch error:`, err);
            errorCount += batch.length;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n  ✓ Import complete: ${successCount} succeeded, ${errorCount} failed`);

    if (errors.length > 0 && errors.length <= 5) {
        console.log('  Sample errors:', errors);
    }
}

// ==============================================================================
// MAIN MIGRATION FLOW
// ==============================================================================

async function main() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║           BACK4APP DATA MIGRATION SCRIPT                  ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`Source App: ${OLD_APP_ID}`);
    console.log(`Target App: ${NEW_APP_ID}`);
    console.log(`Classes: ${CLASSES_TO_MIGRATE.join(', ')}`);
    console.log('');

    // Create backup directory
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        console.log(`✓ Created backup directory: ${BACKUP_DIR}\n`);
    }

    // ==========================================
    // PHASE 1: EXPORT DATA FROM OLD APP
    // ==========================================
    console.log('┌──────────────────────────────────────────────────────────┐');
    console.log('│ PHASE 1: EXPORTING DATA                                  │');
    console.log('└──────────────────────────────────────────────────────────┘');

    const exportedData = {};

    for (const className of CLASSES_TO_MIGRATE) {
        try {
            const data = await fetchAllFromClass(className, OLD_APP_ID, OLD_MASTER_KEY);
            exportedData[className] = data;

            // Save to backup file
            const filename = `${BACKUP_DIR}/${className}.json`;
            fs.writeFileSync(filename, JSON.stringify(data, null, 2));
            console.log(`  💾 Saved to ${filename}`);

        } catch (error) {
            console.error(`  ✗ Failed to export ${className}:`, error.message);
            exportedData[className] = [];
        }
    }

    // Summary
    console.log('\n📊 Export Summary:');
    let totalObjects = 0;
    for (const [className, data] of Object.entries(exportedData)) {
        console.log(`  ${className}: ${data.length} objects`);
        totalObjects += data.length;
    }
    console.log(`  TOTAL: ${totalObjects} objects\n`);

    // ==========================================
    // PHASE 2: IMPORT DATA TO NEW APP
    // ==========================================
    console.log('┌──────────────────────────────────────────────────────────┐');
    console.log('│ PHASE 2: IMPORTING DATA                                  │');
    console.log('└──────────────────────────────────────────────────────────┘');
    console.log('\n⏳ Waiting 3 seconds before import...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    for (const className of CLASSES_TO_MIGRATE) {
        if (exportedData[className] && exportedData[className].length > 0) {
            try {
                await importDataToClass(
                    className,
                    exportedData[className],
                    NEW_APP_ID,
                    NEW_MASTER_KEY
                );
            } catch (error) {
                console.error(`\n  ✗ Failed to import ${className}:`, error.message);
            }
        }
    }

    // ==========================================
    // FINAL SUMMARY
    // ==========================================
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                  MIGRATION COMPLETE                        ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('✓ Data has been exported and imported');
    console.log(`✓ Backup files saved in: ${BACKUP_DIR}/`);
    console.log('');
    console.log('📋 Next Steps:');
    console.log('  1. Verify data in your new Back4App dashboard');
    console.log('  2. Check that ObjectIds are preserved');
    console.log('  3. Verify pointer and relation fields');
    console.log('  4. Test your application with the new backend');
    console.log('');
}

// Run the migration
main().catch(error => {
    console.error('\n❌ FATAL ERROR:', error);
    process.exit(1);
});
