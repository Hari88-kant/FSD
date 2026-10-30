import React, { useState } from 'react';
import { apiRequest } from '../api/client.js';
import { useTheme } from '../context/ThemeContext.jsx';

export default function RatingModal({ complaint, onClose, onRatingSubmitted }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { playHapticSound } = useTheme();

  const tech = complaint.technicianId;
  const techBadge = tech?.technicianBadgeId || (tech?._id ? `EB-TECH-${tech._id.slice(-4)}` : 'Field Tech');

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await apiRequest(`/complaints/${complaint._id}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment })
      });
      playHapticSound('success');
      if (onRatingSubmitted) onRatingSubmitted();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit rating');
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-dialog" style={{ maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '2.5rem' }}>⭐</span>
          <h3 style={{ margin: '0.35rem 0 0.25rem 0', letterSpacing: '-0.02em' }}>
            Rate Service Resolution
          </h3>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Complaint #{complaint._id.slice(-6).toUpperCase()} • {complaint.problemType.replace(/_/g, ' ')}
          </p>
        </div>

        {tech && (
          <div
            style={{
              background: 'var(--badge-tech-bg)',
              border: '1px solid var(--badge-tech-border)',
              borderRadius: '8px',
              padding: '0.75rem',
              marginBottom: '1.25rem',
              textAlign: 'center'
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--badge-tech-text)' }}>{tech.name}</div>
            <span className="tech-id-badge" style={{ fontSize: '0.78rem', marginTop: '0.2rem' }}>
              🪪 {techBadge}
            </span>
          </div>
        )}

        {error && <div className="hazard-alert" style={{ fontSize: '0.85rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Interactive Star Rating */}
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '2.2rem', cursor: 'pointer', display: 'inline-flex', gap: '0.35rem' }}>
              {[1, 2, 3, 4, 5].map((star) => {
                const active = (hoverRating || rating) >= star;
                return (
                  <span
                    key={star}
                    style={{
                      color: active ? '#fbbf24' : 'var(--text-muted)',
                      transition: 'transform 0.15s ease',
                      transform: active ? 'scale(1.15)' : 'scale(1)'
                    }}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => {
                      setRating(star);
                      playHapticSound('click');
                    }}
                  >
                    ★
                  </span>
                );
              })}
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fbbf24', marginTop: '0.25rem' }}>
              {rating === 5 && 'Outstanding Resolution (5/5)'}
              {rating === 4 && 'Great Service (4/5)'}
              {rating === 3 && 'Satisfactory (3/5)'}
              {rating === 2 && 'Needs Improvement (2/5)'}
              {rating === 1 && 'Unsatisfactory (1/5)'}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="rating-comment">Comments or Feedback (Optional):</label>
            <textarea
              id="rating-comment"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Prompt line repair, verified voltage with multimeter before leaving."
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
