'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { hasPermission } from '../service/permission.service';
import { AgentDetail } from '../types/agent';
import { fadeInPage } from '../lib/animations';

interface AgentProfileViewProps {
  agent: AgentDetail;
}

export default function AgentProfileView({ agent }: AgentProfileViewProps) {
  const { data: session } = useSession();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'academic' | 'professional' | 'bank_emergency'>('basic');

  const permissions = session?.user?.userPermissions || '';
  const canEdit = hasPermission(permissions, 'agents:edit');

  useEffect(() => {
    if (containerRef.current) {
      fadeInPage(containerRef.current);
    }
  }, []);

  // Helper to format dates
  const formatDate = (dateVal: string | Date | null | undefined) => {
    if (!dateVal) return '—';
    const date = new Date(dateVal);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div ref={containerRef} className="agents-page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Agent Profile</h1>
          <p className="page-subtitle">Detailed information for {agent.name}</p>
        </div>
        <div className="action-buttons">
          <Link href="/agents" className="btn-secondary-custom">
            Back to Directory
          </Link>
          {canEdit && (
            <Link href={`/agents/${agent.uid}/edit`} className="btn-primary-custom">
              <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Profile
            </Link>
          )}
        </div>
      </div>

      <div className="profile-container">
        {/* Sidebar details */}
        <div className="profile-sidebar">
          <div className="profile-avatar">{agent.name[0]?.toUpperCase()}</div>
          <h2 className="profile-name">{agent.name}</h2>
          {agent.nickname && <p className="text-slate-400 font-medium">&quot;{agent.nickname}&quot;</p>}
          <span className="profile-role-badge badge-role">
            {agent.role?.roleName || 'No Role Assigned'}
          </span>

          <div className="profile-meta-list">
            <div className="profile-meta-item">
              <span className="profile-meta-label">Username:</span>
              <span className="profile-meta-value">{agent.username}</span>
            </div>
            <div className="profile-meta-item">
              <span className="profile-meta-label">Team:</span>
              <span className="profile-meta-value">{agent.team?.teamName || 'Unassigned'}</span>
            </div>
            <div className="profile-meta-item">
              <span className="profile-meta-label">Agent ID:</span>
              <span className="profile-meta-value">{agent.agentId || '—'}</span>
            </div>
            <div className="profile-meta-item">
              <span className="profile-meta-label">Target quota:</span>
              <span className="profile-meta-value">{agent.agentTarget ? `$${agent.agentTarget}` : '—'}</span>
            </div>
            <div className="profile-meta-item">
              <span className="profile-meta-label">Base Salary:</span>
              <span className="profile-meta-value">{agent.agentSalary ? `$${agent.agentSalary}` : '—'}</span>
            </div>
            <div className="profile-meta-item">
              <span className="profile-meta-label">Joining Date:</span>
              <span className="profile-meta-value">{formatDate(agent.dateOfJoining)}</span>
            </div>
            <div className="profile-meta-item">
              <span className="profile-meta-label">Account Status:</span>
              <span className={`status-dot-badge ${agent.status === 1 ? 'status-active' : 'status-inactive'}`} style={{ marginTop: '0' }}>
                {agent.status === 1 ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Tabbed Info details */}
        <div className="profile-main">
          <div className="profile-tabs-header">
            <button
              onClick={() => setActiveTab('basic')}
              className={`profile-tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
            >
              Basic Info
            </button>
            <button
              onClick={() => setActiveTab('academic')}
              className={`profile-tab-btn ${activeTab === 'academic' ? 'active' : ''}`}
            >
              Academic Record
            </button>
            <button
              onClick={() => setActiveTab('professional')}
              className={`profile-tab-btn ${activeTab === 'professional' ? 'active' : ''}`}
            >
              Work History
            </button>
            <button
              onClick={() => setActiveTab('bank_emergency')}
              className={`profile-tab-btn ${activeTab === 'bank_emergency' ? 'active' : ''}`}
            >
              Bank & Emergency
            </button>
          </div>

          <div className="profile-tab-content">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="info-grid">
                <div className="info-group">
                  <span className="info-label">Mobile Number</span>
                  <span className="info-value">{agent.mobile || '—'}</span>
                </div>
                <div className="info-group">
                  <span className="info-label">Email Address</span>
                  <span className="info-value">{agent.email || '—'}</span>
                </div>
                <div className="info-group">
                  <span className="info-label">Gender</span>
                  <span className="info-value">{agent.gender === '1' ? 'Female' : 'Male'}</span>
                </div>
                <div className="info-group">
                  <span className="info-label">Age</span>
                  <span className="info-value">{agent.age || '—'}</span>
                </div>
                <div className="info-group">
                  <span className="info-label">Date of Birth</span>
                  <span className="info-value">{formatDate(agent.profile?.profileDob)}</span>
                </div>
                <div className="info-group">
                  <span className="info-label">Alternate Phone</span>
                  <span className="info-value">{agent.profile?.profileAlternatePhone || '—'}</span>
                </div>
                <div className="info-group" style={{ gridColumn: 'span 2' }}>
                  <span className="info-label">Local Address</span>
                  <span className="info-value">{agent.profile?.profileLocalAddress || '—'}</span>
                </div>
                <div className="info-group" style={{ gridColumn: 'span 2' }}>
                  <span className="info-label">Permanent Address</span>
                  <span className="info-value">{agent.profile?.profilePermanentAddress || '—'}</span>
                </div>
              </div>
            )}

            {/* Academic Tab */}
            {activeTab === 'academic' && (
              <div>
                {!agent.academicRecord || agent.academicRecord.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No academic history recorded.</p>
                ) : (
                  <div className="table-wrapper">
                    <table className="custom-table table-responsive">
                      <thead>
                        <tr>
                          <th>Standard / Degree</th>
                          <th>Institute</th>
                          <th>Specialization</th>
                          <th>Year From</th>
                          <th>Year To</th>
                        </tr>
                      </thead>
                      <tbody>
                        {agent.academicRecord.map((record) => (
                          <tr key={record.academicId}>
                            <td className="font-semibold text-slate-800">{record.academicStandard}</td>
                            <td>{record.academicInstitute || '—'}</td>
                            <td>{record.academicSpecialization || '—'}</td>
                            <td>{record.academicYearFrom || '—'}</td>
                            <td>{record.academicYearTo || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Professional Tab */}
            {activeTab === 'professional' && (
              <div>
                {!agent.professionalRecord || agent.professionalRecord.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No professional experience recorded.</p>
                ) : (
                  <div className="table-wrapper">
                    <table className="custom-table table-responsive">
                      <thead>
                        <tr>
                          <th>Organization</th>
                          <th>Designation</th>
                          <th>Salary</th>
                          <th>Duration</th>
                          <th>Experience Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {agent.professionalRecord.map((record) => (
                          <tr key={record.professionalId}>
                            <td className="font-semibold text-slate-800">{record.professionalOrganization}</td>
                            <td>{record.professionalDesignation || '—'}</td>
                            <td>{record.professionalSalary ? `$${record.professionalSalary}` : '—'}</td>
                            <td>{record.professionalYearFrom || '—'} to {record.professionalYearTo || '—'}</td>
                            <td>{record.professionalExperiance || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Bank & Emergency Tab */}
            {activeTab === 'bank_emergency' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div>
                  <h3 className="form-section-title" style={{ marginBottom: '16px' }}>Bank Account Information</h3>
                  <div className="info-grid">
                    <div className="info-group">
                      <span className="info-label">Bank Account Number</span>
                      <span className="info-value">{agent.profile?.profileBankAccount || '—'}</span>
                    </div>
                    <div className="info-group">
                      <span className="info-label">Bank Name</span>
                      <span className="info-value">{agent.profile?.profileBankName || '—'}</span>
                    </div>
                    <div className="info-group">
                      <span className="info-label">Routing / IFSC Code</span>
                      <span className="info-value">{agent.profile?.profileBankIfsc || '—'}</span>
                    </div>
                    <div className="info-group">
                      <span className="info-label">Bank Branch Location</span>
                      <span className="info-value">{agent.profile?.profileBankBranch || '—'}</span>
                    </div>
                    <div className="info-group" style={{ gridColumn: 'span 2' }}>
                      <span className="info-label">Bank Branch Address</span>
                      <span className="info-value">{agent.profile?.profileBankAddress || '—'}</span>
                    </div>
                    <div className="info-group">
                      <span className="info-label">PAN Number</span>
                      <span className="info-value">{agent.profile?.profilePan || '—'}</span>
                    </div>
                    <div className="info-group">
                      <span className="info-label">National ID (Aadhar)</span>
                      <span className="info-value">{agent.profile?.profileAadhar || '—'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="form-section-title" style={{ marginBottom: '16px' }}>Emergency Contacts</h3>
                  <div className="info-grid">
                    <div className="info-group">
                      <span className="info-label">Contact Name</span>
                      <span className="info-value">{agent.profile?.profileEmergencyContactName || '—'}</span>
                    </div>
                    <div className="info-group">
                      <span className="info-label">Relation</span>
                      <span className="info-value">{agent.profile?.profileEmergencyContactRelation || '—'}</span>
                    </div>
                    <div className="info-group">
                      <span className="info-label">Emergency Phone 1</span>
                      <span className="info-value">{agent.profile?.profileEmergencyContactNumber || '—'}</span>
                    </div>
                    <div className="info-group">
                      <span className="info-label">Emergency Phone 2</span>
                      <span className="info-value">{agent.profile?.profileEmergencyContactNumber2 || '—'}</span>
                    </div>
                    <div className="info-group" style={{ gridColumn: 'span 2' }}>
                      <span className="info-label">Emergency Address</span>
                      <span className="info-value">{agent.profile?.profileEmergencyContactAddress || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
