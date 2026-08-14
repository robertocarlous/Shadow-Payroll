import { useState } from 'react';

const RATINGS = [
  { value: 1, label: '😞', name: 'Frustrating' },
  { value: 2, label: '😕', name: 'Confusing' },
  { value: 3, label: '😐', name: 'Okay' },
  { value: 4, label: '😊', name: 'Good' },
  { value: 5, label: '🤩', name: 'Excellent' },
];

const DEFAULT_TEMPLATE =
  'Rate this payout experience 1-5 and tell us what got in your way, e.g. "took two tries to connect the wallet", "the credential upload was unclear". ';

const ISSUE_URL = 'https://github.com/robertocarlous/Shadow-Payroll/issues/new';

export function FeedbackPanel() {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);

  const submit = () => {
    const stars = rating ? `${rating}/5` : 'n/a';
    const title = `Feedback: ${comment.trim() ? comment.trim().slice(0, 60) : 'payout experience'}`;
    const body = `${DEFAULT_TEMPLATE}\n\nRating: ${stars}\nComment: ${comment.trim() || '(none)'}\n\n(from the dashboard feedback panel)`;
    const url = `${ISSUE_URL}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setSent(true);
  };

  return (
    <section className="card" id="feedback">
      <div className="section-heading">
        <h2>Help shape the next full moon</h2>
        <span className="muted">Every piece of feedback goes into the loop — and a changelog entry</span>
      </div>
      <p className="muted">
        Rate your experience and tell us what got in your way. Submitting opens a pre-filled
        GitHub issue — one tap to send. Feedback is triaged weekly and the result lands in the
        public{' '}
        <a href="https://github.com/robertocarlous/Shadow-Payroll/blob/main/docs/LEVEL5.md" target="_blank" rel="noreferrer">
          Level 5 changelog
        </a>
        .
      </p>

      <div className="feedback-rating" role="radiogroup" aria-label="Rate your experience">
        {RATINGS.map((r) => (
          <button
            key={r.value}
            type="button"
            role="radio"
            aria-checked={rating === r.value}
            aria-label={r.name}
            className={`feedback-rating__btn ${rating === r.value ? 'is-selected' : ''}`}
            onClick={() => setRating(r.value)}
            title={r.name}
          >
            <span className="feedback-rating__emoji">{r.label}</span>
            <span className="feedback-rating__name">{r.name}</span>
          </button>
        ))}
      </div>

      <textarea
        className="claim-panel__textarea feedback-comment"
        placeholder="What was easy? What got in your way? (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
      />

      <div className="claim-panel__row">
        <button className="btn btn--primary" onClick={submit} disabled={rating === null}>
          Send feedback
        </button>
        {sent && <span className="status-badge good">Opened — finish submitting on GitHub</span>}
      </div>
    </section>
  );
}
