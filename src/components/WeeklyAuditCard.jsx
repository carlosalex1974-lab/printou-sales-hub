import React, { useState, useEffect } from 'react';
import { Mail, Clock, Send, CheckCircle2, AlertCircle, RefreshCw, Key, ShieldCheck } from 'lucide-react';

export default function WeeklyAuditCard() {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sending, setSending] = useState(false);
    const [smtpPassInput, setSmtpPassInput] = useState('');
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const loadStatus = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/reports/weekly-audit/status');
            const data = await res.json();
            setConfig(data);
        } catch (e) {
            console.error('Falha ao carregar status da conferência:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStatus();
    }, []);

    const handleSavePassword = async () => {
        if (!smtpPassInput) return;
        try {
            setSaving(true);
            setMessage(null);
            setError(null);
            const res = await fetch('/api/reports/weekly-audit/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    smtpPass: smtpPassInput.trim()
                })
            });
            const data = await res.json();
            if (data.success) {
                setMessage('Senha de aplicativo salva com sucesso!');
                setSmtpPassInput('');
                await loadStatus();
            } else {
                setError(data.error || 'Erro ao salvar senha.');
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSendTestNow = async () => {
        try {
            setSending(true);
            setMessage(null);
            setError(null);
            const res = await fetch('/api/reports/weekly-audit/send-now', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) {
                setMessage('✅ Relatório disparado com sucesso para os e-mails configurados!');
                await loadStatus();
            } else {
                setError(data.error || 'Falha no disparo do e-mail.');
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                        <Mail className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-extrabold text-white text-lg flex items-center gap-2">
                            Conferência Semanal Automatizada (Toda Segunda-feira às 09:00)
                        </h4>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Disparo programado com Balanço Físico (Item 1), Checagem de Integridade (Item 3) e Resumo de Vendas (Item 4).
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <a
                        href="/api/reports/weekly-audit/preview"
                        target="_blank"
                        rel="noreferrer"
                        className="bg-white/5 hover:bg-white/10 text-gray-300 font-bold px-4 py-2 rounded-xl text-xs transition-all border border-white/10 flex items-center gap-2"
                    >
                        👁️ Ver Prévia do E-mail
                    </a>
                    <button
                        onClick={handleSendTestNow}
                        disabled={sending || loading || !config?.smtp?.hasPass}
                        className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl text-xs transition-all flex items-center gap-2 shadow-lg shadow-purple-600/20"
                    >
                        {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Disparar Teste Agora
                    </button>
                </div>
            </div>

            {message && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    {message}
                </div>
            )}

            {error && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2 font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#121215] border border-white/5 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Agendamento Ativo</span>
                    <p className="text-sm font-black text-white flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-purple-400" />
                        Toda Segunda-feira às 09:00
                    </p>
                    <p className="text-[11px] text-gray-400">Horário de Brasília (CRON_TZ)</p>
                </div>

                <div className="p-4 rounded-xl bg-[#121215] border border-white/5 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Destinatários Cadastrados</span>
                    <p className="text-xs font-bold text-gray-200">carlosalex1974@gmail.com</p>
                    <p className="text-xs font-bold text-gray-200">fabi.meneghetti@gmail.com</p>
                </div>

                <div className="p-4 rounded-xl bg-[#121215] border border-white/5 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Status SMTP (Gmail)</span>
                    <div className="flex items-center gap-2 mt-1">
                        {config?.smtp?.hasPass ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5" /> Pronto p/ Disparo
                            </span>
                        ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5" /> Senha App Pendente
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">Remetente: {config?.smtp?.user || 'carlosalex1974@gmail.com'}</p>
                </div>
            </div>

            {/* Input da Senha de Aplicativo do Gmail */}
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-purple-400" />
                        <h5 className="font-bold text-white text-sm">Senha de Aplicativo do Google (16 caracteres)</h5>
                    </div>
                    <p className="text-xs text-gray-400">
                        {config?.smtp?.hasPass 
                            ? '✅ Senha configurada! Você pode inserir uma nova abaixo caso deseje atualizar.' 
                            : 'Insira a senha de 16 caracteres gerada na Conta Google (Segurança > Senhas de app) para habilitar o envio automático.'
                        }
                    </p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <input
                        type="password"
                        placeholder="Ex: abcd efgh ijkl mnop"
                        value={smtpPassInput}
                        onChange={(e) => setSmtpPassInput(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 w-full md:w-64"
                    />
                    <button
                        onClick={handleSavePassword}
                        disabled={saving || !smtpPassInput}
                        className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all whitespace-nowrap"
                    >
                        {saving ? 'Salvando...' : 'Salvar Senha'}
                    </button>
                </div>
            </div>
        </div>
    );
}
