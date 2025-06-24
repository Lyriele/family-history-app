import React, { useState } from 'react'; // Import useState
import { getAuth, signInWithEmailAndPassword,          // eslint-disable-next-line no-unused-vars
    createUserWithEmailAndPassword } from 'firebase/auth';

// LoginForm component receives onLoginSuccess as a prop
function LoginForm({ onLoginSuccess }) { // Destructure onLoginSuccess from props

  // State to hold the values of the email and password input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null); // State to display login errors

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior (page reload)
    setError(null); // Clear previous errors

    try {
      const auth = getAuth(); // Get the Firebase Auth instance

      // Use signInWithEmailAndPassword with the state variables
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Logged in:", userCredential.user);

      // Call the onLoginSuccess prop if login is successful
      if (onLoginSuccess) {
        onLoginSuccess(userCredential.user);
      }

    } catch (firebaseError) {
      // Catch and display specific Firebase errors
      console.error("Login error:", firebaseError.message);
      setError(firebaseError.message); // Set error state to display to the user
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '50px auto', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <h2>Login to Your Family Tree</h2>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>} {/* Display errors */}
      <form onSubmit={handleSubmit}> {/* Attach handleSubmit to the form's onSubmit */}
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email} // Bind input value to state
            onChange={(e) => setEmail(e.target.value)} // Update state on change
            required
            style={{ width: '100%', padding: '8px', margin: '8px 0', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password} // Bind input value to state
            onChange={(e) => setPassword(e.target.value)} // Update state on change
            required
            style={{ width: '100%', padding: '8px', margin: '8px 0', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Login
        </button>
      </form>
      {/* You can add a register button/link here later if you enable createUserWithEmailAndPassword */}
    </div>
  );
}

export default LoginForm;