"""
Phase 4 AI Agent – Runs in GitHub Actions (or Codespaces).
Creates a DRAFT post. You review and publish from /admin.
"""
import os
import uuid
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

# GitHub repo to fetch README from (configurable)
DEFAULT_REPO = "https://raw.githubusercontent.com/facebook/react/main/README.md"


def fetch_github_readme(url: str) -> str:
    """Fetch raw content from a GitHub README or similar URL."""
    try:
        r = requests.get(url, timeout=30)
        r.raise_for_status()
        return r.text[:8000]  # Limit size for LLM context
    except Exception as e:
        return f"[Could not fetch: {e}]"


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
    print("Phase 4 Agent – creating draft (you will review in /admin)...")

    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not set. Add it as a GitHub Secret.")
    if not all([AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY]):
        raise ValueError("AWS credentials not set. Add as GitHub Secrets.")

    # 1. Fetch source content
    source = fetch_github_readme(DEFAULT_REPO)

    # 2. CrewAI with Groq
    llm = LLM(
        model="groq/llama-3.1-8b-instant",
        api_key=GROQ_API_KEY,
        temperature=0.5,
    )

    researcher = Agent(
        role="Technical Researcher",
        goal="Find key points and structure from technical content",
        backstory="You analyze READMEs and docs to extract the most useful information.",
        llm=llm,
        verbose=True,
    )

    writer = Agent(
        role="Technical Blog Writer",
        goal="Write clear, engaging Markdown tutorials",
        backstory="You turn technical content into readable blog posts with headings and examples.",
        llm=llm,
        verbose=True,
    )

    research_task = Task(
        description=f"Analyze this content and list the 5 most important points:\n\n{source[:3000]}",
        expected_output="A numbered list of 5 key points.",
        agent=researcher,
    )

    write_task = Task(
        description="""Using the research, write a 4-paragraph Markdown blog post.
Include: a ## subheading, short intro, main points, and conclusion.
Write for developers. Use **bold** and `code` where helpful.""",
        expected_output="A complete Markdown blog post (no code fences).",
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

    # 3. Extract title and summary (first line as title, next as summary)
    lines = content.split("\n")
    title = "AI-Generated Post"
    for line in lines:
        if line.startswith("# "):
            title = line.lstrip("# ").strip()
            break
    summary = content[:150].replace("\n", " ").strip() + "..." if len(content) > 150 else content[:100]
    newsletter_hook = f"New post: {title}. Check it out!"

    # 4. Upload cover image to S3
    placeholder_url = "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80"
    cover_url = upload_cover_to_s3(placeholder_url)
    if not cover_url:
        cover_url = placeholder_url  # Fallback to external URL

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
