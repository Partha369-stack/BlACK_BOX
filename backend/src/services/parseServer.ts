// @ts-ignore
import Parse from 'parse/node';

// Environment variables are loaded by main server.js before this module is imported

export const initializeParse = () => {
    // Fallback to VITE_ prefixed variables if standard ones are missing
    const appId = process.env.PARSE_APP_ID || process.env.VITE_PARSE_APPLICATION_ID;
    const jsKey = process.env.PARSE_JS_KEY || process.env.VITE_PARSE_JAVASCRIPT_KEY;
    const masterKey = process.env.PARSE_MASTER_KEY || process.env.VITE_PARSE_MASTER_KEY;
    const serverURL = process.env.PARSE_SERVER_URL || 'https://parseapi.back4app.com/';

    if (!appId || !jsKey) {
        throw new Error(`Parse Credentials missing in .env. AppId: ${!!appId}, JsKey: ${!!jsKey}`);
    }

    if (masterKey) {
        console.log('Safe to use Master Key: Yes');
    } else {
        console.warn('WARNING: Master Key not found. Admin/Finance queries may fail.');
    }

    // @ts-ignore - Node SDK supports 3 args (Master Key)
    Parse.initialize(appId, jsKey, masterKey);
    Parse.serverURL = serverURL;
    console.log('Parse initialized successfully.');
};

export default Parse;
