"use client";

import { useState, useEffect } from "react";

export default function CheckoutPage() {
  const [booking, setBooking] = useState<any>(null);

  // Condutor
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");

  // Pagamento
  const [paymentMethod, setPaymentMethod] = useState<"BALCAO" | "CREDIT" | "PIX">("BALCAO");
  const [ccName, setCcName] = useState("");
  const [ccNumber, setCcNumber] = useState("");
  const [ccValidity, setCcValidity] = useState("");
  const [ccCvv, setCcCvv] = useState("");

  // Status
  const [loading, setLoading] = useState(false);
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [resNumber, setResNumber] = useState<string | null>(null);
  const [merchantOrderId, setMerchantOrderId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(180);

  const [imgSrcIdx, setImgSrcIdx] = useState(0);

  const [extrasDetails, setExtrasDetails] = useState<any[]>([]);

  useEffect(() => {
    const data = sessionStorage.getItem("europcar_booking");
    if (data) setBooking(JSON.parse(data));
  }, []);

  // When booking loads, resolve selected extras from XRS optionalInsurances (no DB needed)
  useEffect(() => {
    if (!booking) return;
    const extrasMap: Record<string, number> = booking.extras || {};
    const selectedCodes = Object.keys(extrasMap).filter(k => extrasMap[k] > 0);
    if (selectedCodes.length === 0) { setExtrasDetails([]); return; }

    // optionalInsurances are stored on booking.car by the vehicles page
    const allInsurances: any[] = booking.car?.optionalInsurances || [];
    const resolved = selectedCodes.map(code => {
      const ins = allInsurances.find((i: any) => i.code === code);
      if (!ins) return null;
      return {
        id: code,
        name: code,  // display name mapped in the summary
        pricePerDay: parseFloat(ins.priceInBookingCurrency || ins.price || "0"),
        pricePerDayEUR: parseFloat(ins.price || "0"),
        qty: extrasMap[code],
        ins,
      };
    }).filter(Boolean);
    setExtrasDetails(resolved);
  }, [booking]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (merchantOrderId && !resNumber && paymentMethod === "PIX") {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          const t = prev - 1;
          if (t <= 0) clearInterval(timer);
          if (t % 5 === 0 && t > 0) {
            fetch(`/api/reservas/pix-status?orderId=${merchantOrderId}`)
              .then(r => r.json())
              .then(d => { if (d.status === "PAID" && d.resNumber) setResNumber(d.resNumber); })
              .catch(() => {});
          }
          return t;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [merchantOrderId, resNumber, paymentMethod]);

  if (!booking) return (
    <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center">
      <p className="font-bold text-gray-600">Carregando reserva... Se não aparecer, volte e selecione um veículo.</p>
    </div>
  );

  // --- Extract values from XRS car object ---
  const car = booking.car || {};
  const carName = car.carCategoryName || car.name || "Veículo não identificado";
  const carCode = car.carCategoryCode || "";
  const carSample = car.carCategorySample || "";
  const currency = car.currency || "EUR";
  const totalRateXRS = parseFloat(car.totalRateEstimate || car.total || 0);
  const totalBRL = parseFloat(car.totalRateEstimateInBookingCurrency || 0);
  const bookingCurrency = car.bookingCurrencyOfTotalRateEstimate || "";

  // Pickup/return info
  const pickupStation = booking.pickupStation || car.pickupLoc || "";
  const returnStation = booking.returnStation || booking.pickupStation || "";
  const pickupDate = booking.pickupDate || "";
  const returnDate = booking.returnDate || "";
  const formatDate = (d: string) => d?.length === 8 ? `${d.slice(6, 8)}/${d.slice(4, 6)}/${d.slice(0, 4)}` : d;

  // Calculate days
  const calcDays = () => {
    if (pickupDate?.length === 8 && returnDate?.length === 8) {
      const co = new Date(parseInt(pickupDate.slice(0,4)), parseInt(pickupDate.slice(4,6))-1, parseInt(pickupDate.slice(6,8)));
      const ci = new Date(parseInt(returnDate.slice(0,4)), parseInt(returnDate.slice(4,6))-1, parseInt(returnDate.slice(6,8)));
      const diff = Math.round((ci.getTime() - co.getTime()) / 86400000);
      return diff > 0 ? diff : 1;
    }
    return 1;
  };
  const days = calcDays();

  // Build car image URL — use official XRS carvisual first, then fallback
  const carImgUrl = car.imageUrl
    || (carCode ? `https://static.europcar.com/carvisuals/partners/835x557/${carCode}_IT.png` : "")
    || (carSample ? `https://www.europcar.com/vehicles/images/223/cars/${carSample.split(" ")[0].toLowerCase()}/${carSample.split(" ").slice(1,3).join("-").toLowerCase().replace(/[^a-z0-9-]/g,"")}.png` : "")
    || `https://placehold.co/400x200/f5f5f5/008d36?text=${carCode || "CAR"}`;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    setLoading(true);
    const extrasTotalBRL = extrasDetails.reduce((sum: number, e: any) => sum + e.pricePerDay * e.qty, 0) * days;
    const baseAmountBRL = totalBRL > 0 ? totalBRL : totalRateXRS;
    const grandTotalBRL = baseAmountBRL + extrasTotalBRL;
    const amountInCents = Math.round(grandTotalBRL * 100);

    try {
      const res = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingData: booking,
          customerData: { nome, sobrenome, email, telefone, cpf },
          paymentData: {
            method: paymentMethod,
            amountInCents,
            creditCard: paymentMethod === "CREDIT" ? { name: ccName, number: ccNumber, validity: ccValidity, cvv: ccCvv } : undefined,
          },
        }),
      });
      const json = await res.json();
      if (res.ok) {
        if (paymentMethod === "PIX" && json.pixData) {
          setPixQrCode(json.pixData.qrCodeString);
          setMerchantOrderId(json.merchantOrderId);
        } else {
          setResNumber(json.resNumber);
        }
      } else {
        alert("Erro ao finalizar reserva: " + (json.error || "Desconhecido"));
      }
    } catch {
      alert("Falha de conexão.");
    } finally {
      setLoading(false);
    }
  };

  // ---- Confirmation screen ----
  if (resNumber) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-lg shadow-xl max-w-lg w-full text-center border-t-8 border-[#008d36]">
          <div className="w-20 h-20 bg-green-100 text-[#008d36] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Reserva Confirmada!</h1>
          <p className="text-gray-600 mb-8">Anote seu código de reserva para apresentar no balcão.</p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Código de Reserva</span>
            <span className="text-4xl font-black text-[#008d36] tracking-widest">{resNumber}</span>
          </div>
          <button onClick={() => window.location.href = "/"} className="font-bold text-[#008d36] hover:underline">Voltar para o início</button>
        </div>
      </div>
    );
  }

  // ---- PIX QR screen ----
  if (merchantOrderId && !resNumber && paymentMethod === "PIX") {
    const minutes = Math.floor(Math.max(0, timeLeft) / 60);
    const seconds = Math.max(0, timeLeft) % 60;
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-lg shadow-xl max-w-lg w-full text-center border-t-8 border-[#1b75bb]">
          <h1 className="text-2xl font-black text-gray-900 mb-2">Pague via PIX</h1>
          <p className="text-gray-600 mb-6 border-b border-gray-100 pb-6">Pedido <strong>{merchantOrderId}</strong>. Escaneie o QR Code para confirmar.</p>
          <div className="bg-gray-50 rounded-lg p-6 mb-6 inline-block">
            {timeLeft > 0 ? (
              <>
                {pixQrCode ? (
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixQrCode)}`} alt="QR Code PIX" className="w-48 h-48 mx-auto mb-4" />
                ) : (
                  <div className="w-48 h-48 bg-gray-200 animate-pulse flex items-center justify-center text-xs text-gray-500 mb-4">Gerando...</div>
                )}
                <span className="text-2xl font-black text-[#1b75bb] tabular-nums">{String(minutes).padStart(2,"0")}:{String(seconds).padStart(2,"0")}</span>
              </>
            ) : (
              <div className="w-48 h-48 flex flex-col items-center justify-center text-red-500">
                <span className="font-bold text-lg">QR Code Expirado</span>
                <span className="text-xs text-gray-500 mt-1">Refaça a reserva.</span>
              </div>
            )}
          </div>
          <button onClick={() => window.location.href = "/"} className="w-full bg-[#ffcc00] hover:bg-[#e6b800] text-gray-900 font-bold py-3 rounded text-sm">Já paguei / Voltar</button>
        </div>
      </div>
    );
  }

  // ---- Main checkout ----
  return (
    <div className="min-h-screen bg-[#f7f7f7] font-sans pb-20">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center text-sm font-bold text-gray-900">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 hover:text-[#008d36]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            Voltar
          </button>
          <div className="bg-[#008d36] px-4 py-2"><img src="/logo.jpg" alt="Europcar" className="h-8 object-contain" /></div>
          <div className="flex items-center gap-2">PAGAMENTO 🔒</div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-10 flex gap-8">
        {/* Form */}
        <div className="flex-1">
          <form onSubmit={handleCheckout} className="space-y-8">
            {/* Dados condutor */}
            <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
              <h2 className="text-xl font-black text-gray-900 mb-6">1. Dados do Condutor Principal</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nome</label>
                  <input required value={nome} onChange={e => setNome(e.target.value)} className="w-full border rounded p-3 outline-none focus:border-[#008d36]" placeholder="João" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Sobrenome</label>
                  <input required value={sobrenome} onChange={e => setSobrenome(e.target.value)} className="w-full border rounded p-3 outline-none focus:border-[#008d36]" placeholder="Silva" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-700 mb-1">E-mail</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border rounded p-3 outline-none focus:border-[#008d36]" placeholder="exemplo@email.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Telefone / Celular</label>
                  <input required value={telefone} onChange={e => setTelefone(e.target.value)} className="w-full border rounded p-3 outline-none focus:border-[#008d36]" placeholder="(11) 99999-9999" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">CPF</label>
                  <input required value={cpf} onChange={e => setCpf(e.target.value)} className="w-full border rounded p-3 outline-none focus:border-[#008d36]" placeholder="000.000.000-00" />
                </div>
              </div>
            </div>

            {/* Pagamento */}
            <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
              <h2 className="text-xl font-black text-gray-900 mb-6">2. Forma de Pagamento</h2>
              <div className="space-y-4">
                <label className={`block border-2 rounded-lg p-5 cursor-pointer flex items-center gap-4 transition-colors ${paymentMethod === "BALCAO" ? "border-[#008d36] bg-green-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <input type="radio" checked={paymentMethod === "BALCAO"} onChange={() => setPaymentMethod("BALCAO")} className="w-5 h-5 accent-[#008d36]" />
                  <div>
                    <span className="font-bold text-gray-900 block">Pagar no balcão da loja</span>
                    <span className="text-xs text-gray-500">Pague apenas no momento de retirada do veículo.</span>
                  </div>
                </label>

                <label className={`block border-2 rounded-lg p-5 cursor-pointer flex items-center gap-4 transition-colors ${paymentMethod === "PIX" ? "border-[#008d36] bg-green-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <input type="radio" checked={paymentMethod === "PIX"} onChange={() => setPaymentMethod("PIX")} className="w-5 h-5 accent-[#008d36]" />
                  <div>
                    <span className="font-bold text-gray-900 flex items-center gap-2">
                      Pagar Online via PIX
                      <span className="bg-[#1b75bb] text-white text-[10px] px-2 py-0.5 rounded font-bold">RÁPIDO</span>
                    </span>
                    <span className="text-xs text-gray-500">Aprovação imediata.</span>
                  </div>
                </label>

                <div className={`border-2 rounded-lg overflow-hidden transition-colors ${paymentMethod === "CREDIT" ? "border-[#008d36]" : "border-gray-200"}`}>
                  <label className={`block p-5 cursor-pointer flex items-center gap-4 ${paymentMethod === "CREDIT" ? "bg-green-50 border-b border-[#008d36]" : "hover:bg-gray-50"}`}>
                    <input type="radio" checked={paymentMethod === "CREDIT"} onChange={() => setPaymentMethod("CREDIT")} className="w-5 h-5 accent-[#008d36]" />
                    <div>
                      <span className="font-bold text-gray-900 block">Pagar Online com Cartão de Crédito</span>
                      <span className="text-xs text-gray-500">100% seguro via Cielo.</span>
                    </div>
                  </label>
                  {paymentMethod === "CREDIT" && (
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Nome no Cartão</label>
                        <input required value={ccName} onChange={e => setCcName(e.target.value)} className="w-full border rounded p-3 outline-none focus:border-[#008d36]" placeholder="NOME DO TITULAR" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Número do Cartão</label>
                        <input required value={ccNumber} onChange={e => setCcNumber(e.target.value)} className="w-full border rounded p-3 outline-none focus:border-[#008d36] tracking-widest" placeholder="0000 0000 0000 0000" maxLength={19} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Validade (MM/AAAA)</label>
                          <input required value={ccValidity} onChange={e => { let v = e.target.value.replace(/\D/g,""); if(v.length>=2) v=v.slice(0,2)+"/"+v.slice(2,6); setCcValidity(v); }} className="w-full border rounded p-3 outline-none focus:border-[#008d36]" placeholder="12/2030" maxLength={7} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">CVV</label>
                          <input required value={ccCvv} onChange={e => setCcCvv(e.target.value)} className="w-full border rounded p-3 outline-none focus:border-[#008d36]" placeholder="123" maxLength={4} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <button disabled={loading} type="submit" className="bg-[#008d36] hover:bg-[#007a2d] text-white font-black py-5 px-10 rounded-lg shadow-lg uppercase tracking-wide text-lg disabled:opacity-50 transition-colors">
                {loading ? "Processando..." : "Finalizar e Reservar Agora"}
              </button>
            </div>
          </form>
        </div>

        {/* Resumo */}
        <div className="w-[380px] shrink-0">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm sticky top-8">
            <div className="bg-gray-50 border-b border-gray-200 p-6">
              <h3 className="font-black text-gray-900 text-lg mb-1">Resumo da Reserva</h3>
              <p className="text-xs text-gray-500 font-bold uppercase">{days} {days === 1 ? "dia" : "dias"} de aluguel</p>
            </div>
            <div className="p-6">
              {/* Car image + name */}
              <div className="mb-5 flex flex-col items-center">
                {(() => {
                  const sources = [
                    car.imageUrl || null,
                    carCode ? `https://static.europcar.com/carvisuals/partners/835x557/${carCode}_IT.png` : null,
                    carSample ? `https://www.europcar.com/vehicles/images/223/cars/${carSample.split(" ")[0].toLowerCase()}/${carSample.split(" ").slice(1,3).join("-").toLowerCase().replace(/[^a-z0-9-]/g,"")}.png` : null,
                    `https://placehold.co/400x200/f5f5f5/008d36?text=${carCode || "CAR"}`,
                  ].filter(Boolean) as string[];
                  return (
                    <img
                      src={sources[imgSrcIdx] || sources[0]}
                      alt={carSample || carName}
                      onError={() => { if (imgSrcIdx < sources.length - 1) setImgSrcIdx(i => i + 1); }}
                      className="w-48 h-28 object-contain mix-blend-multiply"
                    />
                  );
                })()}
                <h4 className="font-black text-lg text-gray-900 text-center uppercase mt-2">{carName}</h4>
                {carCode && <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded-full mt-1">{carCode}</span>}
                {carSample && <span className="text-xs text-gray-400 mt-0.5">{carSample} ou similar</span>}
              </div>

              {/* Locations + dates */}
              <div className="border-t border-b border-gray-100 py-4 my-4 space-y-3 text-sm">
                <div className="flex justify-between items-start">
                  <span className="text-gray-500 font-bold">Retirada</span>
                  <span className="font-black text-gray-900 text-right text-xs uppercase">
                    {pickupStation}<br />{formatDate(pickupDate)}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-gray-500 font-bold">Devolução</span>
                  <span className="font-black text-gray-900 text-right text-xs uppercase">
                    {returnStation || pickupStation}<br />{formatDate(returnDate)}
                  </span>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Total período ({currency})</span>
                  <span className="font-bold text-gray-900">{currency} {totalRateXRS.toFixed(2).replace(".", ",")}</span>
                </div>
                {totalBRL > 0 && bookingCurrency && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Em {bookingCurrency}</span>
                    <span className="font-bold text-gray-900">{bookingCurrency} {totalBRL.toFixed(2).replace(".", ",")}</span>
                  </div>
                )}
                {car.exchangeRate && (
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Câmbio</span>
                    <span>1 {currency} = {bookingCurrency} {parseFloat(car.exchangeRate).toFixed(4)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Taxas e Impostos</span>
                  <span>Incluídos</span>
                </div>
              </div>

              {/* Extras selecionados */}
              {extrasDetails.length > 0 && (
                <div className="border border-[#008d36]/20 rounded-lg bg-green-50 p-4 mt-4 mb-4">
                  <h5 className="text-xs font-bold text-[#008d36] uppercase mb-3">Proteções & Extras</h5>
                  <div className="space-y-2">
                    {extrasDetails.map((extra: any) => {
                        const insNames: Record<string, string> = {
                          PREMIUM: "Cobertura Premium", PREMPRE: "Premium Pré-pago", PREMUP: "Premium Plus",
                          SPCDW: "Super Proteção CDW", SPTHW: "Super Proteção THW", STHW: "Proteção THW+",
                          SCDW: "Proteção CDW+", MEDIUM: "Cobertura Média", RSA: "Assistência na Estrada",
                          APP: "Proteção de Aparência",
                        };
                        return (
                          <div key={extra.id} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                              {extra.qty > 1 && (
                                <span className="bg-[#008d36] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{extra.qty}</span>
                              )}
                              <span className="text-gray-700 font-medium">{insNames[extra.id] || extra.id}</span>
                            </div>
                            <span className="font-bold text-gray-900">
                              BRL {(extra.pricePerDay * extra.qty).toFixed(2).replace(".", ",")}
                              <span className="text-xs text-gray-400 font-normal"> /dia</span>
                            </span>
                          </div>
                        );
                      })}
                    <div className="flex justify-between items-center text-sm border-t border-green-200 pt-2 mt-2">
                      <span className="font-bold text-gray-600">Total extras ({days} dias)</span>
                      <span className="font-black text-[#008d36]">
                        R$ {(extrasDetails.reduce((sum: number, e: any) => sum + e.pricePerDay * e.qty, 0) * days).toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="bg-gray-50 -mx-6 -mb-6 p-6 border-t border-gray-200">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-gray-500 uppercase">Preço Total</span>
                  <div className="text-right">
                    {extrasDetails.length > 0 && (
                      <span className="text-xs text-gray-400 block mb-1">
                        incl. R$ {(extrasDetails.reduce((s: number, e: any) => s + e.pricePerDay * e.qty, 0) * days).toFixed(2).replace(".", ",")} em extras
                      </span>
                    )}
                    <span className="text-2xl font-black text-gray-900">
                      {(() => {
                        const extrasSum = extrasDetails.reduce((s: number, e: any) => s + e.pricePerDay * e.qty, 0) * days;
                        const base = totalBRL > 0 ? totalBRL : totalRateXRS;
                        const cur = totalBRL > 0 ? bookingCurrency : currency;
                        return `${cur} ${(base + extrasSum).toFixed(2).replace(".", ",")}`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>


            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
