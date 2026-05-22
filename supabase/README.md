# Supabase setup

## Apply the schema

1. Open Supabase Dashboard → your `chainwork` project → **SQL Editor → New query**.
2. Paste the contents of [`migrations/0001_init.sql`](migrations/0001_init.sql).
3. Click **Run**.

The script is idempotent — safe to re-run if you tweak it.

## What it creates

| Table              | Purpose                                                    |
| ------------------ | ---------------------------------------------------------- |
| `profiles`         | One row per `auth.users`. Auto-inserted on signup.         |
| `tasks`            | A posted task. Has `hirer_id` and (once accepted) `talent_id`. |
| `task_attachments` | Reference links / files per task.                          |
| `task_timeline`    | Status events (offer accepted, escrow funded, etc.).       |
| `task_notes`       | Threaded comments between hirer and talent.                |

## RLS in one paragraph

- **Profiles** are readable by anyone signed in; only the owner can write to their own row.
- **Tasks** are readable by the hirer, the talent, or anyone if `status = 'open'`. Only the hirer can insert; either party can update; only the hirer can delete.
- **Attachments, timeline, notes** are readable/writable only by the two parties on the task. Notes can only be inserted under the current user's own `author_id`.

## Realtime

The tables `tasks`, `task_notes`, and `task_timeline` are added to `supabase_realtime`. RLS still applies on the wire — clients only receive rows they're allowed to read.

## Seeding (optional)

To see your own dashboard light up, insert a sample task as yourself after signing in once:

```sql
insert into public.tasks (hirer_id, talent_id, title, category, status, description,
                          skills, budget_cents, deadline, url, progress)
values
  (auth.uid(), auth.uid(),
   'Landing page for SaaS launch', 'web-build', 'in_escrow',
   'Single-page launch site for our new product.',
   array['React','Tailwind','Vercel'],
   95000, current_date + interval '7 days', 'https://example.com', 60);
```

Set both `hirer_id` and `talent_id` to yourself for demo. In production, the hirer posts first and the talent accepts.
