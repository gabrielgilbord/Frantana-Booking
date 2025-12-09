# FRANTANA - Motor de Reservas Musical

Un sistema de reservas moderno y elegante diseñado específicamente para el artista FRANTANA. Incluye un motor de reservas completo con datepicker y timepicker personalizados, diseño responsive y una interfaz profesional que refleja la calidad artística.

## 🎵 Características

- **Motor de Reservas Completo**: Sistema de reservas paso a paso con validación
- **Datepicker Personalizado**: Calendario interactivo con diseño moderno
- **Timepicker Intuitivo**: Selección de horarios disponibles
- **Diseño Responsive**: Optimizado para todos los dispositivos
- **Animaciones Suaves**: Transiciones elegantes con Framer Motion
- **Tipografía Profesional**: Inspirada en el logo de FRANTANA
- **Paleta de Colores**: Basada en la identidad visual del artista

## 🚀 Servicios Disponibles

- **Grabación de Estudio** - €80 (120 min)
- **Show en Vivo** - €150 (90 min)
- **Ensayo Privado** - €50 (60 min)
- **Clase Personalizada** - €40 (60 min)
- **Evento Especial** - €200 (180 min)

## 🛠️ Tecnologías Utilizadas

- **Next.js 14** - Framework de React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos utilitarios
- **Framer Motion** - Animaciones
- **React DatePicker** - Componente de fechas
- **Lucide React** - Iconos modernos

## 📦 Instalación

1. **Clonar el repositorio**:
   ```bash
   git clone [url-del-repositorio]
   cd frantana-booking
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Ejecutar en modo desarrollo**:
   ```bash
   npm run dev
   ```

4. **Abrir en el navegador**:
   ```
   http://localhost:3000
   ```

## 🎨 Diseño

El diseño está inspirado en la identidad visual de FRANTANA:

- **Colores principales**: Rosa (#FF69B4) y Rojo (#8B1538)
- **Tipografía**: Inter (similar al logo)
- **Estilo**: Moderno, minimalista y profesional
- **Efectos**: Glassmorphism, gradientes y sombras suaves

## 📱 Características Responsive

- **Mobile First**: Diseño optimizado para móviles
- **Breakpoints**: sm, md, lg, xl
- **Navegación**: Menú hamburguesa en móviles
- **Formularios**: Adaptados a pantallas táctiles

## 🔧 Personalización

### Colores
Los colores se pueden personalizar en `tailwind.config.ts`:

```typescript
colors: {
  'frantana-red': '#8B1538',
  'frantana-pink': '#FF69B4',
  'frantana-silver': '#C0C0C0',
  // ...
}
```

### Servicios
Los servicios se pueden modificar en `BookingForm.tsx`:

```typescript
const services = [
  { id: 'recording', name: 'Grabación de Estudio', price: 80, duration: 120 },
  // ...
];
```

## 📋 Funcionalidades del Motor de Reservas

1. **Selección de Servicio**: Elige entre diferentes tipos de servicios
2. **Selección de Fecha**: Calendario interactivo con fechas disponibles
3. **Selección de Hora**: Horarios disponibles para la fecha seleccionada
4. **Datos Personales**: Formulario de contacto completo
5. **Confirmación**: Resumen de la reserva y confirmación

## 🎯 Próximas Mejoras

- [ ] Integración con base de datos
- [ ] Sistema de pagos
- [ ] Notificaciones por email
- [ ] Panel de administración
- [ ] Calendario de disponibilidad en tiempo real

## 📞 Contacto

Para más información sobre FRANTANA:
- **Email**: info@frantana.com
- **Teléfono**: +34 600 000 000
- **Ubicación**: Madrid, España

## 📄 Licencia

Este proyecto está desarrollado específicamente para FRANTANA. Todos los derechos reservados.

---

*Desarrollado con ❤️ para FRANTANA*