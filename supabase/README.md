# Supabase Database Setup

The app keeps localStorage as its offline fallback and can still synchronize with Google Apps Script. When Supabase is configured, staff sign in through Supabase Auth and admin data is loaded from and written to Supabase.

## Create the database

1. Create a Supabase project and keep its database password in your password manager.
2. Open the project's SQL Editor and run `migrations/202610040001_initial_schema.sql`.
3. Run `migrations/202610040002_secure_checkin_and_media.sql`. This creates the image bucket and secure check-in function.
4. In Supabase Authentication, create the administrator and officer users. Disable public sign-ups.
5. Add one `staff_profiles` row for each Auth user. Use the Auth user's UUID as `user_id`, and assign only `ADMIN` or `OFFICER` as the role. Set `full_name` to the real display name, not the example placeholder.

```sql
insert into public.staff_profiles (user_id, username, full_name, role)
values ('AUTH_USER_UUID', 'officer-username', 'Officer Name', 'ADMIN');
```

Do not copy the existing browser demo passkeys into Supabase. The Supabase-configured login accepts the Auth user's email and password and checks that the user has an active staff profile.

## Connect the app

1. In Supabase **Project Settings → API**, copy the Project URL and the publishable key.
2. Create a root `.env.local` file using `.env.example` as a template, then set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. Restart the Vite development server and sign in with the Supabase Auth email and password.

Local demo officer accounts are disabled by default. For isolated development only, set `VITE_ENABLE_LOCAL_DEMO_AUTH=true`; never enable that flag in a production build.

On the first admin sign-in, if the core Supabase tables are empty, the app seeds them from that browser's current local data. If that browser has no local members and the authenticated Apps Script connection is configured, it imports members, events, schedules, attendance, logs, status history, and reports from Google Sheets instead. Announcements and landing-page settings are seeded from local data. Base64 photos in the initial data are uploaded to Supabase Storage before records are seeded. Afterward, Supabase is the staff data source and writes are mirrored to localStorage for the active staff session; sensitive cached rows are cleared on sign-out.

Run both SQL migrations and redeploy the authenticated Apps Script before the first admin sign-in. If neither browser storage nor the authenticated sheet has a roster, Supabase will start with no members; import the real roster from the admin Members page before opening public check-in.

To keep Google Sheets as an authenticated secondary copy, configure the `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` Script Properties described in `../google-apps-script/README.md`, then redeploy the Apps Script. Every Apps Script data operation must pass the active Supabase staff session. In Supabase mode, Sheets pulls are disabled to prevent overwriting newer database data.

Anonymous visitors can load published announcements/events and public landing-page settings. Public self check-in sends only Member ID, full birthday, and a scheduled gathering/event ID to `public_member_check_in`; the function validates an active member, enforces a five-attempt/15-minute limit, checks the event window, and prevents duplicate attendance atomically. It never grants anonymous access to the members table. Public check-ins are saved to Supabase; they are not currently mirrored to Google Sheets.

Uploaded images go to the public-read `announcement-media` bucket, limited to 5 MB and image MIME types. Database records store image URLs, not image bytes. Visitors need an exact Member ID and full birthday for self check-in; check-in opens up to two hours before a schedule and closes three hours after it starts.

## Security

- Row Level Security is enabled on every table.
- Members, attendance, staff profiles, audit history, reports, and settings are restricted to active staff profiles authenticated with Supabase Auth.
- Anonymous visitors can read only published announcements, published events, their active schedules, landing-page settings, and public announcement media.
- Anonymous users can execute only the restricted `public_member_check_in` function; they have no table access to members or attendance.
- Never put a Supabase service-role key in frontend code or a `VITE_` variable. It bypasses Row Level Security.