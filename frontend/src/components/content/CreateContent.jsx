import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const SPECS = [
  { value: 'cereal_crops', label: '🌽 Cereal Crops' },
  { value: 'poultry',      label: '🐔 Poultry' },
  { value: 'fisheries',    label: '🐟 Fisheries' },
  { value: 'horticulture', label: '🥬 Horticulture' },
  { value: 'legumes',      label: '🫘 Legumes' },
  { value: 'general',      label: '📋 General' },
];

const TOPICS = ['planting', 'pest_management', 'fertilization', 'harvesting', 'storage',
  'feeding', 'vaccination', 'water_quality', 'pond_management', 'market', 'soil_health'];

export default function CreateContent() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);
  const [form, setForm] = useState({
    title:        '',
    summary:      '',
    content:      '',
    contentType:  'article',
    specializations: [],
    topics:       [],
    difficulty:   'beginner',
    regions:      ['all'],
    seasons:      ['all'],
    tags:         '',
  });

  const toggleArray = (field, value) => {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter(v => v !== value)
        : [...f[field], value],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) return;
    setSubmitting(true);
    try {
      await api.post('/content', {
        title:       form.title,
        summary:     form.summary,
        content:     form.content,
        contentType: form.contentType,
        tags:        form.tags.split(',').map(t => t.trim()).filter(Boolean),
        metadata: {
          farmingSpecializations: form.specializations,
          topics:     form.topics,
          difficulty: form.difficulty,
          regions:    form.regions,
          seasons:    form.seasons,
        },
      });
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (_) {}
    setSubmitting(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-20 md:pb-6">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">←</button>
        <h1 className="text-xl font-display font-bold text-gray-800">📝 Create Content</h1>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-5 text-sm">
          ✅ Content submitted! It will be reviewed and published shortly.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic info */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <label className="label">Title *</label>
              <input className="input" placeholder="e.g. Maize Cultivation Best Practices for Southwest Nigeria"
                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <label className="label">Summary <span className="text-gray-400 font-normal">(shown in feed cards)</span></label>
              <textarea className="input h-16 resize-none"
                placeholder="A short description of what farmers will learn from this article…"
                value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Content Type</label>
                <select className="input" value={form.contentType}
                  onChange={e => setForm({ ...form, contentType: e.target.value })}>
                  <option value="article">📄 Article</option>
                  <option value="guide">📖 Step-by-step Guide</option>
                  <option value="video">🎥 Video</option>
                  <option value="infographic">📊 Infographic</option>
                </select>
              </div>
              <div>
                <label className="label">Difficulty Level</label>
                <select className="input" value={form.difficulty}
                  onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                  <option value="beginner">🌱 Beginner</option>
                  <option value="intermediate">🌿 Intermediate</option>
                  <option value="advanced">🌳 Advanced</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Article Content *</h3>
          <p className="text-xs text-gray-500 mb-2">You can use basic HTML tags: &lt;h2&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;ul&gt;, &lt;li&gt;</p>
          <textarea className="input font-mono text-sm resize-y" style={{ minHeight: '300px' }}
            placeholder="Write your article content here. You can use HTML for formatting."
            value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required />
        </div>

        {/* Metadata for personalisation */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-1">Metadata <span className="text-primary-600">(drives personalisation)</span></h3>
          <p className="text-xs text-gray-500 mb-4">Tag this content accurately so the right farmers see it in their feed.</p>

          <div className="mb-4">
            <label className="label">Farming Specialisations</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {SPECS.map(s => (
                <button key={s.value} type="button"
                  onClick={() => toggleArray('specializations', s.value)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    form.specializations.includes(s.value)
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="label">Topics</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {TOPICS.map(t => (
                <button key={t} type="button"
                  onClick={() => toggleArray('topics', t)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors capitalize ${
                    form.topics.includes(t)
                      ? 'bg-accent-500 text-white border-accent-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-accent-300'
                  }`}>
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Tags <span className="text-gray-400 font-normal">(comma-separated)</span></label>
            <input className="input" placeholder="maize, pest control, southwest, beginner"
              value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
          </div>
        </div>

        <button type="submit" disabled={submitting || !form.title || !form.content}
          className="btn-primary w-full py-3 text-base">
          {submitting ? 'Submitting…' : '🚀 Submit for Review'}
        </button>
      </form>
    </div>
  );
}
