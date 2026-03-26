"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import LoginModal from "@/components/auth/LoginModal";

const mockCars = [
  {
    id: 1,
    name: "FIAT ARGO 1.0",
    category: "COMPACT",
    image: "https://www.europcar.com/vehicles/images/223/cars/fiat/argo.png",
    passengers: 5,
    doors: 5,
    suitcasesLg: 2,
    transmission: "Manual",
    type: "Carro",
    ac: true,
    co2: 19,
    price: 81.98,
    total: 1803.64,
  },
  {
    id: 2,
    name: "TOYOTA COROLLA 1.8",
    category: "PREMIUM",
    image:
      "https://www.europcar.com/vehicles/images/223/cars/toyota/corolla.png",
    passengers: 5,
    doors: 4,
    suitcasesLg: 4,
    transmission: "Automática",
    type: "Premium",
    ac: true,
    co2: 21,
    price: 238.8,
    total: 5253.55,
  },
  {
    id: 3,
    name: "FIAT MOBI 1.0",
    category: "ECONOMY",
    image: "https://www.europcar.com/vehicles/images/223/cars/fiat/mobi.png",
    passengers: 5,
    doors: 5,
    suitcasesLg: 1,
    transmission: "Manual",
    type: "Carro",
    ac: true,
    co2: 19,
    price: 74.67,
    total: 1642.73,
  },
];

export default function VehiclesSelectionPage() {
  const { data: session, status } = useSession();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(2); // 1: Res, 2: Veiculo, 3: Protecoes, 4: Revisar

  // Extras State for Step 3
  const [dbExtras, setDbExtras] = useState<any[]>([]);
  const [selectedExtrasMap, setSelectedExtrasMap] = useState<Record<string, number>>({});
  const [loadingExtras, setLoadingExtras] = useState(false);

  useEffect(() => {
    if (currentStep === 3 && dbExtras.length === 0) {
      setLoadingExtras(true);
      fetch('/api/admin/extras')
        .then(res => res.json())
        .then(data => setDbExtras(data.filter((e: any) => e.active)))
        .finally(() => setLoadingExtras(false));
    }
  }, [currentStep, dbExtras.length]);

  const handleExtraQuantity = (id: string, delta: number) => {
    setSelectedExtrasMap(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
         const { [id]: _, ...rest } = prev;
         return rest;
      }
      return { ...prev, [id]: next };
    });
  };

  const selectedExtrasPricePerDay = useMemo(() => {
     let sum = 0;
     for (const [id, qty] of Object.entries(selectedExtrasMap)) {
        const ext = dbExtras.find(e => e.id === id);
        if (ext) sum += ext.pricePerDay * qty;
     }
     return sum;
  }, [selectedExtrasMap, dbExtras]);

  // Filters State
  const [transmission, setTransmission] = useState("Ambos");
  const [vehicleType, setVehicleType] = useState("Carro");
  const [minSeats, setMinSeats] = useState(2);
  const [sortBy, setSortBy] = useState("Recomendado");

  // Filtered Cars
  const filteredCars = useMemo(() => {
    let result = mockCars.filter((car) => {
      // Filter Transmission
      if (transmission !== "Ambos" && car.transmission !== transmission)
        return false;

      // Filter Type (simplified)
      if (vehicleType === "Carro" && car.type === "Premium") return false; // Exclude Premium from regular Carro for this mock
      if (vehicleType === "Premium" && car.type !== "Premium") return false;

      // Filter Seats
      if (car.passengers < minSeats) return false;

      return true;
    });

    // Sort
    if (sortBy === "Preço: Menor para maior") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "Preço: Maior para menor") {
      result.sort((a, b) => b.price - a.price);
    } // "Recomendado" keeps default order

    return result;
  }, [transmission, vehicleType, minSeats, sortBy]);

  const handleSelectCar = (car: any) => {
    setSelectedCar(car);
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] font-sans">
      {/* Edit Location Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-70 p-4">
          <div className="bg-white rounded-lg p-8 w-full max-w-lg shadow-2xl relative">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
            <h2 className="text-2xl font-black text-gray-900 mb-6">
              Alterar Pesquisa
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Local de retirada
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-4 py-3 outline-none focus:border-[#008d36]"
                defaultValue="GUARULHOS AIRPORT MEET AND GREET"
              />
            </div>
            <div className="flex gap-4 mb-8">
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Data/Hora Retirada
                </label>
                <input
                  type="datetime-local"
                  className="w-full border border-gray-300 rounded px-4 py-3 outline-none focus:border-[#008d36]"
                  defaultValue="2026-03-18T10:00"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Data/Hora Devolução
                </label>
                <input
                  type="datetime-local"
                  className="w-full border border-gray-300 rounded px-4 py-3 outline-none focus:border-[#008d36]"
                  defaultValue="2026-04-09T09:45"
                />
              </div>
            </div>
            <button
              onClick={() => setShowEditModal(false)}
              className="w-full bg-[#ffcc00] hover:bg-[#e6b800] text-gray-900 font-bold py-4 rounded transition-colors text-lg"
            >
              Atualizar Pesquisa
            </button>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
         <LoginModal onClose={() => setShowLoginModal(false)} />
      )}

      {/* Header Branco Simples */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
          <Link href="/">
            <div className="bg-[#008d36] px-4 py-2 flex items-center justify-center">
               <img src="/logo.jpg" alt="Europcar" className="h-[30px] md:h-[40px] object-contain" />
            </div>
          </Link>
          <div className="flex items-center gap-6 text-sm font-bold text-gray-900">
            {status === "loading" ? (
               <span className="text-gray-400">Carregando...</span>
            ) : session?.user ? (
               <div className="flex items-center gap-4">
                  <span className="text-[#008d36]">Olá, {session.user.name || session.user.email?.split('@')[0]}</span>
                  <button onClick={() => signOut()} className="text-xs text-gray-500 hover:text-red-500 font-normal">Sair</button>
               </div>
            ) : (
               <button onClick={() => setShowLoginModal(true)} className="flex items-center gap-2 hover:text-[#008d36]">
                 <svg
                   className="w-5 h-5"
                   fill="none"
                   stroke="currentColor"
                   viewBox="0 0 24 24"
                 >
                   <path
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     strokeWidth="2"
                     d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                   ></path>
                 </svg>
                 Fazer login
               </button>
            )}
            <button className="flex items-center gap-2 hover:text-[#008d36]">
              <span className="text-xl">🇧🇷</span> BR
            </button>
            <a href="https://www.europcar.com/pt-br/contact-us" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#008d36]">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              Ajuda
            </a>
          </div>
        </div>
      </header>

      {/* Stepper Nav */}
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 flex gap-4">
          {/* Step 1 */}
          <div className="flex-1 bg-white border border-gray-200 rounded p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="bg-[#008d36] text-white font-bold text-xs w-5 h-5 flex items-center justify-center rounded-sm">
                  1
                </span>
                <span className="text-[11px] font-bold text-gray-500 uppercase">
                  LOCAL DO ALUGUEL
                </span>
              </div>
              <button onClick={() => setShowEditModal(true)}>
                <svg
                  className="w-4 h-4 text-[#008d36]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  ></path>
                </svg>
              </button>
            </div>
            <div className="flex justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-900 block uppercase">
                  Retirada
                </span>
                <span className="text-xs font-bold text-gray-900 block truncate max-w-[120px]">
                  GUARULHOS AIRPORT...
                </span>
                <span className="text-xs text-gray-500">2026-03-18 10:00</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-900 block uppercase">
                  Devolução
                </span>
                <span className="text-xs font-bold text-gray-900 block truncate max-w-[120px]">
                  GUARULHOS AIRPORT...
                </span>
                <span className="text-xs text-gray-500">2026-04-09 09:45</span>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div
            className={`flex-1 bg-white border-2 ${currentStep === 2 ? "border-[#008d36]" : "border-gray-200"} rounded p-4 relative`}
          >
            <div className="absolute -top-3 left-4 bg-white px-2 flex items-center gap-2">
              <span
                className={`${currentStep >= 2 ? "bg-[#008d36] text-white" : "bg-gray-200 text-gray-500"} font-bold text-xs w-5 h-5 flex items-center justify-center rounded-sm`}
              >
                2
              </span>
              <span
                className={`text-[11px] font-bold ${currentStep >= 2 ? "text-[#008d36]" : "text-gray-500"} uppercase`}
              >
                VEÍCULO
              </span>
            </div>
            {selectedCar ? (
              <div className="mt-2 text-xs font-bold text-gray-900 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-[#008d36]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                {selectedCar.name} selecionado
              </div>
            ) : (
              <p className="text-[13px] text-gray-500 mt-2">
                Você ainda não selecionou um veículo.
              </p>
            )}
          </div>

          {/* Step 3 */}
          <div
            className={`flex-1 bg-white border-2 ${currentStep === 3 ? "border-[#008d36]" : "border-gray-200"} rounded p-4 relative`}
          >
            {currentStep === 3 && (
              <div className="absolute -top-3 left-4 bg-white px-2 flex items-center gap-2">
                <span className="bg-[#008d36] text-white font-bold text-xs w-5 h-5 flex items-center justify-center rounded-sm">
                  3
                </span>
                <span className="text-[11px] font-bold text-[#008d36] uppercase">
                  PROTEÇÃO, EXTRAS
                </span>
              </div>
            )}
            {currentStep !== 3 && (
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-gray-200 text-gray-500 font-bold text-xs w-5 h-5 flex items-center justify-center rounded-sm">
                  3
                </span>
                <span className="text-[11px] font-bold text-gray-500 uppercase">
                  PROTEÇÃO, EXTRAS
                </span>
              </div>
            )}
            <p className="text-[13px] text-gray-500 mt-2">
              {currentStep === 3
                ? "Selecione a proteção e adicione extras opcionais."
                : "Você poderá escolher proteção e extras depois de selecionar um veículo."}
            </p>
          </div>

          {/* Step 4 */}
          <div className="flex-1 bg-white border border-gray-200 rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-gray-200 text-gray-500 font-bold text-xs w-5 h-5 flex items-center justify-center rounded-sm">
                4
              </span>
              <span className="text-[11px] font-bold text-gray-500 uppercase">
                REVISAR
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8 items-start">
        {/* Sidebar Filters */}
        <div className="w-[280px] shrink-0 sticky top-4">
          <div className="bg-white rounded border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h3 className="font-bold text-gray-900">Filtros</h3>
              <button
                onClick={() => {
                  setTransmission("Ambos");
                  setVehicleType("Carro");
                  setMinSeats(2);
                }}
                className="text-[#008d36] text-xs font-bold hover:underline"
              >
                Redefinir tudo
              </button>
            </div>

            {/* Transmissão */}
            <div className="mb-8">
              <h4 className="font-bold text-sm text-gray-900 mb-4">
                Transmissão
              </h4>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    name="transmissao"
                    checked={transmission === "Automática"}
                    onChange={() => setTransmission("Automática")}
                    className="w-4 h-4 text-[#008d36] focus:ring-[#008d36]"
                  />{" "}
                  Automática
                </label>
                <label className="flex items-center gap-3 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    name="transmissao"
                    checked={transmission === "Manual"}
                    onChange={() => setTransmission("Manual")}
                    className="w-4 h-4 text-[#008d36] focus:ring-[#008d36]"
                  />{" "}
                  Manual
                </label>
                <label className="flex items-center gap-3 text-sm text-gray-900 font-bold cursor-pointer">
                  <input
                    type="radio"
                    name="transmissao"
                    checked={transmission === "Ambos"}
                    onChange={() => setTransmission("Ambos")}
                    className="w-4 h-4 accent-[#008d36] text-[#008d36] focus:ring-[#008d36]"
                  />{" "}
                  Ambos
                </label>
              </div>
            </div>

            {/* Tipo de veículo */}
            <div className="mb-8 border-t border-gray-100 pt-6">
              <h4 className="font-bold text-sm text-gray-900 mb-4">
                Tipo de veículo
              </h4>
              <div className="flex flex-col gap-3">
                <label
                  className={`flex items-center gap-3 text-sm ${vehicleType === "Carro" ? "text-gray-900 font-bold" : "text-gray-600"} cursor-pointer`}
                >
                  <input
                    type="radio"
                    name="tipo"
                    checked={vehicleType === "Carro"}
                    onChange={() => setVehicleType("Carro")}
                    className="w-4 h-4 accent-[#008d36] text-[#008d36]"
                  />{" "}
                  Carro
                </label>
                <label
                  className={`flex items-center gap-3 text-sm ${vehicleType === "Furgões e caminhões" ? "text-gray-900 font-bold" : "text-gray-600"} cursor-pointer`}
                >
                  <input
                    type="radio"
                    name="tipo"
                    checked={vehicleType === "Furgões e caminhões"}
                    onChange={() => setVehicleType("Furgões e caminhões")}
                    className="w-4 h-4 accent-[#008d36] text-[#008d36]"
                  />{" "}
                  Furgões e caminhões
                </label>
                <label
                  className={`flex items-center gap-3 text-sm ${vehicleType === "Premium" ? "text-gray-900 font-bold" : "text-gray-600"} cursor-pointer`}
                >
                  <input
                    type="radio"
                    name="tipo"
                    checked={vehicleType === "Premium"}
                    onChange={() => setVehicleType("Premium")}
                    className="w-4 h-4 accent-[#008d36] text-[#008d36]"
                  />{" "}
                  Premium
                </label>
              </div>
            </div>

            {/* Assentos */}
            <div className="mb-8 border-t border-gray-100 pt-6">
              <h4 className="font-bold text-sm text-gray-900 mb-4">Assentos</h4>
              <div className="flex justify-between text-xs font-bold text-gray-900 mb-2">
                <span>2+</span>
                <span>4+</span>
                <span>5+</span>
                <span>7+</span>
              </div>
              <input
                type="range"
                min="2"
                max="7"
                value={minSeats}
                onChange={(e) => setMinSeats(Number(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#008d36]"
              />
            </div>

            {/* Faixa de preço */}
            <div className="border-t border-gray-100 pt-6">
              <h4 className="font-bold text-sm text-gray-900 mb-4">
                Faixa de preço
              </h4>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] text-gray-500 font-bold mb-1 block">
                    preço mínimo
                  </label>
                  <div className="border border-gray-300 rounded p-2 text-sm font-bold text-gray-900">
                    R$ 1642
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-gray-500 font-bold mb-1 block">
                    preço máximo
                  </label>
                  <div className="border border-gray-300 rounded p-2 text-sm font-bold text-gray-900">
                    R$ 21194
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicles List */}
        <div className="flex-1">
          {currentStep === 2 ? (
            <>
              <div className="flex justify-end items-center mb-6">
                <label className="text-sm font-bold text-gray-900 mr-3">
                  Classificar por:
                </label>
                <select
                  className="border border-gray-300 rounded bg-white px-3 py-2 text-sm font-bold text-gray-700 outline-none w-48"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="Recomendado">Recomendado</option>
                  <option value="Preço: Menor para maior">
                    Preço: Menor para maior
                  </option>
                  <option value="Preço: Maior para menor">
                    Preço: Maior para menor
                  </option>
                </select>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#1b75bb] flex items-center justify-center text-white font-bold text-sm italic">
                    i
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    Local de aluguel Meet & Greet
                  </span>
                </div>
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>

              {/* Cars Grid */}
              <div className="flex flex-col gap-6">
                {filteredCars.length === 0 && (
                  <div className="bg-white p-8 text-center rounded-lg border border-gray-200 text-gray-500 font-medium">
                    Nenhum veículo encontrado com estes filtros. Tente mudar ou
                    redefinir.
                  </div>
                )}
                {filteredCars.map((car) => (
                  <div
                    key={car.id}
                    className={`bg-white rounded-lg border p-6 flex items-center gap-8 relative transition-shadow ${selectedCar?.id === car.id ? "border-[#008d36] shadow-lg" : "border-gray-200 hover:shadow-lg"}`}
                  >
                    <div className="w-[300px] shrink-0">
                      <div className="h-[180px] bg-white border border-gray-100 rounded mb-4 overflow-hidden relative flex items-center justify-center p-4">
                        <img
                          src={car.image}
                          alt={car.name}
                          onError={(e) => { e.currentTarget.src = "https://placehold.co/400x200/efefef/008d36?text=Foto+Indisponível"; e.currentTarget.className = "object-contain w-full h-full rounded" }}
                          className="object-contain w-full h-full mix-blend-multiply"
                        />
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-between self-stretch py-2">
                      <div>
                        <h2 className="text-xl font-black text-gray-900 uppercase leading-none">
                          {car.name}
                        </h2>
                        <div className="inline-flex items-center mt-2 border border-gray-200 rounded-full px-3 py-1 bg-gray-50">
                          <span className="text-[10px] font-bold text-gray-600 mr-2 uppercase">
                            OU SIMILAR {car.category}
                          </span>
                          <span className="w-3.5 h-3.5 bg-[#bfbfbf] text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                            i
                          </span>
                        </div>

                        <div className="flex items-center gap-4 mt-6 text-sm text-gray-600 font-bold">
                          <div className="flex items-center gap-1">
                            <span title="Passageiros">🧑‍🤝‍🧑 {car.passengers}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span title="Portas">🚪 {car.doors}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span title="Malas">🧳 {car.suitcasesLg}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span title="Transmissão">
                              {car.transmission === "Manual" ? "⚙️ M" : "⚙️ A"}
                            </span>
                          </div>
                          {car.ac && (
                            <div className="flex items-center gap-1">
                              <span title="Ar condicionado">❄️ A/C</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <span title="Emissão CO2">🍃 {car.co2}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4 text-[#008d36] text-sm font-bold">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="3"
                              d="M5 13l4 4L19 7"
                            ></path>
                          </svg>
                          Quilometragem ilimitada
                        </div>
                      </div>

                      <div className="mt-4">
                        <button className="text-[#008d36] text-xs font-bold flex items-center gap-1 hover:underline">
                          Mais detalhes{" "}
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            ></path>
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="w-[180px] shrink-0 flex flex-col items-end self-stretch justify-center border-l border-gray-100 pl-6">
                      <span className="text-[10px] uppercase font-bold text-gray-500 mb-1">
                        PAGAR NO BALCÃO
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-gray-900">
                          R$ {car.price.toFixed(2).replace(".", ",")}
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          / dia
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 font-medium mb-4">
                        TOTAL R$ {car.total.toFixed(2).replace(".", ",")}
                      </span>

                      <button
                        onClick={() => handleSelectCar(car)}
                        className={`w-full ${selectedCar?.id === car.id ? "bg-[#008d36] text-white border-2 border-[#008d36]" : "bg-[#ffcc00] hover:bg-[#e6b800] text-gray-900 border-2 border-transparent"} font-bold py-3 rounded text-sm transition-colors shadow-sm`}
                      >
                        {selectedCar?.id === car.id
                          ? "Selecionado ✓"
                          : "Selecionar"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="bg-[#f7f7f7] rounded border border-gray-200 p-8 shadow-sm relative">
              <button
                onClick={() => setCurrentStep(2)}
                className="absolute top-8 right-8 text-[#008d36] font-bold px-4 py-2 hover:underline text-sm"
              >
                ← Voltar
              </button>
              
              <h2 className="text-2xl font-black text-gray-900 mb-8 pb-4">
                Escolha sua proteção e seus extras
              </h2>

              <div className="border border-green-200 rounded mb-8 bg-green-50 p-4 flex gap-4 text-sm font-bold items-center">
                 <div className="flex-1 border-r border-green-200">
                    <div className="text-[10px] uppercase text-green-700">Preço Base do Veículo</div>
                    <div>R$ {selectedCar?.price.toFixed(2).replace('.', ',')} / dia</div>
                 </div>
                 <div className="flex-1">
                    <div className="text-[10px] uppercase text-green-700">Novo Preço Estimado c/ Extras</div>
                    <div className="text-lg">R$ {(selectedCar?.price + selectedExtrasPricePerDay).toFixed(2).replace('.', ',')} / dia</div>
                 </div>
                 <button 
                    onClick={() => {
                        const payload = {
                            car: selectedCar,
                            extras: selectedExtrasMap,
                            pickupLoc: "GUARULHOS AIRPORT",
                            pickupDate: "2026-03-18 10:00",
                            dropoffLoc: "GUARULHOS AIRPORT",
                            dropoffDate: "2026-04-09 09:45",
                            basePrice: selectedCar.price,
                            extrasPrice: selectedExtrasPricePerDay,
                            totalDay: selectedCar.price + selectedExtrasPricePerDay
                        };
                        sessionStorage.setItem('europcar_booking', JSON.stringify(payload));
                        window.location.href = '/checkout';
                    }}
                    className="bg-[#ffcc00] hover:bg-[#e6b800] text-gray-900 font-bold py-3 px-6 rounded shadow-sm shrink-0 uppercase text-xs transition-colors">
                    Ir para revisão
                 </button>
              </div>

              {loadingExtras ? (
                 <div className="text-gray-500 font-bold py-10 text-center">Carregando proteções e extras...</div>
              ) : (
                 <>
                   {/* PROTECTIONS */}
                   {dbExtras.filter(e => e.type === 'PROTECTION').length > 0 && (
                     <>
                       <h3 className="font-bold text-gray-900 text-lg mb-4">Escolha sua proteção</h3>
                       <div className="grid grid-cols-2 gap-4 mb-10">
                          {dbExtras.filter(e => e.type === 'PROTECTION').map(extra => {
                             const isSelected = selectedExtrasMap[extra.id] > 0;
                             return (
                               <div key={extra.id} className={`bg-white border-2 rounded-lg p-6 flex flex-col justify-between ${isSelected ? 'border-[#008d36] shadow-md' : 'border-gray-200 hover:border-[#008d36]'}`}>
                                  <div>
                                     <h4 className="font-black text-lg text-gray-900 mb-1">{extra.name}</h4>
                                     <div className="flex items-baseline gap-1 mb-4">
                                        <span className="text-xl font-black text-gray-900">R$ {extra.pricePerDay.toFixed(2).replace('.', ',')}</span>
                                        <span className="text-xs text-gray-500 font-bold">/ dia</span>
                                     </div>
                                     <p className="text-sm text-gray-600 mb-6">{extra.description}</p>
                                  </div>
                                  <button 
                                     onClick={() => {
                                        if (isSelected) {
                                           handleExtraQuantity(extra.id, -1);
                                        } else {
                                           handleExtraQuantity(extra.id, 1);
                                        }
                                     }}
                                     className={`w-full font-bold py-3 rounded text-sm transition-colors ${isSelected ? 'bg-white border-2 border-gray-200 text-gray-500' : 'bg-[#ffcc00] hover:bg-[#e6b800] text-gray-900 border-2 border-transparent'}`}>
                                     {isSelected ? 'Remover' : 'Selecionar'}
                                  </button>
                               </div>
                             );
                          })}
                       </div>
                     </>
                   )}

                   {/* ADDONS */}
                   {dbExtras.filter(e => e.type === 'ADDON').length > 0 && (
                     <>
                       <h3 className="font-bold text-gray-900 text-lg mb-4">Extras disponíveis</h3>
                       <div className="grid grid-cols-4 gap-4">
                          {dbExtras.filter(e => e.type === 'ADDON').map(extra => {
                             const qty = selectedExtrasMap[extra.id] || 0;
                             return (
                               <div key={extra.id} className={`bg-white border-2 rounded-lg p-4 flex flex-col justify-between ${qty > 0 ? 'border-[#008d36] shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                                  <div>
                                     <div className="flex gap-3 items-start mb-2 min-h-[40px]">
                                       {extra.imageUrl && (
                                          <img src={extra.imageUrl} alt={extra.name} className="w-10 h-10 object-contain rounded bg-white" />
                                       )}
                                       <h4 className="font-bold text-sm text-gray-900 leading-tight flex-1">{extra.name}</h4>
                                     </div>
                                     <p className="text-xs text-gray-500 mb-4 line-clamp-3" title={extra.description}>{extra.description}</p>
                                     <div className="flex items-baseline gap-1 mb-4">
                                        <span className="text-base font-black text-gray-900">R$ {extra.pricePerDay.toFixed(2).replace('.', ',')}</span>
                                        <span className="text-[10px] text-gray-500 font-bold">/ dia</span>
                                     </div>
                                  </div>
                                  <div className="flex flex-col gap-2">
                                     {qty > 0 ? (
                                        <div className="flex items-center justify-between border border-gray-300 rounded overflow-hidden">
                                           <button onClick={() => handleExtraQuantity(extra.id, -1)} className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-lg">-</button>
                                           <span className="font-bold text-gray-900">{qty}</span>
                                           <button onClick={() => handleExtraQuantity(extra.id, 1)} className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-[#008d36] font-bold text-lg">+</button>
                                        </div>
                                     ) : (
                                        <button onClick={() => handleExtraQuantity(extra.id, 1)} className="w-full bg-[#ffcc00] hover:bg-[#e6b800] text-gray-900 font-bold py-2 rounded text-sm transition-colors">
                                           Adicionar
                                        </button>
                                     )}
                                  </div>
                               </div>
                             );
                          })}
                       </div>
                     </>
                   )}
                 </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
