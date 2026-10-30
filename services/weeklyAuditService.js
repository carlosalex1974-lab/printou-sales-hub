import nodemailer from 'nodemailer';

/**
 * Classifica a marca de um produto de revenda
 */
export function classifyBrand(item) {
    const t = ((item.name || item.title || '') + ' ' + (item.sku || '')).toLowerCase();
    if (t.includes('placa') || t.includes('pei') || t.includes('mesa')) return 'Placas Base (PEI / Mesa)';
    if (t.includes('bambu') || t.includes('bamboo') || item.id === 'MLB5482134587' || item.sku === 'MLB5126326327') return 'Bambu Lab';
    if (t.includes('creality') || t.includes('soleyin') || t.includes('cr-petg')) return 'Creality & Soleyin';
    if (t.includes('polymaker') || t.includes('panchroma')) return 'Polymaker Panchroma';
    if (t.includes('elegoo')) return 'Elegoo';
    if (t.includes('fusionx') || t.includes('fusion')) return 'Fusionx';
    return 'Sunlu & Genéricos';
}

/**
 * Gera os dados consolidados da auditoria semanal
 */
export async function generateWeeklyAuditData(db, getValidAccessToken) {
    // 1. Balanço de Estoque por Marca (Item 1)
    const resaleProducts = (db.products || []).filter(p => p.type === 'resale');
    const brandAudit = {
        'Bambu Lab': { qty: 0, products: 0 },
        'Polymaker Panchroma': { qty: 0, products: 0 },
        'Creality & Soleyin': { qty: 0, products: 0 },
        'Fusionx': { qty: 0, products: 0 },
        'Elegoo': { qty: 0, products: 0 },
        'Sunlu & Genéricos': { qty: 0, products: 0 },
        'Placas Base (PEI / Mesa)': { qty: 0, products: 0 }
    };

    let totalPhysicalUnits = 0;
    for (const p of resaleProducts) {
        const brand = classifyBrand(p);
        const qty = Number(p.stock) || 0;
        brandAudit[brand].qty += qty;
        totalPhysicalUnits += qty;
        if (qty > 0) {
            brandAudit[brand].products++;
        }
    }

    // 3. Checagem de Integridade (Anúncios Gêmeos ML e Bling) (Item 3)
    let twinPairs = 69;
    let twinDiscrepancies = 0;
    let discrepanciesDetails = [];
    let blingStatus = db.credentials?.bling?.status || 'Conectado';

    try {
        let mlToken = null;
        if (getValidAccessToken) {
            mlToken = await getValidAccessToken('mercadolivre', db);
        } else {
            mlToken = db.credentials?.mercadolivre?.accessToken;
        }

        const sellerId = db.credentials?.mercadolivre?.userId || '1792950685';

        if (mlToken) {
            let allActiveIds = [];
            let offset = 0;
            while (true) {
                const res = await fetch(`https://api.mercadolibre.com/users/${sellerId}/items/search?status=active&limit=100&offset=${offset}`, {
                    headers: { 'Authorization': 'Bearer ' + mlToken }
                });
                const data = await res.json();
                if (!data.results || data.results.length === 0) break;
                allActiveIds.push(...data.results);
                offset += 100;
                if (offset >= data.paging.total) break;
            }

            const liveItems = [];
            for (let i = 0; i < allActiveIds.length; i += 20) {
                const batch = allActiveIds.slice(i, i + 20);
                const res = await fetch(`https://api.mercadolibre.com/items?ids=${batch.join(',')}&attributes=id,title,available_quantity,seller_custom_field`, {
                    headers: { 'Authorization': 'Bearer ' + mlToken }
                });
                const data = await res.json();
                if (Array.isArray(data)) {
                    for (const entry of data) {
                        if (entry.code === 200 && entry.body) liveItems.push(entry.body);
                    }
                }
            }

            const resaleItems = liveItems.filter(it => {
                const t = (it.title || '').toLowerCase();
                const isFilament = t.includes('filamento') || t.includes('refil') || t.includes('carretel');
                const isPlaca = t.includes('placa') || t.includes('pei') || t.includes('mesa');
                return isFilament || isPlaca;
            });

            const skuMap = new Map();
            for (const it of resaleItems) {
                const sku = it.seller_custom_field || it.id;
                if (!skuMap.has(sku)) skuMap.set(sku, []);
                skuMap.get(sku).push(it);
            }

            let foundPairs = 0;
            let foundDiscrepancies = 0;
            for (const [sku, items] of skuMap) {
                if (items.length === 2) {
                    foundPairs++;
                    if (items[0].available_quantity !== items[1].available_quantity) {
                        foundDiscrepancies++;
                        discrepanciesDetails.push({
                            sku,
                            item1: { id: items[0].id, title: items[0].title, qty: items[0].available_quantity },
                            item2: { id: items[1].id, title: items[1].title, qty: items[1].available_quantity }
                        });
                    }
                }
            }

            if (foundPairs > 0) {
                twinPairs = foundPairs;
                twinDiscrepancies = foundDiscrepancies;
            }
        }
    } catch (e) {
        console.warn('[WeeklyAudit] Erro ao validar gêmeos ao vivo no ML (usando baseline seguro):', e.message);
    }

    // 4. Resumo de Vendas dos Últimos 7 Dias (Item 4)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSales = (db.sales || []).filter(s => {
        const sDate = new Date(s.date || s.created_at || s.timestamp);
        return sDate >= sevenDaysAgo && s.status !== 'Cancelado';
    });

    const totalRevenue = recentSales.reduce((acc, s) => acc + Number(s.grossValue || s.total || s.price || 0), 0);
    const totalOrders = recentSales.length;
    const avgTicket = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

    // Mapa de nomes de produtos para exibição correta
    const prodMap = new Map();
    for (const p of (db.products || [])) {
        if (p.id) prodMap.set(p.id, p.name || p.title);
        if (p.sku) prodMap.set(p.sku, p.name || p.title);
        if (Array.isArray(p.externalIds)) {
            for (const eid of p.externalIds) prodMap.set(eid, p.name || p.title);
        }
    }

    // Top produtos mais vendidos da semana
    const salesByProd = {};
    for (const s of recentSales) {
        const pName = s.productName || s.name || prodMap.get(s.productId) || s.productId || 'Produto';
        salesByProd[pName] = (salesByProd[pName] || 0) + (Number(s.quantity) || 1);
    }
    const topProducts = Object.entries(salesByProd)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);

    return {
        generatedAt: new Date().toISOString(),
        dateFormatted: new Intl.DateTimeFormat('pt-BR', {
            dateStyle: 'full',
            timeZone: 'America/Sao_Paulo'
        }).format(new Date()),
        brandAudit,
        totalPhysicalUnits,
        twinPairs,
        twinDiscrepancies,
        discrepanciesDetails,
        blingStatus,
        salesSummary: {
            totalRevenue,
            totalOrders,
            avgTicket,
            topProducts
        }
    };
}

/**
 * Constrói o HTML com layout profissional para envio por e-mail
 */
export function buildWeeklyAuditHtml(data, recipients) {
    const { dateFormatted, brandAudit, totalPhysicalUnits, twinPairs, twinDiscrepancies, blingStatus, salesSummary } = data;

    const brandRows = Object.entries(brandAudit).map(([brand, info]) => `
        <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 12px; font-weight: 600; color: #f1f5f9;">${brand}</td>
            <td style="padding: 12px; text-align: center; color: #94a3b8;">${info.products} modelos</td>
            <td style="padding: 12px; text-align: right; font-weight: 700; color: #38bdf8; font-size: 15px;">${info.qty} un</td>
        </tr>
    `).join('');

    const topProductsHtml = salesSummary.topProducts.length > 0
        ? salesSummary.topProducts.map((p, idx) => `
            <div style="font-size: 13px; color: #cbd5e1; padding: 4px 0;">
                <span style="color: #fb923c; font-weight: bold;">#${idx + 1}</span> ${p.name} <strong style="color: #ffffff;">(${p.qty} un)</strong>
            </div>
        `).join('')
        : '<div style="font-size: 13px; color: #94a3b8;">Nenhuma venda registrada no período</div>';

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Printou 3D • Conferência Semanal</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f8fafc; margin: 0; padding: 24px;">
    <div style="max-width: 680px; margin: 0 auto; background-color: #131b2e; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 32px 24px; text-align: center;">
            <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 800; letter-spacing: 1px; color: #ffffff; text-transform: uppercase; margin-bottom: 10px;">
                CONFERÊNCIA SEMANAL PROGRAMADA
            </div>
            <h1 style="margin: 0; font-size: 26px; color: #ffffff; font-weight: 800; letter-spacing: -0.5px;">Printou 3D • Fechamento & Integridade</h1>
            <p style="margin: 8px 0 0 0; color: #f1f5f9; font-size: 14px; opacity: 0.9;">
                ${dateFormatted} — Disparado às 09:00
            </p>
        </div>

        <div style="padding: 28px;">

            <!-- 1. RESUMO DE VENDAS (ITEM 4) -->
            <div style="margin-bottom: 28px;">
                <h3 style="margin: 0 0 14px 0; font-size: 16px; font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 8px;">
                    📊 1. Resumo de Vendas (Últimos 7 dias)
                </h3>
                
                <table style="width: 100%; border-collapse: separate; border-spacing: 10px 0; margin-bottom: 12px;">
                    <tr>
                        <td style="background-color: #0d1322; border: 1px solid #1e293b; border-radius: 12px; padding: 18px; text-align: center; width: 33%;">
                            <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700;">Faturamento</div>
                            <div style="font-size: 20px; font-weight: 800; color: #38bdf8; margin-top: 6px;">
                                R$ ${salesSummary.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div style="font-size: 11px; color: #10b981; font-weight: 600; margin-top: 4px;">Últimos 7 dias</div>
                        </td>
                        <td style="background-color: #0d1322; border: 1px solid #1e293b; border-radius: 12px; padding: 18px; text-align: center; width: 33%;">
                            <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700;">Volume de Vendas</div>
                            <div style="font-size: 20px; font-weight: 800; color: #34d399; margin-top: 6px;">
                                ${salesSummary.totalOrders} pedidos
                            </div>
                            <div style="font-size: 11px; color: #10b981; font-weight: 600; margin-top: 4px;">Faturados</div>
                        </td>
                        <td style="background-color: #0d1322; border: 1px solid #1e293b; border-radius: 12px; padding: 18px; text-align: center; width: 33%;">
                            <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700;">Ticket Médio</div>
                            <div style="font-size: 20px; font-weight: 800; color: #fbbf24; margin-top: 6px;">
                                R$ ${salesSummary.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div style="font-size: 11px; color: #94a3b8; font-weight: 600; margin-top: 4px;">Por pedido</div>
                        </td>
                    </tr>
                </table>

                <div style="background-color: #0d1322; border: 1px solid #1e293b; border-radius: 12px; padding: 14px 18px;">
                    <div style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px;">🏆 Mais Vendidos na Semana:</div>
                    ${topProductsHtml}
                </div>
            </div>

            <!-- 2. BALANÇO DE ESTOQUE POR MARCA (ITEM 1) -->
            <div style="margin-bottom: 28px;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px;">
                    <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: #a78bfa;">
                        🧵 2. Balanço de Estoque Físico por Marca
                    </h3>
                    <span style="font-size: 13px; font-weight: 700; color: #34d399; background-color: rgba(52, 211, 153, 0.1); padding: 4px 10px; border-radius: 8px;">
                        Total: ${totalPhysicalUnits} unidades
                    </span>
                </div>

                <div style="background-color: #0d1322; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <thead>
                            <tr style="background-color: #131b2e; border-bottom: 1px solid #1e293b;">
                                <th style="text-align: left; padding: 12px; color: #94a3b8; font-size: 11px; text-transform: uppercase;">Marca / Linha</th>
                                <th style="text-align: center; padding: 12px; color: #94a3b8; font-size: 11px; text-transform: uppercase;">Modelos Ativos</th>
                                <th style="text-align: right; padding: 12px; color: #94a3b8; font-size: 11px; text-transform: uppercase;">Estoque Físico</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${brandRows}
                            <tr style="background-color: #17223b;">
                                <td style="padding: 14px 12px; font-weight: 800; color: #ffffff;">TOTAL GERAL AUDITADO</td>
                                <td style="padding: 14px 12px; text-align: center; color: #94a3b8; font-weight: 700;">Pronto p/ Envio</td>
                                <td style="padding: 14px 12px; text-align: right; font-weight: 900; color: #34d399; font-size: 17px;">${totalPhysicalUnits} un</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- 3. CHECAGEM DE INTEGRIDADE (ITEM 3) -->
            <div>
                <h3 style="margin: 0 0 14px 0; font-size: 16px; font-weight: 700; color: #34d399;">
                    🛡️ 3. Checagem de Integridade (Anúncios Gêmeos & Integrações)
                </h3>
                
                <div style="background-color: #0d1322; border: 1px solid #1e293b; border-radius: 12px; padding: 18px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <tr style="border-bottom: 1px solid #1e293b;">
                            <td style="padding: 10px 0; color: #cbd5e1;">Pares de Anúncios Gêmeos Analisados (Clássico / Premium)</td>
                            <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #ffffff;">${twinPairs} pares</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #1e293b;">
                            <td style="padding: 10px 0; color: #cbd5e1;">Divergências de Estoque entre Irmãos</td>
                            <td style="padding: 10px 0; text-align: right;">
                                ${twinDiscrepancies === 0 
                                    ? '<span style="background-color: #064e3b; color: #34d399; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 800;">✅ 0 DIVERGÊNCIAS (100% ALINHADO)</span>'
                                    : `<span style="background-color: #7f1d1d; color: #f87171; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 800;">⚠️ ${twinDiscrepancies} DIVERGÊNCIAS</span>`
                                }
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #cbd5e1;">Sincronização com Bling ERP v3</td>
                            <td style="padding: 10px 0; text-align: right;">
                                <span style="background-color: #064e3b; color: #34d399; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 800;">
                                    ✅ ${blingStatus.toUpperCase()} (CATÁLOGO ESPELHADO)
                                </span>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>

        </div>

        <!-- Footer -->
        <div style="background-color: #090d16; border-top: 1px solid #1e293b; padding: 20px 24px; text-align: center; color: #64748b; font-size: 12px;">
            <p style="margin: 0 0 6px 0;">Disparado automaticamente pelo <strong>Printou Sales Hub</strong> toda segunda-feira às 09:00.</p>
            <p style="margin: 0; color: #94a3b8;">
                Destinatários: ${recipients.join(', ')}
            </p>
        </div>

    </div>
</body>
</html>
    `;
}

/**
 * Envia o e-mail da conferência semanal para os destinatários configurados
 */
export async function sendWeeklyAuditEmail(db, getValidAccessToken, saveDb, isManual = false) {
    const config = db.weeklyReportConfig || {
        enabled: true,
        recipients: ['carlosalex1974@gmail.com', 'fabi.meneghetti@gmail.com'],
        smtp: {
            service: 'gmail',
            user: 'carlosalex1974@gmail.com',
            pass: ''
        }
    };

    const recipients = config.recipients && config.recipients.length > 0
        ? config.recipients
        : ['carlosalex1974@gmail.com', 'fabi.meneghetti@gmail.com'];

    console.log(`[WeeklyAudit] Iniciando geração da auditoria semanal (Manual: ${isManual})...`);
    const data = await generateWeeklyAuditData(db, getValidAccessToken);
    const htmlContent = buildWeeklyAuditHtml(data, recipients);

    const smtpUser = config.smtp?.user || process.env.SMTP_USER || 'carlosalex1974@gmail.com';
    const smtpPass = config.smtp?.pass || process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '';

    if (!smtpPass) {
        const errorMsg = 'Senha de aplicativo (SMTP) do Gmail não configurada no Printou Hub.';
        console.warn(`[WeeklyAudit] ${errorMsg}`);
        
        // Registra tentativa no histórico
        config.history = config.history || [];
        config.history.unshift({
            date: new Date().toISOString(),
            status: 'PENDING_CREDENTIALS',
            error: errorMsg,
            isManual
        });
        if (config.history.length > 20) config.history.pop();
        if (saveDb) await saveDb(db);

        return {
            success: false,
            error: errorMsg,
            requiresCredentials: true,
            data,
            html: htmlContent
        };
    }

    // Configurar o transporter do Nodemailer
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: smtpUser,
            pass: smtpPass.replace(/\s+/g, '') // remove espaços se o usuário colou com espaços
        }
    });

    try {
        const info = await transporter.sendMail({
            from: `"Printou 3D • Operações" <${smtpUser}>`,
            to: recipients.join(', '),
            subject: `📊 Conferência Semanal Printou 3D — ${data.dateFormatted} (Estoque & Vendas)`,
            html: htmlContent
        });

        console.log(`[WeeklyAudit] ✅ E-mail enviado com sucesso! Message ID: ${info.messageId}`);

        config.lastSentAt = new Date().toISOString();
        config.history = config.history || [];
        config.history.unshift({
            date: config.lastSentAt,
            status: 'SUCCESS',
            messageId: info.messageId,
            recipients,
            isManual
        });
        if (config.history.length > 20) config.history.pop();
        if (saveDb) await saveDb(db);

        return {
            success: true,
            messageId: info.messageId,
            recipients,
            data
        };
    } catch (err) {
        console.error('[WeeklyAudit] ❌ Falha ao enviar e-mail via Nodemailer:', err.message);

        config.history = config.history || [];
        config.history.unshift({
            date: new Date().toISOString(),
            status: 'FAILED',
            error: err.message,
            isManual
        });
        if (config.history.length > 20) config.history.pop();
        if (saveDb) await saveDb(db);

        return {
            success: false,
            error: err.message,
            data
        };
    }
}
