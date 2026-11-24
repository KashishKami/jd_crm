// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import React, { useState } from 'react';
import SupplierContactPicker from '../components/SupplierContactPicker';

const contacts = [
  { contactId: 1, contactName: 'Clay' },
  { contactId: 2, contactName: 'Max' },
];

function Harness({ vendorId = '7', initial = '', currentName, onSubmit }: { vendorId?: string; initial?: string; currentName?: string; onSubmit?: () => void }) {
  const [value, setValue] = useState(initial);
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit?.(); }}>
      <SupplierContactPicker id="contact" vendorId={vendorId} value={value} onChange={setValue} currentName={currentName} />
      <output data-testid="value">{value}</output>
    </form>
  );
}

const mockFetch = (list = contacts) =>
  vi.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === 'POST') {
      const body = JSON.parse(String(init.body));
      return { ok: true, json: async () => ({ contactId: 99, contactName: body.contactName }) };
    }
    return { ok: true, json: async () => list };
  });

describe('SupplierContactPicker', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('asks for a supplier first and does not fetch', () => {
    const fetchMock = mockFetch();
    vi.stubGlobal('fetch', fetchMock);
    render(<Harness vendorId="" />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.disabled).toBe(true);
    expect(screen.getByText('Select a supplier first')).toBeDefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("lists the supplier's contacts and records the choice", async () => {
    const fetchMock = mockFetch();
    vi.stubGlobal('fetch', fetchMock);
    render(<Harness />);
    await screen.findByRole('option', { name: 'Max' });
    expect(fetchMock).toHaveBeenCalledWith('/api/vendors/7/contacts');
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect([...select.options].map(o => o.textContent)).toEqual(['— Not recorded —', 'Clay', 'Max', '+ Add new contact…']);
    fireEvent.change(select, { target: { value: '2' } });
    expect(screen.getByTestId('value').textContent).toBe('2');
  });

  it('adds a new contact inline without submitting the order form', async () => {
    const fetchMock = mockFetch();
    vi.stubGlobal('fetch', fetchMock);
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    await screen.findByRole('option', { name: 'Max' });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '__new__' } });

    const input = screen.getByLabelText('New supplier contact name');
    fireEvent.change(input, { target: { value: 'June' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => expect(screen.getByTestId('value').textContent).toBe('99'));
    expect(onSubmit).not.toHaveBeenCalled();
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')!;
    expect(post[0]).toBe('/api/vendors/7/contacts');
    expect(JSON.parse(String(post[1]!.body))).toEqual({ contactName: 'June' });
  });

  it('shows an error from the server and lets you cancel', async () => {
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) =>
      init?.method === 'POST'
        ? { ok: false, json: async () => ({ error: 'Forbidden: Insufficient Permissions' }) }
        : { ok: true, json: async () => contacts }));
    render(<Harness />);
    await screen.findByRole('option', { name: 'Max' });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '__new__' } });
    fireEvent.change(screen.getByLabelText('New supplier contact name'), { target: { value: 'June' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(await screen.findByRole('alert')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('combobox')).toBeDefined();
    expect(screen.getByTestId('value').textContent).toBe('');
  });

  it('still shows a saved contact that has since been deactivated', async () => {
    vi.stubGlobal('fetch', mockFetch());
    render(<Harness initial="5" currentName="Old Bob" />);
    const opt = await screen.findByRole('option', { name: 'Old Bob (deactivated)' });
    expect((opt as HTMLOptionElement).selected).toBe(true);
  });
});
