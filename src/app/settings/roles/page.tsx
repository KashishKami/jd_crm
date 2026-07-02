/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { hasPermission } from '../../../service/permission.service';
import PermissionMatrix from '../../../components/settings/PermissionMatrix';

interface Role {
  roleId: number;
  roleName: string;
  permissionIds: number[];
}

interface Permission {
  permissionId: number;
  permissionName: string;
  permissionDescription: string | null;
}

export default function RoleSettingsPage() {
  const { data: session } = useSession();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const canManage = hasPermission(session?.user?.userPermissions, 'settings:manage-permissions');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        fetch('/api/settings/roles'),
        fetch('/api/settings/permissions'),
      ]);
      if (!rolesRes.ok || !permsRes.ok) throw new Error('Failed to fetch settings data');
      const [rolesData, permsData] = await Promise.all([rolesRes.json(), permsRes.json()]);
      setRoles(rolesData);
      setPermissions(permsData);
      setSelectedRoleId(prev => {
        if (prev === null && rolesData.length > 0) {
          return rolesData[0].roleId;
        }
        return prev;
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedRole = roles.find(r => r.roleId === selectedRoleId) ?? null;

  const handlePermSaveSuccess = (updatedPermIds: number[], updatedName: string) => {
    setRoles(prev =>
      prev.map(r =>
        r.roleId === selectedRoleId
          ? { ...r, roleName: updatedName, permissionIds: updatedPermIds }
          : r
      )
    );
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch('/api/settings/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRoleName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create role');
      }
      const created = await res.json();
      const newRole: Role = { roleId: created.roleId, roleName: created.roleName, permissionIds: [] };
      setRoles(prev => [...prev, newRole]);
      setSelectedRoleId(newRole.roleId);
      setNewRoleName('');
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!window.confirm('Delete this role? This cannot be undone.')) return;
    setDeletingId(roleId);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/settings/roles/${roleId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete role');
      }
      setRoles(prev => prev.filter(r => r.roleId !== roleId));
      if (selectedRoleId === roleId) {
        const remaining = roles.filter(r => r.roleId !== roleId);
        setSelectedRoleId(remaining.length > 0 ? remaining[0].roleId : null);
      }
    } catch (err) {
      setDeleteError((err as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  if (!canManage) {
    return (
      <div className="agents-page-container">
        <div className="error-box">
          <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p>You do not have permission to manage role settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="agents-page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Roles and Permissions</h1>
          <p className="page-subtitle">Configure what each role is allowed to access across the CRM.</p>
        </div>
      </div>

      {loading && (
        <div className="loader-box"><div className="spinner"></div><p>Loading settings…</p></div>
      )}

      {error && (
        <div className="error-box">
          <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
          </svg>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="settings-layout">
          {/* Left Sidebar: Roles List */}
          <aside className="settings-sidebar">
            <div className="settings-sidebar-header">
              <span>Roles</span>
              <span className="perm-group-count">{roles.length}</span>
            </div>

            <ul className="settings-roles-list">
              {roles.map(role => (
                <li key={role.roleId}>
                  <div
                    className={`settings-role-btn ${selectedRoleId === role.roleId ? 'active' : ''}`}
                    onClick={() => setSelectedRoleId(role.roleId)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setSelectedRoleId(role.roleId)}
                  >
                    <span className="settings-role-avatar">{role.roleName[0]?.toUpperCase()}</span>
                    <span className="settings-role-name">{role.roleName}</span>
                    {role.roleId > 2 && (
                      <button
                        className="settings-role-delete-btn"
                        onClick={e => { e.stopPropagation(); handleDeleteRole(role.roleId); }}
                        disabled={deletingId === role.roleId}
                        aria-label={`Delete ${role.roleName} role`}
                        title="Delete Role"
                      >
                        {deletingId === role.roleId ? '…' : '×'}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {deleteError && (
              <div className="perm-banner perm-banner-error" style={{ margin: '8px 12px', fontSize: '0.78rem' }}>
                {deleteError}
              </div>
            )}

            {/* Add new role */}
            <div className="settings-add-role">
              <p className="settings-add-role-label">Add New Role</p>
              <div className="settings-add-role-row">
                <input
                  className="form-input"
                  style={{ flex: 1, fontSize: '0.85rem', padding: '8px 10px' }}
                  placeholder="Role name…"
                  value={newRoleName}
                  onChange={e => { setNewRoleName(e.target.value); setCreateError(null); }}
                  onKeyDown={e => e.key === 'Enter' && handleCreateRole()}
                />
                <button
                  className="btn-primary-custom"
                  style={{ padding: '8px 14px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                  onClick={handleCreateRole}
                  disabled={creating || !newRoleName.trim()}
                >
                  {creating ? '…' : '+ Add'}
                </button>
              </div>
              {createError && (
                <p className="settings-create-error">{createError}</p>
              )}
            </div>
          </aside>

          {/* Right Panel: Permissions Matrix */}
          <main className="settings-main-panel">
            {selectedRole ? (
              <PermissionMatrix
                key={selectedRole.roleId}
                roleId={selectedRole.roleId}
                roleName={selectedRole.roleName}
                currentPermissionIds={selectedRole.permissionIds}
                allPermissions={permissions}
                onSaveSuccess={handlePermSaveSuccess}
              />
            ) : (
              <div className="loader-box" style={{ minHeight: '300px' }}>
                <p style={{ color: 'var(--text-muted)' }}>Select a role from the left panel to manage its permissions.</p>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
