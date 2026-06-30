'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { hasPermission } from '../service/permission.service';
import { Customer, CustomerCard } from '../types/customer';
import { fadeInPage, staggerEntrance } from '../lib/animations';
import { gsap } from 'gsap';
import CustomerCards from './CustomerCards';

export default function CustomerList() {
  const { data: session, status } = useSession();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>('');
  const [cards, setCards] = useState<CustomerCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardsError, setCardsError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const tableRowsRef = useRef<HTMLTableSectionElement>(null);
  const cardsPanelRef = useRef<HTMLDivElement>(null);

  const permissions = session?.user?.userPermissions || '';
  const canViewCards = hasPermission(permissions, 'customers:view-cards');

  // Fetch customers
  useEffect(() => {
    if (status !== 'authenticated') return;

    let active = true;
    const fetchCustomers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/customers');
        if (!res.ok) {
          throw new Error(`Failed to fetch customers: ${res.statusText}`);
        }
        const data = await res.json();
        if (active) {
          setCustomers(data);
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'An error occurred';
        if (active) {
          setError(errMsg);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchCustomers();

    return () => {
      active = false;
    };
  }, [status]);

  // Page entrance animation
  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      fadeInPage(containerRef.current!);
    });
    return () => ctx.revert();
  }, []);

  // Stagger table rows when customer data loads
  useEffect(() => {
    if (tableRowsRef.current && customers.length > 0) {
      const rows = tableRowsRef.current.querySelectorAll('tr');
      const ctx = gsap.context(() => {
        staggerEntrance(rows);
      });
      return () => ctx.revert();
    }
  }, [customers]);

  // Fetch cards when selectedCustomerId changes
  useEffect(() => {
    if (!selectedCustomerId) {
      return;
    }

    let active = true;
    const fetchCards = async () => {
      setCardsLoading(true);
      setCardsError(null);
      try {
        const res = await fetch(`/api/customers/${selectedCustomerId}/cards`);
        if (!res.ok) {
          throw new Error('Failed to fetch customer card details.');
        }
        const data = await res.json();
        if (active) {
          setCards(data);
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Error fetching cards';
        if (active) {
          setCardsError(errMsg);
        }
      } finally {
        if (active) {
          setCardsLoading(false);
        }
      }
    };

    fetchCards();

    return () => {
      active = false;
    };
  }, [selectedCustomerId]);

  // Animate cards panel when loaded
  useEffect(() => {
    if (cardsPanelRef.current && cards.length > 0) {
      const ctx = gsap.context(() => {
        fadeInPage(cardsPanelRef.current!);
      });
      return () => ctx.revert();
    }
  }, [cards]);

  const selectCustomer = (customerId: number, customerName: string) => {
    setSelectedCustomerId(customerId);
    setSelectedCustomerName(customerName);
    setCards([]);
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 md:p-8" style={{ opacity: 0 }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Customer Directory</h1>
          <p className="text-sm text-slate-500 mt-1">View customers and manage sensitive card billing records</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Customer List Column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm">Loading customer directory...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500 bg-red-50/50">
                <p className="font-semibold">Error loading directory</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            ) : customers.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <p className="font-medium">No customers found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-600">
                      <th className="py-4 px-6">Customer Name</th>
                      <th className="py-4 px-6">Email</th>
                      <th className="py-4 px-6">Phone</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody ref={tableRowsRef}>
                    {customers.map((customer) => (
                      <tr 
                        key={customer.customerId}
                        style={{ opacity: 0 }}
                        className={`border-b last:border-0 border-slate-100/80 hover:bg-slate-50/50 transition-colors cursor-pointer ${
                          selectedCustomerId === customer.customerId ? 'bg-blue-50/20' : ''
                        }`}
                        onClick={() => selectCustomer(customer.customerId, customer.customerName)}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-700 text-sm border border-slate-200/50">
                              {customer.customerName[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{customer.customerName}</div>
                              <div className="text-xs text-slate-400">ID: {customer.customerId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-600 font-mono">
                          {customer.customerEmail}
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-500 font-mono">
                          {customer.customerPhone || '—'}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              selectCustomer(customer.customerId, customer.customerName);
                            }}
                            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                              selectedCustomerId === customer.customerId
                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            View Cards
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Selected Customer Card Details Column */}
        <div className="flex flex-col gap-4">
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/60 flex flex-col gap-4 sticky top-6">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Billing & Ledger</h3>
              <p className="text-xs text-slate-400 mt-0.5">Sensitive details require appropriate authorization clearances</p>
            </div>

            {!selectedCustomerId ? (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-300/80 rounded-xl bg-white/40 text-center min-h-[220px]">
                <svg className="w-10 h-10 text-slate-400 mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                <p className="text-xs text-slate-500 font-medium">No Customer Selected</p>
                <p className="text-[11px] text-slate-400 mt-1">Select a customer from the directory to review card details.</p>
              </div>
            ) : (
              <div ref={cardsPanelRef} className="flex flex-col gap-4" style={{ opacity: 0 }}>
                <div className="border-b border-slate-200/80 pb-3 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{selectedCustomerName}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    canViewCards 
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/25' 
                      : 'bg-amber-500/10 text-amber-500 border border-amber-500/25'
                  }`}>
                    {canViewCards ? 'Full Card Access' : 'Masked Card Mode'}
                  </span>
                </div>

                {cardsLoading ? (
                  <div className="flex items-center justify-center p-12 text-slate-500">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span className="text-xs">Fetching card data...</span>
                  </div>
                ) : cardsError ? (
                  <div className="p-4 text-center text-xs text-red-500 bg-red-50 rounded-lg">
                    {cardsError}
                  </div>
                ) : (
                  <CustomerCards cards={cards} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
