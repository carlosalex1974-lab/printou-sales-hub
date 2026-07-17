import React, { useState } from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';

export default function ProductCatalogView({ products, setProducts, calculateCost, filaments = [] }) {
    const [isAdding, setIsAdding] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: '',
        type: '3d', // '3d' ou 'resale'
        weight: '',
        printTime: '',
        filamentCost: '95.00',
        machineHourCost: '2.00',
        finishingCost: '2.00',
        packagingCost: '2.50',
        failRate: '10',
        acquisitionCost: '',
        filamentId: filaments[0]?.id || ''
    });

    const handleSaveProduct = (e) => {
        e.preventDefault();
        const prod = {
            id: 'p' + (products.length + 1) + Date.now().toString().slice(-2),
            name: newProduct.name,
            type: newProduct.type,
            weight: newProduct.type === '3d' ? parseFloat(newProduct.weight) : 0,
            printTime: newProduct.type === '3d' ? parseFloat(newProduct.printTime) : 0,
            filamentCost: newProduct.type === '3d' ? parseFloat(newProduct.filamentCost) : 0,
            machineHourCost: newProduct.type === '3d' ? parseFloat(newProduct.machineHourCost) : 0,
            finishingCost: newProduct.type === '3d' ? parseFloat(newProduct.finishingCost) : 0,
            packagingCost: newProduct.type === '3d' ? parseFloat(newProduct.packagingCost) : 0,
            failRate: newProduct.type === '3d' ? parseFloat(newProduct.failRate) || 0 : 0,
            acquisitionCost: newProduct.type === 'resale' ? parseFloat(newProduct.acquisitionCost) : 0,
            filamentId: newProduct.type === '3d' ? newProduct.filamentId : undefined
        };

        setProducts([...products, prod]);
        setIsAdding(false);
        setNewProduct({
            name: '',
            type: '3d',
            weight: '',
            printTime: '',
            filamentCost: '95.00',
            machineHourCost: '2.00',
            finishingCost: '2.00',
            packagingCost: '2.50',
            failRate: '10',
            acquisitionCost: '',
            filamentId: filaments[0]?.id || ''
        });
    };

    const handleDeleteProduct = (id) => {
        if (confirm("Atenção: Vendas vinculadas a este produto perderão as referências. Confirmar exclusão?")) {
            setProducts(products.filter(p => p.id !== id));
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header da Aba */}
            <div className="flex justify-between items-center border-b border-brand-borderBg pb-4">
                <div>
                    <span className="text-xs font-bold tracking-widest text-brand-orange uppercase">Engenharia de Produto</span>
                    <h3 className="font-black text-2xl text-gradient">Produtos & Custos</h3>
                </div>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-brand-orange/10 border border-brand-orange/40 hover:bg-brand-orange/20 text-brand-orange px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
                >
                    {isAdding ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {isAdding ? "Fechar Painel" : "Cadastrar Novo Item"}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSaveProduct} className="glass-panel border border-white/15 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-4 gap-5 animate-fade-in shadow-2xl">
                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Nome Comercial do Item</label>
                        <input 
                            type="text" 
                            required
                            placeholder="Ex: Filamento PLA Azul 1kg ou Groot 15cm"
                            value={newProduct.name}
                            onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                            className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange transition-all placeholder-gray-600"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Categoria de Custos</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                type="button"
                                onClick={() => setNewProduct({...newProduct, type: '3d'})}
                                className={`py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${newProduct.type === '3d' ? 'bg-brand-orange/20 border-brand-orange text-white' : 'bg-[#16161A] border-brand-borderBg text-gray-400'}`}
                            >
                                Peça Impressa 3D
                            </button>
                            <button 
                                type="button"
                                onClick={() => setNewProduct({...newProduct, type: 'resale'})}
                                className={`py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${newProduct.type === 'resale' ? 'bg-brand-orange/20 border-brand-orange text-white' : 'bg-[#16161A] border-brand-borderBg text-gray-400'}`}
                            >
                                Revenda Direta
                            </button>
                        </div>
                    </div>

                    {newProduct.type === '3d' ? (
                        <>
                            <div>
                                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Peso da Peça (g)</label>
                                <input 
                                    type="number" required placeholder="Gramas no Fatiador"
                                    value={newProduct.weight}
                                    onChange={e => setNewProduct({...newProduct, weight: e.target.value})}
                                    className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Tempo Impressão (h)</label>
                                <input 
                                    type="number" step="0.1" required placeholder="Horas totais"
                                    value={newProduct.printTime}
                                    onChange={e => setNewProduct({...newProduct, printTime: e.target.value})}
                                    className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Filamento Insumo</label>
                                <select 
                                    value={newProduct.filamentId}
                                    onChange={e => setNewProduct({...newProduct, filamentId: e.target.value})}
                                    className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange cursor-pointer"
                                >
                                    <option value="">Selecione...</option>
                                    {filaments.map(fil => (
                                        <option key={fil.id} value={fil.id}>{fil.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Custo Filamento (R$/kg)</label>
                                <input 
                                    type="number" value={newProduct.filamentCost}
                                    onChange={e => setNewProduct({...newProduct, filamentCost: e.target.value})}
                                    className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Custo de Hora/Máquina</label>
                                <input 
                                    type="number" value={newProduct.machineHourCost}
                                    onChange={e => setNewProduct({...newProduct, machineHourCost: e.target.value})}
                                    className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Acabamento/Insumo</label>
                                <input 
                                    type="number" value={newProduct.finishingCost}
                                    onChange={e => setNewProduct({...newProduct, finishingCost: e.target.value})}
                                    className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Embalagem de Envio</label>
                                <input 
                                    type="number" value={newProduct.packagingCost}
                                    onChange={e => setNewProduct({...newProduct, packagingCost: e.target.value})}
                                    className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Taxa de Perda/Falha (%)</label>
                                <input 
                                    type="number" value={newProduct.failRate}
                                    onChange={e => setNewProduct({...newProduct, failRate: e.target.value})}
                                    className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                                />
                            </div>
                        </>
                    ) : (
                        <div>
                            <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Preço de Compra (R$)</label>
                            <input 
                                type="number" step="0.01" required placeholder="0.00"
                                value={newProduct.acquisitionCost}
                                onChange={e => setNewProduct({...newProduct, acquisitionCost: e.target.value})}
                                className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                            />
                        </div>
                    )}

                    <button 
                        type="submit"
                        className="md:col-span-4 btn-gradient py-3.5 rounded-xl font-extrabold text-black uppercase tracking-widest text-xs md:text-sm"
                    >
                        Registrar no Catálogo
                    </button>
                </form>
            )}

            {/* Catálogo Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {products.map(prod => {
                    const cost = calculateCost(prod);
                    const isResale = prod.type === 'resale';

                    // Detalhes das proporções de custo
                    const rawPlasticCost = isResale ? 0 : (prod.weight * prod.filamentCost) / 1000;
                    const rawMachineCost = isResale ? 0 : prod.printTime * prod.machineHourCost;
                    const failCostValue = isResale ? 0 : (rawPlasticCost + rawMachineCost) * ((prod.failRate || 0) / 100);
                    const extrasCost = isResale ? 0 : prod.finishingCost + prod.packagingCost;

                    const totalParts = isResale ? cost : (rawPlasticCost + rawMachineCost + failCostValue + extrasCost);
                    const plasticPct = !isResale && totalParts > 0 ? (rawPlasticCost / totalParts) * 100 : 0;
                    const machinePct = !isResale && totalParts > 0 ? (rawMachineCost / totalParts) * 100 : 0;
                    const failPct = !isResale && totalParts > 0 ? (failCostValue / totalParts) * 100 : 0;
                    const extrasPct = !isResale && totalParts > 0 ? (extrasCost / totalParts) * 100 : 0;

                    const linkedFilament = !isResale && filaments.find(f => f.id === prod.filamentId);

                    return (
                        <div key={prod.id} className="glass-panel rounded-2xl p-5 hover:border-brand-orange/45 transition-all duration-300 relative overflow-hidden flex flex-col md:flex-row gap-5 border border-white/5 shadow-lg">
                            {prod.isPendingConfig && (
                                <div className="absolute top-3 right-3 bg-rose-600 text-white text-[9px] font-black px-2.5 py-1 rounded-md animate-pulse z-10 uppercase tracking-widest">
                                    Ajustar Custos
                                </div>
                            )}

                            {/* Lado Esquerdo: Imagem + Categorias principais */}
                            <div className="w-full md:w-36 flex flex-col items-center justify-between gap-3 text-center border-b md:border-b-0 md:border-r border-white/5 pb-4 md:pb-0 md:pr-5">
                                {prod.image ? (
                                    <img src={prod.image} className="w-24 h-24 md:w-28 md:h-28 rounded-xl object-cover border border-white/10 shadow" alt={prod.name} />
                                ) : (
                                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-xs font-bold text-gray-500">
                                        Sem Foto
                                    </div>
                                )}

                                <div>
                                    <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${isResale ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25' : 'bg-brand-orange/15 text-brand-orange border border-brand-orange/25'}`}>
                                        {isResale ? 'Revenda' : 'Impressão 3D'}
                                    </span>
                                </div>
                            </div>

                            {/* Lado Direito: Informações Fatais limpas */}
                            <div className="flex-1 flex flex-col justify-between gap-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-extrabold text-white text-lg tracking-tight line-clamp-1">{prod.name}</h4>
                                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Código SKU: {prod.id}</span>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteProduct(prod.id)}
                                        className="p-1.5 hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 rounded-lg transition-all"
                                        title="Excluir produto"
                                    >
                                        <Trash2 className="w-4.5 h-4.5" />
                                    </button>
                                </div>

                                {prod.isPendingConfig ? (
                                    <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl flex items-center justify-between">
                                        <span className="text-xs text-rose-400 font-medium">⚠️ Cadastro provisório pendente de ajustes</span>
                                        <button 
                                            onClick={() => {
                                                const newName = prompt("Confirme o nome do produto:", prod.name);
                                                if (!newName) return;
                                                if (prod.type === '3d') {
                                                    const weight = parseFloat(prompt("Digite o peso em gramas (g):", "100")) || 0;
                                                    const printTime = parseFloat(prompt("Digite o tempo de impressão em horas (h):", "5")) || 0;
                                                    const filId = prompt(`Selecione o Filamento por ID:\n${filaments.map(f => `${f.id}: ${f.name}`).join('\n')}`, prod.filamentId || filaments[0]?.id || '');
                                                    setProducts(products.map(p => p.id === prod.id ? { ...p, name: newName, weight, printTime, filamentId: filId, isPendingConfig: false } : p));
                                                } else {
                                                    const acq = parseFloat(prompt("Digite o custo de aquisição (R$):", "50")) || 0;
                                                    setProducts(products.map(p => p.id === prod.id ? { ...p, name: newName, acquisitionCost: acq, isPendingConfig: false } : p));
                                                }
                                            }}
                                            className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider"
                                        >
                                            Ajustar Ficha
                                        </button>
                                    </div>
                                ) : (
                                    /* Métricas Gerais de Custos */
                                    <div className="grid grid-cols-3 gap-4 border-y border-white/5 py-3">
                                        <div>
                                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block mb-0.5">{isResale ? "Método" : "Material"}</span>
                                            <span className="text-sm font-bold text-white">{isResale ? "Compra Direta" : `${prod.weight}g`}</span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block mb-0.5">{isResale ? "Tipo" : "Tempo"}</span>
                                            <span className="text-sm font-bold text-white">{isResale ? "Pronto" : `${prod.printTime}h`}</span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] text-brand-orange font-bold uppercase tracking-wider block mb-0.5">Preço Custo</span>
                                            <span className="text-sm font-extrabold text-brand-orange">R$ {cost.toFixed(2)}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Barra de composição bem discreta */}
                                {!isResale && !prod.isPendingConfig && (
                                    <div className="space-y-2">
                                        {linkedFilament && (
                                            <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                                <span>Filamento:</span>
                                                <span className="w-2.5 h-2.5 rounded-full border border-white/10" style={{ backgroundColor: linkedFilament.colorHex }}></span>
                                                <strong className="text-white font-bold">{linkedFilament.name}</strong>
                                            </div>
                                        )}
                                        <div className="space-y-1">
                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex">
                                                <div className="h-full bg-blue-500" style={{ width: `${plasticPct}%` }} title={`Plástico: ${plasticPct.toFixed(0)}%`}></div>
                                                <div className="h-full bg-purple-500" style={{ width: `${machinePct}%` }} title={`Máquina: ${machinePct.toFixed(0)}%`}></div>
                                                <div className="h-full bg-rose-500" style={{ width: `${failPct}%` }} title={`Perda: ${failPct.toFixed(0)}%`}></div>
                                                <div className="h-full bg-yellow-500" style={{ width: `${extrasPct}%` }} title={`Extras: ${extrasPct.toFixed(0)}%`}></div>
                                            </div>
                                            <div className="flex justify-between text-[9px] text-gray-500 font-medium">
                                                <span>Plástico ({plasticPct.toFixed(0)}%)</span>
                                                <span>Máquina ({machinePct.toFixed(0)}%)</span>
                                                <span>Falha ({prod.failRate}%)</span>
                                                <span>Extras ({extrasPct.toFixed(0)}%)</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Sugestão de Preço Venda */}
                                <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 text-xs">
                                    <span className="text-gray-400 font-medium">Sugestão de Preço (Markup {isResale ? '1.8x' : '3x'}):</span>
                                    <strong className="text-emerald-400 text-sm font-black">R$ {(cost * (isResale ? 1.8 : 3)).toFixed(2)}</strong>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
