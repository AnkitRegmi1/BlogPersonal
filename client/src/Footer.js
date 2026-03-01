import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>Blog</h3>
            <p>Personal blog. Thoughts, tutorials, and updates.</p>
          </div>
          <div className="footer-col">
            <h4>Links</h4>
            <ul>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/#newsletter">Subscribe</Link>
              </li>
              <li>
                <Link to="/admin">Admin</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Blog. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
