export async function GET(request) {  // ← 注意是 GET 不是 POST
  try {
    const cookies = request.headers.get('cookie');

    const res = await fetch('http://127.0.0.1:5000/api/record', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(cookies && { 'Cookie': cookies }),
      },
    });

    const data = await res.json();

    const setCookieHeader = res.headers.get('set-cookie');
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    if (setCookieHeader) {
      headers.set('Set-Cookie', setCookieHeader);
    }

    return new Response(JSON.stringify(data), { status: res.status, headers });
  } catch (error) {
    return new Response(JSON.stringify({ message: '連接失敗' }), { status: 500 });
  }
}