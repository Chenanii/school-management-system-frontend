import { useState } from 'react';
import SchoolSignup from './SchoolSignup.jsx';
import SignIn from './SignIn.jsx';

export default function AuthPage({ onSignIn, onAuthenticated }) {
  const [mode, setMode] = useState(() => new URLSearchParams(window.location.search).get('mode') === 'signup' ? 'signup' : 'signin');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [notice, setNotice] = useState('');

  if (mode === 'signup') {
    return (
      <SchoolSignup
        onBack={() => setMode('signin')}
        onCreated={(email) => {
          setRegisteredEmail(email);
          setNotice('Your school is registered. Sign in with your administrator account to start the guided school setup.');
          setMode('signin');
        }}
      />
    );
  }

  return (
    <SignIn
      onSignIn={onSignIn}
      onAuthenticated={onAuthenticated}
      onCreateAccount={() => { setNotice(''); setMode('signup'); }}
      initialEmail={registeredEmail}
      notice={notice}
    />
  );
}
