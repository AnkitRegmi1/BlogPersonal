# Phase 2: Step-by-Step Guide (Node Backend + AWS)

You’ve finished Phase 1 (S3, DynamoDB, IAM, `.env`). Follow these steps to run and test Phase 2.

---

## Step 1: Check your `.env` file

In the **`api`** folder, open `.env` and confirm you have (values filled from Phase 1):

```env
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-2
S3_BUCKET=my-tech-blog-assests-2026
BLOG_POSTS_TABLE=BlogPosts
SUBSCRIBERS_TABLE=Subscribers
ADMIN_TOKEN=your-long-random-secret-here
```

- **AWS_REGION** must match the region where you created the bucket and tables (e.g. `us-east-2` for Ohio).
- **S3_BUCKET** must match your bucket name exactly.
- **ADMIN_TOKEN** can be any long random string (e.g. `mySecretAdminKey123!`); you’ll use it to call admin routes.

Save the file and close it (never commit `.env` to git).

---

## Step 2: Start the API server

1. Open a terminal.
2. Go to the API folder:
   ```bash
   cd path/to/BlogPersonal-master/api
   ```
3. Start the server:
   ```bash
   node index.js
   ```
4. You should see:
   - `MongoDB connected` (if MongoDB is running) or a MongoDB error (you can ignore it for Phase 2).
   - `Server is running on port 4000`.

Leave this terminal open. The `/api/*` routes work even if MongoDB is not running.

---

## Resources for testing (Step 3–7)

Pick **one** of these ways to send requests:

| Tool | Best for | Link / How to get it |
|------|----------|----------------------|
| **Browser** | GET only (Steps 3a, 7). Cannot do POST/PUT with a body. | Just open Chrome/Edge/Firefox and paste the URL in the address bar. |
| **Postman** | All steps (GET, POST, PUT) with a simple UI. | [Download Postman](https://www.postman.com/downloads/) (free). Or use the [Postman web app](https://web.postman.co/). |
| **curl** | All steps from the terminal (copy-paste commands). | Already on Mac/Linux. On Windows 10/11: use **PowerShell** or install [curl for Windows](https://curl.se/windows/). |

---

## Step 3: Test the public routes

### 3a. Get published posts

**What you're checking:** The API returns a list of published posts (empty at first).

- **URL:** `http://localhost:4000/api/posts`
- **Method:** GET
- **Expected:** `[]` (empty array) until you have published posts.

**How to do it:**

- **Browser:** Open a new tab and go to: `http://localhost:4000/api/posts` — You should see `[]` on the page.
- **Postman:** 1) Click **New** → **HTTP Request**. 2) Method: **GET**. 3) URL: `http://localhost:4000/api/posts`. 4) Click **Send**. 5) Body should show `[]`.
- **curl:** Run `curl http://localhost:4000/api/posts` — Expected: `[]`

---

### 3b. Subscribe (newsletter)

**What you're checking:** The API saves an email to DynamoDB (Subscribers table).

- **URL:** `http://localhost:4000/api/subscribe`
- **Method:** POST
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):** `{ "email": "you@example.com" }`
- **Expected:** `{ "ok": true, "message": "Subscribed successfully" }`

**How to do it:**

- **Browser:** Cannot send POST with JSON body from the address bar — use **Postman** or **curl**.
- **Postman:** 1) **New** request. 2) Method **POST**, URL `http://localhost:4000/api/subscribe`. 3) **Headers:** add `Content-Type` = `application/json`. 4) **Body** → **raw** → **JSON**, paste: `{ "email": "you@example.com" }`. 5) **Send**. Expect status 200 and the success message.
- **curl (PowerShell):** `curl -X POST http://localhost:4000/api/subscribe -H "Content-Type: application/json" -d "{\"email\": \"you@example.com\"}"`
- **curl (Mac/Linux/Git Bash):** `curl -X POST http://localhost:4000/api/subscribe -H "Content-Type: application/json" -d '{"email": "you@example.com"}'`

**Verify in AWS:** [AWS Console](https://console.aws.amazon.com/) → **DynamoDB** → **Tables** → **Subscribers** → **Explore table items**. You should see one item with `Email` = `you@example.com`.

---

## Step 4: Create a draft post (admin)

**What you're checking:** The API creates a draft when you send the admin token.

- **URL:** `http://localhost:4000/api/drafts`
- **Method:** POST
- **Headers:** `Content-Type: application/json` and `x-admin-token: YOUR_ADMIN_TOKEN` (use the **exact** value from `api/.env`)
- **Body (raw JSON):**
  ```json
  {
    "Title": "My first draft",
    "Summary": "This is a test draft from Phase 2.",
    "Content": "## Hello\n\nThis is **markdown** content.",
    "NewsletterHook": "We wrote a new post. Check it out!"
  }
  ```
- **Expected:** Status **201**, response body with `PostId`, `Status: "draft"`. **Copy the `PostId`** for Step 6.

**How to do it:**

- **Postman:** 1) **New** request. 2) Method **POST**, URL `http://localhost:4000/api/drafts`. 3) **Headers:** `Content-Type` = `application/json`, `x-admin-token` = (paste your real `ADMIN_TOKEN` from `.env`). 4) **Body** → **raw** → **JSON**, paste the body above. 5) **Send**. Copy `PostId` from the response.
- **curl (PowerShell)** — replace `YOUR_ADMIN_TOKEN`:  
  `curl -X POST http://localhost:4000/api/drafts -H "Content-Type: application/json" -H "x-admin-token: YOUR_ADMIN_TOKEN" -d "{\"Title\": \"My first draft\", \"Summary\": \"This is a test draft from Phase 2.\", \"Content\": \"## Hello\", \"NewsletterHook\": \"We wrote a new post. Check it out!\"}"`
- **curl (Mac/Linux/Git Bash)** — replace `YOUR_ADMIN_TOKEN`:  
  `curl -X POST http://localhost:4000/api/drafts -H "Content-Type: application/json" -H "x-admin-token: YOUR_ADMIN_TOKEN" -d '{"Title":"My first draft","Summary":"This is a test draft from Phase 2.","Content":"## Hello","NewsletterHook":"We wrote a new post. Check it out!"}'`

---

## Step 5: Get drafts (admin)

- **URL:** `http://localhost:4000/api/drafts`
- **Method:** GET
- **Headers:** `x-admin-token: YOUR_ADMIN_TOKEN`
- **Expected:** Array with one item (your draft). **401** = wrong token.

**Postman:** GET `http://localhost:4000/api/drafts`, add header `x-admin-token`, **Send**.  
**curl:** `curl -H "x-admin-token: YOUR_ADMIN_TOKEN" http://localhost:4000/api/drafts`

---

## Step 6: Publish the draft (admin)

- **URL:** `http://localhost:4000/api/publish/PASTE_POST_ID_HERE` — Replace with the `PostId` from Step 4.
- **Method:** PUT
- **Headers:** `x-admin-token: YOUR_ADMIN_TOKEN`
- **Expected:** Post object with `Status: "published"`.

**Postman:** Method **PUT**, URL `http://localhost:4000/api/publish/` + your PostId, header `x-admin-token`, **Send**.  
**curl:** `curl -X PUT -H "x-admin-token: YOUR_ADMIN_TOKEN" http://localhost:4000/api/publish/YOUR_POST_ID`

---

## Step 7: Confirm it's public

- **URL:** `http://localhost:4000/api/posts`
- **Method:** GET
- **Expected:** Array with **one** post (the one you published).

**Browser:** Open `http://localhost:4000/api/posts`. **Postman:** GET same URL, **Send**. **curl:** `curl http://localhost:4000/api/posts`

**Verify in AWS:** DynamoDB → **BlogPosts** → **Explore table items** — one item with `Status` = `published`.

---

## Step 3: Test the public routes

Use a browser, Postman, or curl.

### 3a. Get published posts

- **URL:** `http://localhost:4000/api/posts`
- **Method:** GET  
- **Expected:** `[]` (empty array) until you have published posts.

### 3b. Subscribe (newsletter)

- **URL:** `http://localhost:4000/api/subscribe`
- **Method:** POST  
- **Headers:** `Content-Type: application/json`  
- **Body (raw JSON):**
  ```json
  { "email": "you@example.com" }
  ```
- **Expected:** `{ "ok": true, "message": "Subscribed successfully" }`.

Check in AWS DynamoDB → **Subscribers** table: you should see one item with `Email` = `you@example.com`.

---

## Step 4: Create a draft post (admin)

So you can test drafts and publish without the Python agent:

- **URL:** `http://localhost:4000/api/drafts`
- **Method:** POST  
- **Headers:**
  - `Content-Type: application/json`
  - `x-admin-token: your-long-random-secret-here` (same value as `ADMIN_TOKEN` in `.env`)
- **Body (raw JSON):**
  ```json
  {
    "Title": "My first draft",
    "Summary": "This is a test draft from Phase 2.",
    "Content": "## Hello\n\nThis is **markdown** content.",
    "NewsletterHook": "We wrote a new post. Check it out!"
  }
  ```
- **Expected:** Response with the created post (including `PostId`, `Status: "draft"`).

Copy the **`PostId`** from the response (e.g. `a1b2c3d4-...`). You’ll use it in Step 5.

---

## Step 5: Get drafts (admin)

- **URL:** `http://localhost:4000/api/drafts`
- **Method:** GET  
- **Headers:** `x-admin-token: your-long-random-secret-here`  
- **Expected:** Array with one item (your draft). If you get `401 Unauthorized`, the token doesn’t match `ADMIN_TOKEN` in `.env`.

---

## Step 6: Publish the draft (admin)

- **URL:** `http://localhost:4000/api/publish/PASTE_POST_ID_HERE`  
  Replace `PASTE_POST_ID_HERE` with the `PostId` from Step 4 (e.g. `a1b2c3d4-e5f6-7890-abcd-ef1234567890`).
- **Method:** PUT  
- **Headers:** `x-admin-token: your-long-random-secret-here`  
- **Expected:** Response with the post object and `Status: "published"`.

---

## Step 7: Confirm it’s public

- **URL:** `http://localhost:4000/api/posts`
- **Method:** GET  
- **Expected:** Array with one post (the one you just published).

---

## Quick reference: Phase 2 API routes

| Route | Method | Auth | Purpose |
|-------|--------|------|--------|
| `/api/posts` | GET | — | List **published** posts |
| `/api/posts/:id` | GET | — | Get one post by PostId |
| `/api/subscribe` | POST | — | Add email to Subscribers (body: `{ "email": "..." }`) |
| `/api/drafts` | GET | Admin token | List **draft** posts |
| `/api/drafts` | POST | Admin token | Create a draft (body: Title, Summary, Content, NewsletterHook?) |
| `/api/publish/:id` | PUT | Admin token | Set post status to **published** |

**Admin token:** send header `x-admin-token: YOUR_ADMIN_TOKEN` or `Authorization: Bearer YOUR_ADMIN_TOKEN`.

---

## Troubleshooting

- **401 on /api/drafts or /api/publish:** Check that the `x-admin-token` (or Bearer token) value exactly matches `ADMIN_TOKEN` in `api/.env`.
- **500 or “Cannot find module”:** Run `npm install` in the `api` folder.
- **500 on /api/posts or /api/subscribe:** Check `.env`: correct `AWS_REGION`, table names, and IAM keys. Ensure the IAM user has DynamoDB (and S3 if you use uploads) permissions.
- **Empty /api/posts:** Normal until you publish at least one post (Step 6).

When this all works, Phase 2 is complete. Next is **Phase 3** (React: public blog, newsletter form, `/admin` dashboard).
