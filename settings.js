import { supabase } from './supabase.js';

const settingsModal = document.getElementById('settings-modal');
const settingsBtn = document.getElementById('settings-btn');
const closeBtn = document.querySelector('.close-btn');
const settingsContent = document.getElementById('settings-content');

const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const themeSelect = document.getElementById('theme-select');
const logoutBtn = document.getElementById('logout-btn');

async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        usernameInput.value = user.user_metadata.username || '';
        emailInput.value = user.email;
    }
}

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

function loadTheme() {
    const theme = localStorage.getItem('theme-preference') || 'system';
    themeSelect.value = theme;
    handleThemeChange();
}

function openSettingsModal() {
    settingsModal.style.display = 'block';
    fetch('settings.html')
        .then(response => response.text())
        .then(html => {
            settingsContent.innerHTML = html;
            // Re-add event listeners after loading the content
            document.getElementById('logout-btn').addEventListener('click', handleLogout);
            document.getElementById('theme-select').addEventListener('change', handleThemeChange);
            checkAuth();
            loadTheme();
        });
}

function closeSettingsModal() {
    settingsModal.style.display = 'none';
}

settingsBtn.addEventListener('click', openSettingsModal);
closeBtn.addEventListener('click', closeSettingsModal);

window.addEventListener('click', (event) => {
    if (event.target === settingsModal) {
        closeSettingsModal();
    }
});

loadTheme();
