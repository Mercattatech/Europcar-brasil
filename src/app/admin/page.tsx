export default function CMSDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-gray-800">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-europcar-green">
           <h3 className="text-gray-500 font-medium text-sm">Reservas Hoje</h3>
           <p className="text-3xl font-bold mt-2 text-gray-800">0</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-600">
           <h3 className="text-gray-500 font-medium text-sm">Integração XRS</h3>
           <p className="text-lg font-bold mt-2 text-green-600 flex items-center">
              <span className="h-3 w-3 rounded-full bg-green-500 mr-2"></span>
              Online
           </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-sky-400">
           <h3 className="text-gray-500 font-medium text-sm">Integração Cielo 3.0</h3>
           <p className="text-lg font-bold mt-2 text-yellow-600 flex items-center">
              <span className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></span>
               Pendente Config 
           </p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Próximos Passos</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>Cadastrar textos institucionais no menu Content Blocks.</li>
          <li>Fornecer credenciais da Europcar XRS no menu Config.</li>
          <li>Fornecer chaves MerchantId da Cielo no menu Config.</li>
        </ul>
      </div>
    </div>
  )
}
