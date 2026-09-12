import React, { useState, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import {
  UserCircleIcon,
  KeyIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

function Profile({ user }) {
  const { addPassword, error, setError, changePassword } = useAuthStore();
  const [form, setForm] = useState({
    email: user?.email || '',
    password: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const provider = user?.provider || user?.primaryProvider || 'email';

  // Parse linked providers
  const linkedProviders = useMemo(() => {
    const raw = user?.linkedProviders ?? user?.attributes?.linkedProviders;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map((p) => String(p).toLowerCase());
    if (typeof raw === 'string') {
      return raw
        .split(/[,\s]+/)
        .map((p) => p.trim().toLowerCase())
        .filter(Boolean);
    }
    return [];
  }, [user]);

  const hasEmailLinked = linkedProviders.includes('email');
  const hasPassword = useMemo(() => {
    return Boolean(user?.attributes?.hasPassword || provider === 'email');
  }, [user, provider]);

  // Change Password form state
  const [changeForm, setChangeForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const onChangeChangePwd = (e) => {
    const { name, value } = e.target;
    setChangeForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const onSubmitChangePwd = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (!changeForm.currentPassword || !changeForm.newPassword || !changeForm.confirmPassword) {
        toast.error('Please fill all password fields');
        return;
      }
      if (changeForm.newPassword !== changeForm.confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }
      const res = await changePassword({
        currentPassword: changeForm.currentPassword,
        newPassword: changeForm.newPassword,
        confirmPassword: changeForm.confirmPassword,
      });
      if (res?.success) {
        toast.success('Password changed successfully');
        setChangeForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const msg = res?.message || res?.error || 'Failed to change password';
        toast.error(msg);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to change password';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (!form.password || !form.confirmPassword) {
        toast.error('Please fill all password fields');
        return;
      }
      if (form.password !== form.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      const res = await addPassword({
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      if (res?.success) {
        toast.success('Password saved successfully');
        setForm((p) => ({ ...p, password: '', confirmPassword: '' }));
      } else {
        const msg = res?.message || res?.error || 'Failed to save password';
        toast.error(msg);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save password';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-base-content">Profile Settings</h1>
        <p className="text-xs text-base-content/60 mt-1">Manage your identity, connected accounts, and security credentials.</p>
      </div>

      {/* Account Overview Card */}
      <section className="card bg-base-100 border border-base-300 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="avatar placeholder shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-primary/15 text-primary border border-primary/20 flex items-center justify-center font-bold text-2xl shadow-xs">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user?.name || 'User'} className="rounded-2xl" />
              ) : (
                <span>{user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}</span>
              )}
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <h2 className="text-lg font-bold text-base-content">{user?.name || 'Unnamed User'}</h2>
            <p className="text-xs text-base-content/60 flex items-center justify-center sm:justify-start gap-1.5">
              <EnvelopeIcon className="w-3.5 h-3.5 text-base-content/40" />
              <span>{user?.email}</span>
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <span className="badge badge-outline border-base-300 text-base-content/70 text-[11px] py-2 px-2.5">
                ID: {user?.id ? `${user.id.slice(0, 8)}...` : 'N/A'}
              </span>

              {linkedProviders.length === 0 ? (
                <span className="badge badge-outline border-base-300 text-base-content/50 text-[11px] py-2 px-2.5">
                  Provider: {provider}
                </span>
              ) : (
                linkedProviders.map((p, idx) => (
                  <span
                    key={`${p}-${idx}`}
                    className="badge badge-primary badge-outline text-[11px] font-medium py-2 px-2.5 capitalize"
                  >
                    {p}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Security & Password Card */}
      <section className="card bg-base-100 border border-base-300 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-base-300">
          <KeyIcon className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold text-base-content">
            {!hasEmailLinked ? (hasPassword ? 'Update Password' : 'Add Password') : 'Change Password'}
          </h2>
        </div>

        {error && (
          <div className="alert alert-error mb-4 text-xs py-2.5 rounded-xl font-medium">
            <span>{error}</span>
          </div>
        )}

        {!hasEmailLinked ? (
          <form onSubmit={onSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-base-content/80 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                disabled
                className="input input-bordered input-sm w-full bg-base-200 border-base-300 rounded-xl text-base-content/60"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-base-content/80 mb-1">
                {hasPassword ? 'New Password' : 'Password'}
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={onChange}
                required
                className="input input-bordered input-sm w-full bg-base-100 border-base-300 rounded-xl text-base-content focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-base-content/80 mb-1">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={onChange}
                required
                className="input input-bordered input-sm w-full bg-base-100 border-base-300 rounded-xl text-base-content focus:border-primary"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary btn-sm rounded-xl shadow-xs"
            >
              {submitting ? 'Saving...' : hasPassword ? 'Update Password' : 'Add Password'}
            </button>
          </form>
        ) : (
          <form onSubmit={onSubmitChangePwd} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-base-content/80 mb-1">Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={changeForm.currentPassword}
                onChange={onChangeChangePwd}
                required
                className="input input-bordered input-sm w-full bg-base-100 border-base-300 rounded-xl text-base-content focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-base-content/80 mb-1">New Password</label>
              <input
                type="password"
                name="newPassword"
                value={changeForm.newPassword}
                onChange={onChangeChangePwd}
                required
                className="input input-bordered input-sm w-full bg-base-100 border-base-300 rounded-xl text-base-content focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-base-content/80 mb-1">Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={changeForm.confirmPassword}
                onChange={onChangeChangePwd}
                required
                className="input input-bordered input-sm w-full bg-base-100 border-base-300 rounded-xl text-base-content focus:border-primary"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary btn-sm rounded-xl shadow-xs"
            >
              {submitting ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

export default Profile;