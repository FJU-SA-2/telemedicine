export async function GET(request, { params }) {
  try {
    const { filename } = params;
    const cookies = request.headers.get('cookie');
    
    const res = await fetch(`http://127.0.0.1:5000/api/admin/certificate/${filename}`, {
      method: 'GET',
      headers: {
        ...(cookies && { 'Cookie': cookies })
      },
      credentials: 'include',
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ message: '無法獲取證書' }), {
        status: res.status,
      });
    }

    // 轉發圖片
    const imageBuffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type');

    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType || 'image/jpeg',
      },
    });
  } catch (error) {
    console.error('Get Certificate Error:', error);
    return new Response(JSON.stringify({ message: '獲取證書失敗' }), {
      status: 500,
    });
  }
}