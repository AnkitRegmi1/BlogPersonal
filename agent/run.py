"""
Phase 4 AI Agent – Runs in GitHub Actions (or Codespaces).
Creates a DRAFT post about AI agents & GitHub Codespaces. You review and publish from /admin.
"""
import os
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


def find_ai_agent_repo() -> tuple[str, str]:
    """
    Use GitHub API to find a legitimate AI-agent or Codespaces repo.
    Preference order:
    1) Repos with >= 1000 stars.
    2) If none found, repos with 100–999 stars (still AI / agent / AI-related).

    Returns (repo_full_name, readme_content).
    """
    tier1_queries = [
        "ai agent stars:>1000",
        "llm agent stars:>1000",
        "codespaces stars:>1000",
    ]
    # Second tier: slightly smaller but still legitimate AI / agent repos
    tier2_queries = [
        "ai agent stars:100..999",
        "llm agent stars:100..999",
        "ai stars:100..999",
    ]
    headers = {"Accept": "application/vnd.github.v3+json"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"

    for q in tier1_queries + tier2_queries:
        try:
            r = requests.get(
                "https://api.github.com/search/repositories",
                params={"q": q, "sort": "stars", "per_page": 5},
                headers=headers,
                timeout=15,
            )
            r.raise_for_status()
            data = r.json()
            items = data.get("items", [])
            if not items:
                continue
            repo = items[0]
            full_name = repo["full_name"]
            # Fetch README
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
            print(f"GitHub search '{q}' failed: {e}")
            continue

    # Hard fallback: a well-known AI agent repo
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


def get_cover_image_url(title: str, repo_name: str | None = None) -> str:
    """
    Return a topic-appropriate cover image URL.
    Uses repo_name (e.g. langchain-ai/langgraph → LangGraph) so the image matches the post topic,
    not generic "technology programming". If UNSPLASH_ACCESS_KEY is set, search Unsplash; else use fallbacks.
    """
    # Prefer repo name for topic (e.g. "langchain-ai/langgraph" → "LangGraph", "owner/langflow" → "LangFlow")
    topic_lower = (title or "").lower()
    if repo_name:
        project = repo_name.split("/")[-1]  # e.g. langgraph, langflow
        topic_lower = f"{topic_lower} {project}".strip()

    if UNSPLASH_ACCESS_KEY:
        # Build search query from actual project/topic so we get AI/agent images, not code-debug
        if any(w in topic_lower for w in ["codespace", "codespaces", "github"]):
            query = "GitHub Codespaces cloud development"
        elif any(w in topic_lower for w in ["ai", "agent", "llm", "langchain", "langgraph", "langflow", "openai"]):
            query = "artificial intelligence AI robot neural"
        else:
            query = "artificial intelligence technology"
        try:
            r = requests.get(
                "https://api.unsplash.com/search/photos",
                params={"query": query, "per_page": 5, "orientation": "landscape"},
                headers={"Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"},
                timeout=10,
            )
            r.raise_for_status()
            data = r.json()
            results = data.get("results", [])
            if results:
                return results[0].get("urls", {}).get("regular") or results[0].get("urls", {}).get("small") or ""
        except Exception as e:
            print(f"Unsplash search failed: {e}")

    # Fallback: use repo name so AI-agent repos get AI images, not generic coding/debug
    if any(w in topic_lower for w in ["ai", "agent", "llm", "langchain", "langgraph", "langflow", "openai"]):
        return random.choice(FALLBACK_COVERS["ai"])
    if any(w in topic_lower for w in ["codespace", "codespaces"]):
        return random.choice(FALLBACK_COVERS["codespaces"])
    if "github" in topic_lower:
        return random.choice(FALLBACK_COVERS["github"])
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

    # 1. Find a legitimate AI-agent or Codespaces repo (1k+ stars) and fetch README
    repo_name, source = find_ai_agent_repo()
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
    title = "AI Agents & Codespaces: Getting Started"
    for line in lines:
        if line.startswith("# "):
            title = line.lstrip("# ").strip()
            break
    summary = content[:150].replace("\n", " ").strip() + "..." if len(content) > 150 else content[:100]
    newsletter_hook = f"New post: {title}. Check it out!"

    # 4. Topic-appropriate cover image (use repo name so e.g. LangGraph/LangFlow → AI image, not code-debug)
    cover_image_url = get_cover_image_url(title, repo_name=repo_name)
    if not cover_image_url:
        cover_image_url = random.choice(FALLBACK_COVERS["default"])
    cover_url = upload_cover_to_s3(cover_image_url)
    if not cover_url:
        cover_url = cover_image_url

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
