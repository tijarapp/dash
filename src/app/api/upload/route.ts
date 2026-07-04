import { NextRequest, NextResponse } from 'next/server';
import { DEMO_MODE } from '@/lib/demo';
import { getAdminUser } from '@/lib/session';
import { uploadCategoryImage } from '@/lib/uploadCategoryImage';

export async function POST(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  if (DEMO_MODE) {
    return NextResponse.json({ url: '' });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File) || !file.size) {
      return NextResponse.json({ error: 'لم يتم اختيار صورة' }, { status: 400 });
    }

    const url = await uploadCategoryImage(file);
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'فشل رفع الصورة';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
