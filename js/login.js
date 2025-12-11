// login.js - Updated to use MySQL backend API
document.getElementById('loginForm').onsubmit = async function(e) {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || 'Usuario o contraseña incorrectos');
      return;
    }

    // Store user info in sessionStorage for quick access
    sessionStorage.setItem('sessionUser', JSON.stringify(data.user));

    // Redirect to main page
    window.location.href = 'index.html';

  } catch (error) {
    console.error('Login error:', error);
    alert('Error al conectar con el servidor. Por favor, intente nuevamente.');
  }
};
