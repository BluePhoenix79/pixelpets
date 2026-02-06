-- Create a table for tracking user streaks and login history
create table user_streaks (
  user_id uuid references auth.users not null primary key,
  current_streak integer default 0,
  last_login_date date,
  login_dates jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table user_streaks enable row level security;

-- Create policies
create policy "Users can view their own streak" on user_streaks
  for select using (auth.uid() = user_id);

create policy "Users can insert their own streak" on user_streaks
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own streak" on user_streaks
  for update using (auth.uid() = user_id);
