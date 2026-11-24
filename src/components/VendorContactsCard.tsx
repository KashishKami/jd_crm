'use client';

import React, { useCallback, useEffect, useState } from 'react';

export interface VendorContact {
  contactId: number;
  vendorId: number;
  contactName: string;
  contactPhone: string | null;
  contactEmail: string | null;
  contactStatus: number;
  orderCount?: number;
}

interface VendorContactsCardProps {
  vendorId: number;
  /** Can add contacts (order creators/editors and vendor editors) */
  canAdd: boolean;
  /** Can rename and deactivate contacts (vendors:edit) */
  canManage: boolean;
}

const emptyDraft = { contactName: '', contactPhone: '', contactEmail: '' };

export default function VendorContactsCard({ vendorId, canAdd, canManage }: VendorContactsCardProps) {
  const [contacts, setContacts] = useState<VendorContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const qs = canManage ? '?includeInactive=1' : '';
        const res = await fetch(`/api/vendors/${vendorId}/contacts${qs}`);
        if (!res.ok) throw new Error('Could not load contacts');
        const data: VendorContact[] = await res.json();
        if (active) {
          setContacts(data);
          setError(null);
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [vendorId, canManage, reloadKey]);

  const reload = useCallback(() => setReloadKey(k => k + 1), []);

  const send = async (url: string, method: 'POST' | 'PATCH', body: object) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save contact');
      reload();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const addContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.contactName.trim()) return;
    if (await send(`/api/vendors/${vendorId}/contacts`, 'POST', draft)) {
      setDraft(emptyDraft);
      setAdding(false);
    }
  };

  const saveEdit = async (contactId: number) => {
    if (await send(`/api/vendors/${vendorId}/contacts/${contactId}`, 'PATCH', editDraft)) setEditingId(null);
  };

  const setStatus = (c: VendorContact, status: number) => send(`/api/vendors/${vendorId}/contacts/${c.contactId}`, 'PATCH', { contactStatus: status });

  const active = contacts.filter(c => c.contactStatus === 1);
  const inactive = contacts.filter(c => c.contactStatus !== 1);
  const visible = showInactive ? contacts : active;

  return (
    <div className="form-card vc-card" style={{ padding: '24px', marginBottom: '20px', width: '100%', boxSizing: 'border-box', fontFamily: 'Georgia, serif' }}>
      <div className="vc-head">
        <div>
          <h3 className="vc-title">Contacts</h3>
          <p className="vc-sub">People we deal with at this supplier. Pick one on each order part to record who supplied it.</p>
        </div>
        <div className="vc-head-actions">
          {canManage && inactive.length > 0 && (
            <label className="vc-toggle">
              <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
              Show deactivated ({inactive.length})
            </label>
          )}
          {canAdd && !adding && (
            <button type="button" className="vc-btn vc-btn-primary" onClick={() => setAdding(true)}>
              + Add contact
            </button>
          )}
        </div>
      </div>

      {error && <div className="vc-error" role="alert">{error}</div>}

      {adding && (
        <form className="vc-form" onSubmit={addContact}>
          <input
            className="form-input"
            placeholder="Name *"
            aria-label="Contact name"
            value={draft.contactName}
            onChange={e => setDraft({ ...draft, contactName: e.target.value })}
            autoFocus
            required
          />
          <input className="form-input" placeholder="Phone (optional)" aria-label="Contact phone" value={draft.contactPhone} onChange={e => setDraft({ ...draft, contactPhone: e.target.value })} />
          <input className="form-input" placeholder="Email (optional)" aria-label="Contact email" value={draft.contactEmail} onChange={e => setDraft({ ...draft, contactEmail: e.target.value })} />
          <div className="vc-form-actions">
            <button type="submit" className="vc-btn vc-btn-primary" disabled={saving || !draft.contactName.trim()}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" className="vc-btn" onClick={() => { setAdding(false); setDraft(emptyDraft); }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="vc-empty">Loading contacts…</div>
      ) : visible.length === 0 ? (
        <div className="vc-empty">No contacts yet{canAdd ? ' — add the people you deal with here.' : '.'}</div>
      ) : (
        <ul className="vc-list">
          {visible.map(c =>
            editingId === c.contactId ? (
              <li key={c.contactId} className="vc-row vc-row-editing">
                <input className="form-input" aria-label="Contact name" value={editDraft.contactName} onChange={e => setEditDraft({ ...editDraft, contactName: e.target.value })} />
                <input className="form-input" aria-label="Contact phone" placeholder="Phone" value={editDraft.contactPhone} onChange={e => setEditDraft({ ...editDraft, contactPhone: e.target.value })} />
                <input className="form-input" aria-label="Contact email" placeholder="Email" value={editDraft.contactEmail} onChange={e => setEditDraft({ ...editDraft, contactEmail: e.target.value })} />
                <div className="vc-form-actions">
                  <button type="button" className="vc-btn vc-btn-primary" disabled={saving || !editDraft.contactName.trim()} onClick={() => saveEdit(c.contactId)}>
                    Save
                  </button>
                  <button type="button" className="vc-btn" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </div>
              </li>
            ) : (
              <li key={c.contactId} className={`vc-row ${c.contactStatus !== 1 ? 'vc-row-inactive' : ''}`}>
                <div className="vc-avatar" aria-hidden="true">{c.contactName[0]?.toUpperCase()}</div>
                <div className="vc-info">
                  <div className="vc-name">
                    {c.contactName}
                    {c.contactStatus !== 1 && <span className="vc-badge">Deactivated</span>}
                  </div>
                  <div className="vc-details">
                    {c.contactPhone && <span className="font-mono">{c.contactPhone}</span>}
                    {c.contactEmail && <span>{c.contactEmail}</span>}
                    <span>{c.orderCount ?? 0} order{c.orderCount === 1 ? '' : 's'}</span>
                  </div>
                </div>
                {canManage && (
                  <div className="vc-actions">
                    {c.contactStatus === 1 ? (
                      <>
                        <button
                          type="button"
                          className="vc-link"
                          onClick={() => {
                            setEditingId(c.contactId);
                            setEditDraft({ contactName: c.contactName, contactPhone: c.contactPhone || '', contactEmail: c.contactEmail || '' });
                          }}
                        >
                          Edit
                        </button>
                        <button type="button" className="vc-link vc-link-danger" disabled={saving} onClick={() => setStatus(c, 0)}>
                          Deactivate
                        </button>
                      </>
                    ) : (
                      <button type="button" className="vc-link" disabled={saving} onClick={() => setStatus(c, 1)}>
                        Reactivate
                      </button>
                    )}
                  </div>
                )}
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
