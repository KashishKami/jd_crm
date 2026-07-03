'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { AgentDetail, FormAcademicRecord, FormProfessionalRecord } from '../types/agent';
import { fadeInPage } from '../lib/animations';
import { useLenis } from './LenisProvider';
import { localDateStringToUtcNoon, utcDateToLocalDateString } from '../lib/date';

interface EditAgentFormProps {
  agent: AgentDetail;
  teams: { teamId: number; teamName: string }[];
  roles: { roleId: number; roleName: string }[];
  designations: { designationId: number; designationName: string }[];
}

export default function EditAgentForm({ agent, teams, roles, designations }: EditAgentFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'profile' | 'academic' | 'professional'>('basic');
  const [showPassword, setShowPassword] = useState(false);

  const permissions = session?.user?.userPermissions || '';
  const isSuperAdmin = permissions.split(',').includes('super-admin');
  const hasAgentEditPerm = permissions.split(',').includes('agents:edit');
  const isEditingSelf = session?.user?.id ? Number(session.user.id) === agent.uid : false;
  const disableRestrictedFields = isEditingSelf && !hasAgentEditPerm;

  // Local Form state representing primary fields and nested tables
  const [userData, setUserData] = useState({
    name: agent.name || '',
    nickname: agent.nickname || '',
    username: agent.username || '',
    password: '', // blank by default (only filled to update)
    email: agent.email || '',
    mobile: agent.mobile || '',
    gender: agent.gender || '0',
    age: agent.age ? String(agent.age) : '',
    designation: agent.designation || '',
    dateOfJoining: utcDateToLocalDateString(agent.dateOfJoining),
    agentId: agent.agentId || '',
    agentTarget: agent.agentTarget || '',
    agentSalary: agent.agentSalary || '',
    teamId: String(agent.teamId),
    roleId: String(agent.roleId),
  });

  const [profileData, setProfileData] = useState({
    profileLocalAddress: agent.profile?.profileLocalAddress || '',
    profilePermanentAddress: agent.profile?.profilePermanentAddress || '',
    profileAlternatePhone: agent.profile?.profileAlternatePhone || '',
    profileDob: utcDateToLocalDateString(agent.profile?.profileDob),
    profilePan: agent.profile?.profilePan || '',
    profileAadhar: agent.profile?.profileAadhar || '',
    profileBankAccount: agent.profile?.profileBankAccount || '',
    profileBankName: agent.profile?.profileBankName || '',
    profileBankAddress: agent.profile?.profileBankAddress || '',
    profileBankBranch: agent.profile?.profileBankBranch || '',
    profileBankIfsc: agent.profile?.profileBankIfsc || '',
    profileEmergencyContactName: agent.profile?.profileEmergencyContactName || '',
    profileEmergencyContactRelation: agent.profile?.profileEmergencyContactRelation || '',
    profileEmergencyContactAddress: agent.profile?.profileEmergencyContactAddress || '',
    profileEmergencyContactNumber: agent.profile?.profileEmergencyContactNumber || '',
    profileEmergencyContactNumber2: agent.profile?.profileEmergencyContactNumber2 || '',
  });

  const [academicRecords, setAcademicRecords] = useState<FormAcademicRecord[]>(
    agent.academicRecord?.map((r) => ({
      academicStandard: r.academicStandard || '',
      academicInstitute: r.academicInstitute || '',
      academicSpecialization: r.academicSpecialization || '',
      academicYearFrom: r.academicYearFrom || '',
      academicYearTo: r.academicYearTo || '',
    })) || []
  );

  const [professionalRecords, setProfessionalRecords] = useState<FormProfessionalRecord[]>(
    agent.professionalRecord?.map((r) => ({
      professionalOrganization: r.professionalOrganization || '',
      professionalDesignation: r.professionalDesignation || '',
      professionalSalary: r.professionalSalary || '',
      professionalYearFrom: r.professionalYearFrom || '',
      professionalYearTo: r.professionalYearTo || '',
      professionalExperiance: r.professionalExperiance || '',
    })) || []
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { lenis } = useLenis();

  useEffect(() => {
    if (containerRef.current) {
      fadeInPage(containerRef.current);
    }
  }, []);

  useEffect(() => {
    if (lenis) {
      const timer = setTimeout(() => {
        lenis.resize();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeTab, lenis, academicRecords.length, professionalRecords.length]);

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  // Academic dynamic helpers
  const handleAddAcademic = () => {
    setAcademicRecords((prev) => [
      ...prev,
      {
        academicStandard: '',
        academicInstitute: '',
        academicSpecialization: '',
        academicYearFrom: '',
        academicYearTo: '',
      },
    ]);
  };

  const handleRemoveAcademic = (index: number) => {
    setAcademicRecords((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAcademicChange = (index: number, field: string, value: string) => {
    setAcademicRecords((prev) =>
      prev.map((rec, i) => (i === index ? { ...rec, [field]: value } : rec))
    );
  };

  // Professional dynamic helpers
  const handleAddProfessional = () => {
    setProfessionalRecords((prev) => [
      ...prev,
      {
        professionalOrganization: '',
        professionalDesignation: '',
        professionalSalary: '',
        professionalYearFrom: '',
        professionalYearTo: '',
        professionalExperiance: '',
      },
    ]);
  };

  const handleRemoveProfessional = (index: number) => {
    setProfessionalRecords((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProfessionalChange = (index: number, field: string, value: string) => {
    setProfessionalRecords((prev) =>
      prev.map((rec, i) => (i === index ? { ...rec, [field]: value } : rec))
    );
  };

  const handleNextTab = () => {
    if (activeTab === 'basic') {
      if (!userData.name || !userData.username || !userData.teamId || !userData.roleId) {
        setError('Please fill in all required fields (Name, Username, Team, and Role).');
        return;
      }
      setError(null);
      setActiveTab('profile');
    } else if (activeTab === 'profile') {
      setActiveTab('academic');
    } else if (activeTab === 'academic') {
      setActiveTab('professional');
    }
  };

  const handleBackTab = () => {
    setError(null);
    if (activeTab === 'profile') {
      setActiveTab('basic');
    } else if (activeTab === 'academic') {
      setActiveTab('profile');
    } else if (activeTab === 'professional') {
      setActiveTab('academic');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Basic validation
    if (!userData.name || !userData.username || !userData.teamId || !userData.roleId) {
      setError('Please fill in all required fields (Name, Username, Team, and Role).');
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...userData,
        age: userData.age ? Number(userData.age) : null,
        teamId: Number(userData.teamId),
        roleId: Number(userData.roleId),
        dateOfJoining: userData.dateOfJoining ? localDateStringToUtcNoon(userData.dateOfJoining) : null,
        // Nested profile details
        profile: {
          ...profileData,
          profileDob: profileData.profileDob ? localDateStringToUtcNoon(profileData.profileDob) : null,
        },
        // Nested dynamic records
        academicRecord: academicRecords,
        professionalRecord: professionalRecords,
      };

      // Strip empty password to prevent overwrite
      if (!payload.password) {
        delete (payload as { password?: string }).password;
      }

      const res = await fetch(`/api/agents/${agent.uid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update agent profile.');
      }

      router.push(`/agents/${agent.uid}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div ref={containerRef} className="agents-page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Agent Profile</h1>
          <p className="page-subtitle">Modify credentials and sub-profiles for {agent.name}</p>
        </div>
        <Link href={`/agents/${agent.uid}`} className="btn-secondary-custom">
          Cancel
        </Link>
      </div>

      {error && (
        <div className="error-box" style={{ padding: '16px', margin: '0' }}>
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="profile-main" style={{ minHeight: '500px' }}>
        <div className="profile-tabs-header">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`profile-tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
          >
            1. Account & Core Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`profile-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          >
            2. Personal, Bank & Emergency
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('academic')}
            className={`profile-tab-btn ${activeTab === 'academic' ? 'active' : ''}`}
          >
            3. Education History ({academicRecords.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('professional')}
            className={`profile-tab-btn ${activeTab === 'professional' ? 'active' : ''}`}
          >
            4. Work History ({professionalRecords.length})
          </button>
        </div>

        <div className="profile-tab-content">
          {/* Basic & Core Credentials Section */}
          {activeTab === 'basic' && (
            <div className="form-section">
              <h3 className="form-section-title">Core Identity</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={userData.name}
                    onChange={handleUserChange}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nickname</label>
                  <input
                    type="text"
                    name="nickname"
                    value={userData.nickname}
                    onChange={handleUserChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Username *</label>
                  <input
                    type="text"
                    name="username"
                    value={userData.username}
                    onChange={handleUserChange}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password (Leave blank to keep current)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={userData.password}
                      onChange={handleUserChange}
                      className="form-input"
                      placeholder="Reset password"
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0',
                      }}
                      aria-label={showPassword ? "Hide text" : "Show text"}
                    >
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                {isSuperAdmin && (
                  <div className="form-group">
                    <label className="form-label">Role Assignment *</label>
                    <select
                      name="roleId"
                      value={userData.roleId}
                      onChange={handleUserChange}
                      className="form-select"
                      required
                      disabled={disableRestrictedFields}
                    >
                      {roles.map((role) => (
                        <option key={role.roleId} value={role.roleId}>
                          {role.roleName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Team Assignment *</label>
                  <select
                    name="teamId"
                    value={userData.teamId}
                    onChange={handleUserChange}
                    className="form-select"
                    required
                    disabled={disableRestrictedFields}
                  >
                    {teams.map((team) => (
                      <option key={team.teamId} value={team.teamId}>
                        {team.teamName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Designation Title</label>
                  <select
                    name="designation"
                    value={userData.designation}
                    onChange={handleUserChange}
                    className="form-select"
                    disabled={disableRestrictedFields}
                  >
                    <option value="">-- Select Designation --</option>
                    {designations.map((desg) => (
                      <option key={desg.designationId} value={desg.designationName}>
                        {desg.designationName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Agent ID Code</label>
                  <input
                    type="text"
                    name="agentId"
                    value={userData.agentId}
                    onChange={handleUserChange}
                    className="form-input"
                    disabled={disableRestrictedFields}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Corporate Email</label>
                  <input
                    type="email"
                    name="email"
                    value={userData.email}
                    onChange={handleUserChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number</label>
                  <input
                    type="text"
                    name="mobile"
                    value={userData.mobile}
                    onChange={handleUserChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select
                    name="gender"
                    value={userData.gender}
                    onChange={handleUserChange}
                    className="form-select"
                  >
                    <option value="0">Male</option>
                    <option value="1">Female</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={userData.age}
                    onChange={handleUserChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Joining Date</label>
                  <input
                    type="date"
                    name="dateOfJoining"
                    value={userData.dateOfJoining}
                    onChange={handleUserChange}
                    className="form-input"
                    disabled={disableRestrictedFields}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Salary Quota / Quoted Value</label>
                  <input
                    type="text"
                    name="agentSalary"
                    value={userData.agentSalary}
                    onChange={handleUserChange}
                    className="form-input"
                    disabled={disableRestrictedFields}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Target quota</label>
                  <input
                    type="text"
                    name="agentTarget"
                    value={userData.agentTarget}
                    onChange={handleUserChange}
                    className="form-input"
                    disabled={disableRestrictedFields}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Extended Profile, Bank & Emergency info */}
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div className="form-section">
                <h3 className="form-section-title">Addresses & Personal Info</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      name="profileDob"
                      value={profileData.profileDob}
                      onChange={handleProfileChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Alternate Phone</label>
                    <input
                      type="text"
                      name="profileAlternatePhone"
                      value={profileData.profileAlternatePhone}
                      onChange={handleProfileChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Local Residential Address</label>
                    <textarea
                      name="profileLocalAddress"
                      value={profileData.profileLocalAddress}
                      onChange={handleProfileChange}
                      className="form-textarea"
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Permanent Residence Address</label>
                    <textarea
                      name="profilePermanentAddress"
                      value={profileData.profilePermanentAddress}
                      onChange={handleProfileChange}
                      className="form-textarea"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">Bank & Tax Accounts</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">BankAccount Number</label>
                    <input
                      type="text"
                      name="profileBankAccount"
                      value={profileData.profileBankAccount}
                      onChange={handleProfileChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bank Name</label>
                    <input
                      type="text"
                      name="profileBankName"
                      value={profileData.profileBankName}
                      onChange={handleProfileChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Routing / IFSC Code</label>
                    <input
                      type="text"
                      name="profileBankIfsc"
                      value={profileData.profileBankIfsc}
                      onChange={handleProfileChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bank Branch Location</label>
                    <input
                      type="text"
                      name="profileBankBranch"
                      value={profileData.profileBankBranch}
                      onChange={handleProfileChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Bank Branch Address</label>
                    <input
                      type="text"
                      name="profileBankAddress"
                      value={profileData.profileBankAddress}
                      onChange={handleProfileChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">PAN Card Tax Number</label>
                    <input
                      type="text"
                      name="profilePan"
                      value={profileData.profilePan}
                      onChange={handleProfileChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">National ID Number (Aadhar)</label>
                    <input
                      type="text"
                      name="profileAadhar"
                      value={profileData.profileAadhar}
                      onChange={handleProfileChange}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">Emergency Contact Details</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Contact Name</label>
                    <input
                      type="text"
                      name="profileEmergencyContactName"
                      value={profileData.profileEmergencyContactName}
                      onChange={handleProfileChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Relationship to Agent</label>
                    <input
                      type="text"
                      name="profileEmergencyContactRelation"
                      value={profileData.profileEmergencyContactRelation}
                      onChange={handleProfileChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Emergency Phone 1</label>
                    <input
                      type="text"
                      name="profileEmergencyContactNumber"
                      value={profileData.profileEmergencyContactNumber}
                      onChange={handleProfileChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Emergency Phone 2</label>
                    <input
                      type="text"
                      name="profileEmergencyContactNumber2"
                      value={profileData.profileEmergencyContactNumber2}
                      onChange={handleProfileChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Emergency Contact Address</label>
                    <textarea
                      name="profileEmergencyContactAddress"
                      value={profileData.profileEmergencyContactAddress}
                      onChange={handleProfileChange}
                      className="form-textarea"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Academic Records Section */}
          {activeTab === 'academic' && (
            <div className="form-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 className="form-section-title" style={{ border: 'none', padding: '0', margin: '0' }}>Academic Qualifications</h3>
                <button
                  type="button"
                  onClick={handleAddAcademic}
                  className="btn-secondary-custom"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  + Add Qualification
                </button>
              </div>

              {academicRecords.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No academic records added. Click the button to add one.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {academicRecords.map((record, index) => (
                    <div key={index} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', backgroundColor: '#f8fafc', position: 'relative' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveAcademic(index)}
                        style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', color: '#ef4444', fontWeight: '600', cursor: 'pointer' }}
                      >
                        Remove
                      </button>

                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label">Degree / Standard *</label>
                          <input
                            type="text"
                            value={record.academicStandard}
                            onChange={(e) => handleAcademicChange(index, 'academicStandard', e.target.value)}
                            className="form-input"
                            required
                            placeholder="e.g. Bachelor of Science"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Institute / University *</label>
                          <input
                            type="text"
                            value={record.academicInstitute}
                            onChange={(e) => handleAcademicChange(index, 'academicInstitute', e.target.value)}
                            className="form-input"
                            required
                            placeholder="e.g. Stanford University"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Specialization / Major</label>
                          <input
                            type="text"
                            value={record.academicSpecialization}
                            onChange={(e) => handleAcademicChange(index, 'academicSpecialization', e.target.value)}
                            className="form-input"
                            placeholder="e.g. Computer Science"
                          />
                        </div>
                        <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div className="form-group">
                            <label className="form-label">Year From</label>
                            <input
                              type="text"
                              value={record.academicYearFrom}
                              onChange={(e) => handleAcademicChange(index, 'academicYearFrom', e.target.value)}
                              className="form-input"
                              placeholder="YYYY"
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Year To</label>
                            <input
                              type="text"
                              value={record.academicYearTo}
                              onChange={(e) => handleAcademicChange(index, 'academicYearTo', e.target.value)}
                              className="form-input"
                              placeholder="YYYY"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Professional Records Section */}
          {activeTab === 'professional' && (
            <div className="form-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 className="form-section-title" style={{ border: 'none', padding: '0', margin: '0' }}>Professional Work History</h3>
                <button
                  type="button"
                  onClick={handleAddProfessional}
                  className="btn-secondary-custom"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  + Add Experience
                </button>
              </div>

              {professionalRecords.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No work history added. Click the button to add one.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {professionalRecords.map((record, index) => (
                    <div key={index} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', backgroundColor: '#f8fafc', position: 'relative' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveProfessional(index)}
                        style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', color: '#ef4444', fontWeight: '600', cursor: 'pointer' }}
                      >
                        Remove
                      </button>

                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label">Organization Name *</label>
                          <input
                            type="text"
                            value={record.professionalOrganization}
                            onChange={(e) => handleProfessionalChange(index, 'professionalOrganization', e.target.value)}
                            className="form-input"
                            required
                            placeholder="e.g. Google Inc"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Job Designation *</label>
                          <input
                            type="text"
                            value={record.professionalDesignation}
                            onChange={(e) => handleProfessionalChange(index, 'professionalDesignation', e.target.value)}
                            className="form-input"
                            required
                            placeholder="e.g. Sales Executive"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Salary Earned</label>
                          <input
                            type="text"
                            value={record.professionalSalary}
                            onChange={(e) => handleProfessionalChange(index, 'professionalSalary', e.target.value)}
                            className="form-input"
                            placeholder="e.g. 50000"
                          />
                        </div>
                        <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div className="form-group">
                            <label className="form-label">Year From</label>
                            <input
                              type="text"
                              value={record.professionalYearFrom}
                              onChange={(e) => handleProfessionalChange(index, 'professionalYearFrom', e.target.value)}
                              className="form-input"
                              placeholder="YYYY"
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Year To</label>
                            <input
                              type="text"
                              value={record.professionalYearTo}
                              onChange={(e) => handleProfessionalChange(index, 'professionalYearTo', e.target.value)}
                              className="form-input"
                              placeholder="YYYY"
                            />
                          </div>
                        </div>
                        <div className="form-group form-grid-full">
                          <label className="form-label">Roles & Experience Description</label>
                          <textarea
                            value={record.professionalExperiance}
                            onChange={(e) => handleProfessionalChange(index, 'professionalExperiance', e.target.value)}
                            className="form-textarea"
                            placeholder="Briefly describe your responsibilities and achievements..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="form-actions" style={{ padding: '24px 32px' }}>
          {activeTab === 'basic' ? (
            <Link key="cancel-edit" href={`/agents/${agent.uid}`} className="btn-secondary-custom">
              Cancel
            </Link>
          ) : (
            <button
              key="back-edit"
              type="button"
              onClick={handleBackTab}
              className="btn-secondary-custom"
            >
              Back
            </button>
          )}

          {activeTab !== 'professional' && (
            <button
              key="save-intermediate"
              type="submit"
              disabled={submitting}
              className="btn-secondary-custom"
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
          )}

          {activeTab === 'professional' ? (
            <button
              key="save-final"
              type="submit"
              disabled={submitting}
              className="btn-primary-custom"
            >
              {submitting ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          ) : (
            <button
              key="next-edit"
              type="button"
              onClick={handleNextTab}
              className="btn-primary-custom"
            >
              Next Page
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
