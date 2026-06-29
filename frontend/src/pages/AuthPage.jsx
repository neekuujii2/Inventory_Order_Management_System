import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, ShieldCheck, UserCheck, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';

import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

const demoUsers = [
  { role: 'Super Admin', email: 'super_admin@ims.com', desc: 'Complete system privileges' },
  { role: 'Admin', email: 'admin@ims.com', desc: 'Configuration and setup' },
  { role: 'Manager', email: 'manager@ims.com', desc: 'General operations & staff' },
  { role: 'Warehouse Manager', email: 'warehouse_manager@ims.com', desc: 'Stock capacity & transfers' },
  { role: 'Sales Manager', email: 'sales_manager@ims.com', desc: 'Customer pipeline & orders' },
  { role: 'Purchase Manager', email: 'purchase_manager@ims.com', desc: 'Suppliers & procurement' },
  { role: 'Staff User', email: 'staff@ims.com', desc: 'Standard data entry' },
  { role: 'Viewer User', email: 'viewer@ims.com', desc: 'Read-only reporting access' }
];

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'staff',
    remember_me: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await login({ email: form.email, password: form.password, remember_me: form.remember_me });
      } else {
        await register({
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          role: form.role,
          remember_me: form.remember_me,
        });
      }
      toast.success('Access granted! Welcome.');
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed');
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = (demo) => {
    setForm({
      ...form,
      email: demo.email,
      password: 'password123'
    });
    setMode('login');
    toast.success(`Selected role: ${demo.role}. Click Sign In to connect.`);
  };

  const handleForgotSubmit = (event) => {
    event.preventDefault();
    toast.success(`If account exists, reset instructions sent to ${forgotEmail}. (Seeded code is 123456)`);
    setShowForgot(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-shell">
        {/* Demo Users Quick Select List */}
        <motion.div 
          initial={{ opacity: 0, x: -18 }} 
          animate={{ opacity: 1, x: 0 }} 
          className="demo-card surface-card"
        >
          <div className="demo-header">
            <UserCheck size={20} className="text-secondary" />
            <div>
              <h3>Enterprise Demo Accounts</h3>
              <p className="text-secondary">Click a role to pre-fill credentials for testing.</p>
            </div>
          </div>
          <div className="demo-grid">
            {demoUsers.map((demo) => (
              <button 
                key={demo.role} 
                type="button" 
                className={`demo-btn ${form.email === demo.email ? 'is-active' : ''}`}
                onClick={() => handleDemoClick(demo)}
              >
                <strong>{demo.role}</strong>
                <span>{demo.desc}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Real Login Form Card */}
        <motion.div 
          initial={{ opacity: 0, y: 18 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="auth-card surface-card"
        >
          <div className="auth-card__hero">
            <div className="auth-card__icon">
              <ShieldCheck size={24} />
            </div>
            <div>
              <span className="eyebrow">IMS Enterprise</span>
              <h1 className="section-title">Atlas Inventory SaaS</h1>
              <p className="page-subtitle">Multi-warehouse control in one secure platform.</p>
            </div>
          </div>

          {!showForgot ? (
            <>
              <div className="auth-toggle" role="tablist" aria-label="Authentication mode">
                <button type="button" className={`auth-toggle__btn ${mode === 'login' ? 'is-active' : ''}`} onClick={() => setMode('login')}>
                  Sign in
                </button>
                <button type="button" className={`auth-toggle__btn ${mode === 'register' ? 'is-active' : ''}`} onClick={() => setMode('register')}>
                  Create account
                </button>
              </div>

              <form onSubmit={handleSubmit} className="auth-form">
                {mode === 'register' ? (
                  <label className="field-group">
                    <span>Full name</span>
                    <input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} placeholder="Jordan Rivera" required />
                  </label>
                ) : null}

                <label className="field-group">
                  <span>Email Address</span>
                  <div className="field-with-icon">
                    <Mail size={16} />
                    <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@company.com" required />
                  </div>
                </label>

                <label className="field-group">
                  <span>Password</span>
                  <div className="field-with-icon">
                    <Lock size={16} />
                    <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Enter your password" required />
                  </div>
                </label>

                {mode === 'register' ? (
                  <label className="field-group">
                    <span>Role</span>
                    <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                      <option value="staff">Staff</option>
                      <option value="manager">Manager</option>
                      <option value="warehouse_manager">Warehouse manager</option>
                      <option value="sales_manager">Sales manager</option>
                      <option value="purchase_manager">Purchase manager</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super admin</option>
                    </select>
                  </label>
                ) : null}

                <div className="form-actions-row">
                  <label className="checkbox-row">
                    <input type="checkbox" checked={form.remember_me} onChange={(event) => setForm({ ...form, remember_me: event.target.checked })} />
                    <span>Remember me</span>
                  </label>

                  {mode === 'login' && (
                    <button type="button" className="forgot-btn-link" onClick={() => setShowForgot(true)}>
                      Forgot Password?
                    </button>
                  )}
                </div>

                {error ? <div className="auth-error">{error}</div> : null}

                <Button type="submit" fullWidth loading={loading}>
                  {mode === 'login' ? 'Sign in' : 'Create account'}
                </Button>
              </form>
            </>
          ) : (
            <form onSubmit={handleForgotSubmit} className="auth-form">
              <div className="form-heading-simple">
                <KeyRound size={20} className="text-secondary" />
                <h3>Forgot Password?</h3>
                <p className="page-subtitle">We will send a reset code verification to your email.</p>
              </div>

              <label className="field-group">
                <span>Email Address</span>
                <div className="field-with-icon">
                  <Mail size={16} />
                  <input type="email" value={forgotEmail} onChange={(event) => setForgotEmail(event.target.value)} placeholder="you@company.com" required />
                </div>
              </label>

              <div className="toolbar-row justify-end" style={{ marginTop: '1rem' }}>
                <Button variant="ghost" type="button" onClick={() => setShowForgot(false)}>
                  Back to Sign In
                </Button>
                <Button variant="primary" type="submit">
                  Send Code
                </Button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
