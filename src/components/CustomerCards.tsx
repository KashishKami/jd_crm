'use client';

import React from 'react';
import { CustomerCard } from '../types/customer';

interface CustomerCardsProps {
  cards: CustomerCard[];
}

export default function CustomerCards({ cards }: CustomerCardsProps) {
  if (!cards || cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-200 rounded-xl bg-white/50 text-center">
        <svg className="w-12 h-12 text-slate-400 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
        <p className="text-slate-500 font-medium">No payment cards registered</p>
        <p className="text-slate-400 text-sm mt-1">This customer has no credit card records on file.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {cards.map((card) => (
        <div
          key={card.cardId}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border border-white/10"
        >
          {/* Card Glassmorphic Overlay */}
          <div className="absolute inset-0 bg-white/[0.02] pointer-events-none" />

          {/* Card Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Payment Ledger</span>
              <h4 className="text-sm font-medium text-slate-200 mt-0.5 truncate max-w-[200px]">{card.customerNameOncard}</h4>
            </div>
            {/* Card Chip Mockup */}
            <div className="w-10 h-7 bg-gradient-to-r from-amber-400 to-amber-200 rounded-md opacity-80 shadow-inner relative flex items-center justify-center">
              <div className="absolute inset-1 border border-amber-500/20 rounded" />
              <div className="w-full h-px bg-amber-600/30 absolute top-1/2 left-0" />
              <div className="w-px h-full bg-amber-600/30 absolute left-1/3 top-0" />
              <div className="w-px h-full bg-amber-600/30 absolute left-2/3 top-0" />
            </div>
          </div>

          {/* Card Number */}
          <div className="mb-6">
            <span className="text-xs text-slate-500 block mb-1">Card Number</span>
            <div className="text-xl font-mono tracking-widest text-slate-100 font-medium">
              {card.customerCardNumber}
            </div>
          </div>

          {/* Card Footer Info */}
          <div className="flex justify-between items-end">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 block mb-0.5">Expiry Date</span>
              <span className="font-mono text-sm text-slate-200">{card.customerCardExpDate}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 block mb-0.5">CVV</span>
              <span className="font-mono text-sm text-slate-200">CVV: {card.customerCardCvv || '***'}</span>
            </div>
          </div>

          {/* Audit Badges */}
          {(card.customerCardCopyStatus || card.customerCardPhotoStatus) && (
            <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
              {card.customerCardCopyStatus && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  card.customerCardCopyStatus === 'Verified' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  Copy: {card.customerCardCopyStatus}
                </span>
              )}
              {card.customerCardPhotoStatus && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  card.customerCardPhotoStatus === 'Verified' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  Photo: {card.customerCardPhotoStatus}
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
