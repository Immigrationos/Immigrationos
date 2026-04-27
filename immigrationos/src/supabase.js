import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://madxojolvciphwmeprxg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hZHhvam9sdmNpcGh3bWVwcnhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyODAxODgsImV4cCI6MjA5Mjg1NjE4OH0.1Cp254t5LKevojQGZYzSUBucxzTuJSmdOwS1xW1vqJU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
