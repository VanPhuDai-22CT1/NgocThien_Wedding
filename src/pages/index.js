import React, { useState } from 'react';

function Users() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(null); // Lưu thông tin người dùng đã đăng nhập
  const [error, setError] = useState('');

  const handleLogin = () => {
    // Gửi thông tin đăng nhập tới API
    fetch('/api/legacy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Đăng nhập thất bại!');
        }
        return response.json();
      })
      .then(data => {
        setLoggedInUser(data); // Lưu thông tin người dùng đã đăng nhập
        setError('');
      })
      .catch(error => setError(error.message));
  };

  return (
    <div>
      {!loggedInUser ? (
        <div>
          <h1>Đăng nhập</h1>
          <input
            type="text"
            placeholder="Tên đăng nhập"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <br />
          <input
            type="password"
            placeholder="Máº­t kháº©u"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <br />
          <button onClick={handleLogin}>Đăng nhập</button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      ) : (
        <div>
          <h1>Thông tin người dùng</h1>
          <p><strong>ID:</strong> {loggedInUser.id}</p>
          <p><strong>Tên đăng nhập:</strong> {loggedInUser.username}</p>
          <p><strong>Email:</strong> {loggedInUser.email}</p>
          <button onClick={() => setLoggedInUser(null)}>Đăng xuất</button>
        </div>
      )}
    </div>
  );
}

export default Users;

