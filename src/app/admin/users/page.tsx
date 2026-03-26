"use client";
import { useState, useEffect } from "react";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
     try {
       const res = await fetch('/api/admin/users');
       const data = await res.json();
       setUsers(data);
       setLoading(false);
     } catch (e) {
       console.error(e);
       setLoading(false);
     }
  };

  useEffect(() => {
     fetchUsers();
  }, []);

  const toggleRole = async (id: string, currentRole: string) => {
      const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
      if (!confirm(`Tem certeza que deseja mudar a permissão deste usuário para ${newRole}?`)) return;
      
      try {
         const res = await fetch('/api/admin/users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, role: newRole })
         });
         if (res.ok) {
            fetchUsers(); // render updated list
         } else {
            alert("Erro ao alterar permissão.");
         }
      } catch (e) {
         alert("Erro de conexão.");
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-800">Controle de Usuários</h1>
        <div className="text-sm bg-blue-50 text-blue-700 p-2 rounded font-medium border border-blue-200">
          Esta tela mostra todos os clientes cadastrados. Mude o papel (Role) para transformar alguém em Administrador.
        </div>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
           <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-bold text-gray-500">
             <tr>
               <th className="px-6 py-4">Nome</th>
               <th className="px-6 py-4">Email</th>
               <th className="px-6 py-4">Papel (Role)</th>
               <th className="px-6 py-4 text-right">Ações</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-100">
             {loading && <tr><td colSpan={4} className="p-8 text-center text-gray-500">Carregando...</td></tr>}
             {!loading && users.map((u: any) => (
                <tr key={u.id}>
                   <td className="px-6 py-4 font-bold text-gray-900">{u.name || 'N/A'}</td>
                   <td className="px-6 py-4 text-gray-600">{u.email}</td>
                   <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                         {u.role || 'USER'}
                      </span>
                   </td>
                   <td className="px-6 py-4 text-right">
                      {u.role === 'ADMIN' ? (
                          <button onClick={() => toggleRole(u.id, u.role)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded text-xs font-bold transition-colors">Retirar Poderes</button>
                      ) : (
                          <button onClick={() => toggleRole(u.id, u.role)} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-bold transition-colors">Tornar Admin</button>
                      )}
                   </td>
                </tr>
             ))}
           </tbody>
        </table>
      </div>
    </div>
  );
}
