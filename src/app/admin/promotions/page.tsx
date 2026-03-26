"use client";

import { useState, useEffect } from "react";

export default function PromotionsAdminPage() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountValue, setDiscountValue] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const res = await fetch("/api/admin/promotions");
      if (res.ok) {
        const data = await res.json();
        setPromotions(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setDiscountValue("");
    setImageUrl("");
    setStatus("ACTIVE");
    setShowModal(true);
  };

  const handleOpenEdit = (promo: any) => {
    setEditingId(promo.id);
    setTitle(promo.title);
    setDescription(promo.description || "");
    setDiscountValue(promo.discountValue ? promo.discountValue.toString() : "");
    setImageUrl(promo.imageUrl || "");
    setStatus(promo.status);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const payload = {
       title,
       description,
       discountValue: discountValue ? parseFloat(discountValue) : null,
       imageUrl,
       status
    };

    try {
      const url = editingId ? `/api/admin/promotions/${editingId}` : "/api/admin/promotions";
      const method = editingId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
         setShowModal(false);
         fetchPromotions();
      } else {
         alert("Erro ao salvar promoção");
      }
    } catch (e) {
       console.error(e);
       alert("Erro de conexão");
    } finally {
       setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
     if (!confirm("Tem certeza que deseja excluir esta promoção?")) return;
     
     try {
        const res = await fetch(`/api/admin/promotions/${id}`, {
           method: "DELETE"
        });
        if (res.ok) fetchPromotions();
     } catch (e) {
        console.error(e);
     }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-gray-800">Promoções da Homepage</h1>
        <button 
           onClick={handleOpenNew}
           className="bg-[#008d36] hover:bg-[#007a2d] text-white px-4 py-2 rounded font-bold transition-colors"
        >
          + Nova Promoção
        </button>
      </div>

      {loading ? (
        <div>Carregando...</div>
      ) : promotions.length === 0 ? (
        <div className="bg-white p-8 rounded border border-gray-200 text-center text-gray-500">
           Nenhuma promoção cadastrada. Crie a primeira!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {promotions.map(promo => (
              <div key={promo.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                 <div className="h-32 bg-gray-200 relative">
                    {promo.imageUrl ? (
                       <img src={promo.imageUrl} alt={promo.title} className="w-full h-full object-cover" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center text-gray-400">Sem imagem</div>
                    )}
                    <span className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold rounded text-white ${promo.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-500'}`}>
                       {promo.status}
                    </span>
                 </div>
                 <div className="p-4">
                    <h3 className="font-black text-lg text-gray-900 truncate">{promo.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{promo.description}</p>
                    
                    {promo.discountValue && (
                       <div className="mt-3 inline-block bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">
                          {promo.discountValue}% OFF
                       </div>
                    )}
                    
                    <div className="mt-6 flex justify-end gap-2 border-t pt-4">
                       <button onClick={() => handleOpenEdit(promo)} className="text-blue-600 hover:text-blue-800 text-sm font-bold">Editar</button>
                       <button onClick={() => handleDelete(promo.id)} className="text-red-500 hover:text-red-700 text-sm font-bold">Excluir</button>
                    </div>
                 </div>
              </div>
           ))}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
            <div className="bg-white w-full max-w-lg rounded-lg p-6 relative shadow-2xl">
               <h2 className="text-xl font-bold mb-6 text-gray-900">
                  {editingId ? "Editar Promoção" : "Nova Promoção"}
               </h2>
               
               <form onSubmit={handleSave} className="space-y-4">
                  <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">Título</label>
                     <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded px-3 py-2 outline-none focus:border-[#008d36]" placeholder="Ex: Explore a Alemanha!" />
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">Descrição</label>
                     <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded px-3 py-2 outline-none focus:border-[#008d36]" placeholder="Ex: Reserve diretamente para poupar..." rows={2}></textarea>
                  </div>
                  <div className="flex gap-4">
                     <div className="flex-1">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Desconto (%)</label>
                        <input type="number" step="0.01" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="w-full border rounded px-3 py-2 outline-none focus:border-[#008d36]" placeholder="Ex: 20" />
                     </div>
                     <div className="flex-1">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border rounded px-3 py-2 outline-none focus:border-[#008d36]">
                           <option value="ACTIVE">Ativo</option>
                           <option value="ARCHIVED">Arquivado</option>
                        </select>
                     </div>
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">URL da Imagem</label>
                     <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full border rounded px-3 py-2 outline-none focus:border-[#008d36]" placeholder="https://..." />
                  </div>
                  
                  <div className="pt-6 flex justify-end gap-3">
                     <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 font-bold text-gray-600 hover:text-gray-900 border rounded">Cancelar</button>
                     <button type="submit" disabled={saving} className="bg-[#008d36] text-white px-4 py-2 rounded font-bold hover:bg-[#007a2d] disabled:opacity-50">
                        {saving ? "Salvando..." : "Salvar Promoção"}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
}
