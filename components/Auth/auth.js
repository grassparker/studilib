import { supabase } from './supabaseClient';

export async function loginUser(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    
    if (error) throw error;
    return data.user;
}

export async function signUpUser(email, password) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });
    
    if (error) throw error;
    return data.user;
}