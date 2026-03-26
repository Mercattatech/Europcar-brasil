"use client";

import { useState, useEffect } from "react";

export default function ExtrasAdminPage() {
  const [extras, setExtras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pricePerDay, setPricePerDay] = useState("");
  const [type, setType] = useState("ADDON");
  const [active, setActive] = useState(true);
  const [imageUrl, setImageUrl] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchExtras();
  }, []);

  const fetchExtras = async () => {
    try {
      const res = await fetch("/api/admin/extras");
      if (res.ok) {
        const data = await res.json();
        setExtras(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setPricePerDay("");
    setType("ADDON");
    setActive(true);
    setImageUrl("");
    setShowModal(true);
  };

  const handleOpenEdit = (extra: any) => {
    setEditingId(extra.id);
    setName(extra.name);
    setDescription(extra.description || "");
    setPricePerDay(extra.pricePerDay.toString());
    setType(extra.type);
    setActive(extra.active);
    setImageUrl(extra.imageUrl || "");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const payload = {
       name,
       description,
       pricePerDay: parseFloat(pricePerDay),
       type,
       active,
       imageUrl
    };

    try {
      const url = editingId ? `/api/admin/extras/${editingId}` : "/api/admin/extras";
      const method = editingId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
         setShowModal(false);
         fetchExtras();
      } else {
         alert("Erro ao salvar o extra");
      }
    } catch (e) {
       console.error(e);
       alert("Erro de conexão");
    } finally {
       setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
     if (!confirm("Tem certeza que deseja excluir este extra/proteção? (Isto deletará permanentemente do banco)")) return;
     
     try {
        const res = await fetch(`/api/admin/extras/${id}`, {
           method: "DELETE"
        });
        if (res.ok) fetchExtras();
     } catch (e) {
        console.error(e);
     }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-gray-800">Extras e Proteções (Manuais)</h1>
        <button 
           onClick={handleOpenNew}
           className="bg-[#008d36] hover:bg-[#007a2d] text-white px-4 py-2 rounded font-bold transition-colors"
        >
          + Novo Item
        </button>
      </div>

      {loading ? (
        <div>Carregando...</div>
      ) : extras.length === 0 ? (
        <div className="bg-white p-8 rounded border border-gray-200 text-center text-gray-500">
           Nenhum extra ou proteção cadastrado no fallback.
        </div>
      ) : (
        <div className="bg-white border text-sm border-gray-200 rounded shadow-sm overflow-hidden">
           <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                 <tr>
                    <th className="px-6 py-3 font-bold text-gray-700">Nome do Item</th>
                    <th className="px-6 py-3 font-bold text-gray-700">Tipo</th>
                    <th className="px-6 py-3 font-bold text-gray-700">Valor/Dia</th>
                    <th className="px-6 py-3 font-bold text-gray-700">Status</th>
                    <th className="px-6 py-3 font-bold text-gray-700 text-right">Ações</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                 {extras.map(extra => (
                    <tr key={extra.id} className="hover:bg-gray-50">
                       <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{extra.name}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[200px]">{extra.description}</div>
                       </td>
                       <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-bold rounded ${extra.type === 'PROTECTION' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                             {extra.type === 'PROTECTION' ? 'Proteção' : 'Acessório (Addon)'}
                          </span>
                       </td>
                       <td className="px-6 py-4 font-bold text-gray-900">
                          R$ {extra.pricePerDay.toFixed(2).replace('.', ',')}
                       </td>
                       <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-bold rounded ${extra.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                             {extra.active ? 'Ativo' : 'Inativo'}
                          </span>
                       </td>
                       <td className="px-6 py-4 text-right space-x-3">
                          <button onClick={() => handleOpenEdit(extra)} className="text-blue-600 hover:text-blue-800 font-bold">Editar</button>
                          <button onClick={() => handleDelete(extra.id)} className="text-red-500 hover:text-red-700 font-bold">Excluir</button>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
            <div className="bg-white w-full max-w-lg rounded-lg p-6 relative shadow-2xl">
               <h2 className="text-xl font-bold mb-6 text-gray-900">
                  {editingId ? "Editar Extra/Proteção" : "Novo Extra/Proteção"}
               </h2>
               
               <form onSubmit={handleSave} className="space-y-4">
                  <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Item</label>
                     <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded px-3 py-2 outline-none focus:border-[#008d36]" placeholder="Ex: Cadeira de Estaleiro" />
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">Descrição</label>
                     <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded px-3 py-2 outline-none focus:border-[#008d36]" placeholder="Detalhes opcionais..." rows={2}></textarea>
                  </div>
                  <div className="flex gap-4">
                     <div className="flex-1">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Valor por Dia (R$)</label>
                        <input type="number" step="0.01" required value={pricePerDay} onChange={(e) => setPricePerDay(e.target.value)} className="w-full border rounded px-3 py-2 outline-none focus:border-[#008d36]" placeholder="Ex: 15.50" />
                     </div>
                     <div className="flex-1">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Tipo</label>
                        <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border rounded px-3 py-2 outline-none focus:border-[#008d36]">
                           <option value="PROTECTION">Proteção de Veículo</option>
                           <option value="ADDON">Acessório (Addon)</option>
                        </select>
                     </div>
                  </div>
                  
                  <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">URL da Imagem/Ícone</label>
                     <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full border rounded px-3 py-2 outline-none focus:border-[#008d36]" placeholder="Ex: /images/cadeira.png ou https://..." />
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                     <input type="checkbox" id="activeCb" checked={active} onChange={(e) => setActive(e.target.checked)} className="w-4 h-4 accent-[#008d36]" />
                     <label htmlFor="activeCb" className="text-sm font-bold text-gray-700 cursor-pointer">Disponível para os clientes (Ativo)</label>
                  </div>
                  
                  <div className="pt-6 flex justify-end gap-3">
                     <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 font-bold text-gray-600 hover:text-gray-900 border rounded">Cancelar</button>
                     <button type="submit" disabled={saving} className="bg-[#008d36] text-white px-4 py-2 rounded font-bold hover:bg-[#007a2d] disabled:opacity-50">
                        {saving ? "Salvando..." : "Salvar Item"}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
}
