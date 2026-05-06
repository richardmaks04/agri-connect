import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import ContentCard from '../shared/ContentCard';

const TYPES = [
  { value: 'all',       label: 'All' },
  { value: 'content',   label: '📄 Articles' },
  { value: 'questions', label: '❓ Questions' },
  { value: 'users',     label: '👤 Farmers' },
];

const SPECS = [
  { value: '',             label: 'All topics' },
  { value: 'cereal_crops', label: '🌽 Cereal Crops' },
  { value: 'poultry',      label: '🐔 Poultry' },
  { value: 'fisheries',    label: '🐟 Fisheries' },
  { value: 'horticulture', label: '🥬 Horticulture' },
  { value: 'legumes',      label: '🫘 Legumes' },
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';

  const [query, setQuery]           = useState(initialQ);
  const [type, setType]             = useState('all');
  const [spec, setSpec]             = useState('');
  const [results, setResults]       = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Autocomplete suggestions
  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/search/suggestions?q=${encodeURIComponent(query)}`);
        setSuggestions(data.suggestions || []);
      } catch (_) {}
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const runSearch = useCallback(async (q = query, t = type, s = spec) => {
    if (!q || q.trim().length < 2) return;
    setLoading(true);
    setShowSuggestions(false);
    setSearchParams({ q });
    try {
      const params = new URLSearchParams({ q, type: t });
      if (s) params.set('specialization', s);
      const { data } = await api.get(`/search?${params}`);
      setResults(data.results);
    } catch (_) {}
    setLoading(false);
  }, [query, type, spec, setSearchParams]);

  // Run search if q is in URL on mount
  useEffect(() => {
    if (initialQ) runSearch(initialQ);
  }, []);

  const handleKey = (e) => {
    if (e.key === 'Enter') runSearch();
  };

  const totalResults = results
    ? (results.content?.length || 0) + (results.questions?.length || 0) + (results.users?.length || 0)
    : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-20 md:pb-6">
      <h1 className="text-xl font-display font-bold text-gray-800 mb-5">🔍 Search</h1>

      {/* Search bar */}
      <div className="relative mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              className="input pl-10 pr-4 py-3 text-base"
              placeholder="Search articles, questions, farmers…"
              value={query}
              onChange={e => { setQuery(e.target.value); setShowSuggestions(true); }}
              onKeyDown={handleKey}
              onFocus={() => query.length >= 2 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            />
            <span className="absolute left-3 top-3.5 text-gray-400">🔍</span>
          </div>
          <button onClick={() => runSearch()} className="btn-primary px-5 py-3 text-base shrink-0">
            Search
          </button>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 z-30 overflow-hidden">
            {suggestions.map(s => (
              <button key={s.id}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 flex items-center gap-2"
                onClick={() => { setQuery(s.title); runSearch(s.title); }}>
                <span className="text-gray-400">📄</span>
                {s.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {TYPES.map(t => (
            <button key={t.value}
              onClick={() => { setType(t.value); if (results) runSearch(query, t.value, spec); }}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                type === t.value ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
        <select
          className="input w-auto py-1.5 text-sm"
          value={spec}
          onChange={e => { setSpec(e.target.value); if (results) runSearch(query, type, e.target.value); }}>
          {SPECS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && results && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            {totalResults} result{totalResults !== 1 ? 's' : ''} for <strong>"{query}"</strong>
          </p>

          {/* Content results */}
          {results.content?.length > 0 && (
            <section className="mb-6">
              {(type === 'all') && (
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  📄 Articles & Guides
                </h2>
              )}
              <div className="space-y-3">
                {results.content.map(item => (
                  <ContentCard key={item._id} content={item} compact />
                ))}
              </div>
            </section>
          )}

          {/* Question results */}
          {results.questions?.length > 0 && (
            <section className="mb-6">
              {(type === 'all') && (
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  ❓ Community Questions
                </h2>
              )}
              <div className="space-y-3">
                {results.questions.map(q => (
                  <div key={q._id} className="card hover:shadow-md transition-shadow">
                    <p className="font-semibold text-gray-800 text-sm">{q.title}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{q.content}</p>
                    <div className="flex gap-2 mt-2">
                      <span className={`badge ${
                        q.status === 'resolved' ? 'badge-gray' :
                        q.status === 'answered' ? 'bg-blue-100 text-blue-700 badge' : 'badge-green'
                      }`}>{q.status}</span>
                      <span className="text-xs text-gray-400">{q.answers?.length || 0} answers</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* User results */}
          {results.users?.length > 0 && (
            <section className="mb-6">
              {(type === 'all') && (
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  👤 Farmers & Experts
                </h2>
              )}
              <div className="space-y-2">
                {results.users.map(u => (
                  <div key={u._id} className="card flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center shrink-0">
                      {u.profile?.fullName?.[0] || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{u.profile?.fullName}</p>
                      <p className="text-xs text-gray-500 capitalize">{u.role} · {u.profile?.location?.state}</p>
                    </div>
                    <div className="ml-auto text-xs text-gray-400">⭐ {u.social?.reputation || 0}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* No results */}
          {totalResults === 0 && (
            <div className="card text-center py-12">
              <p className="text-4xl mb-3">🔎</p>
              <p className="text-gray-600 font-medium">No results found for "{query}"</p>
              <p className="text-sm text-gray-400 mt-1">Try different keywords or remove filters.</p>
            </div>
          )}
        </div>
      )}

      {/* Empty state before any search */}
      {!loading && !results && (
        <div className="card text-center py-16">
          <p className="text-5xl mb-4">🌾</p>
          <p className="text-gray-600 font-medium">Search for farming knowledge</p>
          <p className="text-sm text-gray-400 mt-1">Find articles, guides, and community answers</p>
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {['maize pest control', 'broiler vaccination', 'catfish feeding', 'cowpea planting'].map(s => (
              <button key={s}
                onClick={() => { setQuery(s); runSearch(s); }}
                className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm hover:bg-primary-100 transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
