import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <article className="about-page">
      <header className="about-hero">
        <h1>How TecBlog AI works</h1>
        <p className="about-lead">
          A minimal, automated pipeline from idea to published post—powered by AI agents and built for clarity.
        </p>
      </header>

      <div className="about-content">
        <section className="about-block">
          <h2>Where content lives</h2>
          <p>
            All posts are stored and versioned in <strong>GitHub</strong>. TecBlog AI is built to read from a single source of truth: your repository. Every article you see here is fetched from the API, which pulls content directly from that GitHub-backed data—so you get the reliability of version control and the flexibility of a modern blog.
          </p>
        </section>

        <section className="about-block">
          <h2>How new posts are made</h2>
          <p>
            New posts are created in two ways. <strong>Manually:</strong> use the Admin panel to write and publish. <strong>Automatically:</strong> a pipeline of <strong>two AI agents</strong> (built with <strong>CrewAI</strong> and powered by <strong>Groq</strong>) runs <strong>daily via GitHub Actions</strong>. The first agent researches GitHub for high-quality AI-agent and Codespaces repos and fetches their READMEs; the second agent writes a step-by-step draft (intro, how to run it, benefits, how to stay up to date). Drafts are saved for you to review and publish from Admin—so every automated post is consistent and professional.
          </p>
        </section>

        <section className="about-block">
          <h2>The AI stack</h2>
          <p>
            <strong>2 agents</strong> (Researcher + Writer), orchestrated by <strong>CrewAI</strong>, with <strong>Groq</strong> as the LLM. The runner uses the GitHub API to discover repos and fetch READMEs, then CrewAI’s crew produces the draft and sends it to the API as a draft. No Crawl4AI or extra scrapers—just CrewAI, Groq, and your GitHub-backed data.
          </p>
        </section>

        <section className="about-block">
          <h2>What you see here</h2>
          <p>
            The homepage shows the latest posts in a responsive grid. Each card links to the full article. The site uses a dark, minimal theme with subtle gradients and smooth interactions—designed to keep the focus on the content and the ideas, not the chrome.
          </p>
        </section>

        <section className="about-cta">
          <Link to="/" className="about-link">Back to home</Link>
        </section>
      </div>
    </article>
  );
}
