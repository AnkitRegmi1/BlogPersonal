import React, { useEffect, useState } from "react";
import Post from "../Post";

const API_BASE = "http://localhost:4000";

export default function IndexPage() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/posts`)
      .then((response) => response.json())
      .then((posts) => setPosts(posts || []))
      .catch((error) => console.error("Error fetching posts:", error));
  }, []);

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <h1>Insights &amp; Updates</h1>
          <p className="hero-desc">
            Thoughts, tutorials, and stories. Welcome to the blog.
          </p>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Latest posts</h2>
        {posts.length > 0 ? (
          <div className="posts-grid">
            {posts.map((post) => (
              <Post key={post.PostId || post._id} post={post} source="api" />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2>No posts yet</h2>
            <p>Check back later or create your first post.</p>
          </div>
        )}
      </section>

      <section className="section" id="newsletter">
        <Newsletter />
      </section>
    </>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(""); // '', 'success', 'error'

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("");
    try {
      const res = await fetch(`${API_BASE}/api/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmail("");
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="newsletter-card">
      <h2 className="section-title">Subscribe to the newsletter</h2>
      <p className="newsletter-desc">Get updates delivered to your inbox.</p>
      <form onSubmit={handleSubmit} className="newsletter-form">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Subscribe</button>
      </form>
      {status === "success" && (
        <p className="newsletter-msg success">Subscribed successfully!</p>
      )}
      {status === "error" && (
        <p className="newsletter-msg error">Something went wrong. Try again.</p>
      )}
    </div>
  );
}
