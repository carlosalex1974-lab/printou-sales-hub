import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, Package } from 'lucide-react';

export default function SearchableProductSelect({ products = [], selectedProductId, onSelect, label = "Produto Vendido" }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const selectedProduct = useMemo(() => {
        return products.find(p => p.id === selectedProductId);
    }, [products, selectedProductId]);

    // Fechar o dropdown ao clicar fora do componente
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredProducts = useMemo(() => {
        if (!searchTerm.trim()) return products;
        const term = searchTerm.toLowerCase();
        return products.filter(p => 
            (p.name && p.name.toLowerCase().includes(term)) ||
            (p.sku && p.sku.toLowerCase().includes(term)) ||
            (p.id && p.id.toLowerCase().includes(term))
        );
    }, [products, searchTerm]);

    return (
        <div className="relative" ref={containerRef}>
            {label && (
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                    {label}
                </label>
            )}

            {/* Display do Produto Selecionado / Input de Pesquisa */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="🔍 Pesquisar produto por nome ou SKU..."
                    value={isOpen ? searchTerm : (selectedProduct ? selectedProduct.name : searchTerm)}
                    onFocus={() => {
                        setIsOpen(true);
                        setSearchTerm('');
                    }}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (!isOpen) setIsOpen(true);
                    }}
                    className="w-full bg-[#16161A] border border-brand-borderBg text-white rounded-xl p-3 pr-10 focus:outline-none focus:border-brand-orange text-sm font-medium transition-all"
                />
                
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                    {isOpen ? (
                        <Search className="w-4 h-4 text-brand-orange animate-pulse" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                </div>
            </div>

            {/* Dropdown com Lista de Produtos e Pesquisa em Tempo Real */}
            {isOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-[#181820] border border-brand-orange/40 rounded-xl shadow-2xl divide-y divide-white/5 animate-fade-in backdrop-blur-xl">
                    <div className="p-2 bg-black/40 text-[11px] font-semibold text-gray-400 flex justify-between items-center sticky top-0 backdrop-blur-md z-10 border-b border-white/5">
                        <span>{filteredProducts.length} produto(s) encontrado(s)</span>
                        {searchTerm && (
                            <button 
                                type="button"
                                onClick={() => setSearchTerm('')} 
                                className="text-brand-orange hover:underline"
                            >
                                Limpar busca
                            </button>
                        )}
                    </div>

                    {filteredProducts.length === 0 ? (
                        <div className="p-4 text-center text-xs text-gray-400">
                            Nenhum produto encontrado com "<span className="text-white font-bold">{searchTerm}</span>"
                        </div>
                    ) : (
                        filteredProducts.map(p => {
                            const isSelected = p.id === selectedProductId;
                            return (
                                <div
                                    key={p.id}
                                    onClick={() => {
                                        onSelect(p.id);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                    className={`p-3 cursor-pointer hover:bg-brand-orange/20 transition-all flex items-center justify-between gap-3 ${isSelected ? 'bg-brand-orange/15 border-l-4 border-brand-orange' : ''}`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/10 overflow-hidden">
                                            {p.image ? (
                                                <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Package className="w-4 h-4 text-brand-orange" />
                                            )}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-bold text-white text-sm truncate">{p.name}</span>
                                            <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                                {p.sku && <span>SKU: <strong className="text-gray-300">{p.sku}</strong></span>}
                                                <span>Estoque: <strong className={p.stock > 0 ? "text-emerald-400" : "text-rose-400"}>{p.stock ?? 0} un</strong></span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0 flex items-center gap-2">
                                        {p.price !== undefined && (
                                            <span className="text-xs font-black text-brand-orange">
                                                R$ {parseFloat(p.price).toFixed(2)}
                                            </span>
                                        )}
                                        {isSelected && (
                                            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
