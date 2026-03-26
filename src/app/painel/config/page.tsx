"use client";

import { useState, useEffect } from "react";

export default function PainelConfig() {
  const [merchantId, setMerchantId] = useState("");
  const [merchantKey, setMerchantKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSandbox, setIsSandbox] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, t: "success" | "error" = "success") => { setToast({ message: msg, type: t }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    fetch("/api/admin/config/cielo")
      .then(res => res.json())
      .then(data => {
        if (data.merchantId) setMerchantId(data.merchantId);
        if (data.merchantKey) setMerchantKey(data.merchantKey);
        if (data.isSandbox !== undefined) setIsSandbox(data.isSandbox);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await fetch("/api/admin/config/cielo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ merchantId, merchantKey, isSandbox }) });
      if (res.ok) showToast("Configurações salvas com sucesso!");
      else showToast("Erro ao salvar", "error");
    } catch (e) { showToast("Erro de conexão", "error"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-2xl space-y-6">
      {toast && <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-2xl font-bold text-sm ${toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>{toast.message}</div>}

      <div>
        <h1 className="text-2xl font-black text-white">Configuração de Pagamento</h1>
        <p className="text-gray-400 text-sm mt-1">Credenciais da API Cielo E-commerce 3.0</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
          <svg className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <p className="text-sm text-blue-300">Insira as credenciais fornecidas pela Cielo E-commerce (API 3.0) para ativar pagamentos com PIX e Cartão de Crédito.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Merchant ID</label>
            <input type="text" required value={merchantId} onChange={e => setMerchantId(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white font-mono outline-none focus:border-green-600"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Merchant Key</label>
            <input type="password" required value={merchantKey} onChange={e => setMerchantKey(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white font-mono outline-none focus:border-green-600"
              placeholder="Sua chave secreta..." />
          </div>

          <div className={`flex items-center gap-3 p-4 rounded-lg border transition-colors ${isSandbox ? "bg-yellow-500/10 border-yellow-500/20" : "bg-green-500/10 border-green-500/20"}`}>
            <input type="checkbox" id="sandbox" checked={isSandbox} onChange={e => setIsSandbox(e.target.checked)} className="w-5 h-5 accent-green-600 rounded" />
            <div>
              <label htmlFor="sandbox" className="block font-bold text-white text-sm cursor-pointer">
                {isSandbox ? "🧪 Modo Sandbox (Testes)" : "🚀 Modo Produção (Real)"}
              </label>
              <span className="text-[11px] text-gray-400">
                {isSandbox ? "Transações simuladas — nenhuma cobrança real será feita." : "ATENÇÃO: Cobranças reais serão processadas!"}
              </span>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold text-sm transition-colors disabled:opacity-50">
              {saving ? "Salvando..." : "Salvar Configuração"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
