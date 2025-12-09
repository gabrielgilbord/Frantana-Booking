'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 96; // Altura del header
      const elementPosition = element.offsetTop - headerHeight;
      
      // Scroll suave con easing personalizado
      const startPosition = window.pageYOffset;
      const distance = elementPosition - startPosition;
      const duration = 1000; // 1 segundo
      let start: number | null = null;

      const animation = (currentTime: number) => {
        if (start === null) start = currentTime;
        const timeElapsed = currentTime - start;
        const run = easeInOutCubic(timeElapsed, startPosition, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animation);
      };

      requestAnimationFrame(animation);
    }
  };

  // Función de easing para scroll más suave
  const easeInOutCubic = (t: number, b: number, c: number, d: number) => {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t * t + b;
    t -= 2;
    return c / 2 * (t * t * t + 2) + b;
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-slate-900/95 backdrop-blur-md shadow-2xl border-b border-pink-500/20' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-24">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-4"
          >
            {/* Monograma FT mejorado */}
            <div className="relative group">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 via-pink-600 to-purple-600 rounded-xl flex items-center justify-center shadow-xl group-hover:shadow-pink-500/50 transition-all duration-300">
                <div className="text-white font-black text-2xl">
                  <div className="relative">
                    <span className="absolute -top-1 -left-1">F</span>
                    <span className="absolute top-0 left-2">T</span>
                  </div>
                </div>
              </div>
              {/* Efecto de resplandor */}
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/30 to-purple-500/30 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            
            {/* Texto FRANTANA */}
            <div className="flex flex-col">
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500 tracking-wider">
                FRANTANA
              </h1>
              <p className="text-sm text-pink-300 font-medium tracking-widest">
                OFICIAL
              </p>
            </div>
          </motion.div>

          {/* Navegación */}
          <nav className="hidden md:flex items-center space-x-12">
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => scrollToSection('inicio')}
              className="text-white/80 hover:text-pink-400 font-semibold transition-colors duration-300 text-lg relative group"
            >
              Inicio
              <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-400 to-purple-400 group-hover:w-full transition-all duration-300"></div>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => scrollToSection('reservas')}
              className="text-white/80 hover:text-pink-400 font-semibold transition-colors duration-300 text-lg relative group"
            >
              Reservas
              <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-400 to-purple-400 group-hover:w-full transition-all duration-300"></div>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => scrollToSection('servicios')}
              className="text-white/80 hover:text-pink-400 font-semibold transition-colors duration-300 text-lg relative group"
            >
              Servicios
              <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-400 to-purple-400 group-hover:w-full transition-all duration-300"></div>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => scrollToSection('contacto')}
              className="text-white/80 hover:text-pink-400 font-semibold transition-colors duration-300 text-lg relative group"
            >
              Contacto
              <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-400 to-purple-400 group-hover:w-full transition-all duration-300"></div>
            </motion.button>
          </nav>

          {/* Botón CTA */}
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => scrollToSection('reservas')}
            className="group relative overflow-hidden bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 text-white font-bold px-8 py-3 rounded-xl shadow-xl hover:shadow-pink-500/50 transition-all duration-300 hidden sm:block"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <span className="relative">Reservar Ahora</span>
          </motion.button>

          {/* Menú móvil */}
          <button className="md:hidden p-3 group">
            <svg className="w-6 h-6 text-white/80 group-hover:text-pink-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
