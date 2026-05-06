import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../utils/api';

const SPECS = [
  { value: '', label: 'All Topics' },
  { value: 'cereal_crops', label: '🌽 Cereal Crops' },
  { value: 'poultry',      label: '🐔 Poultry' },
  { value: 'fisheries',    label: '🐟 Fisheries' },
  { value: 'horticulture', label: '🥬 Horticulture' },
  { value: 'legumes',      label: '🫘 Legumes' },
  { value: 'general',      label: '📋 General' },
];

const STATUS_BADGE = {
  open:     'bg-green-100 text-green-700',
  answered: 'bg-blue-100 text-blue-700',
  resolved: 'bg-gray-100 text-gray-600',
};

function QuestionCard({ q }) {
  return (
    <Link to={`/community/questions/${q._id}`} className="card hover:shadow-md transition-shadow block group">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex flex-wrap gap-1.5">
          <span className={`badge ${STATUS_BADGE[q.status]}`}>{q.status}</span>
          {q.specialization && q.specialization !== 'general' && (
            <span className="badge-gray capitalize">{q.specialization.replace('_', ' ')}</span>
          )}
        </div>
        <span className="text-xs text-gray-400 shrink-0">
          {q.answers?.length || 0} answer{q.answers?.length !== 1 ? 's' : ''}
        </span>
      </div>

      <h3 className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors leading-snug">
        {q.title}
      </h3>
      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{q.content}</p>

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
        <span>👤 {q.authorName || 'Farmer'}</span>
        <span>•</span>
        <span>👁 {q.views || 0} views</span>
        {q.answers?.some(a => a.isExpert) && (
          <span className="badge-expert ml-auto">✅ Expert answered</span>
        )}
      </div>
    </Link>
  );
}

export default function CommunityPage() {
  const { user } = useSelector(s => s.auth);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', specialization: 'general', tags: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = filter ? `?specialization=${filter}` : '';
      const { data } = await api.get(`/community/questions${params}`);
      setQuestions(data.questions);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchQuestions(); }, [filter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/community/questions', {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      setShowForm(false);
      setForm({ title: '', content: '', specialization: 'general', tags: '' });
      fetchQuestions();
    } catch (_) {}
    setSubmitting(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-display font-bold text-gray-800">👥 Community</h1>
          <p className="text-sm text-gray-500">Ask questions, share knowledge with fellow farmers</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          + Ask Question
        </button>
      </div>

      {/* Ask question form */}
      {showForm && (
        <div className="card mb-5 border-2 border-primary-200">
          <h3 className="font-semibold text-gray-800 mb-4">Ask the community</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="label">Your Question</label>
              <input className="input" placeholder="e.g. What is the best fertiliser for late-season maize?"
                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <label className="label">Details</label>
              <textarea className="input h-24 resize-none" placeholder="Describe your situation in detail…"
                value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.specialization}
                  onChange={e => setForm({ ...form, specialization: e.target.value })}>
                  {SPECS.filter(s => s.value).map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Tags (comma-separated)</label>
                <input className="input" placeholder="maize, pest, Oyo"
                  value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1">
                {submitting ? 'Posting…' : 'Post Question'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 no-scrollbar">
        {SPECS.map(spec => (
          <button key={spec.value}
            onClick={() => setFilter(spec.value)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filter === spec.value
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
            }`}>
            {spec.label}
          </button>
        ))}
      </div>

      {/* Questions list */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/5 mb-3" />
              <div className="h-5 bg-gray-200 rounded w-4/5 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">🙋</p>
          <p className="text-gray-600 font-medium">No questions yet in this category</p>
          <p className="text-sm text-gray-400 mt-1">Be the first to ask!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map(q => <QuestionCard key={q._id} q={q} />)}
        </div>
      )}
    </div>
  );
}
