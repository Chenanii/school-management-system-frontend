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
        onCreated={(email, confirmationEmailSent) => {
          setRegisteredEmail(email);
          setNotice(confirmationEmailSent
            ? `Registration is complete. A confirmation email has been sent to ${email}. Sign in to begin setting up your school.`
            : `Registration is complete, but we could not deliver the confirmation email. Sign in with ${email} and the password you created during registration.`);
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
