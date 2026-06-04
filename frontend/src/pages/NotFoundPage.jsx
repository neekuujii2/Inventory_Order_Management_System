import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import './NotFoundPage.css';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="notfound-container">
      <div className="notfound-code">404</div>
      <h1 className="notfound-title">Page Not Found</h1>
      <p className="notfound-text">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <div className="notfound-actions">
        <Button onClick={() => navigate(-1)} className="btn-secondary">
          Go Back
        </Button>
        <Link to="/">
          <Button className="btn-primary">Return Home</Button>
        </Link>
      </div>
    </div>
  );
}
