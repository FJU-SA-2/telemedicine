export async function GET(request) {
  try {
    // 取得前端的 cookie 並轉發給 Flask
    const cookie = request.headers.get('cookie');
    
    const res = await fetch(`http://127.0.0.1:5000/api/me`, {
      method: 'GET',
      headers: {
        'Cookie': cookie || '',
      },
    });

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 401,
    });
  }
}