import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage() {
  const logsCielo = await prisma.logCielo.findMany({
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-800">System Logs (Cielo)</h1>
      </div>
      
      <div className="bg-white rounded-lg shadowoverflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-bold text-gray-500">
              <tr>
                <th className="px-6 py-4">Data/Hora</th>
                <th className="px-6 py-4">Endpoint</th>
                <th className="px-6 py-4">Payload (Oculto CVV/PAN)</th>
                <th className="px-6 py-4">Response (Cielo)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logsCielo.map(log => (
                <tr key={log.id} className="hover:bg-gray-50 align-top">
                  <td className="px-6 py-4 font-mono text-xs whitespace-nowrap text-gray-500">
                    {new Date(log.createdAt).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-700 whitespace-nowrap">
                    {log.endpoint}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">
                    <pre className="bg-gray-100 p-2 rounded text-[10px] overflow-auto max-w-xs">{log.payload}</pre>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">
                    <pre className="bg-gray-100 p-2 rounded text-[10px] overflow-auto max-w-md">{log.response}</pre>
                  </td>
                </tr>
              ))}
              {logsCielo.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Nenhum log registrado ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
