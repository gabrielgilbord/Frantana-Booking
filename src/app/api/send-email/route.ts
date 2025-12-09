import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, message } = await request.json();

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos (to, subject, message)' },
        { status: 400 }
      );
    }

    // Configuración de Gmail con contraseña de aplicación
    const GMAIL_USER = process.env.GMAIL_USER;
    const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      console.error('Error: Gmail credentials no configuradas en .env.local');
      return NextResponse.json(
        { error: 'Configuración de email no disponible. Verifica las variables GMAIL_USER y GMAIL_APP_PASSWORD en .env.local' },
        { status: 500 }
      );
    }

    // Crear transporter de nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD.replace(/\s/g, ''), // Eliminar espacios de la contraseña
      },
    });

    // Configurar el email
    const mailOptions = {
      from: `Frantana <${GMAIL_USER}>`,
      to: to,
      subject: subject,
      html: message.replace(/\n/g, '<br>'),
      text: message, // Versión en texto plano
    };

    // Enviar el email
    const info = await transporter.sendMail(mailOptions);

    console.log('Email enviado correctamente:', {
      to,
      subject,
      messageId: info.messageId,
    });

    return NextResponse.json(
      { 
        success: true, 
        message: 'Email enviado correctamente',
        messageId: info.messageId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error enviando email:', error);
    return NextResponse.json(
      { 
        error: 'Error al enviar el email', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}







