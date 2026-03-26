import prisma from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ReservationsAdminPage() {
  const reservations = await prisma.localReservation.findMany({
      orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-gray-800">Reservas Locais</h1>
      </div>

      {reservations.length === 0 ? (
        <div className="bg-white p-8 rounded border border-gray-200 text-center text-gray-500">
           Nenhuma reserva encontrada ainda.
        </div>
      ) : (
        <div className="bg-white border text-sm border-gray-200 rounded shadow-sm overflow-hidden">
           <table className="w-full text-left">
              <thead className="bg-[#008d36] text-white">
                 <tr>
                    <th className="px-6 py-4 font-bold uppercase text-xs">Cód. Reserva</th>
                    <th className="px-6 py-4 font-bold uppercase text-xs">Cliente</th>
                    <th className="px-6 py-4 font-bold uppercase text-xs">Veículo / Valor</th>
                    <th className="px-6 py-4 font-bold uppercase text-xs">Data Criação</th>
                    <th className="px-6 py-4 font-bold uppercase text-xs">Status Pagto.</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                 {reservations.map(res => {
                    let parsedData: any = {};
                    try { parsedData = JSON.parse(res.customerData as string); } catch(e){}
                    
                    return (
                      <tr key={res.id} className="hover:bg-gray-50">
                         <td className="px-6 py-4">
                            <div className="font-black text-lg text-gray-900">{res.resNumber}</div>
                            <div className="text-xs text-gray-400">ID: {res.merchantOrderId}</div>
                         </td>
                         <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">{parsedData?.nome || 'Cliente'} {parsedData?.sobrenome}</div>
                            <div className="text-xs text-gray-500">{parsedData?.email}</div>
                            <div className="text-xs text-gray-500">{parsedData?.cpf} • {parsedData?.telefone}</div>
                            {parsedData?.systemLogOrigem && (
                               <div className="text-[10px] text-gray-400 mt-1 font-mono break-all max-w-[150px]">
                                  {parsedData.systemLogOrigem}
                               </div>
                            )}
                         </td>
                         <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">{parsedData?.booking?.car?.name || '-'}</div>
                            <div className="text-xs text-green-700 font-bold">R$ {((parsedData?.booking?.totalDay || 0) * 22).toFixed(2)}</div>
                         </td>
                         <td className="px-6 py-4 text-gray-500 text-xs">
                            {new Date(res.createdAt).toLocaleString('pt-BR')}
                         </td>
                         <td className="px-6 py-4">
                            {res.status === 'CONFIRMED_PREPAID' && <span className="bg-[#008d36] text-white px-2 py-1 text-[10px] uppercase font-bold rounded shadow-sm block text-center">Pago Online (Cielo)</span>}
                            {res.status === 'PENDING_PIX' && <span className="bg-[#ffcc00] text-gray-900 px-2 py-1 text-[10px] uppercase font-bold rounded shadow-sm block text-center">PIX Aguardando</span>}
                            {res.status === 'CONFIRMED_NON_PREPAID' && <span className="bg-gray-200 text-gray-800 border border-gray-300 px-2 py-1 text-[10px] uppercase font-bold rounded block text-center">Pagar no Balcão</span>}
                            {res.status === 'CANCELLED' && <span className="bg-red-100 text-red-800 border border-red-300 px-2 py-1 text-[10px] uppercase font-bold rounded block text-center">Cancelada / Erro</span>}
                            {res.status !== 'CONFIRMED_PREPAID' && res.status !== 'PENDING_PIX' && res.status !== 'CONFIRMED_NON_PREPAID' && res.status !== 'CANCELLED' && (
                               <span className="bg-gray-100 text-gray-600 px-2 py-1 text-[10px] uppercase font-bold rounded block text-center">{res.status}</span>
                            )}
                         </td>
                      </tr>
                    );
                 })}
              </tbody>
           </table>
        </div>
      )}
    </div>
  );
}
