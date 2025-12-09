'use client';

import { motion } from 'framer-motion';
import { Music, Mic, Users, Star, Award, Headphones } from 'lucide-react';

const AboutSection = () => {
  const features = [
    {
      icon: Music,
      title: 'Grabación Profesional',
      description: 'Estudio equipado con la mejor tecnología para capturar tu música con calidad profesional.'
    },
    {
      icon: Mic,
      title: 'Shows en Vivo',
      description: 'Presentaciones dinámicas y energéticas que conectan con el público de manera única.'
    },
    {
      icon: Users,
      title: 'Ensayos Privados',
      description: 'Espacios acústicos perfectos para preparar tus presentaciones y perfeccionar tu arte.'
    },
    {
      icon: Headphones,
      title: 'Clases Personalizadas',
      description: 'Aprendizaje individualizado adaptado a tu nivel y objetivos musicales.'
    },
    {
      icon: Award,
      title: 'Eventos Especiales',
      description: 'Servicios premium para ocasiones únicas con atención personalizada y calidad excepcional.'
    },
    {
      icon: Star,
      title: 'Experiencia Garantizada',
      description: 'Más de 10 años de experiencia en la industria musical con clientes satisfechos.'
    }
  ];

  return (
    <section id="servicios" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-bold gradient-text mb-8">
            Servicios Musicales de Élite
          </h2>
          <p className="text-gray-600 text-xl max-w-4xl mx-auto leading-relaxed">
            Descubre la gama completa de servicios profesionales que FRANTANA ofrece. 
            Cada experiencia está diseñada para superar tus expectativas y llevar tu música al siguiente nivel.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="card p-10 text-center group"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-6">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-20 bg-gradient-to-r from-pink-50 to-red-50 rounded-3xl p-8 md:p-12"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">500+</div>
              <div className="text-gray-600 font-medium">Clientes Satisfechos</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">10+</div>
              <div className="text-gray-600 font-medium">Años de Experiencia</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">1000+</div>
              <div className="text-gray-600 font-medium">Horas de Grabación</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">50+</div>
              <div className="text-gray-600 font-medium">Eventos Realizados</div>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-16 text-center"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            ¿Listo para tu próxima experiencia musical?
          </h3>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Reserva tu sesión ahora y descubre por qué FRANTANA es la elección preferida 
            de artistas y músicos profesionales.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              document.getElementById('reservas')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="btn-primary text-lg px-8 py-4"
          >
            Reservar Ahora
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
