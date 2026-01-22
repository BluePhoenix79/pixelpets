import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Pet {
    id: string;
    name: string;
    species: string;
    created_at: string;
}

const Dashboard = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [balance, setBalance] = useState(0);
    const [pets, setPets] = useState<Pet[]>([]);
    const [newPetName, setNewPetName] = useState('');
    const [newPetSpecies, setNewPetSpecies] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (!user) return;
        loadData();
    }, [user]);

    const loadData = async () => {
        await Promise.all([loadBalance(), loadPets()]);
    };

    const loadBalance = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('user_finances')
            .select('balance')
            .eq('user_id', user.id)
            .maybeSingle();
        if (data) setBalance(data.balance);
    };

    const loadPets = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('pets')
            .select('*')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false });
        if (data) setPets(data);
    };

    const handleCreatePet = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newPetName || !newPetSpecies) return;
        setCreating(true);
        const { error } = await supabase.from('pets').insert({
            name: newPetName,
            species: newPetSpecies,
            owner_id: user.id
        });

        if (error) {
            alert('Error creating pet: ' + error.message);
        } else {
            setNewPetName('');
            setNewPetSpecies('');
            await loadPets();
        }
        setCreating(false);
    };

    const getPetEmoji = (species: string) => {
        const emojis: Record<string, string> = {
            dog: '🐶', cat: '🐱', bird: '🐦', fish: '🐠', mouse: '🐭'
        };
        return emojis[species] || '🐾';
    };

    return (
        <>
            <header className="title">
                <h1>PixelPets</h1>
                <div className="pet-icons">
                    <span className="pet-icon">🐶</span><span className="pet-icon">🐱</span>
                    <span className="pet-icon">🐦</span><span className="pet-icon">🐠</span><span className="pet-icon">🐰</span>
                </div>
            </header>

            <div id="user-info" style={{ display: 'flex' }}>
                <div className="balance-display">
                    Balance: <span id="balance-amount">${balance}</span>
                </div>
                <div className="user-bar-buttons">
                    <button id="settings-btn" className="user-bar-btn" onClick={() => navigate('/settings')}>Settings</button>
                    <button id="logout-btn" className="user-bar-btn" onClick={() => signOut()}>Logout</button>
                </div>
            </div>

            <main>
                <section id="controls" aria-label="Pet controls">
                    <form id="new-pet-form" autoComplete="off" onSubmit={handleCreatePet}>
                        <label htmlFor="pet-name">Pet Name</label>
                        <input
                            id="pet-name"
                            name="name"
                            type="text"
                            required
                            placeholder="Enter Pet Name"
                            value={newPetName}
                            onChange={e => setNewPetName(e.target.value)}
                        />
                        <label htmlFor="pet-species">Species</label>
                        <select
                            id="pet-species"
                            name="species"
                            required
                            value={newPetSpecies}
                            onChange={e => setNewPetSpecies(e.target.value)}
                        >
                            <option value="">Select a species</option>
                            <option value="dog">Dog</option>
                            <option value="cat">Cat</option>
                            <option value="bird">Bird</option>
                            <option value="fish">Fish</option>
                            <option value="mouse">Mouse</option>
                        </select>
                        <br />
                        <button id="button" type="submit" disabled={creating}>
                            {creating ? 'Creating...' : 'Create Pet'}
                        </button>
                    </form>

                    <div id="pet-list" style={{ display: pets.length > 0 ? 'block' : 'none' }}>
                        <h2>Your Pets</h2>
                        <div id="pets-container">
                            {pets.map(pet => (
                                <div key={pet.id} className="pet-card" data-pet-id={pet.id}>
                                    <h3>{getPetEmoji(pet.species)} {pet.name}</h3>
                                    <p className="pet-species">{pet.species.charAt(0).toUpperCase() + pet.species.slice(1)}</p>
                                    <button
                                        className="care-btn"
                                        data-pet-id={pet.id}
                                        onClick={() => navigate(`/pet/${pet.id}`)}
                                    >
                                        Care for Pet
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
};

export default Dashboard;
