import { useState } from 'react';
import { User } from '../../types';
import api from '../../services/api';

interface LoginFormProps {
  onLogin: (user: User) => void;
  onSwitchToSignup: () => void;
  users: User[];
}

const LoginForm = ({ onLogin, onSwitchToSignup, users }: LoginFormProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const user = await api.loginUser(username, password);
      onLogin(user);
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 w-full max-w-md">
      <h2 className="text-3xl font-bold text-white mb-6 text-center">Login</h2>
      
      {error && (
        <div className="bg-red-500/20 text-red-100 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-white mb-1">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-white mb-1">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition-colors"
        >
          Login
        </button>
      </form>
      
      <div className="mt-4 text-center">
        <p className="text-white">
          Don't have an account?{' '}
          <button 
            onClick={onSwitchToSignup}
            className="text-indigo-300 hover:text-indigo-200 underline"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm; 