/*
    auth.js
    Handles authentication UI and flows for login and signup pages.
    - Switches between Login and Sign Up tabs
    - Submits credentials to Supabase auth
    - Provides user feedback and redirects on success
*/
import { supabase } from './supabase.js';

// Cached DOM nodes for the authentication forms and messages
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginMessage = document.getElementById('login-message');
const signupMessage = document.getElementById('signup-message');
const tabBtns = document.querySelectorAll('.tab-btn');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;

        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Toggle between login and signup views
        if (tab === 'login') {
            loginForm.style.display = 'flex';
            signupForm.style.display = 'none';
        } else {
            loginForm.style.display = 'none';
            signupForm.style.display = 'flex';
        }
    });
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginMessage.className = 'message';

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    // Attempt to sign in using Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        loginMessage.textContent = error.message;
        loginMessage.className = 'message error';
    } else {
        loginMessage.textContent = 'Login successful!';
        loginMessage.className = 'message success';
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    }
});

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    signupMessage.className = 'message';

    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    // Basic client-side password validation before sign up
    if (password.length < 6) {
        signupMessage.textContent = 'Password must be at least 6 characters';
        signupMessage.className = 'message error';
        return;
    }

    // Create the user in Supabase Auth with email confirmation disabled
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: window.location.origin,
            data: {
                email_confirmed: true
            }
        }
    });

    if (error) {
        signupMessage.textContent = error.message;
        signupMessage.className = 'message error';
    } else {
        // Initialize user's in-game finances after successful signup
        const { error: financeError } = await supabase.from('user_finances').insert({
            user_id: data.user.id,
            balance: 20,
            total_earned: 20,
            total_spent: 0
        });

        if (financeError) {
            signupMessage.textContent = 'Error setting up your account finances. Please try again.';
            signupMessage.className = 'message error';
            // Optionally, you might want to delete the user here to allow them to retry signing up
            // await supabase.auth.api.deleteUser(data.user.id);
            return;
        }

        signupMessage.textContent = 'Account created! Logging you in...';
        signupMessage.className = 'message success';
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
});

(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        window.location.href = 'index.html';
    }
})();
