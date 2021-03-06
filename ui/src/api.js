// Performs a request and parses the result. Takes a single argument with the
// request options:
// - method: The HTTP method
// - url: The API path you want to query, without the hostname (e.g. '/api/dosomething')
// - isMultipart?: Unsets the content-type header if true
// - headers?: Additional HTTP headers
// - body?: The HTTP body, if sending a POST or PUT request
// Either resolves with the returned JSON body or rejects with an error message when
// something outside of the 200 range has been returned.
export async function request (opts) {
  const requestOptions = {
    method: opts.method,
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    credentials: 'include'
  }

  if (opts.isMultipart) {
    delete requestOptions.headers['Content-Type']
  }

  if (['POST', 'PUT'].includes(opts.method)) {
    if (opts.body instanceof FormData) {
      requestOptions.body = opts.body
    } else {
      requestOptions.body = JSON.stringify(opts.body)
    }
  }

  const fetchRes = await fetch(`/api/v1${opts.url}`, requestOptions)
  const textRes = await fetchRes.text()
  const data = textRes && JSON.parse(textRes)
  if (!fetchRes.ok) {
    return Promise.reject({ status: fetchRes.status, message: data.message || 'Error' })
  }

  return data
}
