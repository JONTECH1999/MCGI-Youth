# MCGI Youth Google Sheets Backend Integration

This folder contains the complete Google Apps Script backend that allows the MCGI Youth Web Application to use **Google Sheets as its official primary database and single source of truth**.

---

## 🚀 Quick Setup (Under 3 Minutes)

### Step 1: Create a Google Spreadsheet
1. Open your browser and go to [sheets.new](https://sheets.new).
2. Name the spreadsheet: **"MCGI Youth Database & Official Reports"**.

### Step 2: Open Apps Script
1. Inside your Google Spreadsheet, click the menu: **Extensions** → **Apps Script**.
2. A new tab will open with the code editor.

### Step 3: Paste Code.gs
1. Delete any sample code inside the editor (`function myFunction() { ... }`).
2. Copy the entire contents of [`Code.gs`](file:///google-apps-script/Code.gs) and paste it into the editor.
3. Click the floppy disk **Save** icon (or press `Ctrl + S`).

### Step 4: Run Initializer
1. In the toolbar function dropdown, select **`initializeSpreadsheetStructure`**.
2. Click **Run**.
3. Google will ask for authorization:
   - Click **Review permissions**.
   - Choose your Google account.
   - Click **Advanced** → **Go to Untitled project (unsafe)**.
   - Click **Allow**.
4. Switch back to your Google Spreadsheet tab! You will see all 12 worksheets created with frozen header rows, MCGI blue styling, and live report formulas!

### Step 5: Deploy as Web App
1. At the top-right of the Apps Script window, click the blue **Deploy** button → **New deployment**.
2. Click the gear icon (Select type) → choose **Web app**.
3. Fill in the fields:
   - **Description**: `MCGI Youth Web App API`
   - **Execute as**: `Me (<your-email@gmail.com>)`
   - **Who has access**: **`Anyone`**. The endpoint URL is public, but all data reads and writes now require a valid Supabase Auth access token and an active `staff_profiles` row. Only the health-check ping is unauthenticated.
4. Click **Deploy**.
5. Copy the **Web app URL** (it ends with `/exec`).

### Required Supabase Authorization Properties

Before using the Web App URL with real member data, open **Apps Script → Project Settings → Script Properties** and add:

- `SUPABASE_URL`: your Supabase project URL, such as `https://your-project-id.supabase.co`.
- `SUPABASE_PUBLISHABLE_KEY`: the project's publishable key (the legacy anon public key is also accepted).

The script validates each access token with Supabase Auth, then checks that the user has an active staff profile. Never add a service-role key here or in browser code. After changing `Code.gs`, use **Deploy → Manage deployments → Edit → New version → Deploy** so the live `/exec` deployment receives the authorization check.

### Step 6: Connect to React App
1. Open the MCGI Youth Web Application.
2. Navigate to **Settings** → **Google Sheets**.
3. Paste the Web App URL into the **Google Apps Script Web App URL** input.
4. Sign in as an officer, click **Test Connection**, then use **Push All App Data** to create an authenticated secondary copy. Pulling from Sheets is intentionally disabled when Supabase is the primary database.

---

## Supported Worksheets

1. **`MEMBERS`**: All active and historical members (29 official fields).
2. **`ATTENDANCE_EVENTS`**: Prayer Meetings, Thanksgivings, Worship Services, Youth Activities.
3. **`EVENT_SCHEDULES`**: Multiple schedules per event (e.g. 7:00 PM, 5:30 PM, 3:30 AM).
4. **`ATTENDANCE_RECORDS`**: One row per member per schedule with duplicate prevention.
5. **`COMMITTEES`**: Official MCGI committees directory.
6. **`DEMOGRAPHICS`**: Official automated demographic counts and percentages.
7. **`MEMBERSHIP_STATISTICS`**: Live reporting formulas for Active, On & Off, Inactive, Suspended, Missing.
8. **`ATTENDANCE_STATISTICS`**: Live counts of Present, Absent, Excused, Late, Attendance Rate.
9. **`REPORTS`**: Archived snapshots for submission.
10. **`SETTINGS`**: Configurable thresholds for inactivity, At Risk, and counting methods.
11. **`ACTIVITY_LOG`**: Administrative audit trail.
12. **`MEMBER_STATUS_HISTORY`**: Historical track of member status transitions.
