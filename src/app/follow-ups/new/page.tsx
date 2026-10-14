import React from 'react';
import AddFollowUpForm from '../../../components/AddFollowUpForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Schedule Follow-Up - JD CRM',
  description: 'Schedule a new follow-up for a prospect with options and timezone tracking',
};

export default function NewFollowUpPage() {
  return (
    <div className="agents-page-container follow-up-form-container">
      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 768px) {
          .main-content:has(.follow-up-form-container) {
            padding-left: 20% !important;
            padding-right: 20% !important;
          }
        }
        @media (max-width: 1599.98px) {
          .follow-up-form-container .order-form-layout {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .follow-up-form-container .order-form-sidebar {
            width: 100% !important;
            position: static !important;
            display: flex !important;
            flex-direction: column !important;
          }
        }
      `}} />
      <AddFollowUpForm />

    </div>
  );
}
