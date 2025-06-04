import { useState } from 'react';
import { User } from '../../types';
import api from '../../services/api';

interface SignupFormProps {
  onSignup: (user: User) => void;
  onSwitchToLogin: () => void;
  users: User[];
}

const SignupForm = ({ onSignup, onSwitchToLogin, users }: SignupFormProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      // Trim username and validate length
      const trimmedUsername = username.trim();
      if (trimmedUsername.length < 3) {
        setError('Username must be at least 3 characters long');
        return;
      }
      
      // Validate password length
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
      
      // Check password match
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      
      console.log('Submitting registration:', { username: trimmedUsername });
      const user = await api.registerUser(trimmedUsername, password);
      console.log('Registration successful:', user);
      onSignup(user);
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.response?.data?.message || error.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 w-full max-w-md">
      <h2 className="text-3xl font-bold text-white mb-6 text-center">Sign Up</h2>
      
      {error && (
        <div className="bg-red-500/20 text-red-100 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
        <div>
          <label htmlFor="username" className="block text-white mb-2">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20 focus:border-white/40 focus:outline-none"
            placeholder="Enter username"
            required
            disabled={isSubmitting}
            autoComplete="off"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-white mb-2">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20 focus:border-white/40 focus:outline-none"
            placeholder="Enter password"
            required
            disabled={isSubmitting}
            autoComplete="new-password"
          />
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-white mb-2">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20 focus:border-white/40 focus:outline-none"
            placeholder="Confirm password"
            required
            disabled={isSubmitting}
            autoComplete="new-password"
          />
        </div>
        
        <button
          type="submit"
          className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg ${
            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>
      
      <div className="mt-4 text-center">
        <button
          onClick={onSwitchToLogin}
          className="text-white hover:text-indigo-300"
          disabled={isSubmitting}
        >
          Already have an account? Log in
        </button>
      </div>
    </div>
  );
};

export default SignupForm; 