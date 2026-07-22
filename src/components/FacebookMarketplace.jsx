import React, { useState, useEffect } from 'react';
import { RefreshCw, Send, CheckCircle2, MessageSquare, ShoppingBag, Settings, AlertTriangle, ExternalLink, Bot } from 'lucide-react';

export default function FacebookMarketplace() {
    const [activeTab, setActiveTab] = useState('catalog'); // 'catalog', 'messages', 'config'
    const [shopifyProducts, setShopifyProducts] = useState([]);
    const [messages, setMessages] = useState([]);
    const [config, setConfig] = useState({
        accessToken: '',
        pageId: '1117637594770324',
        businessId: '1550133536629313',
        catalogId: '',
        status: 'Não Sincronizado'
    });

    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSavingConfig, setIsSavingConfig] = useState(false);
    const [publishingId, setPublishingId] = useState(null);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        fetchConfig();
        fetchProducts();
        fetchMessages();
    }, []);

    const showMessage = (msg, isError = false) => {
        if (isError) {
            setErrorMessage(msg);
            setTimeout(() => setErrorMessage(''), 5000);
        } else {
            setSuccessMessage(msg);
            setTimeout(() => setSuccessMessage(''), 5000);
        }
    };

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/facebook/config');
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchProducts = async () => {
        setIsLoadingProducts(true);
        try {
            const res = await fetch('/api/facebook/products');
            if (res.ok) {
                const data = await res.json();
                setShopifyProducts(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingProducts(false);
        }
    };

    const fetchMessages = async () => {
        setIsLoadingMessages(true);
        try {
            const res = await fetch('/api/facebook/messages');
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
                if (data.length > 0 && !selectedMessage) {
                    setSelectedMessage(data[0]);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingMessages(false);
        }
    };

    const handleSaveConfig = async (e) => {
        e.preventDefault();
        setIsSavingConfig(true);
        try {
            const res = await fetch('/api/facebook/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            if (res.ok) {
                const r = await res.json();
                setConfig(r.config);
                showMessage("Configurações do Meta integradas com sucesso!");
            } else {
                showMessage("Erro ao salvar configurações.", true);
            }
        } catch (e) {
            showMessage(e.message, true);
        } finally {
            setIsSavingConfig(false);
        }
    };

    const handleSyncShopify = async () => {
        setIsLoadingProducts(true);
        try {
            const res = await fetch('/api/facebook/sync-shopify', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                showMessage(`Sincronização concluída! ${data.imported} novos produtos importados do Shopify.`);
                fetchProducts();
            } else {
                showMessage(data.error || "Erro ao conectar com o Shopify.", true);
            }
        } catch (e) {
            showMessage(e.message, true);
        } finally {
            setIsLoadingProducts(false);
        }
    };

    const handlePublishProduct = async (id) => {
        setPublishingId(id);
        try {
            const res = await fetch('/api/facebook/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: id })
            });
            const data = await res.json();
            if (res.ok) {
                showMessage(data.message || "Anúncio publicado com sucesso!");
                fetchProducts();
                fetchMessages(); // Atualiza para carregar mensagens simuladas se houver
            } else {
                showMessage(data.error || "Erro ao publicar no Facebook.", true);
            }
        } catch (e) {
            showMessage(e.message, true);
        } finally {
            setPublishingId(null);
        }
    };

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!selectedMessage || !replyText.trim()) return;

        try {
            const res = await fetch('/api/facebook/messages/reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messageId: selectedMessage.id, replyText })
            });
            if (res.ok) {
                showMessage("Resposta enviada com sucesso!");
                setReplyText('');
                fetchMessages();
                setSelectedMessage(prev => prev ? { ...prev, replied: true, replyText } : null);
            } else {
                showMessage("Erro ao enviar resposta.", true);
            }
        } catch (e) {
            showMessage(e.message, true);
        }
    };

    const generateAIReply = () => {
        if (!selectedMessage) return;
        const text = `Olá! 😊 Sim, está disponível! Você pode finalizar sua compra com frete grátis ou descontos exclusivos direto no nosso site oficial:\n\n🔗 ${selectedMessage.productUrl}\n\nEnviamos para todo o Brasil. Qualquer dúvida, estou por aqui!`;
        setReplyText(text);
    };

    // Estatísticas calculadas
    const publishedCount = shopifyProducts.filter(p => p.facebookPublished).length;
    const pendingQuestions = messages.filter(m => !m.replied).length;

    return (
        <div className="space-y-8">
            {/* Notificações e Alertas flutuantes */}
            {successMessage && (
                <div className="fixed bottom-4 right-4 bg-emerald-500/90 backdrop-blur text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-bounce">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-bold">{successMessage}</span>
                </div>
            )}
            {errorMessage && (
                <div className="fixed bottom-4 right-4 bg-rose-500/90 backdrop-blur text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-bounce">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="text-sm font-bold">{errorMessage}</span>
                </div>
            )}

            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <span className="text-xs font-bold tracking-widest text-brand-orange uppercase">Canal Facebook</span>
                    <h3 className="font-black text-2xl text-gradient">Agente Comercial Facebook Marketplace</h3>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleSyncShopify}
                        disabled={isLoadingProducts}
                        className="bg-[#16161A] border border-brand-orange/30 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-brand-orange/10 transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoadingProducts ? 'animate-spin' : ''}`} />
                        Sincronizar Shopify
                    </button>
                </div>
            </div>

            {/* Cards de Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="p-3 bg-brand-orange/10 text-brand-orange rounded-xl">
                        <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest">Shopify Catálogo</span>
                        <h4 className="text-2xl font-black text-white">{shopifyProducts.length} itens</h4>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest">Publicados FB</span>
                        <h4 className="text-2xl font-black text-white">{publishedCount} anúncios</h4>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
                        <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest">Perguntas Pendentes</span>
                        <h4 className="text-2xl font-black text-white">{pendingQuestions} clientes</h4>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                        <Settings className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest">Status Conexão</span>
                        <h4 className={`text-sm font-black uppercase ${config.accessToken ? 'text-brand-yellow' : 'text-gray-500'}`}>
                            {config.accessToken ? 'Autorizado' : 'Não Sincronizado'}
                        </h4>
                    </div>
                </div>
            </div>

            {/* Seletor de Abas */}
            <div className="flex border-b border-brand-borderBg gap-2">
                <button
                    onClick={() => setActiveTab('catalog')}
                    className={`pb-3 px-4 text-sm font-black uppercase tracking-wider transition-all border-b-2 ${activeTab === 'catalog' ? 'border-brand-orange text-white' : 'border-transparent text-gray-500 hover:text-white'}`}
                >
                    Catálogo de Produtos ({shopifyProducts.length})
                </button>
                <button
                    onClick={() => setActiveTab('messages')}
                    className={`pb-3 px-4 text-sm font-black uppercase tracking-wider transition-all border-b-2 relative ${activeTab === 'messages' ? 'border-brand-orange text-white' : 'border-transparent text-gray-500 hover:text-white'}`}
                >
                    Mensagens / Respostas
                    {pendingQuestions > 0 && (
                        <span className="ml-2 bg-rose-600 text-white text-[9px] font-black rounded-full px-1.5 py-0.5 animate-pulse">
                            {pendingQuestions}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('config')}
                    className={`pb-3 px-4 text-sm font-black uppercase tracking-wider transition-all border-b-2 ${activeTab === 'config' ? 'border-brand-orange text-white' : 'border-transparent text-gray-500 hover:text-white'}`}
                >
                    Configurações do Meta
                </button>
            </div>

            {/* ABA: CATÁLOGO */}
            {activeTab === 'catalog' && (
                <div className="space-y-6">
                    {shopifyProducts.length === 0 ? (
                        <div className="glass-panel p-12 text-center rounded-2xl border border-white/5 space-y-4">
                            <ShoppingBag className="w-12 h-12 mx-auto text-gray-600" />
                            <div>
                                <h4 className="text-lg font-bold text-white">Nenhum produto sincronizado do site</h4>
                                <p className="text-sm text-gray-500 max-w-md mx-auto mt-1">
                                    Conecte suas credenciais do site nas Integrações e clique em "Sincronizar Shopify" para importar os produtos.
                                </p>
                            </div>
                            <button
                                onClick={handleSyncShopify}
                                className="btn-gradient px-6 py-2.5 rounded-xl text-black font-bold uppercase text-xs"
                            >
                                Importar do Shopify
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {shopifyProducts.map(prod => (
                                <div key={prod.id} className="glass-panel rounded-2xl overflow-hidden border border-white/5 flex flex-col justify-between group">
                                    <div className="relative">
                                        <img 
                                            src={prod.imageUrl || 'https://printoustudio3d.com/assets/no-image.png'} 
                                            alt={prod.title} 
                                            className="w-full h-48 object-cover group-hover:scale-105 transition-all duration-500"
                                        />
                                        <span className={`absolute top-3 right-3 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg ${prod.facebookPublished ? 'bg-emerald-500/95 text-white' : 'bg-amber-500/95 text-white'}`}>
                                            {prod.facebookPublished ? 'Publicado FB' : 'Pronto p/ Publicar'}
                                        </span>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                                        <div>
                                            <h4 className="font-extrabold text-white text-base tracking-tight line-clamp-2">{prod.title}</h4>
                                            <span className="text-[10px] text-gray-500 font-extrabold uppercase">SKU: {prod.id}</span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                            <div>
                                                <span className="block text-[8px] text-gray-500 font-extrabold uppercase">Preço no Site</span>
                                                <span className="text-white font-black text-sm">R$ {prod.price.toFixed(2)}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-[8px] text-gray-500 font-extrabold uppercase">Estoque</span>
                                                <span className={`text-xs font-bold ${prod.inventoryQuantity > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {prod.inventoryQuantity} un
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handlePublishProduct(prod.id)}
                                            disabled={publishingId === prod.id}
                                            className={`w-full py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 ${prod.facebookPublished ? 'bg-white/5 border border-brand-orange/30 text-white hover:bg-brand-orange/10' : 'btn-gradient text-black'}`}
                                        >
                                            {publishingId === prod.id ? (
                                                <>
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                    Publicando...
                                                </>
                                            ) : prod.facebookPublished ? (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4 text-brand-orange" />
                                                    Publicar Novamente
                                                </>
                                            ) : (
                                                'Publicar no Marketplace'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ABA: MENSAGENS */}
            {activeTab === 'messages' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[500px]">
                    {/* Lista Lateral de Conversas */}
                    <div className="glass-panel rounded-2xl border border-white/5 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-brand-borderBg bg-white/2">
                            <h4 className="font-extrabold text-white text-sm">Conversas Recentes</h4>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-brand-borderBg">
                            {messages.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 text-xs">
                                    Nenhuma mensagem no momento.
                                </div>
                            ) : (
                                messages.map(msg => (
                                    <div 
                                        key={msg.id}
                                        onClick={() => setSelectedMessage(msg)}
                                        className={`p-4 cursor-pointer transition-all hover:bg-white/5 ${selectedMessage?.id === msg.id ? 'bg-[#7C3AED]/10 border-l-4 border-[#7C3AED]' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-white text-xs">{msg.buyerName}</span>
                                            <span className="text-[9px] text-gray-500 font-bold">{msg.timestamp}</span>
                                        </div>
                                        <p className="text-gray-400 text-xs truncate">{msg.messageText}</p>
                                        <span className={`inline-block mt-2 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${msg.replied ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                            {msg.replied ? 'Respondido' : 'Pendente'}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Janela de Chat */}
                    <div className="md:col-span-2 glass-panel rounded-2xl border border-white/5 flex flex-col justify-between overflow-hidden">
                        {selectedMessage ? (
                            <>
                                <div className="p-4 border-b border-brand-borderBg bg-white/2 flex justify-between items-center">
                                    <div>
                                        <h4 className="font-extrabold text-white text-sm">{selectedMessage.buyerName}</h4>
                                        <span className="text-[10px] text-gray-500">Perguntou sobre: <strong className="text-white">{selectedMessage.productTitle}</strong></span>
                                    </div>
                                    <a 
                                        href={selectedMessage.productUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-brand-orange hover:text-white flex items-center gap-1 text-[10px] font-bold uppercase"
                                    >
                                        Ver no Site
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                </div>

                                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                                    {/* Mensagem do Comprador */}
                                    <div className="flex items-start gap-3 max-w-[80%]">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs text-white">
                                            {selectedMessage.buyerName.substring(0, 1)}
                                        </div>
                                        <div className="bg-[#1C1C22] border border-white/5 rounded-2xl p-4 text-xs text-gray-300">
                                            {selectedMessage.messageText}
                                        </div>
                                    </div>

                                    {/* Resposta do Agente */}
                                    {selectedMessage.replied && (
                                        <div className="flex items-start gap-3 max-w-[80%] ml-auto flex-row-reverse">
                                            <div className="w-8 h-8 rounded-full bg-brand-orange flex items-center justify-center font-bold text-xs text-black">
                                                IA
                                            </div>
                                            <div className="bg-brand-orange/10 border border-brand-orange/20 rounded-2xl p-4 text-xs text-white">
                                                {selectedMessage.replyText}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 border-t border-brand-borderBg bg-white/2 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] text-gray-500 font-extrabold uppercase">Escrever resposta</span>
                                        <button 
                                            onClick={generateAIReply}
                                            className="bg-brand-orange/10 hover:bg-brand-orange/20 text-brand-orange border border-brand-orange/30 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5 transition-all"
                                        >
                                            <Bot className="w-3.5 h-3.5" />
                                            Gerar com IA Kika
                                        </button>
                                    </div>
                                    <form onSubmit={handleSendReply} className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Digite a resposta ou use o botão 'Gerar com IA Kika'..."
                                            value={replyText}
                                            onChange={e => setReplyText(e.target.value)}
                                            className="flex-1 bg-[#16161A] border border-brand-borderBg text-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-brand-orange"
                                        />
                                        <button 
                                            type="submit"
                                            disabled={!replyText.trim()}
                                            className="bg-brand-orange text-black font-bold px-5 rounded-xl hover:bg-brand-orange/90 transition-all disabled:opacity-50 flex items-center justify-center"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-xs">
                                Selecione uma conversa na barra lateral.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ABA: CONFIGURAÇÕES */}
            {activeTab === 'config' && (
                <div className="max-w-2xl glass-panel p-8 rounded-2xl border border-white/5">
                    <div className="mb-6">
                        <h4 className="font-extrabold text-white text-base">Credenciais da API do Facebook (Meta)</h4>
                        <p className="text-xs text-gray-500 mt-1">Insira as credenciais do seu aplicativo Meta Business para liberar publicações de catálogo automáticas.</p>
                    </div>

                    <form onSubmit={handleSaveConfig} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">ID do Business Account</label>
                                <input 
                                    type="text"
                                    value={config.businessId}
                                    onChange={e => setConfig({ ...config, businessId: e.target.value })}
                                    className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange text-xs font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">ID da Página do Facebook</label>
                                <input 
                                    type="text"
                                    value={config.pageId}
                                    onChange={e => setConfig({ ...config, pageId: e.target.value })}
                                    className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange text-xs font-bold"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">ID do Catálogo de Comércio Meta</label>
                            <input 
                                type="text"
                                placeholder="Insira o ID do catálogo comercial do Facebook..."
                                value={config.catalogId}
                                onChange={e => setConfig({ ...config, catalogId: e.target.value })}
                                className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange text-xs font-bold"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Facebook Access Token (System User)</label>
                            <textarea 
                                placeholder="Cole seu System User Access Token do Facebook Business Suite..."
                                value={config.accessToken}
                                onChange={e => setConfig({ ...config, accessToken: e.target.value })}
                                rows={4}
                                className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange text-xs font-mono"
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={isSavingConfig}
                            className="btn-gradient w-full py-3 rounded-xl text-black font-bold uppercase tracking-wider text-xs"
                        >
                            {isSavingConfig ? 'Gravando dados...' : 'Salvar Configurações Meta'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
