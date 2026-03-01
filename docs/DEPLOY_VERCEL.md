# Deploy TecBlog AI to Vercel (step-by-step)

Your **data** stays on AWS (DynamoDB + S3). The **API** and **frontend** run on Vercel. The daily AI agent (GitHub Actions) keeps writing drafts into the same DynamoDB, so nothing changes for the agent.

---

## What you need before starting

- GitHub repo with your code (already pushed).
- AWS already set up: DynamoDB tables (`BlogPosts`, `Subscribers`), S3 bucket, IAM user keys (from Phase 1).
- Your `api/.env` values at hand (do **not** commit `.env`):  
  `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET`, `BLOG_POSTS_TABLE`, `SUBSCRIBERS_TABLE`, `ADMIN_TOKEN`.

---

## Step 1: Deploy the API to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub is easiest).
2. Click **Add New…** → **Project**.
3. Import your GitHub repository (e.g. `BlogPersonal`).
4. **Important:** Before deploying, set the **Root Directory**:
   - Click **Edit** next to the project name.
   - Set **Root Directory** to `api` and confirm (so only the `api` folder is built).
5. **Framework Preset:** leave as "Other" or "None".
6. **Environment variables:** Add every variable your API needs (same names as in `api/.env`):

   | Name | Value |
   |------|--------|
   | `AWS_ACCESS_KEY_ID` | (from your IAM user) |
   | `AWS_SECRET_ACCESS_KEY` | (from your IAM user) |
   | `AWS_REGION` | e.g. `us-east-1` |
   | `S3_BUCKET` | Your S3 bucket name |
   | `BLOG_POSTS_TABLE` | `BlogPosts` |
   | `SUBSCRIBERS_TABLE` | `Subscribers` |
   | `ADMIN_TOKEN` | Same long secret you use in Admin |

   Do **not** commit these; only add them in Vercel’s dashboard.
7. Click **Deploy**. Wait for the build to finish.
8. After deploy, open your **API URL** (e.g. `https://blog-personal-api-xxx.vercel.app`). You should see a 404 JSON response for `/` (that’s normal). Test a real route:  
   `https://your-api-url.vercel.app/api/posts`  
   You should get `[]` or your posts. **Copy this base URL** (no trailing slash) for the next step.

---

## Step 2: Deploy the frontend (client) to Vercel

1. In Vercel, click **Add New…** → **Project** again.
2. Import the **same** GitHub repository.
3. This time set **Root Directory** to `client` (so Vercel builds the React app).
4. **Framework Preset:** Vercel should detect **Create React App** (or React). Leave as is.
5. **Environment variables:** Add one variable:

   | Name | Value |
   |------|--------|
   | `REACT_APP_API_URL` | Your API URL from Step 1 (e.g. `https://blog-personal-api-xxx.vercel.app`) — **no trailing slash** |

6. Click **Deploy**. When it’s done, Vercel gives you a URL like `https://blog-personal-xxx.vercel.app`.
7. Open that URL: you should see TecBlog AI. Click a post, open Admin, and check that drafts/posts load (they come from your API on Vercel, which reads DynamoDB).

---

## Step 3: (Optional) Use a custom domain

- In the **frontend** project: **Settings** → **Domains** → add your domain and follow the DNS instructions.
- If you want a separate domain for the API (e.g. `api.yourblog.com`), add it in the **API** project’s Domains. Then set `REACT_APP_API_URL` in the frontend project to that API domain and redeploy.

---

## Step 4: GitHub Actions (AI agent) – no change needed

The agent runs in GitHub Actions and writes **directly to DynamoDB** (using AWS credentials in GitHub Secrets). It does **not** call your API. So:

- You do **not** need to set an API URL in the agent or in GitHub Secrets for the blog URL.
- Keep your existing GitHub Secrets: `GROQ_API_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET`, `BLOG_POSTS_TABLE`, etc.
- The same DynamoDB table is used by both the Vercel API and the agent. New drafts from the agent will show up in **Admin** on your Vercel-hosted site.

---

## Summary

| What | Where |
|------|--------|
| Database & files | AWS (DynamoDB + S3) – unchanged |
| API (Node/Express) | Vercel (serverless), root = `api` |
| Frontend (React) | Vercel, root = `client`, env: `REACT_APP_API_URL` = API URL |
| AI agent | GitHub Actions → DynamoDB (no config change) |

After Step 1 and 2, the site is live: frontend on Vercel, API on Vercel, data on AWS.

---

## Troubleshooting: "Backend data not showing" on the client

**Cause:** The frontend is still using the default API URL (`http://localhost:4000`) because `REACT_APP_API_URL` was not set or not applied when the client was built.

**Fix:**

1. **Check the API**  
   Open `https://YOUR-API-PROJECT-URL.vercel.app/api/posts` in your browser.  
   - You should see JSON (`[]` or a list of posts).  
   - If you see an error or 500: in the **API** project go to **Settings → Environment Variables** and ensure all AWS variables and `BLOG_POSTS_TABLE` are set, then **Redeploy** the API.

2. **Set the API URL on the client**  
   - Open your **frontend (client)** project on Vercel → **Settings → Environment Variables**.  
   - Add: **Name** `REACT_APP_API_URL`, **Value** `https://YOUR-API-PROJECT-URL.vercel.app` (your real API URL, **no trailing slash**).  
   - Apply to **Production** (and **Preview** if you use preview deployments). Save.

3. **Redeploy the client**  
   Create React App bakes env vars at **build time**. Adding or changing `REACT_APP_API_URL` only takes effect after a new build.  
   - **Deployments** → open the **⋮** menu on the latest deployment → **Redeploy** (or push a new commit).  
   - After the new deployment finishes, open the site again; posts should load from your API.

4. **Confirm in the browser**  
   On the live site, open DevTools → **Network** tab, refresh, and find the request to `api/posts`. The **Request URL** should be your Vercel API domain, not `localhost`. If it still shows localhost, the client was built without `REACT_APP_API_URL` — fix the env var and redeploy again.
