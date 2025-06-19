//Colocar Aqui a Api do newsApi

const NEWS_API_KEY = '+++++++++YOUR_API_KEY+++++++++';

const NEWS_API_URL = 'https://newsapi.org/v2';

// Cache local para notícias
const newsCache = {
  data: {},
  timestamps: {},
  
  get(key) {
    const cached = this.data[key];
    const timestamp = this.timestamps[key];
    
    // Cache válido por 15 minutos
    if (cached && timestamp && (Date.now() - timestamp < 15 * 60 * 1000)) {
      console.log('Retornando notícias do cache para:', key);
      return cached;
    }
    
    return null;
  },
  
  set(key, data) {
    this.data[key] = data;
    this.timestamps[key] = Date.now();
    console.log('Cache atualizado para:', key, 'com', data.length, 'artigos');
  }
};

// News Service
const newsService = {
  async getTopHeadlines(country = 'us', pageSize = 50) {
    const cacheKey = `headlines-${country}-${pageSize}`;
    
    // Verificar cache primeiro
    const cached = newsCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    try {
      const url = `${NEWS_API_URL}/top-headlines?country=${country}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`;
      console.log('🔄 Fazendo requisição para News API:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TodoApp/1.0'
        }
      });
      
      console.log('📡 Status da resposta:', response.status);
      
      if (!response.ok) {
        console.error('❌ Erro na resposta da API:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('📄 Detalhes do erro:', errorText);
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Dados recebidos da API:', data.totalResults, 'resultados');
      
      // Verificar se há erro na resposta da API
      if (data.status === 'error') {
        console.error('❌ Erro da NewsAPI:', data.message);
        throw new Error(`NewsAPI Error: ${data.message}`);
      }
      
      const articles = data.articles || [];
      
      // Filtrar artigos válidos (sem dados incompletos)
      const validArticles = articles.filter(article => 
        article.title && 
        article.title !== '[Removed]' &&
        article.description &&
        article.url
      );
      
      console.log('📰 Artigos válidos:', validArticles.length, 'de', articles.length);
      
      // Salvar no cache
      newsCache.set(cacheKey, validArticles);
      
      return validArticles;
    } catch (error) {
      console.error('❌ Erro no serviço de notícias:', error);
      
      // Se for erro de CORS ou rede, tentar novamente após 2 segundos
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.log('🌐 Erro de CORS/rede detectado, tentando novamente...');
        
        // Retry uma vez após delay
        try {
          await new Promise(resolve => setTimeout(resolve, 2000));
          return await this.getTopHeadlines(country, pageSize);
        } catch (retryError) {
          console.log('🔄 Retry falhou, usando dados mock');
          return [];
        }
      }
      
      return [];
    }
  },
  async searchNews(query, pageSize = 50) {
    const cacheKey = `search-${query}-${pageSize}`;
    
    // Verificar cache primeiro
    const cached = newsCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    try {
      const url = `${NEWS_API_URL}/everything?q=${encodeURIComponent(query)}&pageSize=${pageSize}&sortBy=publishedAt&language=en&apiKey=${NEWS_API_KEY}`;
      console.log('🔍 Fazendo busca na News API:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TodoApp/1.0'
        }
      });
      
      if (!response.ok) {
        console.error('❌ Erro na resposta da API:', response.status, response.statusText);
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('🔍 Resultados da busca:', data.totalResults, 'encontrados');
      
      if (data.status === 'error') {
        console.error('❌ Erro da NewsAPI:', data.message);
        throw new Error(`NewsAPI Error: ${data.message}`);
      }
      
      const articles = data.articles || [];
      
      // Filtrar artigos válidos
      const validArticles = articles.filter(article => 
        article.title && 
        article.title !== '[Removed]' &&
        article.description &&
        article.url
      );
      
      // Salvar no cache
      newsCache.set(cacheKey, validArticles);
      
      return validArticles;
    } catch (error) {
      console.error('❌ Erro na busca de notícias:', error);
      return [];
    }
  },
    async getNewsByCategory(category, country = 'us', pageSize = 50, page = 1) {
    const cacheKey = `category-${category}-${country}-${pageSize}-${page}`;
    
    // Verificar cache primeiro
    const cached = newsCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    try {
      const url = `${NEWS_API_URL}/top-headlines?category=${category}&country=${country}&pageSize=${pageSize}&page=${page}&apiKey=${NEWS_API_KEY}`;
      console.log('🏷️ Fazendo requisição por categoria:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TodoApp/1.0'
        }
      });
      
      if (!response.ok) {
        console.error('❌ Erro na resposta da API:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('📄 Detalhes do erro:', errorText);
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('🏷️ Resposta da API por categoria:', data.totalResults, 'resultados');
      
      if (data.status === 'error') {
        console.error('❌ Erro da NewsAPI:', data.message);
        throw new Error(`NewsAPI Error: ${data.message}`);
      }
      
      const articles = data.articles || [];
      
      // Filtrar artigos válidos
      const validArticles = articles.filter(article => 
        article.title && 
        article.title !== '[Removed]' &&
        article.description &&
        article.url
      );
      
      console.log('✅ Artigos válidos por categoria:', validArticles.length, 'de', articles.length);
      
      // Salvar no cache
      newsCache.set(cacheKey, validArticles);
      
      return validArticles;
    } catch (error) {
      console.error('❌ Erro ao buscar notícias por categoria:', error);
      
      // Se for erro de CORS, tentar com retry
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.log('🌐 Erro de CORS detectado na busca por categoria, tentando novamente...');
        
        try {
          await new Promise(resolve => setTimeout(resolve, 1500));
          return await this.getNewsByCategory(category, country, pageSize, page);
        } catch (retryError) {
          console.log('🔄 Retry falhou para categoria, usando dados mock');
          return [];
        }
      }
      
      return [];
    }
  },

  // Verificar se a API está disponível
  async checkApiHealth() {
    try {
      console.log('🏥 Verificando saúde da NewsAPI...');
      const response = await fetch(`${NEWS_API_URL}/top-headlines?country=us&pageSize=1&apiKey=${NEWS_API_KEY}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TodoApp/1.0'
        }
      });
      
      const isHealthy = response.ok;
      console.log(isHealthy ? '✅ NewsAPI está funcionando' : '❌ NewsAPI com problemas');
      
      return isHealthy;
    } catch (error) {
      console.log('❌ NewsAPI indisponível:', error.message);
      return false;
    }
  },

  // Limpar cache manualmente
  clearCache() {
    newsCache.data = {};
    newsCache.timestamps = {};
    console.log('🗑️ Cache de notícias limpo');
  }
};

// Export for use in HTML
window.newsService = newsService;
