"use client";
import { useState, useEffect } from "react";

export default function PromoSection() {
  const [promos, setPromos] = useState([]);

  useEffect(() => {
    fetch("/api/europcar/getPromos")
      .then((res) => res.json())
      .then((data) => setPromos(data.promos || []));
  }, []);

  if (promos.length === 0) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <h2 className="text-2xl font-black text-gray-900 mb-8">
        Promoções imperdíveis da rede !
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {promos.map((promo: any) => (
          <a
            href={promo.url}
            key={promo.id}
            className="relative rounded-lg overflow-hidden h-48 cursor-pointer group block"
          >
            <img
              src={promo.image}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              alt="Promo"
            />
            <div className="absolute top-0 left-0 bg-[#e3000b] text-white font-bold p-3 w-16 text-center leading-tight shadow-md">
              {promo.discount} <br />
              <span className="text-[10px] font-normal">{promo.label}</span>
            </div>
            <div className="absolute bottom-4 left-4">
              <span className="bg-white px-3 py-1 font-bold text-sm rounded shadow">
                {promo.title}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
