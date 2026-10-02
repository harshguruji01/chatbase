# Supabase MCP Project Mapping Rule

When working in the **chatbase** workspace (`c:\Users\harsh\OneDrive\Desktop\chatbase`), always use the **ChatBase** Supabase project for all MCP tool calls:

- **Project ID (ref):** `hzojuiccegnvanqowgmf`
- **Supabase URL:** `https://hzojuiccegnvanqowgmf.supabase.co`
- **Anon Key:** `sb_publishable_5A1JzL0pcic7ergdBEYbgQ_aVVWFajv`

## When calling Supabase MCP tools (e.g. `execute_sql`, `list_tables`, `apply_migration`, `get_advisors`, etc.):
- Always pass `project_id: "hzojuiccegnvanqowgmf"` 
- **NEVER** use the site project ID (`wumdbpyhpblvgjttsbpv`) when working in this folder

## Project Context
- This is the **ChatBase** app — a real-time messaging/chat application
- Domain: `chat.webguruji.online`
- Built with: React + Vite + Supabase + Capacitor
- Tables include: `profiles`, `conversations`, `conversation_members`, `messages`, `blocks`, `reports`, etc.
