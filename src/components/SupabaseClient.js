import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vuzntlbldmfsiatxgnqp.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1em50bGJsZG1mc2lhdHhnbnFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3MTc0NDUsImV4cCI6MjA1MTI5MzQ0NX0.YOSJfQoM1Qlq6xGM960y-4KiVsjhuXq7b_kjQAbvx58'; // Replace with your Supabase anon key

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
