import React from 'react';
import LoginForm from '@/components/LoginForm';
import './login.css';

export default function LoginPage() {
  return (
    <main className="login-container">
      <div className="login-background">
        <div className="glass-circle circle-1"></div>
        <div className="glass-circle circle-2"></div>
      </div>
      <LoginForm />
    </main>
  );
}
