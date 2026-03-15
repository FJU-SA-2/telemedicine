export async function POST(request) {
  try {
    const body = await request.json();
    
    // ⚠️ 重要：轉發前端的 cookies
    const cookies = request.headers.get('cookie');
    
    const res = await fetch(`http://127.0.0.1:5000/api/verify-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cookies && { 'Cookie': cookies })  // 轉發 cookies
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    const data = await res.json();
    
    const setCookieHeader = res.headers.get('set-cookie');
    
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    
    if (setCookieHeader) {
      headers.set('Set-Cookie', setCookieHeader);
    }

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers,
    });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ message: '連接失敗' }), {
      status: 500,
    });
  }
}