"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function CheckoutPage() {
  const [booking, setBooking] = useState<any>(null);
  
  // Condutor Data
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
  
  // Countdown PIX (3 minutos = 180 segundos)
  const [timeLeft, setTimeLeft] = useState(180);

  useEffect(() => {
    const data = sessionStorage.getItem("europcar_booking");
    if (data) {
       setBooking(JSON.parse(data));
    }
  }, []);

  useEffect(() => {
     let timer: NodeJS.Timeout;
     if (merchantOrderId && !resNumber && paymentMethod === 'PIX') {
        timer = setInterval(() => {
           setTimeLeft(prev => {
              const newTime = prev - 1;
              if (newTime <= 0) clearInterval(timer);
              
              // Polling a cada 5 segundos
              if (newTime % 5 === 0 && newTime > 0) {
                 fetch(`/api/reservas/pix-status?orderId=${merchantOrderId}`)
                   .then(r => r.json())
                   .then(d => {
                       if (d.status === 'PAID' && d.resNumber) {
                           setResNumber(d.resNumber);
                       }
                   }).catch(()=>{});
              }
              return newTime;
           });
        }, 1000);
     }
     return () => clearInterval(timer);
  }, [merchantOrderId, resNumber, paymentMethod]);

  const handleCheckout = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!booking) return;
     
     setLoading(true);

     // Simulate 22 days logic
     const days = 22; 
     const amountInCents = Math.round(booking.totalDay * days * 100);

     try {
       const res = await fetch("/api/reservas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
             bookingData: booking,
             customerData: {
                nome,
                sobrenome,
                email,
                telefone,
                cpf
             },
             paymentData: {
                method: paymentMethod,
                amountInCents,
                creditCard: paymentMethod === 'CREDIT' ? {
                   name: ccName,
                   number: ccNumber,
                   validity: ccValidity,
                   cvv: ccCvv
                } : undefined
             }
          })
       });

       const json = await res.json();
       if (res.ok) {
           if (paymentMethod === 'PIX' && json.pixData) {
              setPixQrCode(json.pixData.qrCodeString);
              setMerchantOrderId(json.merchantOrderId);
              // resNumber is null until polling confirms payment
           } else {
              // Balcão ou CC concluído com sucesso
              setResNumber(json.resNumber);
           }
       } else {
           alert("Erro ao finalizar reserva: " + (json.error || "Desconhecido"));
       }
     } catch (err) {
        alert("Falha de conexão.");
     } finally {
        setLoading(false);
     }
  };

  if (!booking) return <div className="p-10 text-center font-bold text-gray-700">Carregando reserva... (se não abrir, volte e selecione um veículo).</div>;

  const days = 22; // Hardcoded mock based on the dates of the UI (18 Mar to 09 Apr)
  const totalAmount = booking.totalDay * days;

  if (resNumber && paymentMethod !== 'PIX' || (resNumber && paymentMethod === 'PIX')) {
      return (
         <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center p-4">
            <div className="bg-white p-10 rounded-lg shadow-xl max-w-lg w-full text-center border-t-8 border-[#008d36]">
               <div className="w-20 h-20 bg-green-100 text-[#008d36] rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
               </div>
               <h1 className="text-3xl font-black text-gray-900 mb-2">Reserva Confirmada!</h1>
               <p className="text-gray-600 mb-8">
                  {paymentMethod === 'PIX' 
                     ? 'Seu pagamento PIX foi aprovado com sucesso! ' 
                     : 'Seu carro está reservado. '}
                  Anote seu código de reserva abaixo para apresentar no balcão da loja.
               </p>
               
               <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">CÓDIGO DE RESERVA</span>
                  <span className="text-4xl font-black text-[#008d36] tracking-widest">{resNumber}</span>
               </div>
               
               <button onClick={() => window.location.href = '/'} className="font-bold text-[#008d36] hover:underline">
                  Voltar para o início
               </button>
            </div>
         </div>
      );
  }

  if (merchantOrderId && !resNumber && paymentMethod === 'PIX') {
      const minutes = Math.floor(Math.max(0, timeLeft) / 60);
      const seconds = Math.max(0, timeLeft) % 60;
      
      return (
         <div className="min-h-screen bg-[#f7f7f7] flex flex-col items-center justify-center p-4">
            <div className="bg-white p-10 rounded-lg shadow-xl max-w-lg w-full text-center border-t-8 border-[#1b75bb]">
               <h1 className="text-2xl font-black text-gray-900 mb-2">Quase lá... Pague via PIX</h1>
               <p className="text-gray-600 mb-6 border-b border-gray-100 pb-6">Seu pedido <strong>{merchantOrderId}</strong> foi gerado. Escaneie o código abaixo para pagar e confirmar a reserva.</p>
               
               <div className="bg-gray-50 rounded-lg p-6 mb-6 inline-block">
                  {timeLeft > 0 ? (
                      <>
                        {pixQrCode ? (
                           <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixQrCode)}`} alt="QR Code PIX" className="w-48 h-48 mx-auto mix-blend-multiply mb-4" />
                        ) : (
                           <div className="w-48 h-48 bg-gray-200 animate-pulse mx-auto flex items-center justify-center text-xs text-gray-500 mb-4">Gerando...</div>
                        )}
                        <div className="mt-2">
                           <span className="text-sm font-bold text-gray-500 uppercase">Tempo Restante: </span>
                           <span className="text-2xl font-black text-[#1b75bb] tabular-nums">
                               {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                           </span>
                        </div>
                      </>
                  ) : (
                      <div className="w-48 h-48 mx-auto flex flex-col items-center justify-center text-red-500">
                          <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          <span className="font-bold text-lg">QR Code Expirado</span>
                          <span className="text-xs text-gray-500 mt-1">Refaça a reserva.</span>
                      </div>
                  )}
               </div>
               
               <button onClick={() => window.location.href = '/'} className="w-full bg-[#ffcc00] hover:bg-[#e6b800] text-gray-900 font-bold py-3 rounded text-sm transition-colors mb-4">
                  Já paguei / Voltar para início
               </button>
            </div>
         </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] font-sans pb-20">
       <header className="bg-white border-b border-gray-200">
         <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center text-sm font-bold text-gray-900">
           <div onClick={() => window.location.href = '/reservation/vehicles'} className="cursor-pointer flex items-center gap-2 hover:text-[#008d36]">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
               Voltar para Extras
           </div>
           <div className="text-2xl italic text-[#008d36]">E</div>
           <div className="flex items-center gap-2">PAGAMENTO 🔒</div>
         </div>
       </header>

       <div className="max-w-7xl mx-auto px-4 py-10 flex gap-8">
           
           {/* FORM - LADO ESQUERDO */}
           <div className="flex-1">
               <form onSubmit={handleCheckout} className="space-y-8">
                  
                  {/* DADOS DO CONDUTOR */}
                  <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
                     <h2 className="text-xl font-black text-gray-900 mb-6">1. Dados do Condutor Principal</h2>
                     <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                           <label className="block text-xs font-bold text-gray-700 mb-1">Nome</label>
                           <input required value={nome} onChange={e=>setNome(e.target.value)} type="text" className="w-full border rounded p-3 outline-none focus:border-[#008d36]" placeholder="João" />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-gray-700 mb-1">Sobrenome</label>
                           <input required value={sobrenome} onChange={e=>setSobrenome(e.target.value)} type="text" className="w-full border rounded p-3 outline-none focus:border-[#008d36]" placeholder="Silva" />
                        </div>
                     </div>
                     <div className="mb-4">
                        <label className="block text-xs font-bold text-gray-700 mb-1">E-mail</label>
                        <input required value={email} onChange={e=>setEmail(e.target.value)} type="email" className="w-full border rounded p-3 outline-none focus:border-[#008d36]" placeholder="exemplo@email.com" />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-bold text-gray-700 mb-1">Telefone / Celular</label>
                           <input required value={telefone} onChange={e=>setTelefone(e.target.value)} type="text" className="w-full border rounded p-3 outline-none focus:border-[#008d36]" placeholder="(11) 99999-9999" />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-gray-700 mb-1">CPF</label>
                           <input required value={cpf} onChange={e=>setCpf(e.target.value)} type="text" className="w-full border rounded p-3 outline-none focus:border-[#008d36]" placeholder="000.000.000-00" />
                        </div>
                     </div>
                  </div>

                  {/* FORMA DE PAGAMENTO */}
                  <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
                     <h2 className="text-xl font-black text-gray-900 mb-6">2. Forma de Pagamento</h2>
                     
                     <div className="space-y-4">
                        {/* OPÇÃO BALCÃO */}
                        <label className={`block border-2 rounded-lg p-5 cursor-pointer flex items-center gap-4 transition-colors ${paymentMethod === 'BALCAO' ? 'border-[#008d36] bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                           <input type="radio" checked={paymentMethod === 'BALCAO'} onChange={() => setPaymentMethod('BALCAO')} className="w-5 h-5 accent-[#008d36]" />
                           <div className="flex-1">
                              <span className="font-bold text-gray-900 block">Pagar no balcão da loja</span>
                              <span className="text-xs text-gray-500">Pague apenas no momento de retirada do veículo (Cartão de Crédito ou Débito).</span>
                           </div>
                        </label>

                        {/* OPÇÃO ONLINE PIX */}
                        <label className={`block border-2 rounded-lg p-5 cursor-pointer flex items-center gap-4 transition-colors ${paymentMethod === 'PIX' ? 'border-[#008d36] bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                           <input type="radio" checked={paymentMethod === 'PIX'} onChange={() => setPaymentMethod('PIX')} className="w-5 h-5 accent-[#008d36]" />
                           <div className="flex-1">
                              <span className="font-bold text-gray-900 block flex items-center gap-2">
                                 Pagar Online via PIX 
                                 <span className="bg-[#1b75bb] text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">Rápido</span>
                              </span>
                              <span className="text-xs text-gray-500">Aprovação imediata. Gere o QR Code no próximo passo.</span>
                           </div>
                        </label>

                        {/* OPÇÃO ONLINE CARTÃO */}
                        <div className={`border-2 rounded-lg transition-colors overflow-hidden ${paymentMethod === 'CREDIT' ? 'border-[#008d36] bg-white' : 'border-gray-200'}`}>
                           <label className={`block p-5 cursor-pointer flex items-center gap-4 ${paymentMethod === 'CREDIT' ? 'bg-green-50 border-b border-[#008d36]' : 'hover:bg-gray-50'}`}>
                              <input type="radio" checked={paymentMethod === 'CREDIT'} onChange={() => setPaymentMethod('CREDIT')} className="w-5 h-5 accent-[#008d36]" />
                              <div className="flex-1">
                                 <span className="font-bold text-gray-900 block">Pagar Online com Cartão de Crédito</span>
                                 <span className="text-xs text-gray-500">Pagamento processado de forma 100% segura pela Cielo.</span>
                              </div>
                           </label>
                           
                           {paymentMethod === 'CREDIT' && (
                              <div className="p-6 space-y-4">
                                 <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Nome Impresso no Cartão</label>
                                    <input required value={ccName} onChange={e=>setCcName(e.target.value)} type="text" className="w-full border rounded p-3 outline-none focus:border-[#008d36]" placeholder="NOME DO TITULAR" />
                                 </div>
                                 <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                       <label className="block text-xs font-bold text-gray-700 mb-1">Número do Cartão</label>
                                       <input required value={ccNumber} onChange={e=>setCcNumber(e.target.value)} type="text" className="w-full border rounded p-3 outline-none focus:border-[#008d36] tracking-widest text-lg" placeholder="0000 0000 0000 0000" maxLength={19} />
                                    </div>
                                    <div>
                                       <label className="block text-xs font-bold text-gray-700 mb-1">Validade (MM/AAAA)</label>
                                       <input required value={ccValidity} onChange={e=>{
                                          // Auto-format MM/YYYY
                                          let val = e.target.value.replace(/\D/g, '');
                                          if (val.length >= 2) {
                                              val = val.substring(0, 2) + '/' + val.substring(2, 6);
                                          }
                                          setCcValidity(val);
                                       }} type="text" className="w-full border rounded p-3 outline-none focus:border-[#008d36]" placeholder="12/2030" maxLength={7} />
                                    </div>
                                    <div>
                                       <label className="block text-xs font-bold text-gray-700 mb-1">Cód. Segurança (CVV)</label>
                                       <input required value={ccCvv} onChange={e=>setCcCvv(e.target.value)} type="text" className="w-full border rounded p-3 outline-none focus:border-[#008d36]" placeholder="123" maxLength={4} />
                                    </div>
                                 </div>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>

                  <div className="text-right">
                     <button disabled={loading} type="submit" className="bg-[#008d36] hover:bg-[#007a2d] text-white font-black py-5 px-10 rounded-lg shadow-lg uppercase tracking-wide text-lg disabled:opacity-50 transition-colors">
                        {loading ? 'Processando Reserva...' : 'Finalizar e Reservar Agora'}
                     </button>
                  </div>
               </form>
           </div>

           {/* RESUMO - LADO DIREITO */}
           <div className="w-[380px] shrink-0">
               <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm sticky top-8">
                  <div className="bg-gray-50 border-b border-gray-200 p-6">
                     <h3 className="font-black text-gray-900 text-lg mb-1">Resumo da Reserva</h3>
                     <p className="text-xs text-gray-500 font-bold uppercase">{days} dias de aluguel</p>
                  </div>

                  <div className="p-6">
                     {/* Imagem do Carro */}
                     <div className="mb-6 flex flex-col items-center">
                        <img src={booking.car.image} alt="Veículo" className="w-48 h-32 object-contain mix-blend-multiply" />
                        <h4 className="font-black text-xl text-gray-900 text-center uppercase mt-2 leading-none">{booking.car.name}</h4>
                        <span className="text-xs font-bold text-gray-500 uppercase mt-1">{booking.car.category}</span>
                     </div>

                     <div className="border-t border-b border-gray-100 py-4 my-4 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                           <span className="text-gray-600 font-bold">Retirada</span>
                           <span className="font-black text-gray-900 text-right text-xs">GUARULHOS AEROPORTO<br />18 Mar 2026, 10:00</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                           <span className="text-gray-600 font-bold">Devolução</span>
                           <span className="font-black text-gray-900 text-right text-xs">GUARULHOS AEROPORTO<br />09 Abr 2026, 09:45</span>
                        </div>
                     </div>

                     <div className="space-y-2 mb-6 text-sm">
                        <div className="flex justify-between">
                           <span className="text-gray-600 font-medium">Veículo ({days} dias)</span>
                           <span className="font-bold text-gray-900">R$ {(booking.car.price * days).toFixed(2).replace('.', ',')}</span>
                        </div>
                        {booking.extrasPrice > 0 && (
                           <div className="flex justify-between text-[#008d36]">
                              <span className="font-medium">Proteções & Extras ({days} dias)</span>
                              <span className="font-bold">R$ {(booking.extrasPrice * days).toFixed(2).replace('.', ',')}</span>
                           </div>
                        )}
                        <div className="flex justify-between text-gray-400 text-xs">
                           <span className="font-medium">Taxas e Impostos</span>
                           <span className="font-bold">Incluídos</span>
                        </div>
                     </div>

                     <div className="bg-gray-50 -mx-6 -mb-6 p-6 border-t border-gray-200">
                        <div className="flex justify-between items-end">
                           <span className="text-xs font-bold text-gray-500 uppercase">Preço Total Estimado</span>
                           <span className="text-3xl font-black text-gray-900 block leading-none">R$ {totalAmount.toFixed(2).replace('.', ',')}</span>
                        </div>
                     </div>
                  </div>
               </div>
           </div>

       </div>
    </div>
  );
}
