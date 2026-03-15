export async function POST(request, { params }) {
  try {
    const { doctor_id } = params;
    const body = await request.json();
    const cookies = request.headers.get('cookie');
    
    const res = await fetch(`http://127.0.0.1:5000/api/admin/reject-doctor/${doctor_id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cookies && { 'Cookie': cookies })
      },
      credentials: 'include',
      body: JSON.stringify(body),
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