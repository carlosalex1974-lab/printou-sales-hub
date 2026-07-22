import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Trava em memória para evitar concorrência/duplicação de webhooks
const activeLocks = new Set();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Servir arquivos estáticos do React em produção
app.use(express.static(path.join(__dirname, 'dist')));
// Servir a pasta de imagens assets diretamente
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Banco de dados Mock Padrão Inicial
const DEFAULT_DB = {
    channels: [
        { id: 'ml1', name: 'printoustudio3d (Clássico)', commission: 12.0, fixedFee: 6.0, color: '#7C3AED', hasFreeShippingThreshold: true, freeShippingThreshold: 79.0, defaultSellerShippingCost: 19.90, defaultBelowThresholdShippingCost: 0.0 },
        { id: 'ml2', name: 'AlucarPrintoustudio3d (Premium)', commission: 19.5, fixedFee: 6.0, color: '#14B8A6', hasFreeShippingThreshold: true, freeShippingThreshold: 79.0, defaultSellerShippingCost: 19.90, defaultBelowThresholdShippingCost: 0.0 },
        { id: 'shopee', name: 'Shopee', commission: 14.0, fixedFee: 3.0, color: '#EE4D2D', hasFreeShippingThreshold: false, freeShippingThreshold: 0, defaultSellerShippingCost: 0.0, defaultBelowThresholdShippingCost: 0.0 },
        { id: 'site', name: 'Site Próprio', commission: 3.99, fixedFee: 0.5, color: '#0088FF', hasFreeShippingThreshold: false, freeShippingThreshold: 0, defaultSellerShippingCost: 0.0, defaultBelowThresholdShippingCost: 0.0 },
        { id: 'direta', name: 'Venda Direta / Pix', commission: 0.0, fixedFee: 0.0, color: '#30D158', hasFreeShippingThreshold: false, freeShippingThreshold: 0, defaultSellerShippingCost: 0.0, defaultBelowThresholdShippingCost: 0.0 }
    ],
    suppliers: [],
    expenses: [],
    products: [],
    filaments: [],
    sales: [],
    integrationLogs: [],
    credentials: {
        mercadolivre: { clientId: '', clientSecret: '', webhookUrl: 'http://localhost:3001/api/webhooks/mercadolivre', status: 'Não Sincronizado' },
        shopee: { shopId: '', apiKey: '', webhookUrl: 'http://localhost:3001/api/webhooks/shopee', status: 'Não Sincronizado' },
        site: { apiKey: '', apiSecret: '', webhookUrl: 'http://localhost:3001/api/webhooks/site', status: 'Não Sincronizado' },
        facebook: { accessToken: '', pageId: '1117637594770324', businessId: '1550133536629313', catalogId: '', status: 'Não Sincronizado' }
    },
    users: [
        { email: 'admin@printou.com', password: 'admin123', name: 'Administrador Printou', role: 'admin' },
        { email: 'operador@printou.com', password: 'printou123', name: 'Operador Printou', role: 'employee' }
    ]
};

// Garantir que a pasta 'data' existe
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR);
}

// Inicializar banco se vazio
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 4), 'utf-8');
}

// Helper para ler DB
function readDb() {
    let db;
    try {
        const fileData = fs.readFileSync(DB_FILE, 'utf-8');
        db = JSON.parse(fileData);
    } catch (e) {
        db = JSON.parse(JSON.stringify(DEFAULT_DB));
    }

    // Injeta variáveis de ambiente se disponíveis
    db.credentials = db.credentials || {};
    
    db.credentials.mercadolivre = db.credentials.mercadolivre || {};
    db.credentials.mercadolivre.clientId = process.env.ML_CLIENT_ID || db.credentials.mercadolivre.clientId || '';
    db.credentials.mercadolivre.clientSecret = process.env.ML_CLIENT_SECRET || db.credentials.mercadolivre.clientSecret || '';
    
    db.credentials.mercadolivre2 = db.credentials.mercadolivre2 || {};
    db.credentials.mercadolivre2.clientId = process.env.ML2_CLIENT_ID || db.credentials.mercadolivre2.clientId || '';
    db.credentials.mercadolivre2.clientSecret = process.env.ML2_CLIENT_SECRET || db.credentials.mercadolivre2.clientSecret || '';
    
    db.credentials.shopee = db.credentials.shopee || {};
    db.credentials.shopee.shopId = process.env.SHOPEE_SHOP_ID || db.credentials.shopee.shopId || '';
    db.credentials.shopee.apiKey = process.env.SHOPEE_API_KEY || db.credentials.shopee.apiKey || '';
    
    db.credentials.site = db.credentials.site || {};
    db.credentials.site.apiKey = process.env.SITE_API_KEY || db.credentials.site.apiKey || '';
    db.credentials.site.apiSecret = process.env.SITE_API_SECRET || db.credentials.site.apiSecret || '';

    db.credentials.facebook = db.credentials.facebook || {};
    db.credentials.facebook.accessToken = process.env.FB_ACCESS_TOKEN || db.credentials.facebook.accessToken || '';
    db.credentials.facebook.pageId = process.env.FB_PAGE_ID || db.credentials.facebook.pageId || '1117637594770324';
    db.credentials.facebook.businessId = process.env.FB_BUSINESS_ID || db.credentials.facebook.businessId || '1550133536629313';
    db.credentials.facebook.catalogId = process.env.FB_CATALOG_ID || db.credentials.facebook.catalogId || '';

    // Define status como Sincronizado se houver credenciais
    if (db.credentials.mercadolivre.clientId && db.credentials.mercadolivre.clientSecret) {
        db.credentials.mercadolivre.status = 'Sincronizado';
    }
    if (db.credentials.mercadolivre2.clientId && db.credentials.mercadolivre2.clientSecret) {
        db.credentials.mercadolivre2.status = 'Sincronizado';
    }
    if (db.credentials.shopee.shopId && db.credentials.shopee.apiKey) {
        db.credentials.shopee.status = 'Sincronizado';
    }
    if (db.credentials.site.apiKey && db.credentials.site.apiSecret) {
        db.credentials.site.status = 'Sincronizado';
    }
    if (db.credentials.facebook.accessToken) {
        db.credentials.facebook.status = 'Sincronizado';
    } else {
        db.credentials.facebook.status = 'Não Sincronizado';
    }

    return db;
}

// Helper para salvar DB
function saveDb(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 4), 'utf-8');
}

// Endpoint para ler dados
app.get('/api/data', (req, res) => {
    try {
        const data = readDb();
        res.json(data);
    } catch (error) {
        console.error("Erro ao ler banco de dados local:", error);
        res.status(500).json({ error: "Erro ao ler banco de dados" });
    }
});

// Endpoint para salvar dados
app.post('/api/data', (req, res) => {
    try {
        const newData = req.body;
        const currentData = readDb();
        
        // Mesclar chaves individuais de credenciais para preservar tokens de acesso confidenciais
        const mergedCredentials = { ...currentData.credentials };
        if (newData.credentials) {
            for (const key of Object.keys(newData.credentials)) {
                const newAcc = newData.credentials[key];
                const currAcc = currentData.credentials[key] || {};
                
                mergedCredentials[key] = {
                    ...currAcc,
                    ...newAcc,
                    accessToken: newAcc.accessToken || currAcc.accessToken,
                    refreshToken: newAcc.refreshToken || currAcc.refreshToken,
                    tokenExpiresAt: newAcc.tokenExpiresAt || currAcc.tokenExpiresAt,
                    userId: newAcc.userId || currAcc.userId,
                    status: newAcc.accessToken || currAcc.accessToken || currAcc.accessToken ? 'Autorizado' : (newAcc.status || currAcc.status || 'Não Sincronizado')
                };
            }
        }

        const mergedSales = (newData.sales && newData.sales.length > 0) ? newData.sales : currentData.sales;
        const mergedProducts = (newData.products && newData.products.length > 0) ? newData.products : currentData.products;
        const mergedFilaments = (newData.filaments && newData.filaments.length > 0) ? newData.filaments : currentData.filaments;
        const mergedSuppliers = (newData.suppliers && newData.suppliers.length > 0) ? newData.suppliers : currentData.suppliers;
        const mergedExpenses = (newData.expenses && newData.expenses.length > 0) ? newData.expenses : currentData.expenses;

        const mergedData = {
            ...currentData,
            ...newData,
            sales: mergedSales,
            products: mergedProducts,
            filaments: mergedFilaments,
            suppliers: mergedSuppliers,
            expenses: mergedExpenses,
            credentials: mergedCredentials,
            users: newData.users || currentData.users,
            integrationLogs: newData.integrationLogs || currentData.integrationLogs
        };
        
        saveDb(mergedData);
        res.json({ success: true, message: "Dados persistidos no banco de dados local com sucesso!" });
    } catch (error) {
        console.error("Erro ao salvar banco de dados local:", error);
        res.status(500).json({ error: "Erro ao salvar banco de dados" });
    }
});

// Helper para renovar o Access Token do Mercado Livre
async function getValidAccessToken(accountKey, db) {
    const creds = db.credentials[accountKey];
    if (!creds || !creds.accessToken || !creds.refreshToken) {
        return null;
    }
    
    // Se expirar em menos de 5 minutos, atualiza
    if (creds.tokenExpiresAt && Date.now() < creds.tokenExpiresAt - 300000) {
        return creds.accessToken;
    }
    
    console.log(`[ML] Atualizando token expirado para a conta ${accountKey}...`);
    try {
        const tokenUrl = 'https://api.mercadolibre.com/oauth/token';
        const params = new URLSearchParams();
        params.append('grant_type', 'refresh_token');
        params.append('client_id', creds.clientId);
        params.append('client_secret', creds.clientSecret);
        params.append('refresh_token', creds.refreshToken);
        
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        });
        
        if (response.ok) {
            const tokenData = await response.json();
            creds.accessToken = tokenData.access_token;
            creds.refreshToken = tokenData.refresh_token;
            creds.tokenExpiresAt = Date.now() + (tokenData.expires_in * 1000);
            creds.status = 'Autorizado';
            saveDb(db);
            return creds.accessToken;
        } else {
            const errText = await response.text();
            console.error(`[ML] Erro ao atualizar token da conta ${accountKey}:`, errText);
            creds.status = 'Erro de Autenticação';
            saveDb(db);
            return null;
        }
    } catch (error) {
        console.error(`[ML] Falha de conexão ao atualizar token da conta ${accountKey}:`, error);
        return null;
    }
}

// Endpoint Webhook Genérico/Simulado para Mercado Livre e Shopee (atualizado para dados reais do ML)
app.post('/api/webhooks/:provider', async (req, res) => {
    const { provider } = req.params;
    const payload = req.body;
    
    console.log(`[WEBHOOK] Notificação recebida de ${provider}:`, payload);
    
    // Se for notificação do Mercado Livre de outros tópicos (como items, questions, etc.), ignoramos
    if (provider === 'mercadolivre' && payload.topic && payload.topic !== 'orders') {
        console.log(`[WEBHOOK] Ignorando notificação do tópico "${payload.topic}" do Mercado Livre (apenas pedidos são processados).`);
        return res.json({ success: true, message: `Tópico "${payload.topic}" ignorado.` });
    }

    // Identificação precoce do ID do pedido para a trava de concorrência
    let orderIdCandidate = null;
    if (provider === 'mercadolivre') {
        if (payload.resource && payload.topic === 'orders') {
            orderIdCandidate = payload.resource.split('/').pop();
        } else {
            orderIdCandidate = payload.order_id || payload.order_sn || null;
        }
    } else if (provider === 'site') {
        orderIdCandidate = payload.name || (payload.id ? String(payload.id) : null);
    } else {
        orderIdCandidate = payload.order_id || payload.order_sn || null;
    }

    // Trava de Concorrência
    if (orderIdCandidate) {
        if (activeLocks.has(orderIdCandidate)) {
            console.log(`[WEBHOOK] Evitando processamento duplicado concorrente para o pedido #${orderIdCandidate}`);
            return res.json({ success: true, message: `Pedido #${orderIdCandidate} já está sendo processado.` });
        }
        activeLocks.add(orderIdCandidate);
    }

    try {
        const db = readDb();
        const todayStr = new Date().toISOString().split('T')[0];
        
        let orderId;
        let channelId;
        let productId;
        let productName;
        let quantity;
        let grossValue;
        let shipping;
        let buyer;
        let isRealMLOrder = false;

        // Trata webhook oficial do Mercado Livre
        if (provider === 'mercadolivre' && payload.resource && payload.topic === 'orders') {
            isRealMLOrder = true;
            const resourceId = payload.resource.split('/').pop();
            const mlUserId = String(payload.user_id);
            
            // Identifica qual conta do Mercado Livre disparou
            let accountKey = 'mercadolivre';
            channelId = 'ml1'; // Printou Hub Premium
            
            if (db.credentials.mercadolivre2 && String(db.credentials.mercadolivre2.userId) === mlUserId) {
                accountKey = 'mercadolivre2';
                channelId = 'ml2'; // Alucar Premium
            } else if (db.credentials.mercadolivre && String(db.credentials.mercadolivre.userId) === mlUserId) {
                accountKey = 'mercadolivre';
                channelId = 'ml1';
            }
            
            const accessToken = await getValidAccessToken(accountKey, db);
            if (!accessToken) {
                throw new Error(`Não foi possível obter Token de Acesso válido para a conta ${accountKey}.`);
            }
            
            // Busca detalhes da venda na API do Mercado Livre
            const orderRes = await fetch(`https://api.mercadolibre.com/orders/${resourceId}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            
            if (!orderRes.ok) {
                const errText = await orderRes.text();
                throw new Error(`Erro ao buscar pedido ${resourceId} na API do ML: ${errText}`);
            }
            
            const orderData = await orderRes.json();
            orderId = String(orderData.id);
            buyer = `${orderData.buyer.first_name || ''} ${orderData.buyer.last_name || ''}`.trim() || orderData.buyer.nickname || 'Comprador ML';
            grossValue = orderData.total_amount;
            
            // Busca custos de frete se houver
            shipping = 0.0;
            if (orderData.shipping && orderData.shipping.id) {
                try {
                    const shipRes = await fetch(`https://api.mercadolibre.com/shipments/${orderData.shipping.id}`, {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                    });
                    if (shipRes.ok) {
                        const shipData = await shipRes.json();
                        if (shipData.shipping_option && shipData.shipping_option.cost !== undefined) {
                            shipping = shipData.shipping_option.cost;
                        }
                    }
                } catch (shipErr) {
                    console.warn("Não foi possível buscar custos de envio detalhados:", shipErr);
                }
            }
            
            const firstItem = orderData.order_items[0];
            if (firstItem) {
                productId = firstItem.item.id;
                productName = firstItem.item.title;
                quantity = firstItem.quantity;
            } else {
                productId = 'p1';
                productName = 'Produto Mercado Livre';
                quantity = 1;
            }
        } else if (provider === 'site') {
            // Webhook do site próprio (Shopify)
            // Se for Shopify, o ID vem em payload.name (ex: "#1001") ou payload.id
            orderId = payload.name || (payload.id ? String(payload.id) : `shop_${Date.now().toString().slice(-4)}`);
            channelId = 'site';
            
            const firstItem = payload.line_items && payload.line_items[0];
            if (firstItem) {
                productId = String(firstItem.variant_id || firstItem.product_id || 'p3');
                productName = firstItem.name || firstItem.title || 'Produto Site';
                quantity = parseInt(firstItem.quantity) || 1;
            } else {
                productId = payload.productId || 'p3';
                productName = payload.productName || 'Produto Shopify';
                quantity = parseInt(payload.quantity) || 1;
            }
            
            grossValue = parseFloat(payload.total_price) || parseFloat(payload.grossValue) || 49.90;
            shipping = payload.shipping_lines && payload.shipping_lines[0] ? parseFloat(payload.shipping_lines[0].price) : (parseFloat(payload.shipping) || 0.0);
            
            if (payload.customer) {
                buyer = `${payload.customer.first_name || ''} ${payload.customer.last_name || ''}`.trim() || 'Cliente Shopify';
            } else {
                buyer = payload.buyer || 'Cliente Shopify';
            }
        } else {
            // Lógica de simulação antiga/Shopee
            orderId = payload.order_id || payload.order_sn || `int_${Date.now().toString().slice(-4)}`;
            channelId = payload.channelId || (provider === 'mercadolivre' ? 'ml2' : provider === 'shopee' ? 'shopee' : 'site');
            productId = payload.productId || 'p1';
            productName = payload.productName || `Produto Simulado ${productId}`;
            quantity = parseInt(payload.quantity) || 1;
            grossValue = parseFloat(payload.grossValue) || 49.90;
            shipping = parseFloat(payload.shipping) || 0.0;
            buyer = payload.buyer || 'Cliente Integrado';
        }
        
        // Evita duplicar venda
        const saleExists = db.sales.find(s => s.id === orderId);
        if (saleExists) {
            return res.json({ success: true, message: `Pedido #${orderId} já processado anteriormente.` });
        }

        // Adiciona log de recebimento
        const logEntry = {
            id: `log_${Date.now()}_${Math.random().toString().slice(-3)}`,
            timestamp: new Date().toLocaleTimeString('pt-BR'),
            type: 'info',
            message: `⚡ Webhook [${provider.toUpperCase()}] recebido. Pedido #${orderId} de ${buyer}.`
        };
        
        // Busca produto correspondente no estoque para baixa
        let product = db.products.find(p => p.id === productId || p.name.toLowerCase() === productName.toLowerCase());
        let deductionLogs = [];
        
        if (product) {
            logEntry.message += ` Processando produto: "${product.name}".`;
            
            if (product.type === '3d' && product.weight && product.filamentId) {
                const totalWeight = product.weight * quantity;
                const filament = db.filaments.find(f => f.id === product.filamentId);
                
                if (filament) {
                    filament.currentWeight = Math.max(0, parseFloat((filament.currentWeight - totalWeight).toFixed(1)));
                    deductionLogs.push(`📉 Baixa automática de estoque: Descontados ${totalWeight}g do filamento "${filament.name}". Restante: ${filament.currentWeight}g.`);
                    
                    // Alerta de estoque crítico
                    if (filament.currentWeight <= filament.alertThreshold) {
                        deductionLogs.push(`⚠️ ALERTA: O filamento "${filament.name}" atingiu o nível crítico (${filament.currentWeight}g)!`);
                    }
                }
            } else if (product.type === 'resale') {
                deductionLogs.push(`📦 Produto de revenda. Baixa automática realizada no sistema.`);
            }
        } else {
            // Importar provisoriamente se não existir no catálogo
            const guessedType = productName.toLowerCase().includes('filamento') || productName.toLowerCase().includes('bico') ? 'resale' : '3d';
            product = {
                id: productId,
                name: productName,
                type: guessedType,
                weight: guessedType === '3d' ? 100 : 0,
                printTime: guessedType === '3d' ? 5.0 : 0,
                filamentCost: 95.00,
                machineHourCost: 2.00,
                finishingCost: 2.00,
                packagingCost: 2.50,
                failRate: 10,
                acquisitionCost: guessedType === 'resale' ? grossValue * 0.5 : 0,
                isPendingConfig: true,
                filamentId: guessedType === '3d' ? (db.filaments[0]?.id || 'fil1') : undefined
            };
            db.products.push(product);
            deductionLogs.push(`🆕 Produto desconhecido "${product.name}" importado automaticamente.`);
        }
        
        // Registrar a venda no caixa
        const newSale = {
            id: orderId,
            date: todayStr,
            channelId,
            productId: product.id,
            quantity,
            grossValue,
            shipping,
            status: 'Pago'
        };
        db.sales.unshift(newSale); // Mais novo primeiro
        
        // Escreve os logs finais
        db.integrationLogs = db.integrationLogs || [];
        db.integrationLogs.push({
            id: `${logEntry.id}_main`,
            timestamp: logEntry.timestamp,
            type: 'success',
            message: logEntry.message
        });
        
        deductionLogs.forEach(msg => {
            db.integrationLogs.push({
                id: `${logEntry.id}_deduction_${Math.random()}`,
                timestamp: new Date().toLocaleTimeString('pt-BR'),
                type: msg.includes('⚠️') ? 'warning' : 'info',
                message: msg
            });
        });
        
        // Limita a quantidade de logs exibidos para evitar vazamento de memória
        if (db.integrationLogs.length > 50) {
            db.integrationLogs = db.integrationLogs.slice(-50);
        }
        
        saveDb(db);
        
        res.json({
            success: true,
            message: `Pedido #${orderId} processado com sucesso!`,
            details: {
                orderId,
                saleAdded: newSale,
                logs: [logEntry.message, ...deductionLogs]
            }
        });
    } catch (e) {
        console.error("Erro ao processar webhook:", e);
        res.status(500).json({ error: `Erro ao processar webhook: ${e.message}` });
    } finally {
        if (orderIdCandidate) {
            activeLocks.delete(orderIdCandidate);
        }
    }
});

// Endpoint para limpar os logs de integração
app.post('/api/integration/logs/clear', (req, res) => {
    try {
        const db = readDb();
        db.integrationLogs = [];
        saveDb(db);
        res.json({ success: true, message: "Logs limpos com sucesso!" });
    } catch (e) {
        res.status(500).json({ error: "Erro ao limpar logs" });
    }
});

// =====================================================
// ENDPOINTS DO AGENTE COMERCIAL FACEBOOK & SHOPIFY
// =====================================================

// Obter configurações do Facebook
app.get('/api/facebook/config', (req, res) => {
    try {
        const db = readDb();
        res.json(db.credentials.facebook || {});
    } catch (e) {
        res.status(500).json({ error: "Erro ao ler configurações do Facebook" });
    }
});

// Salvar configurações do Facebook
app.post('/api/facebook/config', (req, res) => {
    try {
        const db = readDb();
        db.credentials.facebook = {
            ...db.credentials.facebook,
            ...req.body,
            status: req.body.accessToken ? 'Sincronizado' : 'Não Sincronizado'
        };
        saveDb(db);
        res.json({ success: true, message: "Configurações salvas com sucesso!", config: db.credentials.facebook });
    } catch (e) {
        res.status(500).json({ error: "Erro ao salvar configurações do Facebook" });
    }
});

// Listar produtos do Shopify sincronizados
app.get('/api/facebook/products', (req, res) => {
    try {
        const db = readDb();
        res.json(db.shopifyProducts || []);
    } catch (e) {
        res.status(500).json({ error: "Erro ao listar produtos do Shopify" });
    }
});

// Sincronizar produtos da loja Shopify
app.post('/api/facebook/sync-shopify', async (req, res) => {
    try {
        const db = readDb();
        const siteCreds = db.credentials.site;
        
        if (!siteCreds || !siteCreds.apiSecret) {
            return res.status(400).json({ error: "Token de acesso do Shopify (Site) não configurado nas Integrações." });
        }

        const shopifyToken = siteCreds.apiSecret;
        // Sempre usa o domínio myshopify correto
        const shopUrl = `https://printoustudio3d.myshopify.com/admin/api/2024-01/products.json?limit=50`;

        console.log(`[SHOPIFY-SYNC] Buscando produtos em printoustudio3d.myshopify.com...`);
        
        const response = await fetch(shopUrl, {
            headers: {
                'X-Shopify-Access-Token': shopifyToken,
                'User-Agent': 'PrintouSalesHub (contato@printou.com)',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Erro na API do Shopify (Status ${response.status}): ${errText}`);
        }

        const data = await response.json();
        db.shopifyProducts = db.shopifyProducts || [];
        
        let newCount = 0;
        let updatedCount = 0;

        if (data.products) {
            data.products.forEach(p => {
                const price = parseFloat(p.variants?.[0]?.price) || 0.0;
                const imageUrl = p.images?.[0]?.src || '';
                const inventory = parseInt(p.variants?.[0]?.inventory_quantity) || 0;
                const externalId = `shopify_${p.id}`;

                const existingIndex = db.shopifyProducts.findIndex(sp => sp.id === externalId);
                
                if (existingIndex >= 0) {
                    // Atualiza
                    db.shopifyProducts[existingIndex] = {
                        ...db.shopifyProducts[existingIndex],
                        title: p.title,
                        description: p.body_html || '',
                        price,
                        imageUrl,
                        inventoryQuantity: inventory,
                        handle: p.handle
                    };
                    updatedCount++;
                } else {
                    // Insere novo
                    db.shopifyProducts.push({
                        id: externalId,
                        title: p.title,
                        description: p.body_html || '',
                        price,
                        imageUrl,
                        inventoryQuantity: inventory,
                        handle: p.handle,
                        facebookPublished: false,
                        facebookId: ''
                    });
                    newCount++;
                }
            });
        }

        // Registra log de integração
        db.integrationLogs = db.integrationLogs || [];
        db.integrationLogs.push({
            id: `log_shopify_sync_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('pt-BR'),
            type: 'success',
            message: `🛒 [SHOPIFY] Catálogo sincronizado: ${newCount} novos produtos importados, ${updatedCount} atualizados.`
        });

        saveDb(db);
        res.json({ success: true, message: "Sincronização concluída!", imported: newCount, updated: updatedCount });
    } catch (err) {
        console.error("[SHOPIFY-SYNC] Falha ao sincronizar:", err);
        res.status(500).json({ error: `Erro na sincronização: ${err.message}` });
    }
});

// Publicar produto no Facebook Marketplace/Catálogo
app.post('/api/facebook/publish', async (req, res) => {
    const { productId } = req.body;
    try {
        const db = readDb();
        const fbCreds = db.credentials.facebook;
        const prod = (db.shopifyProducts || []).find(p => p.id === productId);

        if (!prod) {
            return res.status(404).json({ error: "Produto do Shopify não encontrado." });
        }

        db.integrationLogs = db.integrationLogs || [];

        // Lógica de Sincronização Real vs Simulação
        if (fbCreds && fbCreds.accessToken && fbCreds.catalogId) {
            // Cenário Real: Enviar para API do Meta Catalog
            console.log(`[FB-CATALOG] Publicando produto ${prod.title} no catálogo ${fbCreds.catalogId}...`);
            
            const batchUrl = `https://graph.facebook.com/v18.0/${fbCreds.catalogId}/batch`;
            const payload = {
                requests: [
                    {
                        method: 'CREATE',
                        retailer_id: prod.id,
                        data: {
                            title: prod.title,
                            description: prod.description.substring(0, 1000) || prod.title,
                            image_link: prod.imageUrl || 'https://printoustudio3d.com/assets/no-image.png',
                            link: `https://printoustudio3d.com/products/${prod.handle}`,
                            brand: 'Printou3D',
                            price: Math.round(prod.price * 100), // Em centavos na API do Facebook
                            currency: 'BRL',
                            availability: prod.inventoryQuantity > 0 ? 'in stock' : 'out of stock',
                            condition: 'new'
                        }
                    }
                ]
            };

            const response = await fetch(batchUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${fbCreds.accessToken}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                prod.facebookPublished = true;
                prod.facebookId = `fb_item_${Date.now()}`;
                
                db.integrationLogs.push({
                    id: `log_fb_pub_${Date.now()}`,
                    timestamp: new Date().toLocaleTimeString('pt-BR'),
                    type: 'success',
                    message: `📢 [FACEBOOK] Anúncio publicado no Marketplace para o item "${prod.title}".`
                });
                
                saveDb(db);
                return res.json({ success: true, message: "Produto publicado no Facebook com sucesso!", published: true });
            } else {
                const errText = await response.text();
                throw new Error(`Erro na API do Facebook: ${errText}`);
            }
        } else {
            // Cenário de Simulação (para testes rápidos enquanto aprova chaves)
            console.log(`[FB-SIMULATION] Simulando publicação do produto ${prod.title}...`);
            prod.facebookPublished = true;
            prod.facebookId = `fb_sim_${Math.random().toString(36).slice(2, 9)}`;

            db.integrationLogs.push({
                id: `log_fb_pub_sim_${Date.now()}`,
                timestamp: new Date().toLocaleTimeString('pt-BR'),
                type: 'success',
                message: `📢 [FACEBOOK (SIMULADO)] Anúncio de teste publicado no Marketplace: "${prod.title}" — R$ ${prod.price.toFixed(2)}.`
            });

            // Adiciona mensagens simuladas desse produto para o chat inteligente
            db.facebookMessages = db.facebookMessages || [];
            
            const buyers = ['Gabriel Silva', 'Beatriz Costa', 'Marcos Oliveira'];
            const questions = [
                'Está disponível? Entrega em quanto tempo?',
                'Qual o preço final e tem outras cores?',
                'Aceita Pix? Consegue enviar hoje?'
            ];
            const randomIndex = Math.floor(Math.random() * buyers.length);

            db.facebookMessages.push({
                id: `msg_${Date.now()}`,
                buyerName: buyers[randomIndex],
                productTitle: prod.title,
                productUrl: `https://printoustudio3d.com/products/${prod.handle}`,
                messageText: questions[randomIndex],
                timestamp: new Date().toLocaleTimeString('pt-BR').substring(0, 5),
                replied: false,
                replyText: ''
            });

            saveDb(db);
            return res.json({ 
                success: true, 
                message: "Produto publicado com sucesso! (Modo Simulado ativado. Nova pergunta recebida no chat!)", 
                published: true, 
                simulated: true 
            });
        }
    } catch (err) {
        console.error("[FB-PUBLISH] Erro ao publicar anúncio:", err);
        res.status(500).json({ error: `Erro ao publicar no Facebook: ${err.message}` });
    }
});

// Listar mensagens recebidas no Facebook Marketplace
app.get('/api/facebook/messages', (req, res) => {
    try {
        const db = readDb();
        res.json(db.facebookMessages || []);
    } catch (e) {
        res.status(500).json({ error: "Erro ao buscar mensagens do Facebook" });
    }
});

// Responder mensagem no chat do Facebook Marketplace (Auto ou Manual)
app.post('/api/facebook/messages/reply', (req, res) => {
    const { messageId, replyText } = req.body;
    try {
        const db = readDb();
        db.facebookMessages = db.facebookMessages || [];
        const msg = db.facebookMessages.find(m => m.id === messageId);

        if (!msg) {
            return res.status(404).json({ error: "Mensagem não encontrada." });
        }

        msg.replied = true;
        msg.replyText = replyText;

        // Log da resposta
        db.integrationLogs = db.integrationLogs || [];
        db.integrationLogs.push({
            id: `log_fb_reply_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('pt-BR'),
            type: 'info',
            message: `💬 [MESSENGER] Resposta enviada para ${msg.buyerName}: "${replyText.substring(0, 40)}..."`
        });

        saveDb(db);
        res.json({ success: true, message: "Resposta enviada com sucesso!", messageObj: msg });
    } catch (e) {
        res.status(500).json({ error: "Erro ao enviar resposta" });
    }
});

// Endpoint para zerar todos os dados do banco (preservando credenciais e canais)
app.post('/api/data/reset', (req, res) => {
    try {
        const db = readDb();
        db.sales = [];
        db.expenses = [];
        db.products = [];
        db.filaments = [];
        db.suppliers = [];
        db.integrationLogs = [];
        saveDb(db);
        res.json({ success: true, message: "Sistema resetado com sucesso! Pronto para uso real." });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Erro ao resetar dados do sistema" });
    }
});

// Endpoint Callback para OAuth 2.0 do Mercado Livre
app.get('/api/auth/mercadolivre/callback', async (req, res) => {
    const { code, state } = req.query; // state define se é 'ml1' ou 'ml2'
    if (!code) {
        return res.status(400).send("Código de autorização não fornecido");
    }
    
    try {
        const db = readDb();
        const accountKey = state === 'ml2' ? 'mercadolivre2' : 'mercadolivre';
        const creds = db.credentials[accountKey];
        
        if (!creds || !creds.clientId || !creds.clientSecret) {
            return res.status(400).send("Credenciais do Mercado Livre não configuradas no servidor.");
        }
        
        // Determina a URL de callback dinâmica
        const host = req.get('host');
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const redirectUri = `${protocol}://${host}/api/auth/mercadolivre/callback`;
        
        const tokenUrl = 'https://api.mercadolibre.com/oauth/token';
        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('client_id', creds.clientId);
        params.append('client_secret', creds.clientSecret);
        params.append('code', code);
        params.append('redirect_uri', redirectUri);
        
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });
        
        if (!response.ok) {
            const errText = await response.text();
            console.error("Erro na troca de token:", errText);
            return res.status(400).send(`Erro ao obter token do Mercado Livre: ${errText}`);
        }
        
        const tokenData = await response.json();
        
        // Salva os tokens no banco
        creds.accessToken = tokenData.access_token;
        creds.refreshToken = tokenData.refresh_token;
        creds.userId = String(tokenData.user_id);
        creds.tokenExpiresAt = Date.now() + (tokenData.expires_in * 1000);
        creds.status = 'Autorizado';
        
        saveDb(db);
        
        // Redireciona de volta para o painel do aplicativo
        res.send(`
            <html>
                <head>
                    <title>Conectado ao Mercado Livre</title>
                    <script>
                        alert("Conta do Mercado Livre vinculada com sucesso!");
                        window.location.href = "/";
                    </script>
                </head>
                <body style="font-family: sans-serif; background-color: #14141b; color: #fff; text-align: center; padding-top: 50px;">
                    <h2>Conexão bem sucedida! Redirecionando...</h2>
                    <script>setTimeout(function(){ window.location.href = "/"; }, 1500);</script>
                </body>
            </html>
        `);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro interno ao processar autorização");
    }
});

// Endpoint para Autenticação (Login)
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    try {
        const db = readDb();
        const usersList = db.users || DEFAULT_DB.users;
        const user = usersList.find(u => u.email === email && u.password === password);
        
        if (user) {
            const { password, ...userSession } = user;
            res.json({ success: true, user: userSession });
        } else {
            res.status(401).json({ success: false, error: "E-mail ou senha incorretos!" });
        }
    } catch (e) {
        res.status(500).json({ error: "Erro interno no servidor de autenticação" });
    }
});

// Rota de fallback para entregar o React App (Single Page Application)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// =====================================================
// AUTO-SYNC POLLER — Busca vendas novas no ML a cada 3 minutos
// Não depende de webhooks. Consulta a API do ML diretamente.
// =====================================================
const POLL_INTERVAL_MS = 3 * 60 * 1000; // 3 minutos

async function pollMercadoLivreOrders() {
    const accountKeys = ['mercadolivre', 'mercadolivre2'];
    const channelMap = { mercadolivre: 'ml1', mercadolivre2: 'ml2' };

    for (const accountKey of accountKeys) {
        try {
            const db = readDb();
            const creds = db.credentials[accountKey];
            if (!creds || !creds.accessToken || !creds.refreshToken || !creds.userId) {
                continue; // conta não configurada, pular
            }

            const accessToken = await getValidAccessToken(accountKey, db);
            if (!accessToken) {
                console.log(`[AUTO-SYNC] Não foi possível obter token para ${accountKey}. Pulando.`);
                continue;
            }

            // Busca pedidos das últimas 6 horas
            const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
            const url = `https://api.mercadolibre.com/orders/search?seller=${creds.userId}&order.date_created.from=${since}&sort=date_desc&limit=20`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error(`[AUTO-SYNC] Erro ao buscar pedidos de ${accountKey}:`, errText);
                continue;
            }

            const data = await response.json();
            if (!data.results || data.results.length === 0) {
                continue;
            }

            // Recarrega DB fresco para cada verificação
            const freshDb = readDb();
            const existingIds = new Set(freshDb.sales.map(s => s.id));
            let newCount = 0;

            for (const order of data.results) {
                const orderId = String(order.id);

                // Pula se já existe ou se está cancelado
                if (existingIds.has(orderId)) continue;
                if (order.status === 'cancelled') continue;

                // Pula se não está pago
                if (order.status !== 'paid') continue;

                const channelId = channelMap[accountKey];
                const buyer = `${order.buyer.first_name || ''} ${order.buyer.last_name || ''}`.trim() || order.buyer.nickname || 'Comprador ML';
                const grossValue = order.total_amount;
                const todayStr = new Date().toISOString().split('T')[0];

                // Dados do produto
                const firstItem = order.order_items && order.order_items[0];
                let productId = firstItem ? firstItem.item.id : 'unknown';
                let productName = firstItem ? firstItem.item.title : 'Produto ML';
                let quantity = firstItem ? firstItem.quantity : 1;

                // Busca frete
                let shipping = 0;
                if (order.shipping && order.shipping.id) {
                    try {
                        const shipRes = await fetch(`https://api.mercadolibre.com/shipments/${order.shipping.id}`, {
                            headers: { 'Authorization': `Bearer ${accessToken}` }
                        });
                        if (shipRes.ok) {
                            const shipData = await shipRes.json();
                            if (shipData.shipping_option && shipData.shipping_option.cost !== undefined) {
                                shipping = shipData.shipping_option.cost;
                            }
                        }
                    } catch (e) {
                        // ignora erro de frete
                    }
                }

                // Verifica se o produto existe no catálogo
                let product = freshDb.products.find(p => p.id === productId || p.name.toLowerCase() === productName.toLowerCase());
                if (!product) {
                    const guessedType = productName.toLowerCase().includes('filamento') || productName.toLowerCase().includes('bico') ? 'resale' : '3d';
                    product = {
                        id: productId,
                        name: productName,
                        type: guessedType,
                        weight: guessedType === '3d' ? 100 : 0,
                        printTime: guessedType === '3d' ? 5.0 : 0,
                        filamentCost: 95.00,
                        machineHourCost: 2.00,
                        finishingCost: 2.00,
                        packagingCost: 2.50,
                        failRate: 10,
                        acquisitionCost: guessedType === 'resale' ? grossValue * 0.5 : 0,
                        isPendingConfig: true,
                        filamentId: guessedType === '3d' ? (freshDb.filaments[0]?.id || 'fil1') : undefined
                    };
                    freshDb.products.push(product);
                }

                // Baixa de estoque para produtos 3D
                if (product.type === '3d' && product.weight && product.filamentId) {
                    const totalWeight = product.weight * quantity;
                    const filament = freshDb.filaments.find(f => f.id === product.filamentId);
                    if (filament) {
                        filament.currentWeight = Math.max(0, parseFloat((filament.currentWeight - totalWeight).toFixed(1)));
                    }
                }

                // Registra a venda
                freshDb.sales.unshift({
                    id: orderId,
                    date: todayStr,
                    channelId,
                    productId: product.id,
                    quantity,
                    grossValue,
                    shipping,
                    status: 'Pago'
                });

                // Log
                freshDb.integrationLogs = freshDb.integrationLogs || [];
                freshDb.integrationLogs.push({
                    id: `log_autosync_${Date.now()}_${Math.random().toString().slice(-3)}`,
                    timestamp: new Date().toLocaleTimeString('pt-BR'),
                    type: 'success',
                    message: `🔄 [AUTO-SYNC] Pedido #${orderId} de ${buyer} importado automaticamente. Produto: "${productName}" — R$ ${grossValue.toFixed(2)}`
                });

                if (product.isPendingConfig) {
                    freshDb.integrationLogs.push({
                        id: `log_autosync_prod_${Date.now()}_${Math.random().toString().slice(-3)}`,
                        timestamp: new Date().toLocaleTimeString('pt-BR'),
                        type: 'info',
                        message: `🆕 Produto "${productName}" importado automaticamente ao catálogo.`
                    });
                }

                existingIds.add(orderId);
                newCount++;
            }

            // Limita logs e salva
            if (newCount > 0) {
                if (freshDb.integrationLogs.length > 50) {
                    freshDb.integrationLogs = freshDb.integrationLogs.slice(-50);
                }
                saveDb(freshDb);
                console.log(`[AUTO-SYNC] ✅ ${newCount} nova(s) venda(s) importada(s) da conta ${accountKey}.`);
            }
        } catch (err) {
            console.error(`[AUTO-SYNC] Erro geral ao sincronizar ${accountKey}:`, err.message);
        }
    }
}

// Atualiza status de vendas canceladas no ML
async function pollCancelledOrders() {
    try {
        const db = readDb();
        const creds = db.credentials.mercadolivre;
        if (!creds || !creds.accessToken || !creds.userId) return;

        const accessToken = await getValidAccessToken('mercadolivre', db);
        if (!accessToken) return;

        // Busca pedidos cancelados recentes
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const url = `https://api.mercadolibre.com/orders/search?seller=${creds.userId}&order.status=cancelled&order.date_created.from=${since}&limit=20`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) return;
        const data = await response.json();
        if (!data.results) return;

        const freshDb = readDb();
        let updated = false;

        for (const order of data.results) {
            const sale = freshDb.sales.find(s => s.id === String(order.id) && s.status !== 'Cancelado');
            if (sale) {
                sale.status = 'Cancelado';
                updated = true;
                console.log(`[AUTO-SYNC] Pedido #${order.id} marcado como cancelado.`);
            }
        }

        if (updated) saveDb(freshDb);
    } catch (err) {
        console.error('[AUTO-SYNC] Erro ao verificar cancelamentos:', err.message);
    }
}

app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Printou Hub - Servidor Ativo!`);
    console.log(`   Endereço: http://localhost:${PORT}`);
    console.log(`   Webhook ML: http://localhost:${PORT}/api/webhooks/mercadolivre`);
    console.log(`   Dados salvos em: ${DB_FILE}`);
    console.log(`   🔄 Auto-Sync ML: ativo (a cada ${POLL_INTERVAL_MS / 1000}s)`);
    console.log(`======================================================\n`);

    // Primeira sincronização 10 segundos após iniciar
    setTimeout(() => {
        console.log('[AUTO-SYNC] Executando primeira sincronização...');
        pollMercadoLivreOrders();
        pollCancelledOrders();
    }, 10000);

    // Poller contínuo a cada 3 minutos
    setInterval(() => {
        pollMercadoLivreOrders();
    }, POLL_INTERVAL_MS);

    // Verifica cancelamentos a cada 10 minutos
    setInterval(() => {
        pollCancelledOrders();
    }, 10 * 60 * 1000);
});
