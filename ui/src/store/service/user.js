export function doRegister (username, password, confirmPassword, email, code) {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: { username, password, confirmPassword, email }, code })
  }

  return fetch(`${process.env.TOMETO_BACKEND_URL}/api/register`, requestOptions)
    .then(res => res.text().then(text => {
      const data = text && JSON.parse(text)
      if (!res.ok) {
        const error = (data && data.message) || res.statusText
        return Promise.reject(error)
      }
      return data
    }))
}

export function doLogin (username, password, remember) {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, remember_me: String(remember) }),
    credentials: 'include'
  }

  return fetch(`${process.env.TOMETO_BACKEND_URL}/api/auth`, requestOptions)
    .then(res => res.text().then(text => {
      const data = text && JSON.parse(text)
      if (!res.ok) {
        const error = (data && data.message) || res.statusText
        return Promise.reject(error)
      }
      return data
    }))
}

export function doLogout (id) {
  const requestOptions = {
    method: 'DELETE',
    credentials: 'include'
  }

  return fetch(`${process.env.TOMETO_BACKEND_URL}/api/auth?id=${id}`, requestOptions)
    .then(res => res.text().then(text => {
      const data = text && JSON.parse(text)
      if (!res.ok) {
        const error = (data && data.message) || res.statusText
        return Promise.reject(error)
      }
      return data
    }))
}

export function doPoll () {
  const requestOptions = {
    method: 'GET',
    credentials: 'include'
  }

  return fetch(`${process.env.TOMETO_BACKEND_URL}/api/poll`, requestOptions)
    .then(res => res.text().then(text => {
      const data = text && JSON.parse(text)
      if (res.status === 401) {
        return null
      }
      if (!res.ok) {
        const error = (data && data.message) || res.statusText
        return Promise.reject(error)
      }
      return data
    }))
}