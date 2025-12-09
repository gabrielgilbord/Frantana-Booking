'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, Send, Instagram, Youtube, Facebook, CheckCircle, XCircle } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

const WhatsappIcon = ({ className, ...props }: LucideProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="none"
    className={className}
    {...props}
  >
    <path d="M12 2.004a9.996 9.996 0 0 0-8.52 15.424L2.11 21.89a.75.75 0 0 0 .997.995l4.465-1.37A9.998 9.998 0 1 0 12 2.004Zm0 18.5a8.5 8.5 0 0 1-4.323-1.176.75.75 0 0 0-.57-.07l-3.234.99.995-3.203a.75.75 0 0 0-.07-.57A8.5 8.5 0 1 1 12 20.504Zm4.305-6.876c-.245-.123-1.448-.714-1.672-.795s-.387-.123-.548.123-.63.795-.773.959-.284.184-.529.061a6.92 6.92 0 0 1-2.04-1.26 7.62 7.62 0 0 1-1.414-1.762c-.148-.255-.016-.393.112-.516.115-.112.255-.29.382-.434a1.721 1.721 0 0 0 .255-.42.462.462 0 0 0-.02-.435c-.062-.123-.548-1.323-.75-1.815s-.4-.43-.548-.438-.306-.01-.469-.01-.435.062-.664.31a2.66 2.66 0 0 0-.82 1.977 4.627 4.627 0 0 0 .97 2.55 10.564 10.564 0 0 0 4.029 3.4 13.288 13.288 0 0 0 1.334.492c.56.178 1.07.153 1.473.093.45-.067 1.448-.59 1.652-1.16s.204-1.06.143-1.16-.224-.163-.469-.286Z" />
  </svg>
);

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // Formatear el mensaje del email
      const emailMessage = `
Hola Frantana,

Has recibido un nuevo mensaje desde el formulario de contacto:

Nombre: ${formData.name}
Email: ${formData.email}
${formData.subject ? `Asunto: ${formData.subject}` : ''}

Mensaje:
${formData.message}

---
Este mensaje fue enviado desde el formulario de contacto de tu sitio web.
      `.trim();

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: ['appfrantana@gmail.com', 'Frantanaoriginal@gmail.com'], // Enviar a ambos emails
          subject: formData.subject || `Nuevo mensaje de contacto de ${formData.name}`,
          message: emailMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar el mensaje');
      }

      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      // Resetear el estado después de 5 segundos
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);
    } catch (error: any) {
      console.error('Error enviando mensaje:', error);
      setSubmitStatus('error');
      setErrorMessage(error.message || 'Error al enviar el mensaje. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contacto" className="py-12 sm:py-20 lg:py-24 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14 sm:mb-16 lg:mb-20"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-pink-500 to-purple-500 mb-6 sm:mb-8">
            Contacto
          </h2>
          <p className="text-gray-300 text-base sm:text-lg md:text-xl max-w-4xl mx-auto leading-relaxed font-light">
            ¿Tienes alguna pregunta o quieres trabajar conmigo? 
            <span className="text-pink-400 font-semibold"> ¡No dudes en contactarme!</span>
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16">
          {/* Información de contacto */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-5 sm:mb-7">Información de Contacto</h3>
            
            <div className="space-y-6">
              <motion.div
                whileHover={{ x: 10 }}
                className="flex items-start sm:items-center space-x-3 sm:space-x-4 p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="text-white font-semibold">Frantanaoriginal@gmail.com</p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ x: 10 }}
                className="flex items-center space-x-3 sm:space-x-4 p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Teléfono</p>
                  <p className="text-white font-semibold">+34 604 220 113</p>
                </div>
              </motion.div>

            </div>

            {/* Redes sociales */}
            <div className="pt-6 sm:pt-8">
              <h4 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Sígueme en Redes</h4>
              <div className="flex flex-wrap gap-3 sm:gap-5">
                {[
                  {
                    icon: Instagram,
                    name: 'Instagram',
                    color: 'from-pink-500 via-purple-500 to-orange-400',
                    href: 'https://www.instagram.com/frantana/'
                  },
                  {
                    icon: Facebook,
                    name: 'Facebook',
                    color: 'from-blue-500 via-blue-600 to-indigo-500',
                    href: 'https://www.facebook.com/Frantanaoficial'
                  },
                  {
                    icon: Youtube,
                    name: 'YouTube',
                    color: 'from-red-500 via-rose-500 to-orange-500',
                    href: 'https://www.youtube.com/@frantana1477'
                  },
                  {
                    icon: WhatsappIcon,
                    name: 'WhatsApp',
                    color: 'from-emerald-400 via-green-500 to-lime-400',
                    href: 'https://www.whatsapp.com/channel/0029VaIbX3P77qVQE3HXoC46?fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQMMjU2MjgxMDQwNTU4AAGnDGSgoOJPLlVa3T24gytIcpMH3oqRIpfElKtHXX3bNyGtkyjkXK4ROqE_gGA_aem_GI8o4JGuuQjoS8cUHGfWIA'
                  }
                ].map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <motion.a
                      key={index}
                      whileHover={{ scale: 1.1, y: -4 }}
                      whileTap={{ scale: 0.96 }}
                      href={social.href}
                      aria-label={social.name}
                      className="group relative flex items-center justify-center"
                    >
                      <span
                        className={`absolute inset-0 rounded-full bg-gradient-to-br ${social.color} opacity-70 blur-md transition-opacity duration-300 group-hover:opacity-100`}
                      />
                      <span
                        className="relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-slate-900/90 border border-white/20 shadow-[0_10px_30px_rgba(15,15,45,0.25)] group-hover:shadow-[0_15px_45px_rgba(15,15,45,0.35)] transition-all duration-300"
                      >
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-sm" />
                      </span>
                    </motion.a>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Formulario de contacto */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-white/10"
          >
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">Envíame un Mensaje</h3>
            
            {submitStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl flex items-center gap-3"
              >
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <p className="text-green-300 text-sm sm:text-base">
                  ¡Mensaje enviado correctamente! Te responderé pronto.
                </p>
              </motion.div>
            )}

            {submitStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-start gap-3"
              >
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-300 text-sm sm:text-base font-semibold mb-1">
                    Error al enviar el mensaje
                  </p>
                  <p className="text-red-300/80 text-xs sm:text-sm">
                    {errorMessage}
                  </p>
                </div>
              </motion.div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-pink-400 focus:bg-white/20 transition-all duration-300"
                    placeholder="Tu nombre"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-pink-400 focus:bg-white/20 transition-all duration-300"
                    placeholder="tu@email.com"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Asunto
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-pink-400 focus:bg-white/20 transition-all duration-300"
                  placeholder="¿En qué puedo ayudarte?"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Mensaje *
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-pink-400 focus:bg-white/20 transition-all duration-300 resize-none"
                  placeholder="Cuéntame más sobre tu proyecto..."
                  disabled={isSubmitting}
                />
              </div>

              <motion.button
                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl shadow-xl hover:shadow-pink-500/50 transition-all duration-300 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Enviar Mensaje</span>
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;






