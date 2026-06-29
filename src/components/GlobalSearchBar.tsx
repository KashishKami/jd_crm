'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface SuggestionItem {
  id: string;
  name: string;
  phone: string;
  crmOrderId: number | null;
}

export default function GlobalSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync state with URL parameter if present
  useEffect(() => {
    if (searchParams) {
      const q = searchParams.get('q');
      if (q) {
        setQuery(q);
      } else {
        setQuery('');
      }
    }
  }, [searchParams]);

  // Fetch suggestions
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          const items: SuggestionItem[] = [];
          const seen = new Set<string>();

          // Merge orders and customers, deduplicate by customer name and phone
          if (data.orders) {
            for (const order of data.orders) {
              if (order.customer) {
                let name = `${order.customer.firstName} ${order.customer.lastName}`;
                if (order.customer.firstName === order.customer.lastName) {
                  name = order.customer.firstName;
                }
                const phone = order.customer.customerPhone || 'No Phone';
                const key = `${name}-${phone}`.toLowerCase();
                if (!seen.has(key)) {
                  seen.add(key);
                  items.push({
                    id: `order-${order.crmOrderId}`,
                    name,
                    phone,
                    crmOrderId: order.crmOrderId,
                  });
                }
              }
            }
          }

          if (data.customers) {
            for (const customer of data.customers) {
              let name = `${customer.firstName} ${customer.lastName}`;
              if (customer.firstName === customer.lastName) {
                name = customer.firstName;
              }
              const phone = customer.customerPhone || 'No Phone';
              const key = `${name}-${phone}`.toLowerCase();
              if (!seen.has(key)) {
                seen.add(key);
                items.push({
                  id: `cust-${customer.customerId}`,
                  name,
                  phone,
                  crmOrderId: customer.crmOrderId,
                });
              }
            }
          }

          setSuggestions(items.slice(0, 5));
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSuggestionClick = (item: SuggestionItem) => {
    setIsOpen(false);
    if (item.crmOrderId) {
      router.push(`/orders/${item.crmOrderId}`);
    } else {
      router.push(`/search?q=${encodeURIComponent(item.name)}`);
    }
  };

  return (
    <div ref={dropdownRef} className="relative w-full global-search-container" style={{ zIndex: 1000, maxWidth: '280px' }}>
      <form onSubmit={handleSubmit} className="relative" style={{ display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search orders, customers..."
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          className="form-input"
          style={{
            paddingLeft: '32px',
            paddingRight: '28px',
            paddingTop: '6px',
            paddingBottom: '6px',
            fontSize: '0.8rem',
            borderRadius: '20px',
            border: '1px solid #cbd5e1',
            width: '100%',
            backgroundColor: '#f8fafc',
            outline: 'none',
            transition: 'all 0.2s ease',
          }}
        />
        <div className="absolute" style={{ left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {loading && (
          <div className="absolute" style={{ right: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
            <div className="spinner-mini" style={{ width: '10px', height: '10px', border: '2px solid #cbd5e1', borderTopColor: '#4b7ccd', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          </div>
        )}
      </form>

      {isOpen && query.trim() && (
        <div
          className="absolute"
          style={{
            top: '100%',
            left: 0,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            width: '320px', // slightly wider than search input to give text breathing room
            right: 0,
            overflow: 'hidden',
            marginTop: '4px',
          }}
        >
          {suggestions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {suggestions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSuggestionClick(item)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                  className="suggestion-item-row"
                >
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#1e293b',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: '1.4',
                    }}
                  >
                    {item.name}
                  </div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: '#64748b',
                      marginTop: '3px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: '1.2',
                    }}
                  >
                    {item.phone}
                  </div>
                </div>
              ))}
              <div
                onClick={() => {
                  setIsOpen(false);
                  router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                }}
                style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: '#f8fafc',
                  transition: 'background-color 0.15s ease',
                }}
                className="suggestion-item-view-all"
              >
                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#2563eb' }}>
                  View all results
                </span>
              </div>
            </div>
          ) : (
            <div style={{ padding: '12px 16px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No suggestions found</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
