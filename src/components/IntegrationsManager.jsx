import React, { useState, useEffect } from 'react';
import { Shield, Terminal, Send, RefreshCw, Trash2, CheckCircle2 } from 'lucide-react';

export default function IntegrationsManager({ products, channels, integrationLogs = [], credentials, onWebhookTriggered, onClearLogs }) {
    const [provider, setProvider] = useState('mercadolivre');
    
    // Inputs de credenciais
    const [mlClientId, setMlClientId] = useState(credentials?.mercadolivre?.clientId || '');
    const [mlClientSecret, setMlClientSecret] = useState(credentials?.mercadolivre?.clientSecret || '');
    const [shopeeShopId, setShopeeShopId] = useState(credentials?.shopee?.shopId || '');
    const [shopeeApiKey, setShopeeApiKey] = useState(credentials?.shopee?.apiKey || '');
    const [siteApiKey, setSiteApiKey] = useState(credentials?.site?.apiKey || '');
    const [siteApiSecret, setSiteApiSecret] = useState(credentials?.site?.apiSecret || '');

    // Simulação do payload JSON
    const [payloadStr, setPayloadStr] = useState('');

    // Prepara payloads modelo
    const mlTemplate = {
        order_id: 'ML-2026-88775',
        channelId: 'ml2',
        productId: 'p1',
        productName: 'Groot Porta-Plantas 15cm',
        quantity: 1,
        grossValue: 49.90,
        shipping: 19.90,
        buyer: 'Rodrigo Medeiros'
    };

    const shopeeTemplate = {
        order_sn: 'SHP-2026-00432',
        channelId: 'shopee',
        productId: 'p2',
        productName: 'Suporte de Headset Gamer',
        quantity: 2,
        grossValue: 79.80,
        shipping: 0.00,
        buyer: 'Jessica Camargo'
    };

    const siteTemplate = {
        order_id: 'SITE-2026-1122',
        channelId: 'site',
        productId: 'p3',
        productName: 'Vaso Espiral Geométrico',
        quantity: 1,
        grossValue: 65.00,
        shipping: 12.00,
        buyer: 'Marcos de Souza'
    };

    // Atualiza o JSON quando troca o provedor
    useEffect(() => {
        const template = provider === 'mercadolivre' ? mlTemplate : provider === 'shopee' ? shopeeTemplate : siteTemplate;
        setPayloadStr(JSON.stringify(template, null, 4));
    }, [provider]);

    // Enviar Simulação do Webhook
    const handleFireWebhook = async () => {
        try {
            let parsed;
            try {
                parsed = JSON.parse(payloadStr);
            } catch (e) {
                alert('JSON inválido! Por favor corrija o formato antes de enviar.');
                return;
            }

            // Faz o disparo POST real para a rota permanente do back-end Express
            const response = await fetch(`/api/webhooks/${provider}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsed)
            });

            if (response.ok) {
                const resData = await response.json();
                // Notifica o componente pai para recarregar dados do banco e atualizar logs
                if (onWebhookTriggered) {
                    onWebhookTriggered();
                }
            } else {
                alert('Falha ao disparar o webhook do servidor.');
            }
        } catch (error) {
            console.error(error);
            alert('Não foi possível se conectar com o servidor da API.');
        }
    };

    // Salvar Credenciais no Banco
    const handleSaveCredentials = async () => {
        try {
            // Sincroniza credenciais
            const response = await fetch('/api/data');
            if (response.ok) {
                const db = await response.json();
                db.credentials = {
                    mercadolivre: {
                        clientId: mlClientId,
                        clientSecret: mlClientSecret,
                        webhookUrl: `${window.location.origin}/api/webhooks/mercadolivre`,
                        status: 'Sincronizado'
                    },
                    shopee: {
                        shopId: shopeeShopId,
                        apiKey: shopeeApiKey,
                        webhookUrl: `${window.location.origin}/api/webhooks/shopee`,
                        status: 'Sincronizado'
                    },
                    site: {
                        apiKey: siteApiKey,
                        apiSecret: siteApiSecret,
                        webhookUrl: `${window.location.origin}/api/webhooks/site`,
                        status: 'Sincronizado'
                    }
                };
                
                const saveRes = await fetch('/api/data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(db)
                });

                if (saveRes.ok) {
                    alert('Chaves e configurações de APIs salvas de forma permanente!');
                }
            }
        } catch (err) {
            alert('Erro ao salvar configurações.');
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <span className="text-xs font-bold tracking-widest text-brand-orange uppercase">Automações API</span>
                <h3 className="font-black text-2xl text-gradient">Painel de Integrações e Webhooks</h3>
                {/* 1. Cards de Conexão Oficial */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Mercado Livre Card */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <span className="text-lg font-black text-[#FFE600] flex items-center gap-2">
                            Mercado Livre API
                        </span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Ativo (Produção)
                        </span>
                    </div>

                    <div className="space-y-3 text-xs">
                        <div className="space-y-1">
                            <span className="text-gray-400 font-bold uppercase block">URL de Notificação (Webhook)</span>
                            <code className="bg-[#121215] text-brand-orange p-2 rounded-lg block overflow-x-auto text-[10px]">
                                http://sua-url-online.com/api/webhooks/mercadolivre
                            </code>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <span className="text-gray-400 font-bold uppercase">Client ID</span>
                                <input
                                    type="text" value={mlClientId} onChange={e => setMlClientId(e.target.value)}
                                    placeholder="Ex: 88775544..."
                                    className="w-full bg-brand-darkBg border border-brand-borderBg text-white rounded-lg p-2.5 focus:outline-none focus:border-brand-orange text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <span className="text-gray-400 font-bold uppercase">Client Secret</span>
                                <input
                                    type="password" value={mlClientSecret} onChange={e => setMlClientSecret(e.target.value)}
                                    placeholder="••••••••••••"
                                    className="w-full bg-brand-darkBg border border-brand-borderBg text-white rounded-lg p-2.5 focus:outline-none focus:border-brand-orange text-xs"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Shopee Card */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <span className="text-lg font-black text-[#EE4D2D] flex items-center gap-2">
                            Shopee API
                        </span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Ativo (Produção)
                        </span>
                    </div>

                    <div className="space-y-3 text-xs">
                        <div className="space-y-1">
                            <span className="text-gray-400 font-bold uppercase block">URL de Notificação (Webhook)</span>
                            <code className="bg-[#121215] text-brand-orange p-2 rounded-lg block overflow-x-auto text-[10px]">
                                http://sua-url-online.com/api/webhooks/shopee
                            </code>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <span className="text-gray-400 font-bold uppercase">Shop ID</span>
                                <input
                                    type="text" value={shopeeShopId} onChange={e => setShopeeShopId(e.target.value)}
                                    placeholder="Ex: 99887766..."
                                    className="w-full bg-brand-darkBg border border-brand-borderBg text-white rounded-lg p-2.5 focus:outline-none focus:border-brand-orange text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <span className="text-gray-400 font-bold uppercase">API Secret Key</span>
                                <input
                                    type="password" value={shopeeApiKey} onChange={e => setShopeeApiKey(e.target.value)}
                                    placeholder="••••••••••••"
                                    className="w-full bg-brand-darkBg border border-brand-borderBg text-white rounded-lg p-2.5 focus:outline-none focus:border-brand-orange text-xs"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Site Próprio Card */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <span className="text-lg font-black text-[#0088FF] flex items-center gap-2">
                            Site Próprio API
                        </span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Ativo (Produção)
                        </span>
                    </div>

                    <div className="space-y-3 text-xs">
                        <div className="space-y-1">
                            <span className="text-gray-400 font-bold uppercase block">URL de Notificação (Webhook)</span>
                            <code className="bg-[#121215] text-brand-orange p-2 rounded-lg block overflow-x-auto text-[10px]">
                                http://sua-url-online.com/api/webhooks/site
                            </code>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <span className="text-gray-400 font-bold uppercase">API Key / Token</span>
                                <input
                                    type="text" value={siteApiKey} onChange={e => setSiteApiKey(e.target.value)}
                                    placeholder="Ex: wp_oauth_..."
                                    className="w-full bg-brand-darkBg border border-brand-borderBg text-white rounded-lg p-2.5 focus:outline-none focus:border-brand-orange text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <span className="text-gray-400 font-bold uppercase">API Secret / Hash</span>
                                <input
                                    type="password" value={siteApiSecret} onChange={e => setSiteApiSecret(e.target.value)}
                                    placeholder="••••••••••••"
                                    className="w-full bg-brand-darkBg border border-brand-borderBg text-white rounded-lg p-2.5 focus:outline-none focus:border-brand-orange text-xs"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSaveCredentials}
                    className="bg-white/5 border border-brand-orange/30 text-white font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider hover:bg-brand-orange hover:text-black transition-all flex items-center gap-2"
                >
                    <Shield className="w-4 h-4" />
                    Salvar Chaves e Configurações de Produção
                </button>
            </div>

            {/* 2. Simulador e Console de Logs */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Simulador Form */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
                    <h4 className="font-extrabold text-white text-lg flex items-center gap-2 border-b border-white/5 pb-3">
                        <Send className="text-brand-orange w-5 h-5" />
                        Disparar Webhook Falso
                    </h4>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Canal Emissor</label>
                            <div className="flex bg-[#121215] p-1 rounded-xl border border-white/5 gap-1">
                                <button
                                    onClick={() => setProvider('mercadolivre')}
                                    className={`flex-1 py-2 px-2 rounded-lg font-bold text-[10px] uppercase transition-all ${provider === 'mercadolivre' ? 'bg-brand-orange text-black' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Mercado Livre
                                </button>
                                <button
                                    onClick={() => setProvider('shopee')}
                                    className={`flex-1 py-2 px-2 rounded-lg font-bold text-[10px] uppercase transition-all ${provider === 'shopee' ? 'bg-brand-orange text-black' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Shopee
                                </button>
                                <button
                                    onClick={() => setProvider('site')}
                                    className={`flex-1 py-2 px-2 rounded-lg font-bold text-[10px] uppercase transition-all ${provider === 'site' ? 'bg-brand-orange text-black' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Site Próprio
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Payload Simulado (JSON)</label>
                            <textarea
                                value={payloadStr}
                                onChange={e => setPayloadStr(e.target.value)}
                                rows={8}
                                className="w-full bg-[#121215] text-emerald-400 font-mono text-[11px] rounded-xl p-3 border border-white/5 focus:outline-none focus:border-brand-orange"
                            />
                        </div>

                        <button
                            onClick={handleFireWebhook}
                            className="w-full btn-gradient font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider text-black flex items-center justify-center gap-2"
                        >
                            🚀 Disparar Webhook
                        </button>
                    </div>
                </div>

                {/* Console Log Terminal */}
                <div className="xl:col-span-2 glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <h4 className="font-extrabold text-white text-lg flex items-center gap-2">
                            <Terminal className="text-brand-orange w-5 h-5" />
                            Console de Integração em Tempo Real
                        </h4>
                        
                        <div className="flex items-center gap-2">
                            {onWebhookTriggered && (
                                <button
                                    onClick={onWebhookTriggered}
                                    title="Sincronizar"
                                    className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white border border-white/5"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={onClearLogs}
                                title="Limpar Logs"
                                className="p-2 bg-white/5 rounded-lg text-rose-400 hover:text-rose-300 border border-white/5"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Terminal Console View */}
                    <div className="flex-1 bg-[#09090c] font-mono text-xs p-4 rounded-xl border border-white/5 h-80 overflow-y-auto mt-4 space-y-2 select-text">
                        {integrationLogs.length === 0 ? (
                            <p className="text-gray-500 italic">[Sem logs de integração. Dispare um webhook de teste para ver o fluxo em execução.]</p>
                        ) : (
                            integrationLogs.map(log => {
                                let colorClass = 'text-gray-400';
                                if (log.type === 'success') colorClass = 'text-emerald-400';
                                if (log.type === 'warning') colorClass = 'text-amber-400';
                                if (log.type === 'error') colorClass = 'text-rose-500';

                                return (
                                    <div key={log.id} className="flex gap-2 items-start leading-5 border-b border-white/5 pb-1 last:border-0">
                                        <span className="text-gray-600">[{log.timestamp}]</span>
                                        <span className={colorClass}>{log.message}</span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
