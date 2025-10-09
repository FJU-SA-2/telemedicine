export async function POST(request) {
  try {
    const body = await request.json();
    
    // 獲取前端的 cookies
    const cookies = request.headers.get('cookie');
    
    const res = await fetch('http://127.0.0.1:5000/api/send-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cookies && { 'Cookie': cookies })  // 轉發 cookies
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    const data = await res.json();
    
    // 獲取 Flask 返回的 Set-Cookie
    const setCookieHeader = res.headers.get('set-cookie');
    
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    
    // 轉發 Set-Cookie 給前端
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