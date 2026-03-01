import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import CoverImageField from "../components/CoverImageField";
import { API_BASE } from "../config";

export default function AdminPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => sessionStorage.getItem("adminToken") || "");
  const [tokenValidated, setTokenValidated] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [showAllPostsSection, setShowAllPostsSection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (token) sessionStorage.setItem("adminToken", token);
    setTokenValidated(false); // Require re-validation when token changes
  }, [token]);

  function getAuthHeaders() {
    return { "x-admin-token": token };
  }

  function loadDrafts() {
    if (!token.trim()) {
      setError("Enter your admin token first.");
      return;
    }
    setError("");
    setLoading(true);
    fetch(`${API_BASE}/api/drafts`, { headers: getAuthHeaders() })
      .then((res) => {
        if (res.status === 401) {
          setError("Invalid token.");
          setTokenValidated(false);
          return [];
        }
        setTokenValidated(true);
        return res.json();
      })
      .then((data) => {
        setDrafts(Array.isArray(data) ? data : []);
      })
      .catch(() => setError("Failed to load drafts."))
      .finally(() => setLoading(false));
  }

  function loadAllPosts() {
    if (!token.trim()) {
      setError("Enter your admin token first.");
      return;
    }
    setError("");
    setShowAllPostsSection(true);
    setLoadingAll(true);
    fetch(`${API_BASE}/api/drafts?all=1`, { headers: getAuthHeaders() })
      .then((res) => {
        if (res.status === 401) {
          setError("Invalid token.");
          setTokenValidated(false);
          setAllPosts([]);
          return [];
        }
        setTokenValidated(true);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setAllPosts(data);
        } else {
          setError(data?.error || "Failed to load posts.");
          setAllPosts([]);
        }
      })
      .catch(() => setError("Failed to load posts."))
      .finally(() => setLoadingAll(false));
  }

  function publishPost(postId) {
    setPublishing(postId);
    fetch(`${API_BASE}/api/publish/${postId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
    })
      .then((res) => {
        if (res.ok) {
          loadDrafts();
          loadAllPosts();
        } else throw new Error("Publish failed");
      })
      .catch(() => setError("Failed to publish."))
      .finally(() => setPublishing(null));
  }

  function deletePost(postId) {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    setDeleting(postId);
    fetch(`${API_BASE}/api/posts/${postId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
      .then((res) => {
        if (res.ok) {
          loadDrafts();
          loadAllPosts();
        } else return res.json().then((d) => { throw new Error(d.error || "Delete failed"); });
      })
      .catch((e) => setError(e.message || "Failed to delete."))
      .finally(() => setDeleting(null));
  }

  async function handleCreatePost(ev) {
    ev.preventDefault();
    setCreating(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/drafts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          Title: title,
          Summary: summary,
          Content: content,
          CoverImageUrl: coverUrl || "",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTitle("");
        setSummary("");
        setContent("");
        setCoverUrl("");
        setShowCreate(false);
        navigate(`/edit/${data.PostId}`);
      } else {
        setError(data.error || "Failed to create draft");
      }
    } catch (e) {
      setError("Network error");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="section admin-page">
      <h1>Admin</h1>
      <p className="admin-desc">Enter your admin token first. Then you can load drafts, view all posts, or create a new post.</p>

      <div className="admin-token-row">
        <input
          type="password"
          placeholder="Admin token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="admin-token-input"
        />
        {token.trim() ? (
          <>
            <button type="button" onClick={loadDrafts} disabled={loading}>
              {loading ? "Loading…" : "Load drafts"}
            </button>
            <button
              type="button"
              onClick={loadAllPosts}
              disabled={loadingAll}
              className="btn-outline"
              style={{ marginLeft: "0.5rem" }}
            >
              {loadingAll ? "Loading…" : "All posts"}
            </button>
          </>
        ) : (
          <span className="admin-hint">Enter token to enable Load drafts and All posts</span>
        )}
      </div>

      {tokenValidated && (
        <button
          type="button"
          className="btn-primary"
          style={{ marginTop: "1rem" }}
          onClick={() => setShowCreate(!showCreate)}
        >
          {showCreate ? "Cancel" : "New post"}
        </button>
      )}

      {showCreate && (
        <form onSubmit={handleCreatePost} className="post-form" style={{ marginTop: "1.5rem" }}>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
          <CoverImageField
            value={coverUrl}
            onChange={setCoverUrl}
            getAuthHeaders={getAuthHeaders}
          />
          <textarea
            placeholder="Content (Markdown supported)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
          />
          <button type="submit" disabled={creating}>
            {creating ? "Creating…" : "Create draft"}
          </button>
        </form>
      )}

      {error && <p className="admin-error">{error}</p>}

      {drafts.length > 0 ? (
        <div className="drafts-list">
          <h2>Drafts</h2>
          {drafts.map((d) => (
            <div key={d.PostId} className="draft-card">
              <h3>{d.Title}</h3>
              <p className="draft-summary">{d.Summary}</p>
              <div className="draft-meta">
                <span>Created: {d.CreatedAt ? new Date(d.CreatedAt).toLocaleDateString() : ""}</span>
              </div>
              <div className="draft-actions">
                <Link to={`/edit/${d.PostId}`} className="btn-outline">Edit</Link>
                <button
                  type="button"
                  className="btn-publish"
                  onClick={() => publishPost(d.PostId)}
                  disabled={publishing === d.PostId}
                >
                  {publishing === d.PostId ? "Publishing…" : "Approve & Publish"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !loading && tokenValidated && <p className="admin-empty">No drafts.</p>
      )}

      {showAllPostsSection && (
        <div className="drafts-list" style={{ marginTop: "2rem" }}>
          <h2>All posts</h2>
          <p className="admin-desc">Drafts and published. Delete removes the post permanently.</p>
          {loadingAll ? (
            <p className="admin-empty">Loading…</p>
          ) : allPosts.length > 0 ? (
            allPosts.map((p) => (
              <div key={p.PostId} className="draft-card">
                <h3>{p.Title}</h3>
                <p className="draft-summary">{p.Summary}</p>
                <div className="draft-meta">
                  <span>Created: {p.CreatedAt ? new Date(p.CreatedAt).toLocaleDateString() : ""}</span>
                  <span style={{ marginLeft: "1rem" }}>
                    <strong>Status:</strong> {p.Status === "draft" ? "Draft" : "Published"}
                  </span>
                </div>
                <div className="draft-actions">
                  {p.Status === "draft" && (
                    <>
                      <Link to={`/edit/${p.PostId}`} className="btn-outline">Edit</Link>
                      <button
                        type="button"
                        className="btn-publish"
                        onClick={() => publishPost(p.PostId)}
                        disabled={publishing === p.PostId}
                      >
                        {publishing === p.PostId ? "Publishing…" : "Approve & Publish"}
                      </button>
                    </>
                  )}
                  {p.Status === "published" && (
                    <Link to={`/post/${p.PostId}`} className="btn-outline">View</Link>
                  )}
                  <button
                    type="button"
                    className="btn-delete"
                    onClick={() => deletePost(p.PostId)}
                    disabled={deleting === p.PostId}
                  >
                    {deleting === p.PostId ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="admin-empty">No posts yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
