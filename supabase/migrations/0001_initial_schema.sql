-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create users table (extending auth.users from Supabase Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Create journal_entries table
create table public.journal_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  mood text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create fitness_activities table
create table public.fitness_activities (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  activity_type text not null,
  duration_minutes integer not null,
  calories_burned integer,
  notes text,
  date timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create water_intake table
create table public.water_intake (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  amount_ml integer not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create mood_entries table
create table public.mood_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  mood text not null,
  energy_level integer check (energy_level between 1 and 5),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better query performance
create index idx_journal_entries_user_id on public.journal_entries(user_id);
create index idx_journal_entries_created_at on public.journal_entries(created_at);

create index idx_fitness_activities_user_id on public.fitness_activities(user_id);
create index idx_fitness_activities_date on public.fitness_activities(date);

create index idx_water_intake_user_id on public.water_intake(user_id);
create index idx_water_intake_timestamp on public.water_intake(timestamp);

create index idx_mood_entries_user_id on public.mood_entries(user_id);
create index idx_mood_entries_created_at on public.mood_entries(created_at);

-- Set up Row Level Security (RLS) policies
-- Profiles
create policy "Users can view their own profile"
on public.profiles for select using (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles for update using (auth.uid() = id);

-- Journal Entries
create policy "Users can view their journal entries"
on public.journal_entries for select using (auth.uid() = user_id);

create policy "Users can create journal entries"
on public.journal_entries for insert with check (auth.uid() = user_id);

create policy "Users can update their journal entries"
on public.journal_entries for update using (auth.uid() = user_id);

create policy "Users can delete their journal entries"
on public.journal_entries for delete using (auth.uid() = user_id);

-- Fitness Activities
create policy "Users can view their fitness activities"
on public.fitness_activities for select using (auth.uid() = user_id);

create policy "Users can create fitness activities"
on public.fitness_activities for insert with check (auth.uid() = user_id);

create policy "Users can update their fitness activities"
on public.fitness_activities for update using (auth.uid() = user_id);

create policy "Users can delete their fitness activities"
on public.fitness_activities for delete using (auth.uid() = user_id);

-- Water Intake
create policy "Users can view their water intake"
on public.water_intake for select using (auth.uid() = user_id);

create policy "Users can log water intake"
on public.water_intake for insert with check (auth.uid() = user_id);

-- Mood Entries
create policy "Users can view their mood entries"
on public.mood_entries for select using (auth.uid() = user_id);

create policy "Users can create mood entries"
on public.mood_entries for insert with check (auth.uid() = user_id);

-- Create a function to handle new user signups
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable realtime for tables
alter publication supabase_realtime add table public.journal_entries;
alter publication supabase_realtime add table public.fitness_activities;
alter publication supabase_realtime add table public.water_intake;
alter publication supabase_realtime add table public.mood_entries;
