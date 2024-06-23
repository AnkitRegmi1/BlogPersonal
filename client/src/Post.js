import { format } from 'date-fns';

export default function Post({ title, summary, cover, content, createdAt, author }) {
    return (
        <div className="post">
            <div className="image">
                <img src={cover} alt="Post Image" />
            </div>
            <div className="texts">
                <h2>{title}</h2>
                <p className="info">
                    <a href="#" className="author">{author ? author.username : 'Unknown Author'}</a>
                    <time>{format(new Date(createdAt), 'MMM d, yyyy HH:mm ')}</time>
                </p>
                <p className="summary">{summary}</p>
            </div>
        </div>
    );
}
