import React from 'react';
import AddFollowUpForm from '../../../components/AddFollowUpForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Schedule Callback - JD CRM',
  description: 'Schedule a new callback for a prospect with options and timezone tracking',
};

export default function NewFollowUpPage() {
  return (
    <div className="agents-page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Schedule New Callback</h1>
          <p className="page-subtitle">
            Create a follow-up record. The callback timezone is automatically calculated based on state.
          </p>
        </div>
      </div>
      <AddFollowUpForm />
    </div>
  );
}
