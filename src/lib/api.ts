const API_URL = import.meta.env.VITE_API_URL;


export async function getPets(userId: string) {
  const res = await fetch(`${API_URL}/api/pets/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch pets");
  return res.json();
}


export async function createPet(data: {
  name: string;
  species: string;
  owner_id: string;
}) {
  const res = await fetch(`${API_URL}/api/pets`, {
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
  const res = await fetch(`${API_URL}/api/pets/${petId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to update pet");
  return res.json();
}

export async function deletePet(petId: string) {
  const res = await fetch(`${API_URL}/api/pets/${petId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete pet");
  return res.json();
}

export async function getTasks(userId: string) {
  const res = await fetch(`${API_URL}/api/tasks/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function createTask(body: {
  user_id: string;
  task_name: string;
  reward_amount?: number;
}) {
  const res = await fetch(`${API_URL}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to create task");
  return res.json();
}


export async function deleteIncompleteTasks(userId: string) {
  const res = await fetch(`${API_URL}/api/tasks/${userId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete tasks");
  return res.json();
}

export async function completeTask(taskId: string) {
  const res = await fetch(`${API_URL}/api/tasks/${taskId}/complete`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Failed to complete task");
  return res.json();
}

export async function getFinances(userId: string) {
  const res = await fetch(`${API_URL}/api/finances/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch finances");
  return res.json();
}

export async function createFinances(body: any) {
  const res = await fetch(`${API_URL}/api/finances`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to create finances");
  return res.json();
}

export async function patchFinances(userId: string, body: any) {
  const res = await fetch(`${API_URL}/api/finances/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to patch finances");
  return res.json();
}

export async function getExpenses(userId: string, petId: string) {
  const res = await fetch(`${API_URL}/api/expenses/${userId}/${petId}`);
  if (!res.ok) throw new Error("Failed to fetch expenses");
  return res.json();
}

export async function createExpense(body: any) {
  const res = await fetch(`${API_URL}/api/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to create expense");
  return res.json();
}

export async function getAchievements(userId: string) {
  const res = await fetch(`${API_URL}/api/achievements/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch achievements");
  return res.json();
}

export async function createAchievement(body: any) {
  const res = await fetch(`${API_URL}/api/achievements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to create achievement");
  return res.json();
}

export async function getUserStreak(userId: string) {
  const res = await fetch(`${API_URL}/api/user_streaks/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch streak");
  return res.json();
}

export async function upsertUserStreak(body: any) {
  const res = await fetch(`${API_URL}/api/user_streaks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to upsert streak");
  return res.json();
}

export async function getSavingsGoal(userId: string, petId: string) {
  const res = await fetch(`${API_URL}/api/savings/${userId}/${petId}`);
  if (!res.ok) throw new Error("Failed to fetch savings");
  return res.json();
}

export async function createSavingsGoal(body: any) {
  const res = await fetch(`${API_URL}/api/savings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to create savings");
  return res.json();
}

export async function updateSavingsGoal(userId: string, petId: string, body:{targetAmount?: number, currentAmount?: number}) {
  const res = await fetch(`${API_URL}/api/savings/${userId}/${petId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to update savings");
  return res.json();
}