export async function apiFetch(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (e) {
    console.error('API fetch failed:', path, e);
    return null;
  }
}
