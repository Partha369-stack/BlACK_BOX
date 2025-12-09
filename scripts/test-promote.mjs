import dotenv from 'dotenv';
import Parse from 'parse/node.js';
import fs from 'fs';

dotenv.config();

const log = (msg) => {
    console.log(msg);
    fs.appendFileSync('promotion-log.txt', msg + '\n');
};

log('=== Starting Admin Promotion ===');
log('Time: ' + new Date().toISOString());

Parse.initialize(
    process.env.PARSE_APP_ID,
    process.env.PARSE_JS_KEY,
    process.env.PARSE_MASTER_KEY
);
Parse.serverURL = process.env.PARSE_SERVER_URL;

async function promoteUser() {
    try {
        log('Searching for user: black369box@gmail.com');

        const query = new Parse.Query(Parse.User);
        query.equalTo('email', 'black369box@gmail.com');

        const user = await query.first({ useMasterKey: true });

        if (!user) {
            log('ERROR: User not found');
            process.exit(1);
        }

        log('User found: ' + user.get('username'));
        log('Current role: ' + (user.get('role') || 'user'));

        user.set('role', 'admin');
        await user.save(null, { useMasterKey: true });

        log('SUCCESS: Promoted to admin!');
        log('User must log out and log back in');

    } catch (error) {
        log('ERROR: ' + error.message + ' (code: ' + error.code + ')');
        process.exit(1);
    }
}

promoteUser();
