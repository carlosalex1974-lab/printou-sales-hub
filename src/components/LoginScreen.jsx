import React, { useState } from 'react';
import { Lock, Mail, Loader2 } from 'lucide-react';

export default function LoginScreen({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Tenta fazer o login no servidor Express
            const response = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                onLoginSuccess(data.user);
            } else {
                const errData = await response.json();
                setError(errData.error || 'Credenciais inválidas.');
            }
        } catch (err) {
            console.error(err);
            // Fallback local se o servidor estiver offline
            if (email === 'admin@printou.com' && password === 'admin123') {
                onLoginSuccess({ email, name: 'Administrador Printou', role: 'admin' });
            } else if (email === 'operador@printou.com' && password === 'printou123') {
                onLoginSuccess({ email, name: 'Operador Printou', role: 'employee' });
            } else {
                setError('E-mail ou senha incorretos.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-brand-darkBg text-white items-center justify-center p-4">
            <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-white/5 space-y-8 relative overflow-hidden shadow-2xl">
                {/* Efeito Glow Roxo no Fundo */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-orange/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-brand-yellow/10 rounded-full blur-3xl"></div>

                <div className="text-center relative z-10 space-y-4">
                    <div className="flex justify-center">
                        <img src="assets/logo.png" alt="Printou Logo" className="h-20 w-auto object-contain" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white">Acesso Restrito</h2>
                        <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Printou Sales Hub</p>
                    </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-5 relative z-10">
                    {error && (
                        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-bold text-center">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">E-mail</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 w-4 h-4 text-gray-500" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="usuario@printou.com"
                                className="w-full bg-[#121215] border border-brand-borderBg text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-brand-orange text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 w-4 h-4 text-gray-500" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••••••"
                                className="w-full bg-[#121215] border border-brand-borderBg text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-brand-orange text-sm"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-gradient font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider text-black flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Autenticando...
                            </>
                        ) : (
                            'Entrar na Plataforma'
                        )}
                    </button>
                </form>

                <div className="text-center relative z-10 text-[10px] text-gray-500 border-t border-white/5 pt-4">
                    <p>Controle de vendas interno • Printou Studio 3D</p>
                </div>
            </div>
        </div>
    );
}
