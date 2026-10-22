import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const opts = { auth: { persistSession: false, autoRefreshToken: false } };


export const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, opts);


export const newClient = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, opts);
