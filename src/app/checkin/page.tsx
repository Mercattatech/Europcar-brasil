export default function CheckInOnline() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Check-in Online Avançado</h1>
        <p className="text-lg text-gray-600 mb-12 max-w-2xl">
          Evite filas no balcão e acelere a retirada do seu veículo. Digite o número da sua reserva Europcar (XRS) e envie uma foto de seus documentos antes de sair de casa.
        </p>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
           <div className="flex flex-col md:flex-row">
              
              <div className="p-8 md:w-1/2">
                 <h3 className="text-2xl font-bold text-gray-800 mb-6">Iniciar Processo</h3>
                 
                 <form className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número da Reserva
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 8501239853"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-europcar-green focus:border-europcar-green outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        E-mail do Locatário principal
                      </label>
                      <input
                        type="email"
                        placeholder="seu@email.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-europcar-green focus:border-europcar-green outline-none transition-all"
                      />
                    </div>
                    
                    <button
                      type="button"
                      className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 px-8 rounded-lg transition-colors flex justify-center items-center gap-2"
                    >
                      Avançar para Documentos
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </button>
                 </form>
              </div>

              <div className="bg-green-50 p-8 md:w-1/2 border-l border-green-100 flex flex-col justify-center">
                 <h3 className="text-xl font-bold text-gray-900 mb-4 text-europcar-dark">Vantagens de fazer rápido:</h3>
                 <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                       <div className="bg-europcar-green text-white rounded-full p-1 mt-0.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                       </div>
                       <div>
                          <p className="font-bold text-gray-800">Balcão Prioritário</p>
                          <p className="text-sm text-gray-500">Apresente apenas o QRCode no balcão de Check-in Express.</p>
                       </div>
                    </li>
                    <li className="flex items-start gap-3">
                       <div className="bg-europcar-green text-white rounded-full p-1 mt-0.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                       </div>
                       <div>
                          <p className="font-bold text-gray-800">Menos Contribuições com Papel</p>
                          <p className="text-sm text-gray-500">Seu contrato de aluguel será enviado digitalmente.</p>
                       </div>
                    </li>
                 </ul>
              </div>

           </div>
        </div>

      </div>
    </div>
  )
}
