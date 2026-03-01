# Serverless AI Technical Writer – Master Plan

Step-by-step implementation. We build **iteratively**; ask for each phase when ready.

---

## Architecture

| Layer        | Tech |
|-------------|------|
| Database    | AWS DynamoDB (BlogPosts, Subscribers) |
| Object storage | AWS S3 (images) |
| Frontend    | React (public blog + `/admin` dashboard) |
| Backend     | Node.js / Express (API) |
| AI Agent    | Python (CrewAI, Crawl4AI, Groq, boto3) |
| Automation  | GitHub Actions (daily cron) |
| Newsletter  | Resend API (on publish) |

**Constraints:** No long-running local scripts or local LLMs. AI runs in the cloud via GitHub Actions. LLM = Groq (Llama 3) only.

---

## Phase 1: AWS Vault ✅

- **Goal:** S3 bucket, DynamoDB tables, IAM user + keys.
- **Doc:** [PHASE1_AWS_SETUP.md](./PHASE1_AWS_SETUP.md)
- **You do:** Create resources in AWS Console, then copy `api/.env.example` → `api/.env` and fill in keys and table/bucket names.

---

## Phase 2: Node Backend (AWS API) ✅

- **Goal:** API that reads/writes DynamoDB and uses S3.
- **Done:**
  - `api/lib/aws.js` – DynamoDB + S3 clients
  - `api/lib/dynamodb-posts.js` – get published, get drafts, get by id, put, publish
  - `api/lib/dynamodb-subscribers.js` – subscribe, list (for Phase 6)
  - `api/lib/s3-upload.js` – upload image, return public URL
  - Routes:
    - **Public:** `GET /api/posts`, `GET /api/posts/:id`, `POST /api/subscribe`
    - **Admin:** `GET /api/drafts`, `POST /api/drafts`, `PUT /api/drafts/:id`, `PUT /api/publish/:id` (header: `x-admin-token`)
- **Guide:** [PHASE2_GUIDE.md](./PHASE2_GUIDE.md) – step-by-step run and test.
- **You do:** Complete Phase 1, create `.env`, run `node index.js`, then follow the guide to test each route.

---

## Phase 3: React Frontend ✅

- **Goal:** Public blog from `GET /api/posts`, newsletter form → `POST /api/subscribe`, hidden `/admin` with drafts and “Approve & Publish” → `PUT /api/publish/:id`.
- **We have:** Existing React app (home, post view, login/register). We’ll add a view that uses `/api/posts`, a newsletter component, and an admin page.

---

## Phase 4: Python AI Agent ✅

- **Goal:** CrewAI + Crawl4AI + Groq script that finds a repo, writes a Markdown tutorial + NewsletterHook, uploads images to S3, writes post to DynamoDB with `Status: "draft"`.
- **Image flow (admin + agent):**
  - **Admin (you):** Use URL or "Upload from device" → `POST /api/upload-image` (token) → image stored in S3 → URL saved in `CoverImageUrl`.
  - **AI agent:** Uses boto3 to upload images to the same S3 bucket → gets public URLs → embeds in Markdown content and `CoverImageUrl` → creates draft via `POST /api/drafts` with `x-admin-token`.

---

## Phase 5: GitHub Actions

- **Goal:** `.github/workflows/agent.yml` – daily run (e.g. 8 AM) that installs deps, runs the Python script, uses GitHub Secrets for AWS and Groq keys.

---

## Phase 6: Newsletter (Resend)

- **Goal:** On `PUT /api/publish/:id`, Node.js loads subscribers from DynamoDB and sends email via Resend with NewsletterHook + link to post.

---

When you’re ready, say **“Phase 3”** (or “Phase 4”, etc.) and we’ll implement that step.
