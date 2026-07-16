'use client';

import React from 'react';
import Link from 'next/link';
import { useFollowUpNotifications } from '../lib/useFollowUpNotifications';

export default function GlobalFollowUpNotifications() {
  const { activeNotifications, dismissNotification } = useFollowUpNotifications();

  if (activeNotifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-4 max-w-[400px] w-full">
      {activeNotifications.map((notif) => (
        <div
          key={notif.followUpId}
          className="bg-white dark:bg-slate-900 border border-black dark:border-black rounded-[16px] shadow-2xl flex flex-col transition-all duration-300 hover:scale-[1.02] animate-slide-in-right overflow-hidden w-full"
          style={{ padding: '16px 18px', gap: '10px' }}
        >
          {/* Header Row */}
          <div className="flex items-center justify-between">
            {/* Pill Badge */}
            <div
              className="inline-flex items-center bg-[#fff3e0] dark:bg-[#ff5722]/10 text-[#e65100] dark:text-[#ff8a65] rounded-full text-[9px] font-bold uppercase tracking-wider"
              style={{ padding: '2px 8px', gap: '3px' }}
            >
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3" />
              </svg>
              Follow-Up Due
            </div>

            {/* Dismiss X */}
            <div className="flex items-center">
              <button
                onClick={() => dismissNotification(notif.followUpId)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-350 transition-colors p-0.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Heading, Subtitle & Jumping Bell */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col" style={{ gap: '3px' }}>
              <h3 className="text-[#0f172a] dark:text-slate-100 text-sm font-extrabold tracking-tight" style={{ margin: 0 }}>
                Follow-Up Due!
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed" style={{ margin: 0 }}>
                <span className="text-[#4b7ccd] dark:text-[#60a5fa] font-bold">{notif.customerName}</span> is waiting for a call.
              </p>
            </div>

            {/* Bouncing Bell icon with circle bg right below the cross button */}
            <div className="w-11 h-11 rounded-full bg-[#fff8f5] dark:bg-orange-950/20 border border-orange-100 dark:border-orange-500/10 flex items-center justify-center shadow-sm shrink-0">
              <svg className="w-5 h-5 text-[#ff5722] animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          </div>

          {/* Two-Column Info Card */}
          <div
            className="bg-[#f8fafc] dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 rounded-xl flex items-center justify-between gap-3"
            style={{ padding: '8px 12px' }}
          >
            {/* Left Column - Part */}
            <div className="flex-1 flex items-center gap-2">
              <div className="bg-[#eff6ff] dark:bg-blue-950/40 text-[#2563eb] dark:text-[#60a5fa] p-1.5 rounded-md shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <span className="block text-slate-400 dark:text-slate-500 text-[9px] font-semibold uppercase tracking-wider">Part</span>
                <span className="block text-slate-800 dark:text-slate-200 font-extrabold text-[11px] mt-0.5">{notif.partRequired}</span>
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 shrink-0" />

            {/* Right Column - Scheduled */}
            <div className="flex-1 flex items-center gap-2">
              <div className="bg-[#f0fdf4] dark:bg-green-950/40 text-[#16a34a] dark:text-[#4ade80] p-1.5 rounded-md shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <span className="block text-slate-400 dark:text-slate-500 text-[9px] font-semibold uppercase tracking-wider">Scheduled</span>
                <span className="block text-slate-800 dark:text-slate-200 font-extrabold text-[11px] mt-0.5">{notif.followUpTime}</span>
              </div>
            </div>
          </div>

          {/* Bottom Actions Row */}
          <div className="flex items-center gap-2.5" style={{ marginTop: '2px' }}>
            <Link
              href={`/follow-ups/${notif.followUpId}`}
              onClick={() => dismissNotification(notif.followUpId)}
              className="flex-1 !inline-flex items-center justify-center gap-1.5 !bg-[#4b7ccd] hover:!bg-[#3b66ab] text-white rounded-xl text-[11px] font-bold shadow-lg shadow-blue-500/10 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
              style={{ padding: '6px 12px' }}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Show Details
              <svg className="w-3 h-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <button
              onClick={() => dismissNotification(notif.followUpId)}
              className="flex-1 !inline-flex items-center justify-center gap-1.5 !bg-white hover:!bg-slate-50 dark:!bg-slate-800 dark:hover:!bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-[11px] font-bold border border-slate-200 dark:border-slate-750 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
              style={{ padding: '6px 12px' }}
            >
              <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
