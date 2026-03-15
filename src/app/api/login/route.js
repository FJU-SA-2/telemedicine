export async function POST(request) {
  try {
    const body = await request.json();
    
    const res = await fetch(`${process.env.BACKEND_URL || 'http://127.0.0.1:5000'}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    
    // 如果 Flask 有設定 Set-Cookie，需要轉發
    const cookies = res.headers.get('set-cookie');
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    if (cookies) {
      headers.set('Set-Cookie', cookies);
    }

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers,
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: '連接失敗' }), {
      status: 500,
    });
  }
}