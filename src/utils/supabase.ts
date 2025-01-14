import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
// Don't log the full key for security, just the first few characters
console.log('Supabase Key (first 10 chars):', supabaseKey?.substring(0, 10));

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables. Make sure .env.local contains REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Test the connection
const testConnection = async () => {
    try {
        await supabase.from('uploads').select('count', { count: 'exact', head: true });
        console.log('Successfully connected to Supabase');
    } catch (error: unknown) {
        const err = error as Error;
        console.error('Error connecting to Supabase:', err.message);
        console.error('Please verify your environment variables and database permissions');
    }
};

testConnection();
