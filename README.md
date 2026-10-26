# Three Jars – 50/30/20 Expense Tracker
React + Vite, auth and database by Supabase, hosted on Vercel.

## 1. Supabase (free)
1. Create a project at supabase.com.
2. SQL Editor → paste and run `supabase.sql`.
3. Project Settings → API → copy the **Project URL** and **anon public key**.
4. (Optional) Authentication → Providers → Email → turn off "Confirm email" to log in immediately after sign-up.

## 2. Run locally
```
cp .env.example .env     # paste your two values
npm install
npm run dev
```

## 3. Deploy to Vercel
1. Push this folder to a GitHub repo.
2. vercel.com → Add New Project → import the repo (Vite is auto-detected).
3. Add environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Deploy. Then in Supabase → Authentication → URL Configuration, set Site URL to your Vercel URL.

Currency: set to PKR. Edit `CUR` at the top of `src/Dashboard.jsx` to change it.
