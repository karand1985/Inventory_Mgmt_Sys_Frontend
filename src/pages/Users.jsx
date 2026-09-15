import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useBusiness } from '../context/BusinessContext';
import { useToast } from '../context/ToastContext';

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

  const fieldError = (name) =>
    fieldErrors[name] ? <span className="text-xs text-red-600">{fieldErrors[name]}</span> : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-5">Users</h1>

      {/* Create user */}
      <form
        onSubmit={handleCreate}
        className="bg-white border border-line rounded-lg p-4 mb-8 grid sm:grid-cols-2 gap-4"
      >
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-line rounded-md px-3 py-2"
          />
          {fieldError('name')}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-line rounded-md px-3 py-2"
          />
          {fieldError('email')}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Password</span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-line rounded-md px-3 py-2"
          />
          {fieldError('password')}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Role</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="border border-line rounded-md px-3 py-2 bg-white"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {fieldError('role')}
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-sm font-medium">Business (optional)</span>
          <select
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
            className="border border-line rounded-md px-3 py-2 bg-white"
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
          <button
            type="submit"
            disabled={saving}
            className="bg-ink text-white font-medium rounded-md px-4 py-2.5"
          >
            {saving ? 'Creating…' : 'Add user'}
          </button>
        </div>
      </form>

      {/* User list */}
      {loading ? (
        <p className="text-ink/60">Loading…</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {users.map((u) => (
            <li
              key={u.id}
              className="bg-white border border-line rounded-lg px-4 py-3 flex items-center justify-between gap-3"
            >
              <div>
                <div className="font-medium text-sm">
                  {u.name} <span className="text-ink/50">· {u.email}</span>
                </div>
                <div className="text-xs text-ink/50">
                  {u.role}
                  {!u.enabled && <span className="text-red-600"> · disabled</span>}
                </div>
              </div>
              <button
                onClick={() => toggleStatus(u)}
                className={`text-sm font-medium border rounded-md px-3 py-1.5 ${
                  u.enabled
                    ? 'border-red-200 text-red-600'
                    : 'border-green-200 text-green-700'
                }`}
              >
                {u.enabled ? 'Disable' : 'Enable'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
