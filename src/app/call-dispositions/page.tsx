import React from 'react';
import CallDispositionListContainer from '../../components/CallDispositionListContainer';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Call Dispositions - JD CRM',
  description: 'Manage and log inbound call outcomes',
};

export default function CallDispositionsPage() {
  return (
    <div className="agents-page-container call-dispositions-container">
      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 768px) and (max-width: 1599px) {
          .main-content:has(.call-dispositions-container) {
            padding-left: 10% !important;
            padding-right: 10% !important;
          }
        }
        @media (min-width: 1600px) {
          .main-content:has(.call-dispositions-container) {
            padding-left: 20% !important;
            padding-right: 20% !important;
          }
        }
      `}} />
      <CallDispositionListContainer />
    </div>
  );
}
