import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../utils/api';
import { fetchCurrentUser } from '../../store/slices/authSlice';

const STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Delta','Ebonyi','Edo','Ekiti','Enugu','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina',
  'Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo',
  'Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara','FCT Abuja'];

const SPEC_LABELS = {
  cereal_crops: '🌽 Cereal Crops', poultry: '🐔 Poultry',
  fisheries: '🐟 Fisheries', horticulture: '🥬 Horticulture', legumes: '🫘 Legumes',
};

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState(false);
  const [form, setForm]         = useState({
    fullName:  user?.profile?.fullName  || '',
    bio:       user?.profile?.bio       || '',
    state:     user?.profile?.location?.state || '',
    lga:       user?.profile?.location?.lga   || '',
    preferredLanguage: user?.profile?.preferredLanguage || 'en',
  });

  if (!user) return null;

  const p = user.profile;
  const initials = p.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const primarySpec = p.farmingSpecializations?.[0]?.primary;

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/users/profile', {
        fullName: form.fullName,
        bio:      form.bio,
        location: { state: form.state, lga: form.lga },
        preferredLanguage: form.preferredLanguage,
      });
      await dispatch(fetchCurrentUser());
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (_) {}
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20 md:pb-6">
      <h1 className="text-xl font-display font-bold text-gray-800 mb-5">👤 My Profile</h1>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-4 text-sm">
          ✅ Profile updated successfully!
        </div>
      )}

      {/* Avatar + name card */}
      <div className="card mb-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-600 text-white text-2xl font-bold flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{p.fullName}</h2>
                <p className="text-sm text-gray-500 capitalize">{user.role}
                  {p.location?.state && ` · ${p.location.state}`}
                </p>
                {primarySpec && (
                  <span className="badge-green mt-1 inline-block">
                    {SPEC_LABELS[primarySpec] || primarySpec}
                  </span>
                )}
              </div>
              <button onClick={() => setEditing(!editing)}
                className={editing ? 'btn-secondary text-sm' : 'btn-primary text-sm'}>
                {editing ? 'Cancel' : '✏️ Edit'}
              </button>
            </div>
            {p.bio && <p className="text-sm text-gray-600 mt-2">{p.bio}</p>}
          </div>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="card mb-5 border-2 border-primary-200">
          <h3 className="font-semibold text-gray-800 mb-4">Edit Profile</h3>
          <div className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div>
              <label className="label">Bio <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea className="input h-20 resize-none" placeholder="Tell other farmers about yourself…"
                value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">State</label>
                <select className="input" value={form.state}
                  onChange={e => setForm({ ...form, state: e.target.value })}>
                  <option value="">Select…</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">LGA</label>
                <input className="input" placeholder="e.g. Ibadan North"
                  value={form.lga} onChange={e => setForm({ ...form, lga: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Preferred Language</label>
              <select className="input" value={form.preferredLanguage}
                onChange={e => setForm({ ...form, preferredLanguage: e.target.value })}>
                <option value="en">English</option>
                <option value="yo">Yoruba</option>
                <option value="ha">Hausa</option>
                <option value="ig">Igbo</option>
              </select>
            </div>
            <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-2.5">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { label: 'Articles Viewed',    value: user.statistics?.interactionHistory?.length || 0, icon: '📚' },
          { label: 'Content Saved',      value: user.statistics?.contentSaved?.length || 0,       icon: '📌' },
          { label: 'Questions Asked',    value: user.statistics?.questionsAsked   || 0,           icon: '❓' },
          { label: 'Answers Given',      value: user.statistics?.answersProvided  || 0,           icon: '💬' },
          { label: 'Helpful Votes',      value: user.statistics?.helpfulVotes     || 0,           icon: '👍' },
          { label: 'Reputation Points',  value: user.social?.reputation           || 0,           icon: '⭐' },
        ].map(s => (
          <div key={s.label} className="card flex items-center gap-3 py-3">
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="text-lg font-bold text-primary-700">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Farming specialisations */}
      {p.farmingSpecializations?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-3">🌱 Farming Profile</h3>
          {p.farmingSpecializations.map((spec, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-3 mb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm text-gray-800">
                  {SPEC_LABELS[spec.primary] || spec.primary}
                </span>
                <span className="badge-amber capitalize">{spec.experience}</span>
              </div>
              {spec.crops?.length > 0 && (
                <p className="text-xs text-gray-500">Crops: {spec.crops.join(', ')}</p>
              )}
              {spec.livestock?.length > 0 && (
                <p className="text-xs text-gray-500">Livestock: {spec.livestock.join(', ')}</p>
              )}
              {spec.farmSize && (
                <p className="text-xs text-gray-500">Farm size: {spec.farmSize} {spec.farmSizeUnit || 'hectares'}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
