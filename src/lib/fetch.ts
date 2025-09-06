// Generic fetch wrapper with type safety
export async function fetchWrapper<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// GET request helper
export async function get<T>(url: string, options: RequestInit = {}): Promise<T> {
  return fetchWrapper<T>(url, {
    ...options,
    method: 'GET',
  });
}

// POST request helper
export async function post<T>(
  url: string,
  body: any,
  options: RequestInit = {}
): Promise<T> {
  return fetchWrapper<T>(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// PUT request helper
export async function put<T>(
  url: string,
  body: any,
  options: RequestInit = {}
): Promise<T> {
  return fetchWrapper<T>(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

// DELETE request helper
export async function del<T>(url: string, options: RequestInit = {}): Promise<T> {
  return fetchWrapper<T>(url, {
    ...options,
    method: 'DELETE',
  });
}
