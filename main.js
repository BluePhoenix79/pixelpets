/*
    main.js
    Entry script for the app's home (index.html).
    Responsibilities:
        - Check authentication and redirect to home if needed
        - Load user's balance and their pets
        - Handle creating new pets and logging out
    This file communicates with Supabase via the exported `supabase` client.
*/
import { supabase } from './supabase.js';

// Track the currently signed-in user (populated after auth check)
let currentUser = null;

// Add minimum loading time for smooth transitions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function checkAuth() {
    try {
        // Show loading state
        document.body.style.opacity = '0';
        
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            console.log('No user found, redirecting to home');
            await delay(300);
            window.location.href = 'auth.html';
            return;
        }

        // Save the user object and show the user info area
        currentUser = user;
        
        // Load user's balance and pets for the dashboard
        await Promise.all([
            loadUserBalance(),
            loadPets(),
            delay(400) // Minimum loading time for smooth appearance
        ]);
        
        document.getElementById('user-info').style.display = 'flex';
        
        // Fade in content
        document.body.style.transition = 'opacity 0.5s ease-in-out';
        document.body.style.opacity = '1';
        
    } catch (err) {
        console.error('Auth check failed:', err);
        await delay(300);
        window.location.href = 'home.html';
    }
}

async function loadUserBalance() {
    const { data, error } = await supabase
        .from('user_finances')
        .select('balance')
        .eq('user_id', currentUser.id)
        .maybeSingle();

    if (error) {
        console.error('Error loading user balance:', error);
        return;
    }

    if (data) {
        // Update the DOM to display the user's current balance
        document.getElementById('balance-amount').textContent = `$${data.balance}`;
    }
}

async function loadPets() {
    const { data: pets, error } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', currentUser.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading pets:', error);
        return;
    }

    const petsContainer = document.getElementById('pets-container');
    const petList = document.getElementById('pet-list');

    if (pets && pets.length > 0) {
        petList.style.display = 'block';
        petsContainer.innerHTML = pets.map(pet => `
            <div class="pet-card" data-pet-id="${pet.id}">
                <h3>${getPetEmoji(pet.species)} ${pet.name}</h3>
                <p class="pet-species">${pet.species.charAt(0).toUpperCase() + pet.species.slice(1)}</p>
                <button class="care-btn" data-pet-id="${pet.id}">Care for Pet</button>
            </div>
        `).join('');
        
        // Add event listeners to all care buttons
        document.querySelectorAll('.care-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const petId = e.target.dataset.petId;
                // Fade out before navigation
                document.body.style.transition = 'opacity 0.3s ease-out';
                document.body.style.opacity = '0';
                
                setTimeout(() => {
                    window.location.href = `pet.html?id=${petId}`;
                }, 300);
            });
        });
    } else {
        petList.style.display = 'none';
    }
}

function getPetEmoji(species) {
    const emojis = {
        dog: '🐶',
        cat: '🐱',
        bird: '🐦',
        fish: '🐠',
        mouse: '🐭'
    };
    return emojis[species] || '🐾';
}

document.getElementById('new-pet-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('pet-name').value;
    const species = document.getElementById('pet-species').value;

    if (!name || !species) {
        alert('Please fill in all fields');
        return;
    }

    // Show loading state on button
    const button = document.getElementById('button');
    const originalText = button.textContent;
    button.textContent = 'Creating...';
    button.disabled = true;

    // Add small delay for smooth UX
    await delay(300);

    // Insert a new pet record tied to the current user
    const { error } = await supabase.from('pets').insert({
        name,
        species,
        owner_id: currentUser.id
    });

    if (error) {
        alert('Error creating pet: ' + error.message);
        button.textContent = originalText;
        button.disabled = false;
    } else {
        document.getElementById('pet-name').value = '';
        document.getElementById('pet-species').value = '';
        await loadPets();
        button.textContent = originalText;
        button.disabled = false;
    }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
    // Fade out before redirect
    document.body.style.transition = 'opacity 0.3s ease-out';
    document.body.style.opacity = '0';
    
    await delay(300);
    await supabase.auth.signOut();
    window.location.href = 'home.html';
});

document.getElementById('settings-btn').addEventListener('click', () => {
    // Fade out before redirect
    document.body.style.transition = 'opacity 0.3s ease-out';
    document.body.style.opacity = '0';
    
    setTimeout(() => {
        window.location.href = 'settings.html';
    }, 300);
});

checkAuth();