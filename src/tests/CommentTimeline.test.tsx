// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import CommentTimeline from '../components/CommentTimeline';
import AddCommentForm from '../components/AddCommentForm';
import { Comment } from '../types/comment';

afterEach(() => {
  cleanup();
});

describe('CommentTimeline Component Unit Tests', () => {
  it('should render comments with correct details and images if present', () => {
    const mockComments: Comment[] = [
      {
        commentId: 1,
        customerId: 1,
        orderId: 10,
        comment: 'This is the first comment',
        commentImage: null,
        commentAgentId: 2,
        commentAgentName: 'Agent Nickname',
        commentCreatedDate: '2026-06-29T10:00:00Z',
        commentUpdatedDate: null,
      },
      {
        commentId: 2,
        customerId: 1,
        orderId: 10,
        comment: 'This is a comment with an image',
        commentImage: '/uploads/comments/receipt.png',
        commentAgentId: 2,
        commentAgentName: 'Agent Nickname',
        commentCreatedDate: '2026-06-29T11:00:00Z',
        commentUpdatedDate: null,
      },
    ];

    render(<CommentTimeline comments={mockComments} />);

    expect(screen.getByText('This is the first comment')).not.toBeNull();
    expect(screen.getByText('This is a comment with an image')).not.toBeNull();
    expect(screen.getAllByText('Agent Nickname').length).toBe(2);

    // Check image element
    const imgElements = screen.getAllByRole('img');
    expect(imgElements.length).toBe(1);
    expect(imgElements[0].getAttribute('src')).toBe('/uploads/comments/receipt.png');
  });

  it('should support carousel card sliding for comments exceeding 3 items', () => {
    const mockComments: Comment[] = [
      {
        commentId: 1,
        customerId: 1,
        orderId: 10,
        comment: 'Comment 1 (oldest)',
        commentImage: null,
        commentAgentId: 2,
        commentAgentName: 'Agent A',
        commentCreatedDate: '2026-06-29T10:00:00Z',
        commentUpdatedDate: null,
      },
      {
        commentId: 2,
        customerId: 1,
        orderId: 10,
        comment: 'Comment 2',
        commentImage: null,
        commentAgentId: 2,
        commentAgentName: 'Agent A',
        commentCreatedDate: '2026-06-29T11:00:00Z',
        commentUpdatedDate: null,
      },
      {
        commentId: 3,
        customerId: 1,
        orderId: 10,
        comment: 'Comment 3',
        commentImage: null,
        commentAgentId: 2,
        commentAgentName: 'Agent A',
        commentCreatedDate: '2026-06-29T12:00:00Z',
        commentUpdatedDate: null,
      },
      {
        commentId: 4,
        customerId: 1,
        orderId: 10,
        comment: 'Comment 4 (newest)',
        commentImage: null,
        commentAgentId: 2,
        commentAgentName: 'Agent A',
        commentCreatedDate: '2026-06-29T13:00:00Z',
        commentUpdatedDate: null,
      },
    ];

    render(<CommentTimeline comments={mockComments} />);

    // Initially should show comments 2, 3, 4. Comment 1 is hidden
    expect(screen.queryByText('Comment 1 (oldest)')).toBeNull();
    expect(screen.getByText('Comment 2')).not.toBeNull();
    expect(screen.getByText('Comment 3')).not.toBeNull();
    expect(screen.getByText('Comment 4 (newest)')).not.toBeNull();

    // Click Previous to show comments 1, 2, 3
    const prevBtn = screen.getByRole('button', { name: /previous/i });
    fireEvent.click(prevBtn);

    expect(screen.getByText('Comment 1 (oldest)')).not.toBeNull();
    expect(screen.getByText('Comment 2')).not.toBeNull();
    expect(screen.getByText('Comment 3')).not.toBeNull();
    expect(screen.queryByText('Comment 4 (newest)')).toBeNull();

    // Click Next to show comments 2, 3, 4 again
    const nextBtn = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextBtn);

    expect(screen.queryByText('Comment 1 (oldest)')).toBeNull();
    expect(screen.getByText('Comment 2')).not.toBeNull();
    expect(screen.getByText('Comment 3')).not.toBeNull();
    expect(screen.getByText('Comment 4 (newest)')).not.toBeNull();
  });
});

describe('AddCommentForm Component Unit Tests', () => {
  it('should call onSubmit handler with dynamic values', async () => {
    const mockSubmit = vi.fn().mockResolvedValue(true);
    render(<AddCommentForm onSubmit={mockSubmit} isSubmitting={false} />);

    const textarea = screen.getByPlaceholderText('Type your comment here...');
    fireEvent.change(textarea, { target: { value: 'New test comment' } });

    const submitBtn = screen.getByRole('button', { name: /add comment/i });
    fireEvent.click(submitBtn);

    expect(mockSubmit).toHaveBeenCalledTimes(1);
    const submittedData = mockSubmit.mock.calls[0][0];
    expect(submittedData.get('comment')).toBe('New test comment');
  });
});
