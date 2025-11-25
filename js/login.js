// login.js
(function initDefaultUsers() {
  if (!localStorage.getItem('users_v1')) {
      const defaultUsers = [
          { id: 1, username: 'zahir', password: 'programador', role: 'ADMIN' },
          { id: 2, username: 'cajero', password: '1234', role: 'CAJERO' },
          { id: 3, username: 'brayan', password: 'cajero', role: 'ADMIN' }
      ];
      localStorage.setItem('users_v1', JSON.stringify(defaultUsers));
  }
})();

document.getElementById('loginForm').onsubmit = function(e) {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const users = JSON.parse(localStorage.getItem('users_v1') || '[]');
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
      alert('Usuario o contraseña incorrectos');
      return;
  }

  // Guardar sesión (objeto con username y role)
  localStorage.setItem('sessionUser', JSON.stringify({ username: user.username, role: user.role }));

  // Redirigir según rol (si quieres diferenciar, puedes crear paneles distintos)
  window.location.href = 'index.html';
};
