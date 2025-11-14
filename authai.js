
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

/**
 * Validates email format using RFC 5322 compliant regex
 * @param {string} email - Email address to validate
 * @returns {object} - {isValid: boolean, error: string}
 */

function validateEmail(email) {
    // Check if email is empty
    if (!email || email.trim() === '') {
        return { isValid: false, error: 'Email is required' };
    }

    // Remove leading/trailing whitespace
    email = email.trim();

    // Check length constraints
    if (email.length > 254) {
        return { isValid: false, error: 'Email is too long (max 254 characters)' };
    }

    // Check for basic format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { isValid: false, error: 'Please enter a valid email address' };
    }

    return { isValid: true, error: null };
}

/**
 * Validates password strength and format
 * @param {string} password - Password to validate
 * @param {boolean} isSignup - Whether this is for signup (stricter rules)
 * @returns {object} - {isValid: boolean, error: string}
 */
function validatePassword(password, isSignup = false) {
    if (!password) {
        return { isValid: false, error: 'Password is required' };
    }

    if (password.length < 6) {
        return { isValid: false, error: 'Password must be at least 6 characters long' };
    }

    if (password.length > 128) {
        return { isValid: false, error: 'Password is too long (max 128 characters)' };
    }

    if (isSignup) {
        if (!/[a-zA-Z]/.test(password)) {
            return { isValid: false, error: 'Password must contain at least one letter' };
        }

        if (!/[0-9]/.test(password)) {
            return { isValid: false, error: 'Password must contain at least one number' };
        }

        const weakPasswords = [
            'password', 'password1', 'password123', '123456', '12345678',
            'qwerty', 'abc123', 'letmein', 'welcome', 'monkey'
        ];
        if (weakPasswords.includes(password.toLowerCase())) {
            return { isValid: false, error: 'This password is too common. Please choose a stronger password' };
        }

        const sequences = ['123', '234', '345', '456', '567', '678', '789', 'abc', 'bcd', 'cde'];
        if (sequences.some(seq => password.toLowerCase().includes(seq))) {
            return { isValid: false, error: 'Password should not contain sequential characters' };
        }
    }

    return { isValid: true, error: null };
}

/**
 * Sanitizes user input by trimming and removing potentially harmful characters
 * @param {string} input - Input string to sanitize
 * @returns {string} - Sanitized string
 */
function sanitizeInput(input) {
    if (!input) return '';
    
    // Trim whitespace
    let sanitized = input.trim();
    
    // Remove control characters (except newlines and tabs if needed)
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
    
    return sanitized;
}

/**
 * Displays validation error message
 * @param {HTMLElement} messageElement - Element to display message in
 * @param {string} message - Error message to display
 */
function showError(messageElement, message) {
    messageElement.textContent = message;
    messageElement.className = 'message error';
    messageElement.style.display = 'block';
}

/**
 * Displays success message
 * @param {HTMLElement} messageElement - Element to display message in
 * @param {string} message - Success message to display
 */
function showSuccess(messageElement, message) {
    messageElement.textContent = message;
    messageElement.className = 'message success';
    messageElement.style.display = 'block';
}

/**
 * Clears message display
 * @param {HTMLElement} messageElement - Element to clear
 */
function clearMessage(messageElement) {
    messageElement.textContent = '';
    messageElement.className = 'message';
    messageElement.style.display = 'none';
}

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

    
    // Attempt to sign in using Supabase Auth
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            // Provide user-friendly error messages
            if (error.message.includes('Invalid login credentials')) {
                signupMessage.textContent = error.message;
                signupMessage.className = 'Invalid email or password. Please try again.';
            } else if (error.message.includes('Email not confirmed')) {
                signupMessage.textContent = error.message;
                signupMessage.className = 'Please confirm your email address before logging in.';
            } else {
                signupMessage.textContent = error.message;
                signupMessage.className = 'error';
            }
        } else {
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        }
    } catch (err) {
        signupMessage.textContent = error.message;
        signupMessage.className = 'An unexpected error occurred. Please try again.';
        console.error('Login error:', err);
    }
});

(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        window.location.href = 'index.html';
    }
})();
