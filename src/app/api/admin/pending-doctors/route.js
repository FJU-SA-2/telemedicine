export async function GET(request) {
  try {
    const cookies = request.headers.get('cookie');
    
    const res = await fetch(`http://127.0.0.1:5000/api/admin/pending-doctors`, {
      method: 'GET',
      headers: {
        ...(cookies && { 'Cookie': cookies })
      },
      credentials: 'include',
    });

    const data = await res.json();
    
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: '連接失敗' }), {
      status: 500,
    });
  }
}