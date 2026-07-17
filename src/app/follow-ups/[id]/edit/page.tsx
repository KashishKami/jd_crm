import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../api/auth/[...nextauth]/route';
import * as followupService from '../../../../service/followup.service';
import EditFollowUpForm from '../../../../components/EditFollowUpForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Edit Follow-Up - JD CRM',
  description: 'Update follow-up schedule, vehicle, pricing options, status or notes',
};

export default async function EditFollowUpPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login');
  }

  const { id } = await params;
  const followUpId = Number(id);
  if (isNaN(followUpId)) {
    notFound();
  }

  let record;
  try {
    record = await followupService.getFollowUpById(session.user as any, followUpId);
  } catch (error: any) {
    if (error.message.includes('Forbidden')) {
      redirect('/access-denied');
    }
    throw error;
  }

  if (!record) {
    notFound();
  }

  return (
    <div className="agents-page-container follow-up-form-container">
      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 768px) {
          .main-content:has(.follow-up-form-container) {
            padding-left: 20% !important;
            padding-right: 20% !important;
          }
        }
      `}} />
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Follow-Up</h1>
          <p className="page-subtitle">
            Modify scheduling parameters, status, priority, or notes for this prospect.
          </p>
        </div>
      </div>
      <EditFollowUpForm record={record} />
    </div>
  );
}
