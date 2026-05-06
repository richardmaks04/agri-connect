import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../utils/api';

function AnswerCard({ answer, questionAuthorId, questionId, onAccept, onHelpful }) {
  const { user } = useSelector(s => s.auth);
  const isAuthor = user?._id === questionAuthorId?.toString();
  const voted = answer.helpfulVoters?.includes(user?._id);

  return (
    <div className={`rounded-xl border-2 p-4 ${
      answer.accepted ? 'border-green-400 bg-green-50' : 'border-gray-100 bg-white'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs">
          {answer.authorName?.[0] || '?'}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800">{answer.authorName || 'Farmer'}</p>
          <p className="text-xs text-gray-400 capitalize">{answer.authorRole}</p>
        </div>
        {answer.isExpert && <span className="badge-expert ml-1">✅ Verified Expert</span>}
        {answer.accepted && <span className="badge-green ml-auto">✔ Accepted Answer</span>}
      </div>

      <p className="text-sm text-gray-700 leading-relaxed">{answer.content}</p>

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={() => onHelpful(answer._id)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
            voted ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
          }`}>
          👍 Helpful ({answer.helpful || 0})
        </button>
        {isAuthor && !answer.accepted && (
          <button
            onClick={() => onAccept(answer._id)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-green-200 text-green-700 hover:bg-green-50 transition-colors">
            ✔ Accept Answer
          </button>
        )}
        <span className="text-xs text-gray-400 ml-auto">
          {new Date(answer.createdAt).toLocaleDateString('en-NG')}
        </span>
      </div>
    </div>
  );
}

export default function QuestionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [answer, setAnswer]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchQuestion = async () => {
    try {
      const { data } = await api.get(`/community/questions/${id}`);
      setQuestion(data.question);
    } catch (_) { navigate('/community'); }
    setLoading(false);
  };

  useEffect(() => { fetchQuestion(); }, [id]);

  const handleAnswer = async (e) => {
    e.preventDefault();
    if (!answer.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/community/questions/${id}/answers`, { content: answer });
      setAnswer('');
      fetchQuestion();
    } catch (_) {}
    setSubmitting(false);
  };

  const handleHelpful = async (answerId) => {
    try {
      await api.post(`/community/questions/${id}/answers/${answerId}/helpful`);
      fetchQuestion();
    } catch (_) {}
  };

  const handleAccept = async (answerId) => {
    try {
      await api.put(`/community/questions/${id}/resolve`, { acceptedAnswerId: answerId });
      fetchQuestion();
    } catch (_) {}
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
      {[...Array(3)].map((_, i) => <div key={i} className="h-4 bg-gray-100 rounded mb-2" />)}
    </div>
  );
  if (!question) return null;

  const STATUS_COLOR = { open: 'badge-green', answered: 'bg-blue-100 text-blue-700 badge', resolved: 'badge-gray' };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-20 md:pb-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5">
        ← Back to Community
      </button>

      {/* Question card */}
      <div className="card mb-5">
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={STATUS_COLOR[question.status]}>{question.status}</span>
          {question.specialization && question.specialization !== 'general' && (
            <span className="badge-gray capitalize">{question.specialization.replace('_', ' ')}</span>
          )}
          {question.tags?.map(tag => (
            <span key={tag} className="badge-gray">#{tag}</span>
          ))}
        </div>

        <h1 className="text-xl font-display font-bold text-gray-900 leading-snug mb-3">
          {question.title}
        </h1>
        <p className="text-gray-700 text-sm leading-relaxed mb-4">{question.content}</p>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs">
              {question.authorName?.[0] || '?'}
            </div>
            <span>{question.authorName}</span>
          </div>
          <div className="flex gap-3">
            <span>👁 {question.views || 0}</span>
            <span>💬 {question.answers?.length || 0} answers</span>
          </div>
        </div>
      </div>

      {/* Answers */}
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-800 mb-3">
          {question.answers?.length || 0} Answer{question.answers?.length !== 1 ? 's' : ''}
        </h2>

        {question.answers?.length === 0 ? (
          <div className="card text-center py-8 text-gray-400 text-sm">
            No answers yet — be the first to help! 👇
          </div>
        ) : (
          <div className="space-y-3">
            {/* Show accepted answer first */}
            {[...question.answers]
              .sort((a, b) => (b.accepted ? 1 : 0) - (a.accepted ? 1 : 0) || b.helpful - a.helpful)
              .map(ans => (
                <AnswerCard
                  key={ans._id}
                  answer={ans}
                  questionAuthorId={question.author}
                  questionId={question._id}
                  onAccept={handleAccept}
                  onHelpful={handleHelpful}
                />
              ))}
          </div>
        )}
      </div>

      {/* Post answer form */}
      {question.status !== 'resolved' && (
        <div className="card border-2 border-primary-100">
          <h3 className="font-semibold text-gray-800 mb-3">💬 Your Answer</h3>
          <form onSubmit={handleAnswer}>
            <textarea
              className="input h-28 resize-none mb-3"
              placeholder="Share your knowledge or experience…"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              required
            />
            <button type="submit" disabled={submitting || !answer.trim()} className="btn-primary w-full py-2.5">
              {submitting ? 'Posting…' : 'Post Answer'}
            </button>
          </form>
        </div>
      )}

      {question.status === 'resolved' && (
        <div className="card text-center py-6 bg-green-50 border-green-200">
          <p className="text-green-700 font-medium">✅ This question has been resolved</p>
          <p className="text-sm text-green-600 mt-1">The best answer has been accepted above.</p>
        </div>
      )}
    </div>
  );
}
