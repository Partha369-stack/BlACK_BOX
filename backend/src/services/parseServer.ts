// @ts-ignore
import Parse from 'parse/node';

// Environment variables are loaded by main server.js before this module is imported

export const initializeParse = () => {
    const appId = process.env.PARSE_APP_ID;
    const jsKey = process.env.PARSE_JS_KEY;
    const serverURL = process.env.PARSE_SERVER_URL || 'https://parseapi.back4app.com/';

    if (!appId || !jsKey) {
        throw new Error('Parse Credentials missing in .env');
    }

    Parse.initialize(appId, jsKey);
    Parse.serverURL = serverURL;
    console.log('Parse initialized successfully.');
};

export default Parse;
