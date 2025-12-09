'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface TimePickerProps {
  initialHour?: number;
  initialMinute?: number;
  onTimeChange: (hour: number, minute: number) => void;
  className?: string;
}

const TimePicker = ({ 
  initialHour = 12, 
  initialMinute = 0, 
  onTimeChange, 
  className = '' 
}: TimePickerProps) => {
  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(initialMinute);

  const handleTimeSelect = (newHour: number, newMinute: number) => {
    setHour(newHour);
    setMinute(newMinute);
    onTimeChange(newHour, newMinute);
  };

  const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      {/* Hora seleccionada */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 sm:p-6 border-2 border-pink-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Hora seleccionada:</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-800">
              {timeString}
            </p>
          </div>
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
        </div>
      </div>

      {/* Timepicker */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 border border-gray-200">
        <div className="flex flex-col sm:flex-row items-center justify-center sm:space-x-8 gap-4">
          {/* Selector de Horas */}
          <div className="text-center">
            <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-4">Hora</h3>
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 max-h-40 sm:max-h-48 overflow-y-auto">
              <div className="grid grid-cols-6 sm:block gap-2 sm:space-y-2">
                {Array.from({ length: 24 }, (_, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleTimeSelect(i, minute)}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg font-bold transition-all duration-300 ${
                      hour === i
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white sm:scale-110 sm:shadow-lg'
                        : 'bg-white hover:bg-pink-100 text-gray-700 hover:text-pink-600'
                    }`}
                  >
                    {i.toString().padStart(2, '0')}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Separador */}
          <div className="hidden sm:block text-4xl font-bold text-gray-400">:</div>

          {/* Selector de Minutos */}
          <div className="text-center">
            <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-4">Minutos</h3>
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 max-h-40 sm:max-h-48 overflow-y-auto">
              <div className="grid grid-cols-6 sm:block gap-2 sm:space-y-2">
                {Array.from({ length: 60 }, (_, i) => {
                  if (i % 5 !== 0) return null;
                  return (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleTimeSelect(hour, i)}
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg font-bold transition-all duration-300 ${
                        minute === i
                          ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white sm:scale-110 sm:shadow-lg'
                          : 'bg-white hover:bg-pink-100 text-gray-700 hover:text-pink-600'
                      }`}
                    >
                      {i.toString().padStart(2, '0')}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Opciones rápidas */}
        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
          <h4 className="text-center text-xs sm:text-sm font-semibold text-gray-600 mb-3 sm:mb-4">Horarios Populares</h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
            {[
              { hour: 10, minute: 0, label: '10:00' },
              { hour: 12, minute: 0, label: '12:00' },
              { hour: 15, minute: 0, label: '15:00' },
              { hour: 18, minute: 0, label: '18:00' },
              { hour: 19, minute: 30, label: '19:30' },
              { hour: 20, minute: 0, label: '20:00' },
              { hour: 21, minute: 0, label: '21:00' },
              { hour: 22, minute: 0, label: '22:00' }
            ].map((time) => (
              <motion.button
                key={time.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTimeSelect(time.hour, time.minute)}
                className={`p-2 sm:p-3 rounded-lg border-2 text-xs sm:text-base transition-all duration-300 ${
                  hour === time.hour && minute === time.minute
                    ? 'border-pink-500 bg-pink-500 text-white'
                    : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50 text-gray-700'
                }`}
              >
                {time.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimePicker;
