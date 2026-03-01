import { formatISO9075 } from "date-fns";
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";

const API_BASE = "http://localhost:4000";

export default function PostPage() {
  const [postInfo, setPostInfo] = useState(null);
  const [error, setError] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    fetch(`${API_BASE}/api/posts/${id}`)
      .then((res) => {
        if (res.ok) return res.json();
        if (res.status === 404) return null;
        throw new Error("Failed to fetch");
      })
      .then((data) => {
        setPostInfo(data);
        setError(data ? null : "Post not found");
      })
      .catch(() => setError("Failed to load post"));
  }, [id]);

  if (error) {
    return (
      <div className="section">
        <p style={{ textAlign: "center", color: "var(--destructive)" }}>{error}</p>
      </div>
    );
  }

  if (!postInfo) {
    return (
      <div className="section">
        <p style={{ textAlign: "center", color: "var(--muted-foreground)" }}>
          Loading…
        </p>
      </div>
    );
  }

  const title = postInfo.Title;
  const createdAt = postInfo.CreatedAt;
  const content = postInfo.Content;
  const cover = postInfo.CoverImageUrl;

  return (
    <div className="post-page">
      <h1>{title}</h1>
      <time className="post-meta">
        {createdAt ? formatISO9075(new Date(createdAt)) : ""}
      </time>

      {cover && (
        <div className="image">
          <img src={cover} alt="" />
        </div>
      )}

      <div className="content">
        {content ? <ReactMarkdown>{content}</ReactMarkdown> : null}
      </div>
    </div>
  );
}
