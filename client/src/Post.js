import { format } from "date-fns";
import { Link } from "react-router-dom";

export default function Post({ post, source = "api" }) {
  if (!post) return null;

  const isApi = source === "api";
  const id = isApi ? post.PostId : post._id;
  const title = isApi ? post.Title : post.title;
  const summary = isApi ? post.Summary : post.summary;
  const createdAt = isApi ? post.CreatedAt : post.createdAt;
  const author = isApi ? null : post.author;

  return (
    <Link to={`/post/${id}`} className="post post-list-item">
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
