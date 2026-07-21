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
        site: { apiKey: '', apiSecret: '', webhookUrl: 'http://localhost:3001/api/webhooks/site', status: 'Não Sincronizado' }
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
        const data = req.body;
        saveDb(data);
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

app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Printou Hub - Banco de Dados Local Ativo!`);
    console.log(`   Endereço: http://localhost:${PORT}`);
    console.log(`   Webhook Mercado Livre: http://localhost:${PORT}/api/webhooks/mercadolivre`);
    console.log(`   Webhook Shopee: http://localhost:${PORT}/api/webhooks/shopee`);
    console.log(`   Dados salvos em: ${DB_FILE}`);
    console.log(`======================================================\n`);
});
