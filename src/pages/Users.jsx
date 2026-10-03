import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useBusiness } from '../context/BusinessContext';
import { useToast } from '../context/ToastContext';
import AuditMeta from '../components/AuditMeta';

const ROLES = ['SUPER_ADMIN', 'OWNER', 'VIEWER'];

/**
 * SUPER_ADMIN-only user administration:
 *  - GET  /users                 list all users
 *  - POST /auth/register         create a user (name, email, password, role, businessId?)
 *  - PATCH /users/{id}/status    enable/disable
 */
export default function Users() {
  const { businesses } = useBusiness();
  const { success, error: toastError } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // New-user form state.
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('VIEWER');
  const [businessId, setBusinessId] = useState('');
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Edit-user modal state.
  const [editing, setEditing] = useState(null); // the user being edited, or null
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('VIEWER');
  const [editBusinessId, setEditBusinessId] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editErrors, setEditErrors] = useState({});

  function load() {
    setLoading(true);
    api.users
      .list()
      .then(setUsers)
      .catch((err) => toastError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    try {
      await api.auth.register({
        name,
        email,
        password,
        role,
        businessId: businessId ? Number(businessId) : null,
      });
      success('User created.');
      setName('');
      setEmail('');
      setPassword('');
      setRole('VIEWER');
      setBusinessId('');
      load();
    } catch (err) {
      setFieldErrors(err.fieldErrors || {});
      toastError(err.message || 'Could not create the user.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(user) {
    try {
      const updated = await api.users.setStatus(user.id, !user.enabled);
      setUsers((list) => list.map((u) => (u.id === user.id ? updated : u)));
      success(`${user.email} ${updated.enabled ? 'enabled' : 'disabled'}.`);
    } catch (err) {
      toastError(err.message || 'Could not update status.');
    }
  }

  function startEdit(user) {
    setEditing(user);
    setEditName(user.name || '');
    setEditRole(user.role || 'VIEWER');
    setEditBusinessId(user.businessId ? String(user.businessId) : '');
    setEditPassword('');
    setEditErrors({});
  }

  function cancelEdit() {
    setEditing(null);
    setEditErrors({});
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!editing) return;
    setEditSaving(true);
    setEditErrors({});
    try {
      const updated = await api.users.update(editing.id, {
        name: editName,
        role: editRole,
        businessId: editBusinessId ? Number(editBusinessId) : null,
        // Only send a password when the admin actually typed one.
        password: editPassword.trim() ? editPassword : null,
      });
      setUsers((list) => list.map((u) => (u.id === updated.id ? updated : u)));
      success(`${updated.email} updated.`);
      cancelEdit();
    } catch (err) {
      setEditErrors(err.fieldErrors || {});
      toastError(err.message || 'Could not update the user.');
    } finally {
      setEditSaving(false);
    }
  }

  const fieldError = (name) =>
    fieldErrors[name] ? <span className="text-xs text-red-600">{fieldErrors[name]}</span> : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 iv-page-in">
      <h1 className="iv-display text-2xl font-extrabold mb-5">Users</h1>

      {/* Create user */}
      <form
        onSubmit={handleCreate}
        className="iv-card p-4 mb-8 grid sm:grid-cols-2 gap-4"
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="iv-input"
          />
          {fieldError('name')}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="iv-input"
          />
          {fieldError('email')}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Password</span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="iv-input"
          />
          {fieldError('password')}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Role</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="iv-input"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {fieldError('role')}
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-semibold">Business (optional)</span>
          <select
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
            className="iv-input"
          >
            <option value="">None (spans all — e.g. SUPER_ADMIN)</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          {fieldError('businessId')}
        </label>
        <div className="sm:col-span-2">
          <button type="submit" disabled={saving} className="iv-btn iv-btn-primary">
            {saving ? (
              <>
                <span className="iv-spinner h-4 w-4" />
                Creating…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                Add user
              </>
            )}
          </button>
        </div>
      </form>

      {/* User list */}
      {loading ? (
        <ul className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="iv-skeleton h-16 rounded-xl" />
          ))}
        </ul>
      ) : (
        <ul className="flex flex-col gap-2">
          {users.map((u, i) => (
            <li
              key={u.id}
              className="iv-card iv-card-hover iv-stagger px-4 py-3 flex items-center justify-between gap-3"
              style={{ '--i': i }}
            >
              <div>
                <div className="font-semibold text-sm">
                  {u.name} <span className="text-ink/50 font-normal">· {u.email}</span>
                </div>
                <div className="text-xs text-ink/50 flex items-center gap-1.5 mt-0.5">
                  <span className="iv-badge bg-paper border border-line">{u.role}</span>
                  {!u.enabled && (
                    <span className="iv-badge bg-red-50 text-red-600 border border-red-200">disabled</span>
                  )}
                </div>
                <AuditMeta entity={u} variant="inline" className="mt-1" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => startEdit(u)}
                  className="iv-btn iv-btn-ghost !px-3 !py-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  Edit
                </button>
                <button
                  onClick={() => toggleStatus(u)}
                  className={`iv-btn !px-3 !py-1.5 ${
                    u.enabled
                      ? 'iv-btn-ghost !text-red-600 !border-red-200'
                      : 'iv-btn-ghost !text-green-700 !border-green-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {u.enabled ? 'block' : 'check_circle'}
                  </span>
                  {u.enabled ? 'Disable' : 'Enable'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Edit-user modal */}
      {editing && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onMouseDown={cancelEdit}
        >
          <div
            className="iv-card iv-glow-border iv-page-in w-full max-w-lg p-5"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2 className="iv-display text-lg font-extrabold mb-4">Edit user</h2>
            <form onSubmit={handleUpdate} className="grid sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">Name</span>
                <input
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="iv-input"
                />
                {editErrors.name && (
                  <span className="text-xs text-red-600">{editErrors.name}</span>
                )}
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">
                  Email <span className="text-ink/40 font-normal">(cannot be changed)</span>
                </span>
                <input
                  type="email"
                  value={editing.email}
                  disabled
                  className="iv-input bg-paper text-ink/60 cursor-not-allowed"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">Role</span>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="iv-input"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                {editErrors.role && (
                  <span className="text-xs text-red-600">{editErrors.role}</span>
                )}
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">Business (optional)</span>
                <select
                  value={editBusinessId}
                  onChange={(e) => setEditBusinessId(e.target.value)}
                  className="iv-input"
                >
                  <option value="">None (spans all — e.g. SUPER_ADMIN)</option>
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-sm font-semibold">
                  New password{' '}
                  <span className="text-ink/40 font-normal">(leave blank to keep current)</span>
                </span>
                <input
                  type="password"
                  minLength={8}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="••••••••"
                  className="iv-input"
                />
                {editErrors.password && (
                  <span className="text-xs text-red-600">{editErrors.password}</span>
                )}
              </label>
              <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="iv-btn iv-btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" disabled={editSaving} className="iv-btn iv-btn-primary">
                  {editSaving ? (
                    <>
                      <span className="iv-spinner h-4 w-4" />
                      Saving…
                    </>
                  ) : (
                    'Save changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
