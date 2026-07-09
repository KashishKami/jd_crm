'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Comment } from '../types/comment';
import { formatDateDDMMYYYY } from '../lib/date';

interface CommentTimelineProps {
  comments: Comment[];
}

export default function CommentTimeline({ comments }: CommentTimelineProps) {
  // Sort comments chronologically (oldest first, newest last)
  const sortedComments = useMemo(() => {
    return [...comments].sort(
      (a, b) => new Date(a.commentCreatedDate).getTime() - new Date(b.commentCreatedDate).getTime()
    );
  }, [comments]);

  // The offset from the end (0 means showing latest, 1 is shifted left by 1, etc.)
  const [offsetFromEnd, setOffsetFromEnd] = useState(0);

  // Clamp offsetFromEnd so it's always valid for the current comment list
  const maxOffset = Math.max(0, sortedComments.length - 1);
  const clampedOffset = Math.min(offsetFromEnd, maxOffset);
  const activeIndex = sortedComments.length - 1 - clampedOffset;

  if (sortedComments.length === 0) {
    return (
      <div className="profile-main" style={{ padding: '24px', textAlign: 'center' }}>
        <p className="text-sm text-slate-400">No notes or comments have been recorded for this order yet.</p>
      </div>
    );
  }

  // Determine window of comments to display (up to 3 cards ending at activeIndex)
  const visibleCount = Math.min(3, sortedComments.length);
  const startIndex = Math.max(0, activeIndex - 2);
  const endIndex = Math.min(startIndex + 3, sortedComments.length);
  const visibleComments = sortedComments.slice(startIndex, endIndex);

  const canGoPrev = startIndex > 0;
  const canGoNext = endIndex < sortedComments.length;

  const handlePrev = () => {
    if (canGoPrev) {
      setOffsetFromEnd((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      setOffsetFromEnd((prev) => Math.max(0, prev - 1));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Navigation Toolbar */}
      {sortedComments.length > 3 && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-slate-500 font-semibold">
            Showing comments {startIndex + 1}-{endIndex} of {sortedComments.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              disabled={!canGoPrev}
              className={`btn-secondary-custom px-3 py-1 text-xs font-bold ${
                !canGoPrev ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100'
              }`}
              style={{ padding: '6px 12px', fontSize: '0.75rem', cursor: canGoPrev ? 'pointer' : 'not-allowed' }}
            >
              ← Previous
            </button>
            <button
              onClick={handleNext}
              disabled={!canGoNext}
              className={`btn-secondary-custom px-3 py-1 text-xs font-bold ${
                !canGoNext ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100'
              }`}
              style={{ padding: '6px 12px', fontSize: '0.75rem', cursor: canGoNext ? 'pointer' : 'not-allowed' }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Cards Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${visibleCount}, minmax(0, 1fr))`, gap: '16px' }}>
        {visibleComments.map((comment) => {
          const createdDate = new Date(comment.commentCreatedDate);
          const formattedDate = formatDateDDMMYYYY(createdDate);
          const formattedTime = createdDate.toLocaleTimeString('en-US', {
            timeZone: 'America/New_York',
            timeStyle: 'short',
          });

          return (
            <div
              key={comment.commentId}
              className="profile-main flex flex-col gap-4"
              style={{
                padding: '20px',
                border: '1px solid #cbd2d9',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                justifyContent: 'space-between',
                minHeight: '180px',
              }}
            >
              <div className="flex flex-col gap-3">
                {/* Header */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    {/* Agent Avatar */}
                    <div
                      className="flex items-center justify-center font-bold text-white bg-slate-400 rounded-full"
                      style={{ width: '32px', height: '32px', fontSize: '0.85rem', flexShrink: 0 }}
                    >
                      {comment.commentAgentName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900" style={{ fontSize: '0.85rem', margin: 0, lineHeight: 1.2 }}>
                        {comment.commentAgentName}
                      </h4>
                      <span className="text-slate-500" style={{ fontSize: '0.7rem' }}>
                        Agent ID: {comment.commentAgentId}
                      </span>
                    </div>
                  </div>
                  <div className="text-right" style={{ flexShrink: 0 }}>
                    <span className="font-bold text-slate-800 block" style={{ fontSize: '0.7rem' }}>
                      {formattedDate}
                    </span>
                    <span className="text-slate-400 block" style={{ fontSize: '0.65rem' }}>
                      {formattedTime}
                    </span>
                  </div>
                </div>

                {/* Comment Body */}
                <div
                  className="text-slate-700 whitespace-pre-line"
                  style={{ fontSize: '0.82rem', lineHeight: '1.4', wordBreak: 'break-word' }}
                >
                  {comment.comment}
                </div>
              </div>

              {/* Optional Image */}
              {comment.commentImage && (
                <div className="mt-2" style={{ maxWidth: '100%' }}>
                  <a
                    href={comment.commentImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-lg border border-slate-200 hover:border-slate-400 transition-colors"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={comment.commentImage}
                      alt="Uploaded comment attachment"
                      className="w-full h-auto object-cover max-h-32"
                    />
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
