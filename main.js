/*
    main.js
    Entry script for the app's home (index.html).
    Responsibilities:
        - Check authentication and redirect to login if needed
        - Load user's balance and their pets
        - Handle creating new pets and logging out
    This file communicates with Supabase via the exported `supabase` client.
*/
import { supabase } from './supabase.js';

window.location.href = 'home.html';

// Track the currently signed-in user (populated after auth check)
let currentUser = null;

async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();

    //if (!user) {
        //window.location.href = 'auth.html';
        //return;
    //}

    // Save the user object and show the user info area
    currentUser = user;
    document.getElementById('user-info').style.display = 'flex';

    // Load user's balance and pets for the dashboard
    await loadUserBalance();
    await loadPets();
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

    // DOM containers used to render the list of pets
    const petsContainer = document.getElementById('pets-container');
    const petList = document.getElementById('pet-list');

    if (pets && pets.length > 0) {
        // Render each pet as a card with a button to go to the pet care page
        petList.style.display = 'block';
        petsContainer.innerHTML = pets.map(pet => `
            <div class="pet-card" data-pet-id="${pet.id}">
                <h3>${getPetEmoji(pet.species)} ${pet.name}</h3>
                <p class="pet-species">${pet.species.charAt(0).toUpperCase() + pet.species.slice(1)}</p>
                <button class="care-btn" onclick="window.location.href='pet.html?id=${pet.id}'">Care for Pet</button>
            </div>
        `).join('');
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

    // Insert a new pet record tied to the current user
    const { error } = await supabase.from('pets').insert({
        name,
        species,
        owner_id: currentUser.id
    });

    if (error) {
        alert('Error creating pet: ' + error.message);
    } else {
        document.getElementById('pet-name').value = '';
        document.getElementById('pet-species').value = '';
        await loadPets();
    }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'auth.html';
});

document.getElementById('settings-btn').addEventListener('click', () => {
    window.location.href = 'settings.html';
});

checkAuth();
