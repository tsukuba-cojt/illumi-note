const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

async function post(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    credentials: 'include',
  });

  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    // ignore json parse error
  }

  if (!response.ok) {
    const message = data?.error?.message || 'API request failed';
    const err = new Error(message);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export function login({ email, password, rememberMe }) {
  return post('/auth/login', { email, password, rememberMe });
}

export function register({ name, email, password, confirmPassword }) {
  return post('/auth/register', { name, email, password, confirmPassword });
}
