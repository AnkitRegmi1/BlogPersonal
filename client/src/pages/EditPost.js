import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import CoverImageField from "../components/CoverImageField";
import { API_BASE } from "../config";

export default function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  function getAuthHeaders() {
    const token = sessionStorage.getItem("adminToken");
    return token ? { "x-admin-token": token } : {};
  }

  useEffect(() => {
    fetch(`${API_BASE}/api/posts/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((post) => {
        if (post) {
          setTitle(post.Title || "");
          setSummary(post.Summary || "");
          setContent(post.Content || "");
          setCoverUrl(post.CoverImageUrl || "");
          if (post.Status !== "draft") {
            setError("Cannot edit published post.");
          }
        } else {
          setError("Post not found.");
        }
      })
      .catch(() => setError("Failed to load post."))
      .finally(() => setFetching(false));
  }, [id]);

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (error) return;
    const token = sessionStorage.getItem("adminToken");
    if (!token) {
      setError("Admin token required. Go to Admin and enter your token first.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/drafts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          Title: title,
          Summary: summary,
          Content: content,
          CoverImageUrl: coverUrl || "",
        }),
      });
      let data;
      try {
        data = await res.json();
      } catch {
        setError(res.status === 404 ? "Draft not found (check the URL)" : `Request failed (${res.status})`);
        return;
      }
      if (res.ok) {
        navigate("/admin");
      } else {
        setError(data.error || `Failed to update (${res.status})`);
      }
    } catch (e) {
      setError("Network error. Is the API running on port 4000?");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="section">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="section form-page">
      <h1>Edit draft</h1>
      <p className="admin-desc">
        <Link to="/admin">← Back to Admin</Link>
      </p>
      <form onSubmit={handleSubmit} className="post-form">
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
          rows={12}
        />
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={loading || error === "Cannot edit published post."}>
          {loading ? "Saving…" : "Save draft"}
        </button>
      </form>
    </div>
  );
}
