import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const response = NextResponse.json({ 
      success: true, 
      message: '登出成功' 
    });
    
    // 清除 cookie
    response.cookies.delete('admin_session');
    
    return response;
  } catch (error) {
    console.error('管理者登出錯誤:', error);
    return NextResponse.json(
      { success: false, message: '登出失敗' },
      { status: 500 }
    );
  }
}