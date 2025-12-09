import { NextRequest, NextResponse } from 'next/server';
import { generateICS } from '@/lib/icalendar';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const title = searchParams.get('title');
    const description = searchParams.get('description') || '';
    const location = searchParams.get('location') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const organizerName = searchParams.get('organizerName') || 'FRANTANA';
    const organizerEmail = searchParams.get('organizerEmail') || 'info@frantana.com';

    if (!title || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos (title, startDate, endDate)' },
        { status: 400 }
      );
    }

    const event = {
      title,
      description,
      location,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      organizer: {
        name: organizerName,
        email: organizerEmail,
      },
    };

    const icsContent = generateICS(event);
    const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar;charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Error generando archivo .ics:', error);
    return NextResponse.json(
      { error: 'Error al generar el archivo de calendario', details: error.message },
      { status: 500 }
    );
  }
}






