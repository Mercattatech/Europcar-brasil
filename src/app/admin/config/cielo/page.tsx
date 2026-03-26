"use client";

import { useState, useEffect } from "react";

export default function CieloConfigPage() {
  const [merchantId, setMerchantId] = useState("");
  const [merchantKey, setMerchantKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSandbox, setIsSandbox] = useState(true);

  useEffect(() => {
    fetch("/api/admin/config/cielo")
      .then((res) => res.json())
      .then((data) => {
        if (data.merchantId) setMerchantId(data.merchantId);
        if (data.merchantKey) setMerchantKey(data.merchantKey);
        if (data.isSandbox !== undefined) setIsSandbox(data.isSandbox);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/config/cielo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantId, merchantKey, isSandbox }),
      });
      if (res.ok) {
        alert("Configurações da Cielo salvas com sucesso!");
      } else {
        alert("Erro ao salvar configurações.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-black text-gray-800">Credenciais API Cielo E-commerce</h1>
      
      <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
        <p className="text-sm text-gray-600 mb-6">
          Insira abaixo as credenciais fornecidas pela Cielo E-commerce (API 3.0) para ativar os pagamentos reais com PIX e Cartão de Crédito no seu site.
        </p>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Merchant ID</label>
            <input
              type="text"
              required
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
              className="w-full border p-3 rounded outline-none focus:border-[#008d36] font-mono text-sm"
              placeholder="Ex: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Merchant Key</label>
            <input
              type="password"
              required
              value={merchantKey}
              onChange={(e) => setMerchantKey(e.target.value)}
              className="w-full border p-3 rounded outline-none focus:border-[#008d36] font-mono text-sm"
              placeholder="Sua chave secreta da Cielo..."
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
             <input type="checkbox" checked={isSandbox} onChange={e => setIsSandbox(e.target.checked)} className="w-5 h-5 accent-[#008d36]" />
             <div>
                <span className="block font-bold text-gray-800 text-sm">Modo de Testes (Sandbox)</span>
                <span className="block text-xs text-gray-500">Mantenha marcado enquanto estiver testando no localhost ou cartões falsos. Desmarque apenas para Produção Real.</span>
             </div>
          </label>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#008d36] hover:bg-[#007a2d] text-white px-8 py-3 rounded font-bold shadow-md transition-colors disabled:opacity-50"
            >
              {saving ? "Salvando Chaves..." : "Salvar Configuração de Pagamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
