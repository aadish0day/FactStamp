import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Button from "../components/ui/Button.jsx";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="nf-page">
    <Helmet><title>WhisperStop | Page Not Found</title></Helmet>
      <div className="nf-bg">404</div>
      <div className="nf-content">
        <span className="nf-emoji"><Search size={64} /></span>
        <h1 className="nf-title display">Claim Not Found</h1>
        <p className="nf-desc">
          The claim you're looking for doesn't exist or may have been removed.
        </p>
        <Link to="/">
          <Button variant="primary" size="lg" icon={ArrowLeft}>
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
