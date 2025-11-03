import { supabase } from './supabase.js';

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

    if (password.length < 6) {
        signupMessage.textContent = 'Password must be at least 6 characters';
        signupMessage.className = 'message error';
        return;
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });

    if (error) {
        signupMessage.textContent = error.message;
        signupMessage.className = 'message error';
    } else {
        await supabase.from('user_finances').insert({
            user_id: data.user.id,
            balance: 1000,
            total_earned: 1000,
            total_spent: 0
        });

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
