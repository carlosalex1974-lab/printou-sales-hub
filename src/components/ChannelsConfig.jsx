import React, { useState } from 'react';

export default function ChannelsConfigView({ channels, setChannels }) {
    const [selectedChan, setSelectedChan] = useState(channels[0]);
    const [editedCommission, setEditedCommission] = useState(channels[0]?.commission || 0);
    const [editedFixedFee, setEditedFixedFee] = useState(channels[0]?.fixedFee || 0);
    const [editedHasThreshold, setEditedHasThreshold] = useState(channels[0]?.hasFreeShippingThreshold || false);
    const [editedThreshold, setEditedThreshold] = useState(channels[0]?.freeShippingThreshold || 0);
    const [editedDefaultSellerCost, setEditedDefaultSellerCost] = useState(channels[0]?.defaultSellerShippingCost || 0);
    const [editedDefaultBelowCost, setEditedDefaultBelowCost] = useState(channels[0]?.defaultBelowThresholdShippingCost || 0);

    const handleUpdate = (e) => {
        e.preventDefault();
        setChannels(channels.map(c => {
            if (c.id === selectedChan.id) {
                return {
                    ...c,
                    commission: parseFloat(editedCommission),
                    fixedFee: parseFloat(editedFixedFee),
                    hasFreeShippingThreshold: editedHasThreshold,
                    freeShippingThreshold: parseFloat(editedThreshold) || 0,
                    defaultSellerShippingCost: parseFloat(editedDefaultSellerCost) || 0,
                    defaultBelowThresholdShippingCost: parseFloat(editedDefaultBelowCost) || 0
                };
            }
            return c;
        }));
        alert("Tarifas e regras de frete do canal atualizadas com sucesso!");
    };

    const selectChannel = (chan) => {
        setSelectedChan(chan);
        setEditedCommission(chan.commission);
        setEditedFixedFee(chan.fixedFee);
        setEditedHasThreshold(chan.hasFreeShippingThreshold || false);
        setEditedThreshold(chan.freeShippingThreshold || 0);
        setEditedDefaultSellerCost(chan.defaultSellerShippingCost || 0);
        setEditedDefaultBelowCost(chan.defaultBelowThresholdShippingCost || 0);
    };

    return (
        <div className="glass-panel rounded-2xl p-6">
            <h3 className="font-black text-xl mb-6 text-gradient">Taxas e Regras de Frete</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Lista de Canais */}
                <div className="space-y-3">
                    {channels.map(c => (
                        <button 
                            key={c.id}
                            type="button"
                            onClick={() => selectChannel(c)}
                            className={`w-full text-left p-4 rounded-xl border flex flex-col justify-between transition-all ${selectedChan.id === c.id ? 'bg-brand-orange/10 border-brand-orange' : 'bg-[#121215] border-white/5 hover:border-brand-orange/30'}`}
                        >
                            <div className="w-full flex justify-between items-center mb-1">
                                <span className="font-bold flex items-center gap-2" style={{ color: c.color }}>
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }}></span>
                                    {c.name}
                                </span>
                                <span className="text-xs text-gray-400">{c.commission}% + R$ {c.fixedFee}</span>
                            </div>
                            {c.hasFreeShippingThreshold && (
                                <span className="text-[10px] text-gray-500 font-extrabold uppercase mt-1">
                                    Frete Grátis ≥ R$ {c.freeShippingThreshold} (Custo: R$ {c.defaultSellerShippingCost})
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Editor do Canal selecionado */}
                <form onSubmit={handleUpdate} className="lg:col-span-2 bg-[#121215] p-6 rounded-2xl border border-white/5 space-y-6">
                    <h4 className="font-extrabold text-white text-lg">
                        Configurações: <span style={{ color: selectedChan.color }}>{selectedChan.name}</span>
                    </h4>

                    {/* Tarifas de Comissão */}
                    <div className="space-y-3">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-orange">Taxas da Plataforma</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Comissão do Canal (%)</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    required
                                    value={editedCommission}
                                    onChange={e => setEditedCommission(e.target.value)}
                                    className="w-full bg-brand-darkBg border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Taxa Fixa por Venda (R$)</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    required
                                    value={editedFixedFee}
                                    onChange={e => setEditedFixedFee(e.target.value)}
                                    className="w-full bg-brand-darkBg border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Regras de Frete */}
                    <div className="space-y-4 border-t border-white/5 pt-4">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-orange block mb-2">Regras de Frete / Envio</span>
                        
                        <div className="flex items-center gap-3">
                            <input 
                                type="checkbox"
                                id="hasThreshold"
                                checked={editedHasThreshold}
                                onChange={e => setEditedHasThreshold(e.target.checked)}
                                className="w-5 h-5 rounded border-white/10 bg-brand-darkBg text-brand-orange focus:ring-brand-orange cursor-pointer"
                            />
                            <label htmlFor="hasThreshold" className="text-sm font-semibold text-white cursor-pointer select-none">
                                Este canal possui limite de Frete Grátis obrigatório
                            </label>
                        </div>

                        {editedHasThreshold && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Limite Frete Grátis (R$)</label>
                                    <input 
                                        type="number" step="0.01" required
                                        value={editedThreshold}
                                        onChange={e => setEditedThreshold(e.target.value)}
                                        className="w-full bg-brand-darkBg border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Frete Vendedor ≥ Limite (R$)</label>
                                    <input 
                                        type="number" step="0.01" required
                                        value={editedDefaultSellerCost}
                                        onChange={e => setEditedDefaultSellerCost(e.target.value)}
                                        className="w-full bg-brand-darkBg border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Frete Vendedor &lt; Limite (R$)</label>
                                    <input 
                                        type="number" step="0.01" required
                                        value={editedDefaultBelowCost}
                                        onChange={e => setEditedDefaultBelowCost(e.target.value)}
                                        className="w-full bg-brand-darkBg border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <button 
                        type="submit"
                        className="w-full btn-gradient py-3.5 rounded-xl font-bold text-black uppercase tracking-wide transition-all"
                    >
                        Salvar Configurações do Canal
                    </button>
                </form>
            </div>
        </div>
    );
}
