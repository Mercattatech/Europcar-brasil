'use client';

import { useState } from "react";

export default function MinhasReservas() {
  const [resNumber, setResNumber] = useState('');
  const [email, setEmail] = useState('');
  
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const res = await fetch(`/api/reservas?resNumber=${resNumber}`);
        const data = await res.json();
        
        if (res.ok) {
           alert(`Reserva encontrada! Status: ${data.status} | Cliente: ${data.customerData?.firstName || ''}`);
        } else {
           alert("Reserva não encontrada.");
        }
    } catch(err) {
        alert("Erro de conexão ao buscar.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Minhas Reservas
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Consulte, altere ou cancele sua reserva na Europcar
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleLookup}>
            
            <div>
              <label htmlFor="resNumber" className="block text-sm font-medium text-gray-700">
                Número da Reserva (Ex: 123456789)
              </label>
              <div className="mt-1">
                <input
                  id="resNumber"
                  name="resNumber"
                  type="text"
                  required
                  value={resNumber}
                  onChange={(e) => setResNumber(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-europcar-green focus:border-europcar-green sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-mail
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-europcar-green focus:border-europcar-green sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-europcar-green hover:bg-europcar-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-europcar-green transition-colors"
              >
                Buscar Reserva
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  )
}
