export async function POST(request) {
  try {
    const body = await request.json();
    
    const res = await fetch(`${process.env.BACKEND_URL || 'http://127.0.0.1:5000'}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: res.status,
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: '連接失敗' }), {
      status: 500,
    });
  }
}