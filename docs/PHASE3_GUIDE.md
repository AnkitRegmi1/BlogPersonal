# Phase 3: React Frontend – Step-by-Step Guide

Phase 3 wires the React app to the new API (DynamoDB). Follow these steps to run and test.

---

## What’s Implemented

1. **Public blog** – Homepage fetches published posts from `GET /api/posts`
2. **Post detail** – Single post page fetches from `GET /api/posts/:id` and renders markdown
3. **Newsletter** – Email form on homepage that calls `POST /api/subscribe`
4. **Admin dashboard** – Hidden route `/admin` to view drafts and click "Approve & Publish"

---

## Step 1: Start the API server

```bash
cd api
node index.js
```

Keep this terminal open. You should see `Server is running on port 4000`.

---

## Step 2: Start the React app

In a **new terminal**:

```bash
cd client
npm start
```

The app opens at `http://localhost:3000` (or another port if 3000 is busy).

---

## Step 3: Test the public blog

1. Go to **http://localhost:3000/**
2. You should see:
   - Hero: "Insights & Updates"
   - **Latest posts** – Your published post from Phase 2 (or empty if none)
   - **Subscribe to the newsletter** – Email input form
3. Click a post to open the detail page – content should render as markdown.

---

## Step 4: Test the newsletter

1. Scroll to the newsletter section.
2. Enter an email and click **Subscribe**.
3. You should see "Subscribed successfully!".
4. Confirm in AWS DynamoDB → **Subscribers** table that the email was saved.

---

## Step 5: Test the admin dashboard

1. Open **http://localhost:3000/admin** (or click **Admin** in the footer).
2. Enter your **ADMIN_TOKEN** (from `api/.env`) in the token field.
3. Click **Load drafts**.
4. You should see your draft posts (if any from Phase 2 testing).
5. Click **Approve & Publish** on a draft – it should disappear from drafts and appear on the homepage.

---

## Quick Reference

| Page | URL | Purpose |
|------|-----|--------|
| Home | `/` | Published posts + newsletter form |
| Post | `/post/:id` | Single post (markdown) |
| Admin | `/admin` | Load drafts, publish |

**Admin token:** Same value as `ADMIN_TOKEN` in `api/.env`. Stored in session storage after first success.

---

## Troubleshooting

- **Empty posts on homepage:** Create and publish a draft via `/admin` or `POST /api/drafts` + `PUT /api/publish/:id`.
- **401 on Load drafts:** Check that the token matches `ADMIN_TOKEN` in `api/.env`.
- **CORS errors:** Ensure the API is running and allows `http://localhost:3000` (or your client URL).

Phase 3 complete. Next: **Phase 4** (Python AI agent).
