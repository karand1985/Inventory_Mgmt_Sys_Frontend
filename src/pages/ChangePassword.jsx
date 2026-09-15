import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../context/ToastContext';

/**
 * Change the currently authenticated user's own password.
 * PUT /users/me/password -> 204 (no body). fieldErrors drive inline messages.
 */
export default function ChangePassword() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  async function handleSubmit(e) {
    e.preventDefault();
    setFieldErrors({});
    if (newPassword !== confirm) {
      setFieldErrors({ confirm: 'Passwords do not match.' });
      return;
    }
    setSaving(true);
    try {
      await api.users.changePassword({ currentPassword, newPassword });
      success('Password changed.');
      navigate('/');
    } catch (err) {
      setFieldErrors(err.fieldErrors || {});
      toastError(err.message || 'Could not change your password.');
    } finally {
      setSaving(false);
    }
  }

  const fieldError = (name) =>
    fieldErrors[name] ? <span className="text-xs text-red-600">{fieldErrors[name]}</span> : null;

  return (
    <div className="max-w-sm mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-5">Change password</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Current password</span>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="border border-line rounded-md px-3 py-2 bg-white"
          />
          {fieldError('currentPassword')}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">New password</span>
          <input
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="border border-line rounded-md px-3 py-2 bg-white"
          />
          <span className="text-xs text-ink/50">At least 8 characters.</span>
          {fieldError('newPassword')}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Confirm new password</span>
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="border border-line rounded-md px-3 py-2 bg-white"
          />
          {fieldError('confirm')}
        </label>

        <button
          type="submit"
          disabled={saving}
          className="bg-ink text-white font-medium rounded-md px-4 py-2.5 mt-2"
        >
          {saving ? 'Saving…' : 'Change password'}
        </button>
      </form>
    </div>
  );
}
