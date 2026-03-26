"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function PainelDashboard() {
   const [data, setData] = useState<any>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");

   useEffect(() => {
      fetch("/api/admin/dashboard")
         .then(res => res.json())
         .then(d => {
            if (d.error) {
               setError(d.error);
            } else {
               setData(d);
            }
            setLoading(false);
         })
         .catch((e) => { setError("Erro de conexão com o servidor"); setLoading(false); });
   }, []);

   if (loading) {
      return (
         <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
         </div>
      );
   }

   if (error || !data || !data.users) {
      return (
         <div className="text-center py-10">
            <p className="text-red-400 mb-2">{error || "Erro ao carregar dados do dashboard."}</p>
            <button onClick={() => window.location.reload()} className="text-sm text-green-500 font-bold hover:underline">Tentar novamente</button>
         </div>
      );
   }

   const userCards = [
      { label: "Total de Usuários", value: data.users.total, color: "from-blue-600 to-blue-800", icon: "👥" },
      { label: "Usuários Ativos", value: data.users.active, color: "from-green-600 to-green-800", icon: "✅" },
      { label: "Bloqueados", value: data.users.blocked, color: "from-red-600 to-red-800", icon: "🚫" },
      { label: "Administradores", value: data.users.admins, color: "from-purple-600 to-purple-800", icon: "🛡️" },
   ];

   const reservationCards = [
      { label: "Total de Reservas", value: data.reservations.total, color: "from-indigo-600 to-indigo-800", icon: "📋" },
      { label: "Pagas (Online)", value: data.reservations.paid, color: "from-emerald-600 to-emerald-800", icon: "💳" },
      { label: "Pendentes", value: data.reservations.pending, color: "from-amber-600 to-amber-800", icon: "⏳" },
      { label: "Canceladas", value: data.reservations.cancelled, color: "from-rose-600 to-rose-800", icon: "❌" },
   ];

   return (
      <div className="space-y-8">
         {/* Welcome */}
         <div>
            <h1 className="text-2xl font-black text-white">Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Visão geral do sistema Europcar Brasil</p>
         </div>

         {/* User Metrics */}
         <div>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Usuários</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               {userCards.map((card, i) => (
                  <div key={i} className={`bg-gradient-to-br ${card.color} rounded-xl p-5 shadow-lg relative overflow-hidden`}>
                     <div className="absolute top-3 right-3 text-2xl opacity-30">{card.icon}</div>
                     <p className="text-white/70 text-xs font-bold uppercase tracking-wide">{card.label}</p>
                     <p className="text-3xl font-black text-white mt-2">{card.value}</p>
                  </div>
               ))}
            </div>
         </div>

         {/* Reservation Metrics */}
         <div>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Reservas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               {reservationCards.map((card, i) => (
                  <div key={i} className={`bg-gradient-to-br ${card.color} rounded-xl p-5 shadow-lg relative overflow-hidden`}>
                     <div className="absolute top-3 right-3 text-2xl opacity-30">{card.icon}</div>
                     <p className="text-white/70 text-xs font-bold uppercase tracking-wide">{card.label}</p>
                     <p className="text-3xl font-black text-white mt-2">{card.value}</p>
                  </div>
               ))}
            </div>
         </div>

         {/* Quick Actions */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Users */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
               <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
                  <h3 className="font-bold text-white text-sm">Últimos Usuários Cadastrados</h3>
                  <Link href="/painel/usuarios" className="text-xs text-green-500 font-bold hover:text-green-400">Ver todos →</Link>
               </div>
               <div className="divide-y divide-gray-800/50">
                  {data.recentUsers.length === 0 ? (
                     <p className="text-gray-500 text-sm p-5 text-center">Nenhum usuário ainda.</p>
                  ) : (
                     data.recentUsers.map((u: any) => (
                        <div key={u.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-800/30 transition-colors">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-green-500 font-bold text-xs">
                                 {(u.name || u.email || "?")[0].toUpperCase()}
                              </div>
                              <div>
                                 <p className="text-sm font-medium text-white">{u.name || "Sem nome"}</p>
                                 <p className="text-xs text-gray-500">{u.email}</p>
                              </div>
                           </div>
                           <span className="text-[10px] text-gray-500">{new Date(u.createdAt).toLocaleDateString("pt-BR")}</span>
                        </div>
                     ))
                  )}
               </div>
            </div>

            {/* Recent Reservations */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
               <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
                  <h3 className="font-bold text-white text-sm">Últimas Reservas</h3>
                  <Link href="/painel/reservas" className="text-xs text-green-500 font-bold hover:text-green-400">Ver todas →</Link>
               </div>
               <div className="divide-y divide-gray-800/50">
                  {data.recentReservations.length === 0 ? (
                     <p className="text-gray-500 text-sm p-5 text-center">Nenhuma reserva ainda.</p>
                  ) : (
                     data.recentReservations.map((r: any) => {
                        let parsed: any = {};
                        try { parsed = JSON.parse(r.customerData); } catch(e){}
                        const statusColors: Record<string, string> = {
                           "CONFIRMED_PREPAID": "bg-green-500/20 text-green-400",
                           "PENDING_PIX": "bg-yellow-500/20 text-yellow-400",
                           "CONFIRMED_NON_PREPAID": "bg-gray-500/20 text-gray-300",
                           "CANCELLED": "bg-red-500/20 text-red-400",
                        };
                        const statusLabels: Record<string, string> = {
                           "CONFIRMED_PREPAID": "Pago",
                           "PENDING_PIX": "PIX Pendente",
                           "CONFIRMED_NON_PREPAID": "Balcão",
                           "CANCELLED": "Cancelada",
                        };
                        return (
                           <div key={r.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-800/30 transition-colors">
                              <div>
                                 <p className="text-sm font-bold text-white">{r.resNumber || "—"}</p>
                                 <p className="text-xs text-gray-500">{parsed?.nome} {parsed?.sobrenome}</p>
                              </div>
                              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${statusColors[r.status] || "bg-gray-700 text-gray-400"}`}>
                                 {statusLabels[r.status] || r.status}
                              </span>
                           </div>
                        );
                     })
                  )}
               </div>
            </div>
         </div>
      </div>
   );
}
