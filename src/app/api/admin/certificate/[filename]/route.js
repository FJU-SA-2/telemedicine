export async function GET(request, { params }) {
  try {
    const { filename } = params;
    const cookies = request.headers.get('cookie');
    
    console.log('📂 Next.js 代理請求證明:', filename);
    console.log('🍪 轉發 Cookies:', cookies);
    
    const res = await fetch(`${process.env.BACKEND_URL || 'http://127.0.0.1:5000'}/api/admin/certificate/${filename}`, {
      method: 'GET',
      headers: {
        ...(cookies && { 'Cookie': cookies })
      },
      credentials: 'include',
    });

    if (!res.ok) {
      console.error('❌ Flask 返回錯誤:', res.status);
      return new Response(JSON.stringify({ message: '無法載入證明' }), {
        status: res.status,
      });
    }

    // 取得圖片 blob
    const blob = await res.blob();
    
    // 轉發圖片
    return new Response(blob, {
      status: 200,
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'image/jpeg',
      },
    });
  } catch (error) {
    console.error('❌ 代理錯誤:', error);
    return new Response(JSON.stringify({ message: '載入失敗' }), {
      status: 500,
    });
  }
}