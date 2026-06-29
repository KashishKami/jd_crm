import React, { useState, useRef } from 'react';

interface AddCommentFormProps {
  onSubmit: (formData: FormData) => Promise<boolean>;
  isSubmitting: boolean;
}

export default function AddCommentForm({ onSubmit, isSubmitting: parentIsSubmitting }: AddCommentFormProps) {
  const [commentText, setCommentText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [localIsSubmitting, setLocalIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSubmitting = parentIsSubmitting || localIsSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) {
      setError('Comment text cannot be empty.');
      return;
    }

    setError(null);
    setLocalIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('comment', commentText.trim());
      if (file) {
        formData.append('file', file);
      }

      const success = await onSubmit(formData);
      if (success) {
        setCommentText('');
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to submit comment';
      setError(errorMsg);
    } finally {
      setLocalIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="profile-main flex flex-col gap-4" style={{ padding: '24px' }}>
      <h3 className="form-section-title" style={{ margin: 0, paddingBottom: '12px' }}>
        Add Internal Note / Comment
      </h3>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="comment-text" className="info-label" style={{ fontWeight: '600' }}>
          Your Note
        </label>
        <textarea
          id="comment-text"
          placeholder="Type your comment here..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          disabled={isSubmitting}
          className="form-input"
          style={{ minHeight: '100px', resize: 'vertical' }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="comment-file" className="info-label" style={{ fontWeight: '600' }}>
          Attach Image (Optional)
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            className="btn-secondary-custom"
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '8px 16px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Choose Image
          </button>
          <span className="font-sans" style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: '500' }}>
            {file ? file.name : 'No image chosen'}
          </span>
          {file && (
            <button
              type="button"
              onClick={() => {
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                fontSize: '0.8rem',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              Remove
            </button>
          )}
        </div>
        <input
          id="comment-file"
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={(e) => {
            const selectedFile = e.target.files?.[0] || null;
            setFile(selectedFile);
          }}
          disabled={isSubmitting}
          style={{ display: 'none' }}
        />
      </div>

      <div className="flex justify-end gap-3 mt-2">
        <button
          type="submit"
          disabled={isSubmitting || !commentText.trim()}
          className="btn-primary-custom"
          style={{ padding: '10px 20px', minWidth: '120px' }}
        >
          {isSubmitting ? 'Submitting...' : 'Add Comment'}
        </button>
      </div>
    </form>
  );
}
