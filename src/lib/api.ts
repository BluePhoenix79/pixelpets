const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ==================== PETS ====================
export async function getPets(userId: string) {
  const res = await fetch(`${API_URL}/pets/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch pets");
  return res.json();
}

export async function createPet(data: {
  name: string;
  species: string;
  owner_id: string;
}) {
  const res = await fetch(`${API_URL}/pets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to create pet");
  return res.json();
}

export async function updatePet(petId: string, body: any) {
  const res = await fetch(`${API_URL}/pets/${petId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to update pet");
  return res.json();
}

export async function deletePet(petId: string) {
  const res = await fetch(`${API_URL}/pets/${petId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete pet");
  return res.json();
}

// ==================== TASKS ====================
export async function getTasks(userId: string) {
  const res = await fetch(`${API_URL}/tasks/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function createTask(body: {
  user_id: string;
  task_name: string;
  reward_amount?: number;
}) {
  const res = await fetch(`${API_URL}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to create task");
  return res.json();
}

export async function deleteIncompleteTasks(userId: string) {
  const res = await fetch(`${API_URL}/tasks/${userId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete tasks");
  return res.json();
}

export async function completeTask(taskId: string) {
  const res = await fetch(`${API_URL}/tasks/${taskId}/complete`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Failed to complete task");
  return res.json();
}

// ==================== FINANCES ====================
export async function getFinances(userId: string) {
  const res = await fetch(`${API_URL}/finances/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch finances");
  return res.json();
}

export async function createFinances(body: any) {
  const res = await fetch(`${API_URL}/finances`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to create finances");
  return res.json();
}

export async function patchFinances(userId: string, body: any) {
  const res = await fetch(`${API_URL}/finances/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to patch finances");
  return res.json();
}

// ==================== EXPENSES ====================
export async function getExpenses(userId: string, petId: string) {
  const res = await fetch(`${API_URL}/expenses/${userId}/${petId}`);
  if (!res.ok) throw new Error("Failed to fetch expenses");
  return res.json();
}

export async function createExpense(body: any) {
  const res = await fetch(`${API_URL}/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to create expense");
  return res.json();
}

// ==================== ACHIEVEMENTS ====================
export async function getAchievements(userId: string) {
  const res = await fetch(`${API_URL}/achievements/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch achievements");
  return res.json();
}

export async function createAchievement(body: any) {
  const res = await fetch(`${API_URL}/achievements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to create achievement");
  return res.json();
}

// ==================== USER STREAKS ====================
export async function getUserStreak(userId: string) {
  const res = await fetch(`${API_URL}/user_streaks/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch streak");
  return res.json();
}

export async function upsertUserStreak(body: any) {
  const res = await fetch(`${API_URL}/user_streaks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to upsert streak");
  return res.json();
}

// ==================== SAVINGS GOALS ====================
export async function getSavingsGoal(userId: string, petId: string) {
  const res = await fetch(`${API_URL}/savings/${userId}/${petId}`);
  if (!res.ok) throw new Error("Failed to fetch savings");
  return res.json();
}

export async function createSavingsGoal(body: any) {
  const res = await fetch(`${API_URL}/savings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to create savings");
  return res.json();
}

export async function updateSavingsGoal(userId: string, petId: string, body:{targetAmount?: number, currentAmount?: number}) {
  const res = await fetch(`${API_URL}/savings/${userId}/${petId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to update savings");
  return res.json();
}

// ==================== PROFILES (NEW - for auth) ====================
export async function getProfile(userId: string) {
  const res = await fetch(`${API_URL}/profiles/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

export async function createProfile(body: {
  user_id: string;
  username: string;
  show_on_leaderboard?: boolean;
}) {
  const res = await fetch(`${API_URL}/profiles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to create profile");
  return res.json();
}

export async function updateProfile(userId: string, body: any) {
  const res = await fetch(`${API_URL}/profiles/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}

// ==================== LEADERBOARD ====================
export async function getLeaderboardByBalance(limit = 50) {
  const res = await fetch(`${API_URL}/leaderboard/balance?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch balance leaderboard");
  return res.json();
}

export async function getLeaderboardByLevel(limit = 50) {
  const res = await fetch(`${API_URL}/leaderboard/level?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch level leaderboard");
  return res.json();
}

export async function getLeaderboardByStreak(limit = 50) {
  const res = await fetch(`${API_URL}/leaderboard/streak?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch streak leaderboard");
  return res.json();
}
