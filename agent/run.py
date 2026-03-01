"""
Phase 4 AI Agent – Runs in GitHub Actions (or Codespaces).
Creates a DRAFT post about AI agents & GitHub Codespaces. You review and publish from /admin.
"""
import os
import re
import uuid
import random
import requests
from datetime import datetime

from dotenv import load_dotenv
from crewai import Agent, Task, Crew, Process, LLM
import boto3

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_BUCKET = os.getenv("S3_BUCKET")
BLOG_POSTS_TABLE = os.getenv("BLOG_POSTS_TABLE", "BlogPosts")
UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")  # Optional; higher rate limit in Actions

# Fallback cover images by topic (used when Unsplash API key is not set)
# Each is a different Unsplash photo so we don't always show the same image.
FALLBACK_COVERS = {
    "ai": [
        "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
        "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80",
        "https://images.unsplash.com/photo-1676278134826-30732a7428b4?w=800&q=80",
    ],
    "codespaces": [
        "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&q=80",
        "https://images.unsplash.com/photo-1555066931-4365d18baba9?w=800&q=80",
    ],
    "github": [
        "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&q=80",
        "https://images.unsplash.com/photo-1555066931-4365d18baba9?w=800&q=80",
    ],
    "default": [
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80",
        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80",
    ],
}


def get_already_used_repos() -> set[str]:
    """
    Scan DynamoDB BlogPosts for existing posts and extract repo names from the
    Repository footer (e.g. **Repository:** [owner/repo](url)). Returns a set of
    lowercase 'owner/repo' strings so we can avoid writing about the same repo again.
    """
    if not all([BLOG_POSTS_TABLE, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY]):
        return set()
    used = set()
    try:
        dynamodb = boto3.resource(
            "dynamodb",
            region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        )
        table = dynamodb.Table(BLOG_POSTS_TABLE)
        response = table.scan(ProjectionExpression="Content")
        items = response.get("Items", [])
        while "LastEvaluatedKey" in response:
            response = table.scan(
                ProjectionExpression="Content",
                ExclusiveStartKey=response["LastEvaluatedKey"],
            )
            items.extend(response.get("Items", []))
        for item in items:
            content = item.get("Content") or ""
            # Parse **Repository:** [name](https://github.com/owner/repo)
            m = re.search(r"https://github\.com/([^)\s]+)", content)
            if m:
                used.add(m.group(1).lower())
    except Exception as e:
        print(f"Could not load existing repos from DB: {e}")
    return used


def find_ai_agent_repo(already_used: set[str] | None = None) -> tuple[str, str]:
    """
    Use GitHub API to find a legitimate AI-agent or Codespaces repo.
    Builds a larger pool from multiple queries, skips repos we've already used
    (from DynamoDB), then picks one and fetches its README.

    Returns (repo_full_name, readme_content).
    """
    already_used = already_used or set()
    tier1_queries = [
        "ai agent stars:>1000",
        "llm agent stars:>1000",
        "codespaces stars:>1000",
    ]
    tier2_queries = [
        "ai agent stars:100..999",
        "llm agent stars:100..999",
        "ai stars:100..999",
    ]
    headers = {"Accept": "application/vnd.github.v3+json"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"

    # Build a larger pool from all queries (more results per query)
    pool: list[str] = []
    seen = set()
    for q in tier1_queries + tier2_queries:
        try:
            r = requests.get(
                "https://api.github.com/search/repositories",
                params={"q": q, "sort": "stars", "per_page": 20},
                headers=headers,
                timeout=15,
            )
            r.raise_for_status()
            data = r.json()
            for repo in data.get("items", []):
                full_name = repo.get("full_name")
                if not full_name or full_name in seen:
                    continue
                seen.add(full_name)
                if full_name.lower() in already_used:
                    continue
                pool.append(full_name)
        except Exception as e:
            print(f"GitHub search '{q}' failed: {e}")
            continue

    # Shuffle and try each candidate until we get a valid README
    random.shuffle(pool)
    for full_name in pool:
        try:
            rr = requests.get(
                f"https://api.github.com/repos/{full_name}/readme",
                headers=headers,
                timeout=10,
            )
            if rr.status_code != 200:
                continue
            readme_json = rr.json()
            download_url = readme_json.get("download_url")
            if not download_url:
                continue
            content = requests.get(download_url, timeout=15).text
            return (full_name, content[:10000])
        except Exception as e:
            print(f"README fetch for {full_name} failed: {e}")
            continue

    # Hard fallback if pool was empty or all README fetches failed
    fallback_repo = "langchain-ai/langgraph"
    try:
        rr = requests.get(
            f"https://api.github.com/repos/{fallback_repo}/readme",
            headers=headers,
            timeout=10,
        )
        if rr.status_code == 200:
            download_url = rr.json().get("download_url")
            if download_url:
                content = requests.get(download_url, timeout=15).text
                return (fallback_repo, content[:10000])
    except Exception:
        pass
    return ("langchain-ai/langgraph", "[README content unavailable; write from general AI agent knowledge.]")


def get_cover_image_url(repo_name: str | None = None) -> str:
    """
    Return a repo-related cover image URL.

    Uses GitHub's Open Graph image for the repo. If the repo has no custom
    social preview/logo, GitHub still serves an auto-generated card (repo name,
    description). If that URL fails when we try to use it, the caller falls back
    to a default image.
    """
    if repo_name:
        # GitHub automatically serves a social preview image for each repo.
        # This keeps the cover tightly aligned with the actual project.
        return f"https://opengraph.githubassets.com/1/{repo_name}"

    # Fallback if for some reason we don't know the repo name.
    return random.choice(FALLBACK_COVERS["default"])


def upload_cover_to_s3(image_url: str) -> str:
    """Download image from URL and upload to S3. Returns public URL."""
    if not all([S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY]):
        return ""
    try:
        r = requests.get(image_url, timeout=10)
        r.raise_for_status()
        body = r.content
        ext = "jpg" if "jpeg" in r.headers.get("content-type", "") or "jpg" in image_url else "png"
        key = f"covers/{uuid.uuid4()}.{ext}"
        s3 = boto3.client(
            "s3",
            region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        )
        s3.put_object(
            Bucket=S3_BUCKET,
            Key=key,
            Body=body,
            ContentType=r.headers.get("content-type", "image/jpeg"),
        )
        return f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{key}"
    except Exception as e:
        print(f"S3 upload failed: {e}")
        return ""


def put_draft_to_dynamodb(
    title: str,
    summary: str,
    content: str,
    newsletter_hook: str,
    cover_url: str,
) -> str:
    """Write draft to DynamoDB. Returns PostId."""
    dynamodb = boto3.resource(
        "dynamodb",
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    )
    table = dynamodb.Table(BLOG_POSTS_TABLE)
    now = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    post_id = str(uuid.uuid4())
    table.put_item(
        Item={
            "PostId": post_id,
            "Title": title,
            "Summary": summary,
            "Content": content,
            "NewsletterHook": newsletter_hook,
            "CoverImageUrl": cover_url,
            "Status": "draft",
            "CreatedAt": now,
            "UpdatedAt": now,
        }
    )
    return post_id


def main():
    print("Phase 4 Agent – creating draft (AI agents / Codespaces)...")

    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not set. Add it as a GitHub Secret.")
    if not all([AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY]):
        raise ValueError("AWS credentials not set. Add as GitHub Secrets.")

    # Repos we've already written about (drafts + published) so we pick something new
    already_used = get_already_used_repos()
    if already_used:
        print(f"Skipping {len(already_used)} already-used repo(s): {sorted(already_used)[:5]}{'...' if len(already_used) > 5 else ''}")

    # 1. Find a legitimate AI-agent or Codespaces repo (not in already_used), fetch README
    repo_name, source = find_ai_agent_repo(already_used=already_used)
    print(f"Using repo: {repo_name}")

    # 2. CrewAI with Groq – focused on AI agents & Codespaces
    llm = LLM(
        model="groq/llama-3.1-8b-instant",
        api_key=GROQ_API_KEY,
        temperature=0.5,
    )

    researcher = Agent(
        role="AI & DevTools Researcher",
        goal="Extract how to run the project, key features, and why it matters for developers",
        backstory="You specialize in AI agents, LLMs, and GitHub Codespaces. You identify setup steps, benefits, and how readers can stay up to date with high-quality repos.",
        llm=llm,
        verbose=True,
    )

    writer = Agent(
        role="Technical Blog Writer",
        goal="Write clear step-by-step tutorials and explain benefits so readers stay up to date with legitimate AI agent projects",
        backstory="You write for developers who want to run AI agents and use Codespaces. You always include numbered steps, benefits, and links to the repo.",
        llm=llm,
        verbose=True,
    )

    research_task = Task(
        description=f"""Analyze this repository README and content. Repository: {repo_name}.

Content (excerpt):
{source[:5000]}

Extract:
1. What this project does (AI agent / Codespaces / dev tool).
2. Step-by-step how to run it (install, config, run commands).
3. Main benefits for developers.
4. Why it's legitimate (e.g. stars, maintainers, use cases).
Output: a structured list with these four sections.""",
        expected_output="Structured list: what it does, step-by-step how to run, benefits, why it's legitimate.",
        agent=researcher,
    )

    repo_url = f"https://github.com/{repo_name}"

    write_task = Task(
        description=f"""Using the research, write a single Markdown blog post (4–6 short sections) that:

- **Focus**: AI agents and/or GitHub Codespaces. Teach the reader how to run this repo and why it matters.
- **Structure**: Start with a short intro, then "What is [repo]?", "How to run it (step-by-step)", "Benefits", and "How to stay up to date" (e.g. watch the repo, filter by 1k+ stars for AI agents).
- **Tone**: Beginner-friendly, practical. Use **bold** and `code` for commands and key terms.
- **Do not** use long code blocks; use inline `code` or one-line snippets. Keep steps numbered and clear.
- **Repository link**: Use this exact URL for the repo: {repo_url}. Do not invent or change the URL. You may mention the repo as [{repo_name}]({repo_url}) in the post.
- Mention the repo name ({repo_name}) and that it has substantial stars/community so readers know it's legitimate.""",
        expected_output="A complete Markdown blog post with ## headings, step-by-step instructions, and benefits. No long code fences.",
        agent=writer,
        context=[research_task],
    )

    crew = Crew(
        agents=[researcher, writer],
        tasks=[research_task, write_task],
        process=Process.sequential,
        verbose=True,
    )

    result = crew.kickoff()
    content = str(result).strip()

    # Ensure the correct repo URL is always in the post (LLM might omit or wrong it)
    repo_url = f"https://github.com/{repo_name}"
    repo_footer = f"\n\n---\n**Repository:** [{repo_name}]({repo_url})"
    if repo_footer.strip() not in content and repo_url not in content:
        content = content + repo_footer

    # 3. Extract title and summary
    lines = content.split("\n")
    project = repo_name.split("/")[-1] if "/" in repo_name else repo_name
    # Vary the default title so posts don't all start with "Getting Started"
    title_templates = [
        "Getting Started with {project}",
        "How to Run {project}: A Quick Guide",
        "{project}: What It Does and How to Use It",
        "Why {project} Matters for AI Agents",
        "Building with {project}: Step-by-Step",
    ]
    title = random.choice(title_templates).format(project=project)
    for line in lines:
        if line.startswith("# "):
            heading = line.lstrip("# ").strip()
            if project.lower() in heading.lower():
                title = heading
            break
    summary = content[:150].replace("\n", " ").strip() + "..." if len(content) > 150 else content[:100]
    newsletter_hook = f"New post: {title}. Check it out!"

    # 4. Repo-specific cover image (GitHub Open Graph card for the repo)
    cover_image_url = get_cover_image_url(repo_name=repo_name)
    if not cover_image_url:
        cover_image_url = random.choice(FALLBACK_COVERS["default"])
    cover_url = upload_cover_to_s3(cover_image_url)
    if not cover_url:
        # Repo may have no social preview or URL failed; use a known-good fallback image
        fallback_url = random.choice(FALLBACK_COVERS["default"])
        cover_url = upload_cover_to_s3(fallback_url)
        if not cover_url:
            cover_url = fallback_url

    # 5. Save draft to DynamoDB
    post_id = put_draft_to_dynamodb(
        title=title,
        summary=summary,
        content=content,
        newsletter_hook=newsletter_hook,
        cover_url=cover_url,
    )

    print(f"Done! Draft PostId: {post_id}")
    print("Go to your blog /admin, load drafts, review, and click Approve & Publish.")


if __name__ == "__main__":
    main()
