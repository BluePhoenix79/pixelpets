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
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
            console.log('No user found, redirecting to home');
            window.location.href = 'home.html';
            return;
        }
        
        currentUser = user;
        populateUserInfo();
    } catch (err) {
        console.error('Auth check failed:', err);
        window.location.href = 'home.html';
    }
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
    window.location.href = 'home.html';
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

async function loadUserPets() {
    const petsContainer = document.getElementById('pets-management-container');
    if (!petsContainer) return; // If element doesn't exist, skip
    
    const { data: pets, error } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', currentUser.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading pets:', error);
        return;
    }

    if (!pets || pets.length === 0) {
        petsContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">No pets yet</p>';
        return;
    }

    petsContainer.innerHTML = pets.map(pet => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--surface-medium); border-radius: 8px; margin-bottom: 10px;">
            <div>
                <strong style="color: var(--text-primary);">${pet.name}</strong>
                <span style="color: var(--text-muted); margin-left: 8px;">(${pet.species})</span>
            </div>
            <div style="display: flex; gap: 8px;">
                <button onclick="renamePet('${pet.id}', '${pet.name}')" style="padding: 6px 12px; background: var(--fbla-blue-600); color: white; border: none; border-radius: 6px; cursor: pointer;">Rename</button>
                <button onclick="deletePet('${pet.id}', '${pet.name}')" style="padding: 6px 12px; background: #dc2626; color: white; border: none; border-radius: 6px; cursor: pointer;">Delete</button>
            </div>
        </div>
    `).join('');
}

window.renamePet = async function(petId, currentName) {
    const newName = prompt(`Enter new name for ${currentName}:`, currentName);
    if (!newName || newName === currentName) return;
    
    const { error } = await supabase.from('pets').update({ name: newName }).eq('id', petId);
    
    if (error) {
        alert('Error updating pet name: ' + error.message);
    } else {
        showMessage('Pet name updated!', 'success');
        loadUserPets();
    }
};

window.deletePet = async function(petId, petName) {
    if (!confirm(`Delete ${petName}? This cannot be undone!`)) return;
    if (!confirm(`Are you SURE? This will delete all data for ${petName}!`)) return;
    
    try {
        await supabase.from('achievements').delete().eq('pet_id', petId);
        await supabase.from('expenses').delete().eq('pet_id', petId);
        await supabase.from('savings_goals').delete().eq('pet_id', petId);
        await supabase.from('pets').delete().eq('id', petId);
        
        showMessage(`${petName} deleted`, 'success');
        loadUserPets();
    } catch (error) {
        alert('Error deleting pet: ' + error.message);
    }
};

// Run on page load
(async () => {
    await checkAuth();
    loadTheme();
    setupEventListeners();
    loadUserPets(); 
})();