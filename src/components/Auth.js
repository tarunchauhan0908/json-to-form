import React, { useState } from 'react';
import { supabase } from './SupabaseClient';

const Auth = ({ setLoggedInUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else alert('Signup successful! Please log in.');
  };

  const handleLogin = async () => {
    const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else {
      setLoggedInUser(user);
      alert('Login successful!');
    }
  };

  return (
    <div>
      <h1>Login or Sign Up</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
      <button onClick={handleSignUp}>Sign Up</button>
    </div>
  );
};

export default Auth;
