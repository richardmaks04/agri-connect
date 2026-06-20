import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../store/slices/authSlice';

const STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River',
  'Delta','Ebonyi','Edo','Ekiti','Enugu','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina',
  'Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo',
  'Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara','FCT Abuja'];

const SPECS = [
  { value: 'cereal_crops', label: 'Cereal Crops', emoji: '🌽', desc: 'Maize, rice, sorghum, millet' },
  { value: 'poultry',      label: 'Poultry',      emoji: '🐔', desc: 'Broiler, layer, turkey' },
  { value: 'fisheries',    label: 'Fisheries',    emoji: '🐟', desc: 'Catfish, tilapia, aquaculture' },
  { value: 'horticulture', label: 'Horticulture', emoji: '🥬', desc: 'Vegetables, fruits, tomatoes' },
  { value: 'legumes',      label: 'Legumes',      emoji: '🫘', desc: 'Cowpea, soybean, groundnut' },
];

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useSelector(s => s.auth);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    state: '', lga: '', primarySpecialization: '', experience: 'beginner',
    role: 'farmer', inviteCode: '',
  });
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
    return () => dispatch(clearError());
  }, [isAuthenticated, navigate, dispatch]);

  // FIX #3: Clear Redux error when user edits any field
  const set = (field, value) => {
    if (error) dispatch(clearError());
    if (field === 'state') setForm(f => ({ ...f, state: value, lga: '' })); // reset LGA on state change
    else setForm(f => ({ ...f, [field]: value }));
  };

  const validateStep1 = () => {
    if (!form.fullName.trim()) return 'Full name is required';
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) return 'Valid email required';
    if (form.password.length < 8) return 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    return '';
  };

  const validateStep2 = () => {
    if (!form.state) return 'Please select your state';
    if (!form.lga) return 'Please select your LGA';  // FIX #6
    if (!form.primarySpecialization) return 'Please select your farming type';
    return '';
  };

  const nextStep = () => {
    const err = validateStep1();
    if (err) { setValidationError(err); return; }
    setValidationError('');
    setStep(s => s + 1);
  };

  const handleSubmit = () => {
    const err = validateStep2();
    if (err) { setValidationError(err); return; }
    setValidationError('');
    dispatch(registerUser(form));
  };

  // FIX #2: Progress starts at 0%, reaches 50% at step 2
  const progressPct = ((step - 1) / 2) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-800 to-primary-600 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <span className="text-5xl">🌾</span>
          <h1 className="text-2xl font-display font-bold text-white mt-2">Join Agri-Connect</h1>
          <p className="text-primary-200 text-sm">Personalised knowledge for Nigerian farmers</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span className={step >= 1 ? 'text-primary-600 font-medium' : ''}>1. Your Account</span>
              <span className={step >= 2 ? 'text-primary-600 font-medium' : ''}>2. Farming Profile</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full">
              {/* FIX #2: now uses corrected progressPct */}
              <div className="h-2 bg-primary-500 rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          {(error || validationError) && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">
              {validationError || error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Create your account</h2>
              <div>
                <label className="label">Full Name</label>
                <input className="input" placeholder="e.g. Bisi Adeyemi" value={form.fullName}
                  onChange={e => set('fullName', e.target.value)} />
              </div>
              <div>
                <label className="label">Email Address</label>
                <input className="input" type="email" placeholder="you@example.com" value={form.email}
                  onChange={e => set('email', e.target.value)} />
              </div>
              <div>
                <label className="label">Password</label>
                {/* FIX #5: added autoComplete */}
                <input className="input" type="password" placeholder="Min. 8 characters" value={form.password}
                  autoComplete="new-password"
                  onChange={e => set('password', e.target.value)} />
              </div>
              <div>
                <label className="label">Confirm Password</label>
                {/* FIX #5: added autoComplete */}
                <input className="input" type="password" placeholder="Re-enter password" value={form.confirmPassword}
                  autoComplete="new-password"
                  onChange={e => set('confirmPassword', e.target.value)} />
              </div>
              {/* Role selection for expert/extension/admin (invite-code protected) */}
              <div>
                <label className="label">Account Type</label>
                <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
                  <option value="farmer">Farmer</option>
                  <option value="expert">Expert</option>
                  <option value="extension">Extension Officer</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {form.role !== 'farmer' && (
                <div>
                  <label className="label">Invite Code</label>
                  <input className="input" placeholder="Enter invite code provided by admin" value={form.inviteCode}
                    onChange={e => set('inviteCode', e.target.value)} />
                </div>
              )}
              <button onClick={nextStep} className="btn-primary w-full py-3 text-base mt-2">
                Continue →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Your farming profile</h2>
              <p className="text-sm text-gray-500 -mt-2">This is used to personalise your content feed.</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">State</label>
                  <select className="input" value={form.state} onChange={e => set('state', e.target.value)}>
                    <option value="">Select state…</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Experience Level</label>
                  <select className="input" value={form.experience} onChange={e => set('experience', e.target.value)}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {/* FIX #6: LGA field — only shows after a state is selected */}
              {form.state && (
                <div>
                  <label className="label">Local Government Area (LGA)</label>
                  <input
                    className="input"
                    placeholder="e.g. Ikorodu"
                    value={form.lga}
                    onChange={e => set('lga', e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="label">Primary Farming Type</label>
                <div className="grid grid-cols-1 gap-2 mt-1">
                  {SPECS.map(spec => (
                    <button key={spec.value} type="button"
                      onClick={() => set('primarySpecialization', spec.value)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                        form.primarySpecialization === spec.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-200'
                      }`}>
                      <span className="text-2xl">{spec.emoji}</span>
                      <div>
                        <div className="font-medium text-sm text-gray-800">{spec.label}</div>
                        <div className="text-xs text-gray-500">{spec.desc}</div>
                      </div>
                      {form.primarySpecialization === spec.value && (
                        <span className="ml-auto text-primary-600">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => { setStep(1); setValidationError(''); }} className="btn-secondary flex-1 py-2.5">
                  ← Back
                </button>
                {/* FIX #4: removed invalid flex-2 class */}
                <button onClick={handleSubmit} disabled={isLoading} className="btn-primary flex-1 py-2.5">
                  {isLoading ? 'Creating account…' : 'Create Account'}
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}