import { format } from "date-fns";
import { Link } from "react-router-dom";

// Supports both: API (DynamoDB) schema and MongoDB schema
export default function Post({ post, source = "mongo" }) {
  if (!post) return null;

  const isApi = source === "api";
  const id = isApi ? post.PostId : post._id;
  const title = isApi ? post.Title : post.title;
  const summary = isApi ? post.Summary : post.summary;
  const cover = isApi
    ? post.CoverImageUrl
    : post.cover
    ? `http://localhost:4000/${post.cover}`
    : null;
  const createdAt = isApi ? post.CreatedAt : post.createdAt;
  const author = isApi ? null : post.author;

  const coverUrl =
    cover || "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80";

  return (
    <Link to={`/post/${id}`} className="post">
      <div className="image">
        <div className="overlay" aria-hidden="true" />
        <img src={coverUrl} alt={title || "Post"} />
      </div>
      <div className="texts">
        <h2>{title}</h2>
        <p className="info">
          <span className="author">{author?.username || "Blog"}</span>
          <time>{createdAt ? format(new Date(createdAt), "MMM d, yyyy") : ""}</time>
        </p>
        <p className="summary">{summary}</p>
      </div>
    </Link>
  );
}
