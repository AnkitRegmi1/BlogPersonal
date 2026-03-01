import { format } from "date-fns";
import { Link } from "react-router-dom";
import { stripMarkdown } from "./utils/stripMarkdown";

export default function Post({ post, source = "api", variant = "card" }) {
  if (!post) return null;

  const isApi = source === "api";
  const id = isApi ? post.PostId : post._id;
  const title = isApi ? post.Title : post.title;
  const summary = isApi ? post.Summary : post.summary;
  const createdAt = isApi ? post.CreatedAt : post.createdAt;
  const cleanSummary = stripMarkdown(summary || "", 160);

  const content = (
    <div className="texts">
      <div className="meta-row">
        <time>{createdAt ? format(new Date(createdAt), "MMM d, yyyy") : ""}</time>
      </div>
      <h2>{title}</h2>
      <p className="summary">{cleanSummary}</p>
    </div>
  );

  return (
    <Link
      to={`/post/${id}`}
      className={`post ${variant === "card" ? "post-card" : "post-list-item"}`}
    >
      {content}
    </Link>
  );
}
