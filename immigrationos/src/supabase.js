import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://madxojolvciphwmeprxg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_D0GuZfoRefW78H6Pxrk1Mg_zoSLsnUV';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
