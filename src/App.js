import React, { useState, useEffect } from 'react';
import { supabase } from './components/SupabaseClient';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './components/Auth';
import FormGenerator from './components/FormGenerator';
import SharedForm from './components/SharedForm';
import './styles.css'

const App = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setLoggedInUser(session?.user || null);
    };
    getSession();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLoggedInUser(null);
  };

  if (!loggedInUser) {
    return <Auth setLoggedInUser={setLoggedInUser} />;
  }

  return (
    <Router>
      <button onClick={handleLogout}>Logout</button>
      <Routes>
        <Route path="/" element={<FormGenerator loggedInUser={loggedInUser} />} />
        <Route path="/shared-form/:id" element={<SharedForm />} />
      </Routes>
    </Router>
  );
};

export default App;
