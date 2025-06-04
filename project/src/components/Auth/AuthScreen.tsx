import { useState } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import { User } from '../../types';

interface AuthScreenProps {
  onAuthenticated: (user: User) => void;
  users: User[];
  setUsers: (users: User[]) => void;
}

const AuthScreen = ({ onAuthenticated, users, setUsers }: AuthScreenProps) => {
  const [showLogin, setShowLogin] = useState(true);

  const handleLogin = (user: User) => {
    onAuthenticated(user);
  };

  const handleSignup = (user: User) => {
    setUsers([...users, user]);
    onAuthenticated(user);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 p-4">
      <h1 className="text-4xl font-bold text-white mb-8 flex items-center gap-2">
        MTG Life Tracker
      </h1>
      
      {showLogin ? (
        <LoginForm 
          onLogin={handleLogin} 
          onSwitchToSignup={() => setShowLogin(false)}
          users={users}
        />
      ) : (
        <SignupForm 
          onSignup={handleSignup} 
          onSwitchToLogin={() => setShowLogin(true)}
          users={users}
        />
      )}
    </div>
  );
};

export default AuthScreen; 