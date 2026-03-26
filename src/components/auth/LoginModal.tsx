"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

interface LoginModalProps {
  onClose: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const [view, setView] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
       setError("E-mail ou senha incorretos.");
       setLoading(false);
    } else {
       onClose();
       window.location.reload();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const message = await res.text();
        setError(message || "Erro ao realizar cadastro.");
        setLoading(false);
        return;
      }

      setSuccess("Conta criada com sucesso! Fazendo login...");

      // Entrar automaticamente após cadastro
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result?.error) {
        onClose();
        window.location.reload();
      } else {
        setView("login");
      }
    } catch (err) {
      setError("Erro interno ao criar conta.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-70 p-4">
      <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        
        <div className="flex justify-center mb-6">
           <div className="w-12 h-12 bg-[#008d36] flex items-center justify-center font-bold text-white text-3xl italic">E</div>
        </div>

        <h2 className="text-xl font-black text-gray-900 mb-6 text-center">
          {view === "login" ? "Acesse sua conta" : "Crie sua conta"}
        </h2>
        
        {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded text-sm mb-4 font-bold text-center">
               {error}
            </div>
        )}
        
        {success && (
            <div className="bg-green-50 text-green-700 border border-green-200 p-3 rounded text-sm mb-4 font-bold text-center">
               {success}
            </div>
        )}

        <form onSubmit={view === "login" ? handleLogin : handleRegister}>
          {view === "register" && (
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-1">Nome completo</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded px-4 py-3 outline-none focus:border-[#008d36]" 
                placeholder="Seu nome" 
              />
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-1">E-mail</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded px-4 py-3 outline-none focus:border-[#008d36]" 
              placeholder="seu@email.com" 
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-1">Senha</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-4 py-3 outline-none focus:border-[#008d36]" 
              placeholder="••••••••" 
            />
          </div>
          
          <button 
             type="submit" 
             disabled={loading}
             className="w-full bg-[#008d36] hover:bg-[#007a2d] text-white font-bold py-4 rounded transition-colors text-lg disabled:opacity-50"
          >
             {loading 
                ? (view === "login" ? 'Acessando...' : 'Criando...') 
                : (view === "login" ? 'Fazer login' : 'Cadastrar-se')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
           {view === "login" ? (
              <>Ainda não tem conta? <button onClick={() => { setView("register"); setError(""); }} className="font-bold text-[#008d36] hover:underline">Cadastre-se</button></>
           ) : (
              <>Já tem uma conta? <button onClick={() => { setView("login"); setError(""); }} className="font-bold text-[#008d36] hover:underline">Faça login</button></>
           )}
        </div>
      </div>
    </div>
  );
}
