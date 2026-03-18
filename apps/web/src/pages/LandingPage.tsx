import { Link } from "react-router-dom";

export function LandingPage() {
  return (
    <div className="landing-page">
      <section className="hero-card">
        <div>
          <p className="eyebrow">AI-powered home services marketplace</p>
          <h1>Book trusted help faster with TaskSwift.</h1>
          <p className="hero-copy">
            Post tasks, compare bids, match with verified providers, and manage work from one modern dashboard.
          </p>
          <div className="hero-actions">
            <Link className="button button--primary" to="/auth">
              Get Started
            </Link>
            <Link className="button button--ghost" to="/marketplace">
              Browse Tasks
            </Link>
          </div>
        </div>
        <div className="hero-panel">
          <div className="metric-stack">
            <div>
              <strong>6</strong>
              <span>service categories</span>
            </div>
            <div>
              <strong>AI</strong>
              <span>provider ranking</span>
            </div>
            <div>
              <strong>24h</strong>
              <span>average response target</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}