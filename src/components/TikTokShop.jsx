import React, { useState, useEffect } from 'react';
import { ShoppingBag, CheckCircle2, AlertTriangle, Settings, RefreshCw, Smartphone } from 'lucide-react';

export default function TikTokShopView() {
    const [shopifyProducts, setShopifyProducts] = useState([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [activeTab, setActiveTab] = useState('catalog');
    
    const [config, setConfig] = useState({
        appKey: '',
        appSecret: '',
        status: 'Não Sincronizado'
    });
    
    const [isSavingConfig, setIsSavingConfig] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const showMessage = (msg, isError = false) => {
        if (isError) {
            setErrorMessage(msg);
            setTimeout(() => setErrorMessage(''), 4000);
        } else {
            setSuccessMessage(msg);
            setTimeout(() => setSuccessMessage(''), 4000);
        }
    };

    const loadData = async () => {
        setIsLoadingProducts(true);
        try {
            const response = await fetch('/api/data');
            if (response.ok) {
                const data = await response.json();
                
                // Carrega produtos do banco local
                const allProducts = data.products || [];
                // Por padrão exibe todos para enviar pro TikTok (simulação de catálogo)
                setShopifyProducts(allProducts.map(p => ({
                    ...p,
                    tiktokPublished: p.tiktokPublished || false
                })));

                // Carrega configurações
                if (data.credentials && data.credentials.tiktok) {
                    setConfig({
                        appKey: data.credentials.tiktok.appKey || '',
                        appSecret: data.credentials.tiktok.appSecret || '',
                        status: data.credentials.tiktok.status || 'Não Sincronizado'
                    });
                }
            }
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            showMessage("Erro ao carregar catálogo. Tente novamente.", true);
        } finally {
            setIsLoadingProducts(false);
        }
    };

    const handleSyncShopify = () => {
        loadData();
        showMessage("Sincronização com o sistema concluída!");
    };

    const handleSaveConfig = async (e) => {
        e.preventDefault();
        setIsSavingConfig(true);
        try {
            const currentDataResponse = await fetch('/api/data');
            const currentData = await currentDataResponse.json();
            
            const updatedCredentials = {
                ...currentData.credentials,
                tiktok: {
                    ...(currentData.credentials?.tiktok || {}),
                    appKey: config.appKey,
                    appSecret: config.appSecret,
                    status: (config.appKey && config.appSecret) ? 'Autorizado' : 'Não Sincronizado'
                }
            };
            
            const response = await fetch('/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credentials: updatedCredentials })
            });

            if (response.ok) {
                setConfig(prev => ({ ...prev, status: (config.appKey && config.appSecret) ? 'Autorizado' : 'Não Sincronizado' }));
                showMessage("Configurações do TikTok salvas com sucesso!");
            } else {
                showMessage("Erro ao salvar configurações do TikTok.", true);
            }
        } catch (e) {
            showMessage("Erro de conexão ao salvar configurações.", true);
        } finally {
            setIsSavingConfig(false);
        }
    };

    const handlePublishToTikTok = async (productId) => {
        if (!config.appKey || !config.appSecret) {
            showMessage("Configure a sua App Key e App Secret na aba de Configurações primeiro!", true);
            return;
        }

        try {
            // Simulação de envio para API do TikTok
            const currentDataResponse = await fetch('/api/data');
            const currentData = await currentDataResponse.json();
            
            const updatedProducts = currentData.products.map(p => {
                if (p.id === productId) {
                    return { ...p, tiktokPublished: true };
                }
                return p;
            });
            
            await fetch('/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ products: updatedProducts })
            });

            setShopifyProducts(prev => prev.map(p => p.id === productId ? { ...p, tiktokPublished: true } : p));
            showMessage("Produto publicado no TikTok Shop!");
        } catch (error) {
            showMessage("Falha ao publicar produto.", true);
        }
    };

    const handleRemoveFromTikTok = async (productId) => {
        try {
            const currentDataResponse = await fetch('/api/data');
            const currentData = await currentDataResponse.json();
            
            const updatedProducts = currentData.products.map(p => {
                if (p.id === productId) {
                    return { ...p, tiktokPublished: false };
                }
                return p;
            });
            
            await fetch('/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ products: updatedProducts })
            });

            setShopifyProducts(prev => prev.map(p => p.id === productId ? { ...p, tiktokPublished: false } : p));
            showMessage("Anúncio removido do TikTok Shop.");
        } catch (error) {
            showMessage("Falha ao remover produto.", true);
        }
    };

    // Estatísticas calculadas
    const publishedCount = shopifyProducts.filter(p => p.tiktokPublished).length;

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
                <div className="fixed bottom-4 right-4 bg-[#fe0979]/90 backdrop-blur text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-bounce">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="text-sm font-bold">{errorMessage}</span>
                </div>
            )}

            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <span className="text-xs font-bold tracking-widest text-[#fe0979] uppercase">Canal TikTok</span>
                    <h3 className="font-black text-2xl text-gradient">Agente Comercial TikTok Shop</h3>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleSyncShopify}
                        disabled={isLoadingProducts}
                        className="bg-[#16161A] border border-[#fe0979]/30 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-[#fe0979]/10 transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoadingProducts ? 'animate-spin' : ''}`} />
                        Sincronizar Catálogo
                    </button>
                </div>
            </div>

            {/* Cards de Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="p-3 bg-[#fe0979]/10 text-[#fe0979] rounded-xl">
                        <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest">Itens no Catálogo</span>
                        <h4 className="text-2xl font-black text-white">{shopifyProducts.length} itens</h4>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="p-3 bg-[#00f2fe]/10 text-[#00f2fe] rounded-xl">
                        <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest">Publicados TikTok</span>
                        <h4 className="text-2xl font-black text-white">{publishedCount} anúncios</h4>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                        <Settings className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest">Status Conexão</span>
                        <h4 className={`text-sm font-black uppercase ${config.status === 'Autorizado' ? 'text-emerald-400' : 'text-gray-500'}`}>
                            {config.status}
                        </h4>
                    </div>
                </div>
            </div>

            {/* Seletor de Abas */}
            <div className="flex border-b border-brand-borderBg gap-2">
                <button
                    onClick={() => setActiveTab('catalog')}
                    className={`pb-3 px-4 text-sm font-black uppercase tracking-wider transition-all border-b-2 ${activeTab === 'catalog' ? 'border-[#fe0979] text-white' : 'border-transparent text-gray-500 hover:text-white'}`}
                >
                    Catálogo de Produtos ({shopifyProducts.length})
                </button>
                <button
                    onClick={() => setActiveTab('config')}
                    className={`pb-3 px-4 text-sm font-black uppercase tracking-wider transition-all border-b-2 ${activeTab === 'config' ? 'border-[#fe0979] text-white' : 'border-transparent text-gray-500 hover:text-white'}`}
                >
                    Configurações do TikTok
                </button>
            </div>

            {/* ABA: CATÁLOGO */}
            {activeTab === 'catalog' && (
                <div className="space-y-6">
                    {shopifyProducts.length === 0 ? (
                        <div className="glass-panel p-12 text-center rounded-2xl border border-white/5 space-y-4">
                            <ShoppingBag className="w-12 h-12 mx-auto text-gray-600" />
                            <div>
                                <h4 className="text-lg font-bold text-white">Nenhum produto cadastrado no sistema</h4>
                                <p className="text-sm text-gray-500 max-w-md mx-auto mt-1">
                                    Adicione produtos no painel principal primeiro para enviá-los ao TikTok Shop.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {shopifyProducts.map(product => (
                                <div key={product.id} className="glass-panel rounded-2xl border border-white/5 overflow-hidden flex flex-col group hover:border-[#fe0979]/30 transition-all">
                                    <div className="relative h-48 bg-[#16161A] flex items-center justify-center p-4">
                                        {product.tiktokPublished && (
                                            <div className="absolute top-3 right-3 bg-[#fe0979] text-white text-[9px] font-black uppercase px-2 py-1 rounded-md flex items-center gap-1 shadow-lg">
                                                <CheckCircle2 className="w-3 h-3" />
                                                Publicado no TikTok
                                            </div>
                                        )}
                                        {product.imageUrl ? (
                                            <img src={product.imageUrl} alt={product.name} className="max-h-full object-contain rounded-lg group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <ShoppingBag className="w-12 h-12 text-gray-700" />
                                        )}
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <h5 className="text-sm font-bold text-white mb-1 line-clamp-2">{product.name}</h5>
                                        <p className="text-[10px] text-gray-500 font-mono mb-4 uppercase">SKU: {product.sku || product.id}</p>
                                        
                                        <div className="mt-auto flex justify-between items-end mb-4">
                                            <div>
                                                <span className="text-[10px] font-extrabold text-gray-500 uppercase block">Preço de Venda</span>
                                                <span className="text-base font-black text-white">
                                                    R$ {product.price ? product.price.toFixed(2) : '0.00'}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-extrabold text-gray-500 uppercase block">Estoque</span>
                                                <span className={`text-sm font-bold ${product.stock > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {product.stock || 0} un
                                                </span>
                                            </div>
                                        </div>

                                        {product.tiktokPublished ? (
                                            <div className="flex gap-2">
                                                <button 
                                                    className="flex-1 bg-[#16161A] text-emerald-400 border border-emerald-500/30 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex justify-center items-center gap-2 cursor-default"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Sincronizado
                                                </button>
                                                <button 
                                                    onClick={() => handleRemoveFromTikTok(product.id)}
                                                    className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all border border-rose-500/30"
                                                    title="Remover do TikTok"
                                                >
                                                    <AlertTriangle className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => handlePublishToTikTok(product.id)}
                                                className="w-full bg-[#fe0979] hover:bg-[#fe0979]/80 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                                            >
                                                Publicar no TikTok Shop
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ABA: CONFIGURAÇÕES */}
            {activeTab === 'config' && (
                <div className="max-w-2xl glass-panel p-8 rounded-2xl border border-white/5">
                    <div className="mb-6">
                        <h4 className="font-extrabold text-white text-base">Credenciais da API do TikTok Shop</h4>
                        <p className="text-xs text-gray-500 mt-1">Insira as credenciais do seu aplicativo TikTok Seller para habilitar integrações automáticas.</p>
                    </div>

                    <form onSubmit={handleSaveConfig} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">App Key (Chave do Aplicativo)</label>
                            <input 
                                type="text"
                                value={config.appKey}
                                onChange={e => setConfig({ ...config, appKey: e.target.value })}
                                placeholder="Insira a App Key gerada no painel de desenvolvedor do TikTok..."
                                className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-[#fe0979] text-xs font-mono"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">App Secret (Segredo do Aplicativo)</label>
                            <input 
                                type="password"
                                value={config.appSecret}
                                onChange={e => setConfig({ ...config, appSecret: e.target.value })}
                                placeholder="Insira o App Secret do aplicativo..."
                                className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-[#fe0979] text-xs font-mono"
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={isSavingConfig}
                            className="bg-gradient-to-r from-[#fe0979] to-[#00f2fe] w-full py-3 rounded-xl text-white font-bold uppercase tracking-wider text-xs shadow-[0_0_15px_rgba(254,9,121,0.3)] hover:shadow-[0_0_25px_rgba(254,9,121,0.5)] transition-all"
                        >
                            {isSavingConfig ? 'Gravando dados...' : 'Salvar Configurações TikTok'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
