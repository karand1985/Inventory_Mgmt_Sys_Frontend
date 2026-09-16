import React from 'react';

/**
 * Formats an ISO date/date-time string into a short, locale-friendly label.
 * Returns null for empty/invalid input so callers can skip rendering.
 * @param {string} [value]
 * @returns {string|null}
 */
export function formatDateTime(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  // Show date + time, but drop the time for pure yyyy-MM-dd values.
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(dateOnly ? {} : { hour: '2-digit', minute: '2-digit' }),
  });
}

/**
 * A single "Label by <who> on <when>" line. Renders nothing if there's no data.
 */
function AuditLine({ label, who, when }) {
  const at = formatDateTime(when);
  if (!who && !at) return null;
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-ink/40">{label}</span>
      {who && <span className="font-medium text-ink/70">{who}</span>}
      {at && (
        <span className="text-ink/40">
          {who ? ' · ' : ''}
          {at}
        </span>
      )}
    </span>
  );
}

/**
 * Renders created/updated audit metadata for any entity carrying the standard
 * audit fields (createdAt, createdBy, updatedAt, updatedBy).
 *
 * @param {Object} props
 * @param {{createdAt?:string, createdBy?:string, updatedAt?:string, updatedBy?:string}} props.entity
 * @param {'block'|'inline'} [props.variant='block']  block = stacked footer; inline = compact one-liner
 * @param {string} [props.className]
 */
export default function AuditMeta({ entity, variant = 'block', className = '' }) {
  if (!entity) return null;
  const { createdAt, createdBy, updatedAt, updatedBy } = entity;

  const hasCreated = Boolean(createdBy || createdAt);
  const hasUpdated =
    Boolean(updatedBy || updatedAt) &&
    // Skip a redundant "Updated" line when it matches the create stamp.
    (updatedAt !== createdAt || updatedBy !== createdBy);

  if (!hasCreated && !hasUpdated) return null;

  if (variant === 'inline') {
    return (
      <span className={`text-xs text-ink/50 flex flex-wrap gap-x-3 gap-y-0.5 ${className}`}>
        {hasCreated && <AuditLine label="Created by" who={createdBy} when={createdAt} />}
        {hasUpdated && <AuditLine label="Updated by" who={updatedBy} when={updatedAt} />}
      </span>
    );
  }

  return (
    <div
      className={`border-t border-line/70 mt-6 pt-3 text-xs text-ink/50 flex flex-col gap-1 ${className}`}
    >
      {hasCreated && <AuditLine label="Created by" who={createdBy} when={createdAt} />}
      {hasUpdated && <AuditLine label="Updated by" who={updatedBy} when={updatedAt} />}
    </div>
  );
}
