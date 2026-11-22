import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../services/api';
import type { Profile as ProfileType } from '../types';

export default function Profile() {
  const [profile, setProfile] = useState<ProfileType>({ name: '', age: null, profession: '', username: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  useEffect(() => {
    api.get<ProfileType>('/profile').then(({ data }) => setProfile(data)).catch(() => setError('Could not load profile')).finally(() => setLoading(false));
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setSaved('');
    try {
      const { data } = await api.patch<ProfileType>('/profile', { name: profile.name || undefined, age: profile.age ?? undefined, profession: profile.profession || undefined });
      setProfile(data); setSaved('Profile updated');
    } catch { setError('Could not update profile'); }
  }
  if (loading) return <div className="page"><div className="loading">Loading...</div></div>;
  return <div className="page"><h1>Profile</h1>
    {error && <div className="error" role="alert">{error}</div>} {saved && <div className="success">{saved}</div>}
    <form className="profile-form" onSubmit={submit}>
      <label>Name<input value={profile.name || ''} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></label>
      <label>Age<input type="number" min="1" max="150" value={profile.age ?? ''} onChange={(e) => setProfile({ ...profile, age: e.target.value ? Number(e.target.value) : null })} /></label>
      <label>Profession<input value={profile.profession || ''} onChange={(e) => setProfile({ ...profile, profession: e.target.value })} /></label>
      <label>Username<input value={profile.username} readOnly /></label>
      <button>Save profile</button>
    </form>
  </div>;
}
