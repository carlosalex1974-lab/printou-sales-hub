import React, { useState, useMemo } from 'react';
import { DollarSign, Percent, Printer, ShoppingBag, Plus } from 'lucide-react';

export default function PricingSimulator({ channels, filaments, onAddProduct, setActiveTab }) {
    const [type, setType] = useState('3d');
    const [name, setName] = useState('');
    
    // Inputs para 3D
    const [weight, setWeight] = useState('100');
    const [printTime, setPrintTime] = useState('5');
    const [selectedFilamentId, setSelectedFilamentId] = useState(filaments[0]?.id || '');
    const [filamentPrice, setFilamentPrice] = useState('95.00'); // Padrão se não achar filamento
    const [machineHour, setMachineHour] = useState('2.00');
    const [failRate, setFailRate] = useState('10');
    const [finishing, setFinishing] = useState('3.00');
    const [packaging, setPackaging] = useState('2.50');

    // Inputs para Revenda
    const [acquisitionCost, setAcquisitionCost] = useState('50.00');

    // Estado da simulação customizada de preço de venda
    const [customSalePrice, setCustomSalePrice] = useState('150.00');

    // Atualiza preço do filamento quando muda o filamento selecionado
    const handleFilamentChange = (e) => {
        const fid = e.target.value;
        setSelectedFilamentId(fid);
        // Tenta achar a bobina correspondente
        const fil = filaments.find(f => f.id === fid);
        if (fil) {
            // Em uma estrutura real, buscaríamos o preço do fornecedor ou padrão. 
            // Como no nosso mock o filamento não tem preço direto, usamos valores baseados no material ou mantemos o digitado
            if (fil.name.includes('Vermelho')) setFilamentPrice('110.00');
            else if (fil.name.includes('Branco')) setFilamentPrice('85.00');
            else setFilamentPrice('95.00');
        }
    };

    // --- CÁLCULO DO CUSTO REAL ---
    const calculatedCost = useMemo(() => {
        if (type === 'resale') {
            return parseFloat(acquisitionCost) || 0;
        }
        const w = parseFloat(weight) || 0;
        const t = parseFloat(printTime) || 0;
        const fPrice = parseFloat(filamentPrice) || 0;
        const mHour = parseFloat(machineHour) || 0;
        const fRate = parseFloat(failRate) || 0;
        const fin = parseFloat(finishing) || 0;
        const pack = parseFloat(packaging) || 0;

        const filCost = (w * fPrice) / 1000;
        const machCost = t * mHour;
        const rateFactor = 1 + (fRate / 100);
        const rawCost = (filCost + machCost) * rateFactor;
        
        return parseFloat((rawCost + fin + pack).toFixed(2));
    }, [type, weight, printTime, filamentPrice, machineHour, failRate, finishing, packaging, acquisitionCost]);

    // Markups Sugeridos
    const markups = [
        { label: 'Margem Segura (2.0x)', multiplier: 2.0 },
        { label: 'Margem Média (2.5x)', multiplier: 2.5 },
        { label: 'Recomendado (3.0x)', multiplier: 3.0 },
        { label: 'Alta Lucratividade (3.5x)', multiplier: 3.5 }
    ];

    // Simulação detalhada por canal para o preço customizado
    const channelSimulations = useMemo(() => {
        const saleVal = parseFloat(customSalePrice) || 0;
        return channels.map(chan => {
            // 1. Comissão e Taxa Fixa do Canal
            const commissionFee = (saleVal * (chan.commission / 100)) + chan.fixedFee;
            
            // 2. Cálculo do Frete Dinâmico de Co-participação do Canal
            let shippingFee = 0;
            if (chan.hasFreeShippingThreshold) {
                if (saleVal >= chan.freeShippingThreshold) {
                    shippingFee = chan.defaultSellerShippingCost;
                } else {
                    shippingFee = chan.defaultBelowThresholdShippingCost;
                }
            } else {
                shippingFee = chan.defaultSellerShippingCost || 0;
            }

            // 3. Lucro Líquido
            const netProfit = saleVal - commissionFee - shippingFee - calculatedCost;
            const marginPercent = saleVal > 0 ? (netProfit / saleVal) * 100 : 0;

            return {
                ...chan,
                commissionFee,
                shippingFee,
                totalFees: commissionFee + shippingFee,
                netProfit,
                marginPercent
            };
        });
    }, [channels, customSalePrice, calculatedCost]);

    // Manipula criação do produto
    const handleSaveAsProduct = () => {
        if (!name.trim()) {
            alert('Por favor, informe o nome do produto para salvá-lo no catálogo.');
            return;
        }

        const productData = {
            id: 'p_sim_' + Date.now().toString().slice(-4),
            name: name.trim(),
            type,
            // Propriedades 3D
            weight: type === '3d' ? parseFloat(weight) || 0 : undefined,
            printTime: type === '3d' ? parseFloat(printTime) || 0 : undefined,
            filamentCost: type === '3d' ? parseFloat(filamentPrice) || 0 : undefined,
            machineHourCost: type === '3d' ? parseFloat(machineHour) || 0 : undefined,
            finishingCost: type === '3d' ? parseFloat(finishing) || 0 : undefined,
            packagingCost: type === '3d' ? parseFloat(packaging) || 0 : undefined,
            failRate: type === '3d' ? parseFloat(failRate) || 0 : undefined,
            filamentId: type === '3d' ? selectedFilamentId : undefined,
            // Propriedades Revenda
            acquisitionCost: type === 'resale' ? parseFloat(acquisitionCost) || 0 : undefined,
        };

        onAddProduct(productData);
        alert(`Produto "${name}" cadastrado com sucesso no catálogo! Redirecionando...`);
        setActiveTab('products');
    };

    return (
        <div className="space-y-8">
            <div>
                <span className="text-xs font-bold tracking-widest text-brand-orange uppercase">Engenharia Financeira</span>
                <h3 className="font-black text-2xl text-gradient">Simulador de Precificação e Orçamentos</h3>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* 1. Formulário de Custos */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
                    <h4 className="font-extrabold text-white text-lg flex items-center gap-2 border-b border-white/5 pb-3">
                        <DollarSign className="text-brand-orange w-5 h-5" />
                        Custos de Entrada
                    </h4>

                    {/* Selector de Tipo */}
                    <div className="flex bg-[#121215] p-1 rounded-xl border border-white/5">
                        <button
                            type="button"
                            onClick={() => setType('3d')}
                            className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs transition-all uppercase ${type === '3d' ? 'bg-brand-orange text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            Peça Impressa 3D
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('resale')}
                            className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs transition-all uppercase ${type === 'resale' ? 'bg-brand-orange text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            Produto Revenda
                        </button>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nome Provisório do Produto</label>
                        <input
                            type="text"
                            placeholder="Ex: Groot Porta Canetas 12cm"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-brand-darkBg border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                        />
                    </div>

                    {type === '3d' ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Peso da Peça (g)</label>
                                    <input
                                        type="number" value={weight} onChange={e => setWeight(e.target.value)}
                                        className="w-full bg-brand-darkBg border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Tempo Impressão (h)</label>
                                    <input
                                        type="number" value={printTime} onChange={e => setPrintTime(e.target.value)}
                                        className="w-full bg-brand-darkBg border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Filamento Utilizado</label>
                                <select
                                    value={selectedFilamentId} onChange={handleFilamentChange}
                                    className="w-full bg-brand-darkBg border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                >
                                    <option value="">-- Selecione do Estoque --</option>
                                    {filaments.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Preço Filamento (R$/kg)</label>
                                    <input
                                        type="number" value={filamentPrice} onChange={e => setFilamentPrice(e.target.value)}
                                        className="w-full bg-brand-darkBg border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Custo Hora Máquina (R$/h)</label>
                                    <input
                                        type="number" value={machineHour} onChange={e => setMachineHour(e.target.value)}
                                        className="w-full bg-brand-darkBg border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Perda (%)</label>
                                    <input
                                        type="number" value={failRate} onChange={e => setFailRate(e.target.value)}
                                        className="w-full bg-brand-darkBg border border-brand-borderBg text-white rounded-xl p-2 focus:outline-none focus:border-brand-orange text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Acabamento (R$)</label>
                                    <input
                                        type="number" value={finishing} onChange={e => setFinishing(e.target.value)}
                                        className="w-full bg-brand-darkBg border border-brand-borderBg text-white rounded-xl p-2 focus:outline-none focus:border-brand-orange text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Embalagem (R$)</label>
                                    <input
                                        type="number" value={packaging} onChange={e => setPackaging(e.target.value)}
                                        className="w-full bg-brand-darkBg border border-brand-borderBg text-white rounded-xl p-2 focus:outline-none focus:border-brand-orange text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Preço de Aquisição (Compra R$)</label>
                            <input
                                type="number" value={acquisitionCost} onChange={e => setAcquisitionCost(e.target.value)}
                                className="w-full bg-brand-darkBg border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                            />
                        </div>
                    )}

                    {/* Resumo do Custo Real */}
                    <div className="p-4 rounded-xl bg-brand-orange/5 border border-brand-orange/20 mt-4">
                        <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wide block">Custo Real Calculado</span>
                        <span className="text-3xl font-black text-brand-orange mt-1 block">
                            R$ {calculatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleSaveAsProduct}
                        className="w-full bg-white/5 border border-brand-orange/20 hover:bg-brand-orange hover:text-black text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Criar Produto no Catálogo
                    </button>
                </div>

                {/* 2. Resultados, Markups e Simulações por Canal */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Markups Sugeridos */}
                    <div className="glass-panel p-6 rounded-2xl border border-white/5">
                        <h4 className="font-extrabold text-white text-lg flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
                            <Percent className="text-brand-orange w-5 h-5" />
                            Preços de Venda Sugeridos (Markups)
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            {markups.map(m => {
                                const price = calculatedCost * m.multiplier;
                                const isBest = m.multiplier === 3.0;
                                return (
                                    <div key={m.label} className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${isBest ? 'bg-brand-orange/10 border-brand-orange/40 shadow-lg' : 'bg-[#121215] border-white/5'}`}>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase">{m.label}</span>
                                        <h5 className={`text-xl font-black mt-2 ${isBest ? 'text-brand-orange' : 'text-white'}`}>
                                            R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </h5>
                                        <button
                                            type="button"
                                            onClick={() => setCustomSalePrice(price.toFixed(2))}
                                            className="text-[10px] text-left text-gray-400 hover:text-white mt-4 font-extrabold uppercase underline"
                                        >
                                            Simular Este Preço
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Simulação Detalhada de Canais */}
                    <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b border-white/5 pb-3">
                            <h4 className="font-extrabold text-white text-lg flex items-center gap-2">
                                <ShoppingBag className="text-brand-orange w-5 h-5" />
                                Margem e Lucro Real Líquido por Canal
                            </h4>
                            
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-400 font-bold whitespace-nowrap uppercase">Simular Preço (R$)</span>
                                <input
                                    type="number" step="0.01" value={customSalePrice} onChange={e => setCustomSalePrice(e.target.value)}
                                    className="bg-brand-darkBg border border-brand-borderBg text-white rounded-xl px-4 py-2 text-sm font-bold w-28 focus:outline-none focus:border-brand-orange"
                                />
                            </div>
                        </div>

                        {/* Listagem de Simulação dos Canais */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {channelSimulations.map(sim => {
                                const isPositive = sim.netProfit > 0;
                                return (
                                    <div key={sim.id} className="p-5 rounded-2xl bg-[#121215] border border-white/5 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="font-black text-sm flex items-center gap-2" style={{ color: sim.color }}>
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sim.color }}></span>
                                                {sim.name}
                                            </span>
                                            <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                                Margem: {sim.marginPercent.toFixed(1)}%
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs border-y border-white/5 py-3">
                                            <div className="space-y-1">
                                                <p className="text-gray-400">Comissões/Taxas:</p>
                                                <p className="text-white font-bold">R$ {sim.commissionFee.toFixed(2)}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-gray-400">Frete Envio:</p>
                                                <p className="text-white font-bold">R$ {sim.shippingFee.toFixed(2)}</p>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center pt-1">
                                            <span className="text-xs text-gray-400">Lucro Líquido Real:</span>
                                            <span className={`text-xl font-black ${isPositive ? 'text-emerald-400' : 'text-rose-500'}`}>
                                                R$ {sim.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
