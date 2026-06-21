# Growth Sphere

Discover government jobs, scholarships & schemes — now with real authentication.

## What changed from the original

The original `login.html` had two real bugs:

1. **No password field on registration at all.** The form only asked for name, DOB, and an "email or contact" field, plus a fake captcha. There was nothing to log in *with*.
2. **Email validation accepted anything.** The field was `type="text"` with no format check, so `+1 234 567` or `asdf` passed as a valid "email or contact."

Both forms also just called `alert()` and redirected to `home.html` — there was no server, no database, and `home.html` itself had no login check, so anyone could open it directly.

This version adds a real Node + Express backend, a Postgres database (Supabase), and:
- A genuine `password` + `confirm password` field on registration
- Server-side **and** client-side email/password validation
- Passwords hashed with bcrypt — never stored in plaintext
- JWT-based sessions stored in an httpOnly cookie
- `home.html` now checks `/api/auth/me` on load and redirects to `login.html` if there's no valid session
- A working logout button

## Project structure

```
api/
  index.js       — Express app (entry point for Vercel's serverless function)
  auth.js        — /api/auth/register, /login, /me, /logout routes
db/
  pool.js        — Postgres connection pool (Supabase)
  schema.sql     — run this once in Supabase to create the users table
middleware/
  auth.js        — JWT verification middleware (requireAuth)
utils/
  validators.js  — real email/password/name/dob validation
public/
  index.html     — splash screen
  login.html     — register + login (now calls the real API)
  home.html      — dashboard, now auth-protected
server.js        — local dev server only (Vercel doesn't use this)
vercel.json      — routes /api/* into api/index.js
```

## 1. Create a free Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up (free tier is enough).
2. Click **New Project**. Pick any name/region, and set a database password — **save it somewhere**, you'll need it for the connection string.
3. Wait ~2 minutes for the project to finish provisioning.
4. Open the **SQL Editor** (left sidebar) → **New query**, paste in the contents of `db/schema.sql`, and run it. This creates the `users` table.
5. Go to **Project Settings → Database → Connection string**. Choose the **Connection pooling** tab (not "Direct connection") and copy the URI — it looks like:
   ```
   postgresql://postgres.xxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-xx-xxxx-1.pooler.supabase.com:6543/postgres
   ```
   Replace `[YOUR-PASSWORD]` with the database password from step 2.

   **Use the pooled connection (port 6543), not the direct one (port 5432).** Vercel runs your API as serverless functions, which open many short-lived connections — the direct connection limit (Supabase free tier caps it low) gets exhausted almost immediately. The pooler is built for exactly this.

## 2. Set up environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in:
- `DATABASE_URL` — the pooled connection string from above
- `JWT_SECRET` — generate one with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```

## 3. Run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`. The splash page checks for a session, sends you to `login.html`, and after registering/logging in you land on `home.html`.

## 4. Deploy to Vercel (free)

1. Push this project to a GitHub repo.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
3. Vercel auto-detects the Node setup. Before deploying, add the environment variables under **Settings → Environment Variables**:
   - `DATABASE_URL` (the same pooled Supabase string)
   - `JWT_SECRET`
   - `NODE_ENV` = `production`
4. Deploy. Vercel will serve `public/` as static files and run `api/index.js` as a serverless function for everything under `/api/*`.

No further config needed — `vercel.json` already routes `/api/*` correctly, and the frontend calls `/api/auth/...` using relative paths, so it works on whatever domain Vercel gives you.

## API reference

| Method | Route | Body | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | `{ fullName, email, password, dob }` | Creates account, sets session cookie |
| POST | `/api/auth/login` | `{ email, password }` | Verifies credentials, sets session cookie |
| GET | `/api/auth/me` | — | Returns current user if session is valid, else 401 |
| POST | `/api/auth/logout` | — | Clears session cookie |

## Password policy

Minimum 8 characters, must include at least one letter and one number. Change the rule in `utils/validators.js` (`isValidPassword`) if you want something stricter.

## Notes on the captcha / "I am not a robot" checkbox

These were removed from the register form since they were cosmetic only (the code just compared two strings client-side — trivially bypassable, and not in the request flow that mattered). If you want real bot protection later, the standard free option is [Google reCAPTCHA v3](https://www.google.com/recaptcha/about/) or [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) — both verify server-side, which the old captcha never did.
