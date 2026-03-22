export async function POST(request) {
  try {
    const cookie = request.headers.get('cookie');
    
    const res = await fetch(`http://127.0.0.1:5000/api/logout`, {
      method: 'POST',
      headers: {
        'Cookie': cookie || '',
      },
    });

    const data = await res.json();

    // 清除 cookie
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Set-Cookie', 'telemedicine_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers,
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: '登出失敗' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}