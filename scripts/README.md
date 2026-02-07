# Setup Scripts

This folder contains utility scripts for setting up and managing the Equipment Management System.

## Create Admin User Script

This script creates an admin user in Supabase Auth and adds the corresponding profile to the database.

### Prerequisites

1. **Get your Supabase Service Role Key:**
   - Go to your Supabase project dashboard
   - Navigate to **Settings → API**
   - Copy the **"service_role"** key (NOT the anon key)
   - ⚠️ **WARNING**: The service role key has admin privileges. Keep it secret and never commit it to version control!

2. **Add to .env file:**
   Add this line to your `.env` file in the project root:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

### Usage

Run the script with the following command:

```bash
npm run create-admin <email> <password> <full_name>
```

**Example:**
```bash
npm run create-admin admin@school.edu MySecurePassword123 "Admin User"
```

Or run directly with Node:
```bash
node scripts/create-admin.js admin@school.edu MySecurePassword123 "Admin User"
```

### What the Script Does

1. ✅ Creates a user in Supabase Authentication
2. ✅ Auto-confirms the email (no email verification needed)
3. ✅ Creates a profile in the `users` table with role `admin`
4. ✅ Links the auth user ID with the profile

### After Running

Once the script completes successfully, you can:
- Login to the admin dashboard using the email and password you provided
- Access all admin features (Inventory, Students, Settings)

### Troubleshooting

**Error: "User with this email already exists"**
- The email is already registered in Supabase Auth
- You can either use a different email or manually update the user in Supabase dashboard

**Error: "SUPABASE_SERVICE_ROLE_KEY is not set"**
- Make sure you've added the service role key to your `.env` file
- Restart your terminal/command prompt after adding it

**Error: "VITE_SUPABASE_URL is not set"**
- Make sure your `.env` file has the `VITE_SUPABASE_URL` variable set
- This should already be set if you've configured the project

