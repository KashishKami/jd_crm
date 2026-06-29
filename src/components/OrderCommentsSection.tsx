'use client';

import React, { useState, useEffect, useCallback } from 'react';
import CommentTimeline from './CommentTimeline';
import AddCommentForm from './AddCommentForm';
import { Comment } from '../types/comment';

interface OrderCommentsSectionProps {
  orderId: number;
}

export default function OrderCommentsSection({ orderId }: OrderCommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/comments`);
      if (!res.ok) {
        throw new Error('Failed to load comments');
      }
      const data = await res.json();
      setComments(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching comments');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchComments();
  }, [fetchComments]);

  const handleSubmitComment = async (formData: FormData): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/comments`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit comment');
      }

      await fetchComments();
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit comment');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="form-section-title" style={{ fontSize: '1.25rem', marginBottom: '8px' }}>
        Activity Log & Notes
      </h2>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-400">Loading notes...</p>
      ) : (
        <CommentTimeline comments={comments} />
      )}

      <AddCommentForm onSubmit={handleSubmitComment} isSubmitting={isSubmitting} />
    </div>
  );
}
