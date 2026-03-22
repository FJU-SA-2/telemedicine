export async function POST(request) {
  try {
    const formData = await request.formData();
    const cookies = request.headers.get('cookie');
    
    const res = await fetch(`http://127.0.0.1:5000}/api/upload-certificate`, {
      method: 'POST',
      headers: {
        ...(cookies && { 'Cookie': cookies })
      },
      credentials: 'include',
      body: formData, // 直接轉發 FormData
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
    console.error('Upload Error:', error);
    return new Response(JSON.stringify({ message: '檔案上傳失敗' }), {
      status: 500,
    });
  }
}