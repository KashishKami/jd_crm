'use client';

import React, { useEffect, useState } from 'react';

interface ContactOption {
  contactId: number;
  contactName: string;
}

interface SupplierContactPickerProps {
  id: string;
  /** Selected supplier's vendorId ('' when none) */
  vendorId: string;
  /** Selected contactId ('' when none) */
  value: string;
  onChange: (contactId: string) => void;
  /** Name saved on the order, so a since-deactivated contact still shows */
  currentName?: string | null;
  /** Whether this user may add a new contact from the form */
  canAdd?: boolean;
  disabled?: boolean;
}

const NEW = '__new__';

export default function SupplierContactPicker({ id, vendorId, value, onChange, currentName, canAdd = true, disabled = false }: SupplierContactPickerProps) {
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [loadedFor, setLoadedFor] = useState<string>('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!vendorId) return;
    let active = true;
    const run = async () => {
      try {
        const res = await fetch(`/api/vendors/${vendorId}/contacts`);
        if (!res.ok) throw new Error('Could not load contacts');
        const data: ContactOption[] = await res.json();
        if (active) {
          setContacts(data);
          setLoadedFor(vendorId);
          setLoadError(null);
        }
      } catch (e) {
        if (active) {
          setLoadError((e as Error).message);
          setLoadedFor(vendorId);
        }
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [vendorId, refreshKey]);

  const loading = !!vendorId && loadedFor !== vendorId;
  const list = vendorId && loadedFor === vendorId ? contacts : [];
  // Keep showing the saved contact even if it has since been deactivated
  const missingSelected = value && !list.some(c => String(c.contactId) === value);

  const saveNew = async () => {
    const name = newName.trim();
    if (!name || !vendorId) return;
    setSaving(true);
    setAddError(null);
    try {
      const res = await fetch(`/api/vendors/${vendorId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactName: name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not add contact');
      setContacts(prev => (prev.some(c => c.contactId === data.contactId) ? prev : [...prev, data].sort((a, b) => a.contactName.localeCompare(b.contactName))));
      onChange(String(data.contactId));
      setAdding(false);
      setNewName('');
      setRefreshKey(k => k + 1);
    } catch (e) {
      setAddError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (adding) {
    return (
      <div className="scp-add">
        <div className="scp-add-row">
          <input
            id={id}
            className="form-input"
            placeholder="Contact name, e.g. Max"
            aria-label="New supplier contact name"
            value={newName}
            autoFocus
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              // Enter adds the contact instead of submitting the whole order form
              if (e.key === 'Enter') {
                e.preventDefault();
                saveNew();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                setAdding(false);
              }
            }}
          />
          <button type="button" className="scp-btn scp-btn-primary" onClick={saveNew} disabled={saving || !newName.trim()}>
            {saving ? 'Adding…' : 'Add'}
          </button>
          <button type="button" className="scp-btn" onClick={() => { setAdding(false); setNewName(''); setAddError(null); }}>
            Cancel
          </button>
        </div>
        {addError && <p className="scp-error" role="alert">{addError}</p>}
      </div>
    );
  }

  return (
    <>
      <select
        id={id}
        className="form-select"
        style={{ width: '100%', minWidth: 0 }}
        value={missingSelected && !currentName ? '' : value}
        disabled={disabled || !vendorId || loading}
        onChange={e => {
          if (e.target.value === NEW) {
            setAdding(true);
            return;
          }
          onChange(e.target.value);
        }}
      >
        {!vendorId ? (
          <option value="">Select a supplier first</option>
        ) : loading ? (
          <option value={value}>Loading contacts…</option>
        ) : (
          <>
            <option value="">— Not recorded —</option>
            {missingSelected && currentName && <option value={value}>{currentName} (deactivated)</option>}
            {list.map(c => (
              <option key={c.contactId} value={String(c.contactId)}>
                {c.contactName}
              </option>
            ))}
            {canAdd && <option value={NEW}>+ Add new contact…</option>}
          </>
        )}
      </select>
      {loadError && <p className="scp-error" role="alert">{loadError}</p>}
    </>
  );
}
