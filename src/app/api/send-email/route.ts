import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, message } = await request.json();

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos (to, subject, message)' },
        { status: 400 }
      );
    }

    // Configuración de Resend (o el servicio de email que uses)
    // Por ahora, simulamos el envío. Necesitarás configurar tu API key de Resend o similar
    
    // Ejemplo con Resend (descomentar cuando tengas la API key):
    /*
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    if (!RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'API key no configurada' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@frantana.com', // Cambia esto por tu dominio verificado
        to: [to],
        subject: subject,
        html: message.replace(/\n/g, '<br>'),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    */

    // Por ahora, solo logueamos el email (para desarrollo)
    console.log('Email a enviar:', {
      to,
      subject,
      message,
    });

    return NextResponse.json(
      { 
        success: true, 
        message: 'Email enviado correctamente',
        // id: data.id // Cuando uses Resend de verdad
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error enviando email:', error);
    return NextResponse.json(
      { error: 'Error al enviar el email', details: error.message },
      { status: 500 }
    );
  }
}







