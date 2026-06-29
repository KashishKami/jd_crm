import React from 'react';
import { Comment } from '../types/comment';
import { formatDateDDMMYYYY } from '../lib/date';

interface CommentTimelineProps {
  comments: Comment[];
}

export default function CommentTimeline({ comments }: CommentTimelineProps) {
  if (comments.length === 0) {
    return (
      <div className="profile-main" style={{ padding: '24px', textAlign: 'center' }}>
        <p className="text-sm text-slate-400">No notes or comments have been recorded for this order yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {comments.map((comment) => {
        const createdDate = new Date(comment.commentCreatedDate);
        const formattedDate = formatDateDDMMYYYY(createdDate);
        const formattedTime = createdDate.toLocaleTimeString('en-US', {
          timeStyle: 'short',
        });

        return (
          <div
            key={comment.commentId}
            className="profile-main flex flex-col gap-4"
            style={{ padding: '20px', border: '1px solid #cbd2d9', borderRadius: '12px' }}
          >
            {/* Header */}
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-3">
                {/* Agent Avatar Placeholder */}
                <div
                  className="flex items-center justify-center font-bold text-white bg-slate-400 rounded-full"
                  style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}
                >
                  {comment.commentAgentName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900" style={{ fontSize: '0.95rem', margin: 0 }}>
                    {comment.commentAgentName}
                  </h4>
                  <span className="text-slate-500" style={{ fontSize: '0.75rem' }}>
                    Agent ID: {comment.commentAgentId}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block" style={{ fontSize: '0.75rem' }}>
                  {formattedDate}
                </span>
                <span className="text-slate-400 block" style={{ fontSize: '0.7rem' }}>
                  {formattedTime}
                </span>
              </div>
            </div>

            {/* Comment Body */}
            <div className="text-slate-700 whitespace-pre-line" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
              {comment.comment}
            </div>

            {/* Optional Image */}
            {comment.commentImage && (
              <div className="mt-2" style={{ maxWidth: '300px' }}>
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
                    className="w-full h-auto object-cover max-h-48"
                  />
                </a>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
