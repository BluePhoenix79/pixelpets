import { supabase } from './supabase.js';

let currentUser = null;

async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        window.location.href = 'auth.html';
        return;
    }

    currentUser = user;
    document.getElementById('user-info').style.display = 'flex';
    await loadUserBalance();
    await loadPets();
}

async function loadUserBalance() {
    const { data } = await supabase
        .from('user_finances')
        .select('balance')
        .eq('user_id', currentUser.id)
        .maybeSingle();

    if (data) {
        document.getElementById('balance-amount').textContent = `$${data.balance}`;
    }
}

async function loadPets() {
    const { data: pets } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', currentUser.id)
        .order('created_at', { ascending: false });

    const petsContainer = document.getElementById('pets-container');
    const petList = document.getElementById('pet-list');

    if (pets && pets.length > 0) {
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

checkAuth();
