# Guia de Integração Oficial: Conectando seus Canais de Venda

Este guia descreve os passos exatos para obter as chaves de API e configurar os Webhooks reais das suas lojas (Mercado Livre, Shopee e Site Próprio) para que a plataforma **Printou Sales Hub** receba as vendas em tempo real.

---

## 🟡 1. Integração com o Mercado Livre

Para receber vendas do Mercado Livre, você precisa cadastrar um aplicativo no portal de desenvolvedores deles.

### Passo a Passo:
1. **Acesse o Portal de Desenvolvedores**:
   - Entre em [developers.mercadolivre.com.br](https://developers.mercadolivre.com.br/) e faça login com a conta da sua loja.
2. **Criar um Aplicativo**:
   - Clique em **Meus Aplicativos** ➔ **Criar aplicativo**.
   - Dê um nome (ex: `Printou Sales Hub`).
   - No campo **URL de Retorno (Redirect URI)**, coloque a URL do seu sistema:
     `https://printou-sales-hub.onrender.com`
3. **Configurar o Webhook (Notificações)**:
   - No campo **URL de Notificações de Tópicos (Callbacks)**, insira:
     `https://printou-sales-hub.onrender.com/api/webhooks/mercadolivre`
   - No seletor de tópicos, marque a opção **orders** (pedidos) e **created** (criados).
4. **Obter Chaves**:
   - Após salvar, o Mercado Livre gerará o seu **App ID (Client ID)** e a **Secret Key (Client Secret)**.
5. **Salvar no Printou Hub**:
   - Vá na aba **Integrações** do seu sistema, cole essas chaves no card do Mercado Livre e clique em **Salvar**.

---

## 🟠 2. Integração com a Shopee

A Shopee exige um cadastro no programa de desenvolvedores deles para liberar as chaves.

### Passo a Passo:
1. **Acesse o Shopee Open Platform**:
   - Entre em [open.shopee.com](https://open.shopee.com/) e registre-se como desenvolvedor.
2. **Criar um Console App**:
   - Vá em **App Console** ➔ **Create App**.
   - Escolha o tipo de aplicativo de integração de loja única.
3. **Configurar Webhook**:
   - No painel do seu App na Shopee, vá em **Push Settings** ou **Webhook Settings**.
   - Insira a URL de notificações da Shopee:
     `https://printou-sales-hub.onrender.com/api/webhooks/shopee`
   - Selecione para receber eventos de **Order Status** (Status de Pedidos).
4. **Obter Chaves**:
   - Copie o seu **Partner ID (Shop ID)** e a **API Key (API Secret Key)**.
5. **Salvar no Printou Hub**:
   - Vá na aba **Integrações** do seu sistema, cole no card da Shopee e clique em **Salvar**.

---

## 🔵 3. Integração com Site Próprio (Exemplo: WooCommerce)

Se a sua loja virtual for em WooCommerce (WordPress), a integração é feita direto pelas chaves da API REST e Webhooks.

### Passo a Passo:
1. **Acesse seu painel WordPress**:
   - Vá em **WooCommerce** ➔ **Configurações** ➔ **Avançado** ➔ **Chaves REST API**.
2. **Gerar Nova Chave**:
   - Clique em **Adicionar chave**.
   - Descrição: `Printou Sales Hub`.
   - Permissão: **Ler/Escrever**.
   - Clique em **Gerar chave de API**.
3. **Obter Chaves**:
   - Copie a **Chave do cliente (API Key)** e o **Segredo do cliente (API Secret)**.
   - Cole-os no card correspondente na aba **Integrações** do seu sistema.
4. **Criar o Webhook no WordPress**:
   - Vá em **WooCommerce** ➔ **Configurações** ➔ **Avançado** ➔ **Webhooks**.
   - Clique em **Adicionar webhook**.
   - Ação (Tópico): **Pedido criado**.
   - URL de entrega: `https://printou-sales-hub.onrender.com/api/webhooks/site`
   - Salve o webhook.

---

## 💡 Informações Importantes sobre Segurança
* As chaves salvas são armazenadas **criptografadas** localmente no seu banco de dados na nuvem e nunca saem do seu servidor.
* Lembre-se que as chaves de API servem para que a plataforma consulte dados de produtos caso eles ainda não estejam cadastrados quando a venda cair.
