# ASCOVILLE Web App

This project is configured to use:

- Google Sheets as the primary live data table for records and metadata
- Supabase Storage for uploaded images and videos
- Browser localStorage only as a temporary cache layer, not as the source of truth

## Data architecture

Use Google Sheets for data such as members, events, schedules, attendance, announcements, and landing-page records. Store only the public URL for uploaded media in the sheet row, while actual image/video files live in Supabase Storage.

### Required environment variables

```env
VITE_APPS_SCRIPT_URL=...
VITE_SPREADSHEET_ID=...
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_REQUIRED=false
VITE_SUPABASE_MEDIA_BUCKET=announcement-media
```

### Supabase bucket setup

The Supabase migration creates the public-read `announcement-media` bucket and restricts uploads to authenticated active staff. Apply the migrations in `supabase/migrations` to your Supabase project. In the app, sign in through the Officer Portal, upload an image in an image control, and then save the page or announcement. The app stores the returned public URL in the record, which is synced to Google Sheets. The current bucket accepts images up to 5 MB; video uploads are not enabled by this policy.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```
