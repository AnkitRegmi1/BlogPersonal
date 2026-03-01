# Phase 4: AI Agent – No Laptop Setup

**Everything runs in GitHub Actions.** You never install Python or run the agent on your laptop. You only add secrets and push.

The agent **focuses on AI agents and GitHub Codespaces**: it finds legitimate GitHub repos (1k+ stars) about AI agents or Codespaces, fetches their README, and writes a draft that teaches readers **step-by-step how to run** the project, **benefits**, and how to **stay up to date** with high-quality AI agent repos. Cover images are **topic-appropriate** (e.g. AI vs Codespaces) via Unsplash search or curated fallbacks.

---

## Human-in-the-Loop

| Step | Who | What |
|------|-----|------|
| 1 | **AI Agent** (GitHub) | Creates a **draft** → saves to DynamoDB |
| 2 | **You** | Open `/admin` → read draft → edit if needed |
| 3 | **You** | Click **Approve & Publish** when ready |

The agent never publishes. You always approve first.

---

## What You Need to Bring (GitHub Secrets)

Add these in your repo: **Settings → Secrets and variables → Actions → New repository secret**.

| Secret Name | Where to get it | Example |
|-------------|-----------------|---------|
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) → API Keys | `gsk_...` |
| `AWS_ACCESS_KEY_ID` | Same as `api/.env` (Phase 1) | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | Same as `api/.env` (Phase 1) | `...` |
| `AWS_REGION` | Your AWS region | `us-east-1` |
| `S3_BUCKET` | Your S3 bucket name | `my-tech-blog-assets-2026` |
| `BLOG_POSTS_TABLE` | DynamoDB table name | `BlogPosts` |
| `UNSPLASH_ACCESS_KEY` | Optional. [unsplash.com/developers](https://unsplash.com/developers) → New Application → Access Key | For topic-matched cover images; if omitted, the agent uses curated fallback images by topic (AI / Codespaces / default). |
| `GITHUB_TOKEN` | Optional. In Actions it's automatic. | For higher GitHub API rate limit when searching repos; not required. |

That’s it. No other setup on your machine.

---

## What Was Created (Already in Your Repo)

```
BlogPersonal-master/
├── agent/
│   ├── requirements.txt   ← Python deps
│   ├── .env.example       ← Template (for reference only)
│   └── run.py             ← Agent script
└── .github/workflows/
    └── agent.yml          ← Runs the agent on schedule
```

---

## How It Works

1. **You push** the repo to GitHub.
2. **GitHub Actions** runs daily (or when you click “Run workflow”):
   - Checks out your code
   - Installs Python and packages in a cloud VM
   - Runs `agent/run.py` with your secrets
   - Agent **searches GitHub** for AI-agent or Codespaces repos (≥1k stars), fetches a README
   - **CrewAI** writes a draft: step-by-step how to run, benefits, staying up to date with legitimate repos
   - Picks a **topic-appropriate cover image** (Unsplash search or fallback by keyword)
   - Uploads cover to S3 → saves **draft** to DynamoDB
3. **You** open your blog → `/admin` → load drafts → see the new draft → review → Approve & Publish.

---

## Optional: Run Once Manually

1. In your repo: **Actions** tab.
2. Select **AI Blog Agent**.
3. Click **Run workflow** → **Run workflow**.
4. After it finishes, check `/admin` for the new draft.

---

## Summary

- **You do:** Add 6 required GitHub Secrets (optionally add `UNSPLASH_ACCESS_KEY` for better cover images).
- **GitHub does:** Runs the agent on schedule (or manually). Agent finds AI-agent/Codespaces repos (1k+ stars), writes step-by-step + benefits, picks a topic-appropriate cover.
- **You do:** Review drafts in `/admin`, publish when ready.
- **No Python on your laptop.** No `pip install`. Everything runs in GitHub.
