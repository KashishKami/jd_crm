'use client';

import React, { useState, useEffect } from 'react';

interface Permission {
  permissionId: number;
  permissionName: string;
  permissionDescription: string | null;
}

interface PermissionMatrixProps {
  roleId: number;
  roleName: string;
  currentPermissionIds: number[];
  allPermissions: Permission[];
  onSaveSuccess: (updatedPermIds: number[], updatedName: string) => void;
}

// Group permissions by resource scope prefix
function groupPermissions(permissions: Permission[]): Record<string, Permission[]> {
  const groups: Record<string, Permission[]> = {};
  for (const perm of permissions) {
    const parts = perm.permissionName.split(':');
    const group = parts.length > 1 ? parts[0] : 'general';
    const label = group.charAt(0).toUpperCase() + group.slice(1);
    if (!groups[label]) groups[label] = [];
    groups[label].push(perm);
  }
  return groups;
}

export default function PermissionMatrix({
  roleId,
  roleName,
  currentPermissionIds,
  allPermissions,
  onSaveSuccess,
}: PermissionMatrixProps) {
  const [name, setName] = useState(roleName);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set(currentPermissionIds));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset when role changes
  useEffect(() => {
    setName(roleName);
    setSelectedIds(new Set(currentPermissionIds));
    setError(null);
    setSuccess(false);
  }, [roleId, roleName, currentPermissionIds]);

  const isSuperAdminRole = roleId === 1;
  const groups = groupPermissions(allPermissions);

  const superAdminPerm = allPermissions.find(p => p.permissionName === 'super-admin');

  const togglePerm = (permId: number) => {
    // Block toggle of super-admin for role 1
    if (isSuperAdminRole && superAdminPerm && permId === superAdminPerm.permissionId) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
    setSuccess(false);
  };

  const toggleGroup = (perms: Permission[]) => {
    const groupIds = perms
      .filter(p => !(isSuperAdminRole && superAdminPerm && p.permissionId === superAdminPerm.permissionId))
      .map(p => p.permissionId);
    const allChecked = groupIds.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allChecked) {
        groupIds.forEach(id => next.delete(id));
      } else {
        groupIds.forEach(id => next.add(id));
      }
      return next;
    });
    setSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`/api/settings/roles/${roleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          permissionIds: Array.from(selectedIds),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }
      setSuccess(true);
      onSaveSuccess(Array.from(selectedIds), name.trim());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="perm-matrix-wrapper">
      {/* Role name editor */}
      <div className="perm-matrix-header">
        <div className="perm-matrix-name-row">
          <label className="form-label" htmlFor={`role-name-${roleId}`}>Role Name</label>
          <input
            id={`role-name-${roleId}`}
            className="form-input perm-name-input"
            value={name}
            onChange={e => { setName(e.target.value); setSuccess(false); }}
            disabled={isSuperAdminRole}
          />
        </div>
        {isSuperAdminRole && (
          <div className="perm-lockout-notice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            <span>Super Admin role is locked. The <strong>super-admin</strong> permission cannot be removed.</span>
          </div>
        )}
      </div>

      {/* Permission groups */}
      <div className="perm-groups-list">
        {Object.entries(groups).map(([groupName, perms]) => {
          const groupIds = perms.map(p => p.permissionId);
          const filteredGroupIds = groupIds.filter(id =>
            !(isSuperAdminRole && superAdminPerm && id === superAdminPerm.permissionId)
          );
          const allChecked = filteredGroupIds.length > 0 && filteredGroupIds.every(id => selectedIds.has(id));
          const someChecked = filteredGroupIds.some(id => selectedIds.has(id));

          return (
            <div key={groupName} className="perm-group">
              <div className="perm-group-header" onClick={() => toggleGroup(perms)}>
                <input
                  type="checkbox"
                  className="perm-group-checkbox"
                  checked={allChecked}
                  ref={el => { if (el) el.indeterminate = !allChecked && someChecked; }}
                  onChange={() => toggleGroup(perms)}
                  onClick={e => e.stopPropagation()}
                  aria-label={`Select all ${groupName} permissions`}
                />
                <span className="perm-group-label">{groupName}</span>
                <span className="perm-group-count">{filteredGroupIds.filter(id => selectedIds.has(id)).length}/{perms.length}</span>
              </div>
              <div className="perm-items-grid">
                {perms.map(perm => {
                  const isLocked = isSuperAdminRole && superAdminPerm && perm.permissionId === superAdminPerm.permissionId;
                  return (
                    <label
                      key={perm.permissionId}
                      className={`perm-item ${isLocked ? 'perm-item-locked' : ''}`}
                      htmlFor={`perm-${perm.permissionId}`}
                    >
                      <input
                        id={`perm-${perm.permissionId}`}
                        type="checkbox"
                        className="perm-checkbox"
                        checked={selectedIds.has(perm.permissionId)}
                        onChange={() => togglePerm(perm.permissionId)}
                        disabled={!!isLocked}
                        aria-label={perm.permissionName}
                      />
                      <div className="perm-item-info">
                        <span className="perm-name">{perm.permissionName}</span>
                        {perm.permissionDescription && (
                          <span className="perm-desc">{perm.permissionDescription}</span>
                        )}
                      </div>
                      {isLocked && (
                        <svg className="perm-lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Feedback banners */}
      {error && (
        <div className="perm-banner perm-banner-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </div>
      )}
      {success && (
        <div className="perm-banner perm-banner-success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Permissions saved successfully!
        </div>
      )}

      {/* Save button */}
      <div className="perm-matrix-footer">
        <button
          className="btn-primary-custom"
          onClick={handleSave}
          disabled={saving}
          aria-label="Save permissions"
        >
          {saving ? (
            <>
              <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></span>
              Saving…
            </>
          ) : (
            <>
              <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Save Permissions
            </>
          )}
        </button>
      </div>
    </div>
  );
}
