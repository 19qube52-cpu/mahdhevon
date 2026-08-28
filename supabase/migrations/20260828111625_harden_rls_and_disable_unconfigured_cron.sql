-- Remove public RPC access to a privileged helper created by the platform.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- Avoid per-row auth.uid() evaluation while preserving owner-scoped CRUD.
drop policy if exists "select_own_favorites" on public.favorites;
create policy "select_own_favorites" on public.favorites for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "insert_own_favorites" on public.favorites;
create policy "insert_own_favorites" on public.favorites for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "update_own_favorites" on public.favorites;
create policy "update_own_favorites" on public.favorites for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "delete_own_favorites" on public.favorites;
create policy "delete_own_favorites" on public.favorites for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "select_own_saved_items" on public.saved_items;
create policy "select_own_saved_items" on public.saved_items for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "insert_own_saved_items" on public.saved_items;
create policy "insert_own_saved_items" on public.saved_items for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "update_own_saved_items" on public.saved_items;
create policy "update_own_saved_items" on public.saved_items for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "delete_own_saved_items" on public.saved_items;
create policy "delete_own_saved_items" on public.saved_items for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "select_own_rights_cases" on public.rights_cases;
create policy "select_own_rights_cases" on public.rights_cases for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "insert_own_rights_cases" on public.rights_cases;
create policy "insert_own_rights_cases" on public.rights_cases for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "update_own_rights_cases" on public.rights_cases;
create policy "update_own_rights_cases" on public.rights_cases for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "delete_own_rights_cases" on public.rights_cases;
create policy "delete_own_rights_cases" on public.rights_cases for delete to authenticated using ((select auth.uid()) = user_id);

-- Disable the broken legacy job until a Vault-backed credential is configured.
select cron.unschedule('publish-daily-calculator') where exists (select 1 from cron.job where jobname = 'publish-daily-calculator');
