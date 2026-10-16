import { useState } from 'react';
import SchoolSignup from './SchoolSignup.jsx';
import SignIn from './SignIn.jsx';

export default function AuthPage({ onSignIn }) {
  const [mode, setMode] = useState('signin');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [notice, setNotice] = useState('');

  if (mode === 'signup') {
    return (
      <SchoolSignup
        onBack={() => setMode('signin')}
        onCreated={(email) => {
          setRegisteredEmail(email);
          setNotice('Your school is registered. Sign in with the administrator email and password you created.');
          setMode('signin');
        }}
      />
    );
  }

  return (
    <SignIn
      onSignIn={onSignIn}
      onCreateAccount={() => { setNotice(''); setMode('signup'); }}
      initialEmail={registeredEmail}
      notice={notice}
    />
  );
}
