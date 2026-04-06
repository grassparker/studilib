// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dyugzzbkvfmdgynobgow.supabase.co';
const supabaseKey = 'sb_publishable_DiO96OIwCg_CQYi-btuROw_TYIU15aA';

export const supabase = createClient(supabaseUrl, supabaseKey);
