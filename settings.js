import { supabase } from './supabase.js';

// DOM Elements
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const themeSelect = document.getElementById('theme-select');
const logoutBtn = document.getElementById('logout-btn');
const backBtn = document.getElementById('back-btn');
const editUsernameBtn = document.getElementById('edit-username-btn');
const passwordForm = document.getElementById('password-form');
const newPasswordInput = document.getElementById('new-password');
const messageArea = document.getElementById('message-area');

let currentUser = null;

// --- Core Functions ---

async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = 'auth.html';
        return;
    }
    currentUser = user;
    populateUserInfo();
}

function populateUserInfo() {
    if (!currentUser) return;
    emailInput.value = currentUser.email;
    usernameInput.value = currentUser.user_metadata.username || '';
}

function showMessage(message, type = 'success') {
    messageArea.textContent = message;
    messageArea.className = `message ${type}`;
    messageArea.style.display = 'block';
}

// --- Event Handlers ---

function handleThemeChange() {
    const theme = themeSelect.value;
    localStorage.setItem('theme-preference', theme);

    if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
        document.documentElement.setAttribute('data-theme', theme);
    }
}

async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
}

function handleEditUsernameClick() {
    if (usernameInput.disabled) {
        // Enable editing
        usernameInput.disabled = false;
        usernameInput.focus();
        editUsernameBtn.textContent = 'Save';
    } else {
        // Save changes
        saveUsername();
    }
}

async function saveUsername() {
    const newUsername = usernameInput.value.trim();
    if (newUsername === (currentUser.user_metadata.username || '')) {
        // No change, just revert UI
        usernameInput.disabled = true;
        editUsernameBtn.textContent = 'Edit';
        return;
    }

    const { data, error } = await supabase.auth.updateUser({
        data: { username: newUsername }
    });

    if (error) {
        showMessage(`Error: ${error.message}`, 'error');
    } else {
        currentUser = data.user; // Update local user object
        showMessage('Username updated successfully!');
        populateUserInfo();
    }

    usernameInput.disabled = true;
    editUsernameBtn.textContent = 'Edit';
}

async function handlePasswordUpdate(e) {
    e.preventDefault();
    const newPassword = newPasswordInput.value;

    if (newPassword.length < 6) {
        showMessage('Password must be at least 6 characters long.', 'error');
        return;
    }

    const { error } = await supabase.auth.updateUser({
        password: newPassword
    });

    if (error) {
        showMessage(`Error: ${error.message}`, 'error');
    } else {
        showMessage('Password updated successfully!');
        newPasswordInput.value = ''; // Clear the input
    }
}

// --- Initialization ---

function loadTheme() {
    const theme = localStorage.getItem('theme-preference') || 'system';
    themeSelect.value = theme;
    handleThemeChange();
}

function setupEventListeners() {
    logoutBtn.addEventListener('click', handleLogout);
    backBtn.addEventListener('click', () => window.location.href = 'index.html');
    themeSelect.addEventListener('change', handleThemeChange);
    editUsernameBtn.addEventListener('click', handleEditUsernameClick);
    passwordForm.addEventListener('submit', handlePasswordUpdate);

    // Also save username on Enter key press
    usernameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !usernameInput.disabled) {
            saveUsername();
        }
    });
}

// Run on page load
(async () => {
    await checkAuth();
    loadTheme();
    setupEventListeners();
})();

