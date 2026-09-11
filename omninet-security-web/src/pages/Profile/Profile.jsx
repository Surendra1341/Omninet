import { useState, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Divider,
  Stack,
  Alert,
} from '@mui/material';
import { GitHub, Email } from '@mui/icons-material';
import GoogleIcon from '@mui/icons-material/Google';
import toast from 'react-hot-toast';

function Profile({ user }) {
  const { addPassword, error, setError } = useAuthStore();
  const [form, setForm] = useState({
    email: user?.email || '',
    password: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const provider = user?.provider || user?.primaryProvider || 'email';

  // Parse linked providers from possible shapes (string, array, nested attributes)
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

  // Disable add password if email provider is already linked (per requirement)
  const disablePasswordForm = hasEmailLinked; // For Add Password form

  // Change Password form state (for email-linked accounts)
  const [changeForm, setChangeForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const onChangeChangePwd = (e) => {
    const { name, value } = e.target;
    setChangeForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const { changePassword } = useAuthStore();

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
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
        Profile
      </Typography>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
            <Avatar sx={{ width: 72, height: 72 }} src={user?.avatarUrl}>
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, width: '100%' }}>
              <Typography variant="h6">{user?.name || 'Unnamed User'}</Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 1, flexWrap: 'wrap' }}>
                <ChipLike label={`User ID: ${user?.id || 'N/A'}`} />
              </Stack>

              {/* Linked providers section */}
              <Box sx={{ mt: 1.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                  Linked providers:
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                  {linkedProviders.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">None</Typography>
                  ) : (
                    linkedProviders.map((p, idx) => (
                      <ProviderBadge key={`${p}-${idx}`} provider={p} />
                    ))
                  )}
                </Stack>
              </Box>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          {!hasEmailLinked ? (
            <>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                {hasPassword ? 'Update Password' : 'Add a Password'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {hasPassword
                  ? 'Change your account password.'
                  : 'Set a password so you can also sign in with email + password.'}
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={onSubmit} noValidate>
                <Stack spacing={2}>
                  <TextField
                    name="email"
                    label="Email"
                    value={form.email}
                    onChange={onChange}
                    fullWidth
                    disabled
                  />
                  <Divider />
                  <TextField
                    name="password"
                    type="password"
                    label={hasPassword ? 'New Password' : 'Password'}
                    value={form.password}
                    onChange={onChange}
                    required
                    fullWidth
                  />
                  <TextField
                    name="confirmPassword"
                    type="password"
                    label="Confirm Password"
                    value={form.confirmPassword}
                    onChange={onChange}
                    required
                    fullWidth
                  />
                  <Box>
                    <Button type="submit" variant="contained" disabled={submitting}>
                      {submitting ? 'Saving...' : hasPassword ? 'Update Password' : 'Add Password'}
                    </Button>
                  </Box>
                </Stack>
              </Box>
            </>
          ) : (
            <>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                Change Password
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Update your password for email authentication.
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={onSubmitChangePwd} noValidate>
                <Stack spacing={2}>
                  <TextField
                    name="currentPassword"
                    type="password"
                    label="Current Password"
                    value={changeForm.currentPassword}
                    onChange={onChangeChangePwd}
                    required
                    fullWidth
                  />
                  <TextField
                    name="newPassword"
                    type="password"
                    label="New Password"
                    value={changeForm.newPassword}
                    onChange={onChangeChangePwd}
                    required
                    fullWidth
                  />
                  <TextField
                    name="confirmPassword"
                    type="password"
                    label="Confirm New Password"
                    value={changeForm.confirmPassword}
                    onChange={onChangeChangePwd}
                    required
                    fullWidth
                  />
                  <Box>
                    <Button type="submit" variant="contained" disabled={submitting}>
                      {submitting ? 'Changing...' : 'Change Password'}
                    </Button>
                  </Box>
                </Stack>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

// Simple Chip-like visual using Typography/Box to avoid importing MUI Chip if not used elsewhere
function ChipLike({ label }) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        px: 1,
        py: 0.5,
        bgcolor: 'grey.100',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'grey.200',
        fontSize: 12,
      }}
    >
      {label}
    </Box>
  );
}

export default Profile;

function ProviderBadge({ provider }) {
  const meta = getProviderMeta(provider);
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1,
        py: 0.5,
        bgcolor: 'grey.100',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'grey.200',
        fontSize: 12,
      }}
    >
      <Box sx={{ display: 'inline-flex', alignItems: 'center', color: meta.color }}>
        {meta.icon}
      </Box>
      <Typography variant="caption" sx={{ lineHeight: 1.2 }}>
        {meta.label}
      </Typography>
    </Box>
  );
}

function getProviderMeta(p) {
  const key = String(p || '').toLowerCase();
  switch (key) {
    case 'github':
      return { label: 'GitHub', color: '#24292e', icon: <GitHub fontSize="small" /> };
    case 'google':
      return { label: 'Google', color: '#4285F4', icon: <GoogleIcon fontSize="small" /> };
    case 'email':
      return { label: 'Email', color: '#6b7280', icon: <Email fontSize="small" /> };
    default:
      return { label: key || 'Unknown', color: '#6b7280', icon: <GoogleIcon fontSize="small" /> };
  }
}