-- Arcane Supabase RLS Policies
-- Execute with: supabase db push --file supabase/policies.sql

------------------------------------------
-- PLAYERS
------------------------------------------

alter table public.players enable row level security;

drop policy if exists "Players are only managed by owner" on public.players;
create policy "Players are only managed by owner"
  on public.players
  for all
  using (auth.uid()::text = "userId")
  with check (auth.uid()::text = "userId");

------------------------------------------
-- SCOUTING REPORTS
------------------------------------------

alter table public.scouting_reports enable row level security;

drop policy if exists "Reports readable by creator and admins" on public.scouting_reports;
create policy "Reports readable by creator and admins"
  on public.scouting_reports
  for select
  using (
    auth.uid()::text = "scoutId"
    or exists (
      select 1
      from public.users u
      where u.id = auth.uid()::text
      and u.role in ('ADMIN', 'SUPER_ADMIN')
    )
  );

drop policy if exists "Reports updatable by creator" on public.scouting_reports;
create policy "Reports updatable by creator"
  on public.scouting_reports
  for all
  using (auth.uid()::text = "scoutId")
  with check (auth.uid()::text = "scoutId");

------------------------------------------
-- CLUB REQUESTS
------------------------------------------

alter table public.club_requests enable row level security;

drop policy if exists "Club requests visible by owner" on public.club_requests;
create policy "Club requests visible by owner"
  on public.club_requests
  for select
  using (
    exists (
      select 1
      from public.players p
      where p.id = "playerId"
      and p."userId" = auth.uid()::text
    )
    or exists (
      select 1
      from public.clubs c
      where c.id = "clubId"
      and c."contactUserId" = auth.uid()::text
    )
    or exists (
      select 1
      from public.users u
      where u.id = auth.uid()::text
      and u.role in ('ADMIN', 'SUPER_ADMIN')
    )
  );

------------------------------------------
-- USERS (CRITICAL!)
------------------------------------------

alter table public.users enable row level security;

-- Users can view their own profile
drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile"
  on public.users
  for select
  using (auth.uid()::text = id);

-- Users can update their own profile
drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
  on public.users
  for update
  using (auth.uid()::text = id)
  with check (auth.uid()::text = id);

-- Only service role can create users (handled by auth flow)
drop policy if exists "Service role can create users" on public.users;
create policy "Service role can create users"
  on public.users
  for insert
  with check (auth.role() = 'service_role');

------------------------------------------
-- SUBSCRIPTIONS
------------------------------------------

alter table public.subscriptions enable row level security;

-- Users can view their own subscription
drop policy if exists "Users can view own subscription" on public.subscriptions;
create policy "Users can view own subscription"
  on public.subscriptions
  for select
  using (auth.uid()::text = "userId");

-- Only service role can manage subscriptions (Stripe webhooks)
drop policy if exists "Service role can manage subscriptions" on public.subscriptions;
create policy "Service role can manage subscriptions"
  on public.subscriptions
  for all
  using (auth.role() = 'service_role');

------------------------------------------
-- CAMPS
------------------------------------------

alter table public.camps enable row level security;

-- Everyone can view published camps
drop policy if exists "Public can view published camps" on public.camps;
create policy "Public can view published camps"
  on public.camps
  for select
  using (status = 'PUBLISHED');

-- Only admins can manage camps
drop policy if exists "Admins can manage camps" on public.camps;
create policy "Admins can manage camps"
  on public.camps
  for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()::text
      and u.role in ('ADMIN', 'SUPER_ADMIN', 'SCOUT')
    )
  );

------------------------------------------
-- CAMP_PARTICIPATIONS
------------------------------------------

alter table public.camp_participations enable row level security;

-- Users can view their own participations
drop policy if exists "Users can view own participations" on public.camp_participations;
create policy "Users can view own participations"
  on public.camp_participations
  for select
  using (
    exists (
      select 1
      from public.players p
      where p.id = "playerId"
      and p."userId" = auth.uid()::text
    )
  );

-- Users can register for camps
drop policy if exists "Users can register for camps" on public.camp_participations;
create policy "Users can register for camps"
  on public.camp_participations
  for insert
  with check (
    exists (
      select 1
      from public.players p
      where p.id = "playerId"
      and p."userId" = auth.uid()::text
    )
  );

-- Users can update their own participations
drop policy if exists "Users can update own participations" on public.camp_participations;
create policy "Users can update own participations"
  on public.camp_participations
  for update
  using (
    exists (
      select 1
      from public.players p
      where p.id = "playerId"
      and p."userId" = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1
      from public.players p
      where p.id = "playerId"
      and p."userId" = auth.uid()::text
    )
  );

------------------------------------------
-- EVENTS
------------------------------------------

alter table public.events enable row level security;

-- Users can view events they're assigned to or public events
drop policy if exists "Users can view relevant events" on public.events;
create policy "Users can view relevant events"
  on public.events
  for select
  using (
    "createdById" = auth.uid()::text
    or exists (
      select 1
      from public.event_assignments ea
      where ea."eventId" = id
      and ea."userId" = auth.uid()::text
    )
  );

-- Users can create events
drop policy if exists "Users can create events" on public.events;
create policy "Users can create events"
  on public.events
  for insert
  with check (auth.uid()::text = "createdById");

-- Users can update their own events
drop policy if exists "Users can update own events" on public.events;
create policy "Users can update own events"
  on public.events
  for update
  using (auth.uid()::text = "createdById")
  with check (auth.uid()::text = "createdById");

------------------------------------------
-- EVENT_ASSIGNMENTS
------------------------------------------

alter table public.event_assignments enable row level security;

-- Users can view their own assignments
drop policy if exists "Users can view own assignments" on public.event_assignments;
create policy "Users can view own assignments"
  on public.event_assignments
  for select
  using (
    auth.uid()::text = "userId"
    or exists (
      select 1
      from public.events e
      where e.id = "eventId"
      and e."createdById" = auth.uid()::text
    )
  );

-- Event owners can manage assignments
drop policy if exists "Event owners can manage assignments" on public.event_assignments;
create policy "Event owners can manage assignments"
  on public.event_assignments
  for all
  using (
    exists (
      select 1 from public.events e
      where e.id = "eventId"
      and e."createdById" = auth.uid()::text
    )
  );

------------------------------------------
-- KANBAN BOARDS (Market Board)
------------------------------------------

alter table public.kanban_boards enable row level security;

-- Users can view own kanban boards
drop policy if exists "Users can view own kanban boards" on public.kanban_boards;
create policy "Users can view own kanban boards"
  on public.kanban_boards
  for select
  using (auth.uid()::text = "ownerId");

-- Users can manage own kanban boards
drop policy if exists "Users can manage own kanban boards" on public.kanban_boards;
create policy "Users can manage own kanban boards"
  on public.kanban_boards
  for all
  using (auth.uid()::text = "ownerId")
  with check (auth.uid()::text = "ownerId");

------------------------------------------
-- KANBAN COLUMNS
------------------------------------------

alter table public.kanban_columns enable row level security;

-- Users can view columns of their boards
drop policy if exists "Users can view own columns" on public.kanban_columns;
create policy "Users can view own columns"
  on public.kanban_columns
  for select
  using (
    exists (
      select 1 from public.kanban_boards kb
      where kb.id = "boardId"
      and kb."ownerId" = auth.uid()::text
    )
  );

-- Users can manage columns of their boards
drop policy if exists "Users can manage own columns" on public.kanban_columns;
create policy "Users can manage own columns"
  on public.kanban_columns
  for all
  using (
    exists (
      select 1 from public.kanban_boards kb
      where kb.id = "boardId"
      and kb."ownerId" = auth.uid()::text
    )
  );

------------------------------------------
-- KANBAN CARDS
------------------------------------------

alter table public.kanban_cards enable row level security;

-- Users can view cards of their boards
drop policy if exists "Users can view own cards" on public.kanban_cards;
create policy "Users can view own cards"
  on public.kanban_cards
  for select
  using (
    exists (
      select 1 from public.kanban_columns kc
      join public.kanban_boards kb on kb.id = kc."boardId"
      where kc.id = "columnId"
      and kb."ownerId" = auth.uid()::text
    )
  );

-- Users can manage cards of their boards
drop policy if exists "Users can manage own cards" on public.kanban_cards;
create policy "Users can manage own cards"
  on public.kanban_cards
  for all
  using (
    exists (
      select 1 from public.kanban_columns kc
      join public.kanban_boards kb on kb.id = kc."boardId"
      where kc.id = "columnId"
      and kb."ownerId" = auth.uid()::text
    )
  );

------------------------------------------
-- NOTIFICATIONS
------------------------------------------

alter table public.notifications enable row level security;

-- Users can view their own notifications
drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
  on public.notifications
  for select
  using (auth.uid()::text = "userId");

-- Users can update their own notifications (mark as read)
drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications
  for update
  using (auth.uid()::text = "userId")
  with check (auth.uid()::text = "userId");

------------------------------------------
-- MEDIA
------------------------------------------

alter table public.media enable row level security;

-- Users can view media they uploaded or media related to their entities
drop policy if exists "Users can view accessible media" on public.media;
create policy "Users can view accessible media"
  on public.media
  for select
  using (
    exists (
      select 1 from public.players p
      where p.id = "playerId"
      and p."userId" = auth.uid()::text
    )
    or exists (
      select 1 from public.scouting_reports r
      where r.id = "reportId"
      and r."scoutId" = auth.uid()::text
    )
  );

-- Users can upload media
drop policy if exists "Users can upload media" on public.media;
create policy "Users can upload media"
  on public.media
  for insert
  with check (
    auth.role() = 'service_role'
    or exists (
      select 1 from public.players p
      where p.id = "playerId"
      and p."userId" = auth.uid()::text
    )
    or exists (
      select 1 from public.scouting_reports r
      where r.id = "reportId"
      and r."scoutId" = auth.uid()::text
    )
  );

-- Users can delete their own media
drop policy if exists "Users can delete own media" on public.media;
create policy "Users can delete own media"
  on public.media
  for delete
  using (
    auth.role() = 'service_role'
    or exists (
      select 1 from public.players p
      where p.id = "playerId"
      and p."userId" = auth.uid()::text
    )
    or exists (
      select 1 from public.scouting_reports r
      where r.id = "reportId"
      and r."scoutId" = auth.uid()::text
    )
  );
