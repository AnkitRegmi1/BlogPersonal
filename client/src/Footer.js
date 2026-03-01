import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>TecBlog AI</h3>
            <p>Insights, guides, and thoughts about AI and AI agents—powered by automation.</p>
          </div>
          <div className="footer-col">
            <h4>Links</h4>
            <ul>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/about">About</Link>
              </li>
              <li>
                <Link to="/admin">Admin</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} TecBlog AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
