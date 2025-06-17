const NEWS_API_KEY = '100879ca703f4ce4b4aee80bcca895f3';
const NEWS_API_URL = 'https://newsapi.org/v2';

// News Service
const newsService = {
  async getTopHeadlines(country = 'pt', pageSize = 20) {
    try {
      const response = await fetch(`${NEWS_API_URL}/top-headlines?country=${country}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`);
      
      if (!response.ok) {
        console.error('Erro na resposta da API:', response.status, response.statusText);
        throw new Error(`Erro ao buscar notícias: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Verificar se há erro na resposta da API
      if (data.status === 'error') {
        console.error('Erro da NewsAPI:', data.message);
        throw new Error(data.message);
      }
      
      return data.articles || [];
    } catch (error) {
      console.error('Erro no serviço de notícias:', error);
      
      // Se for erro de CORS ou rede, retornar array vazio
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.log('Erro de CORS detectado, API de notícias não disponível');
      }
      
      return [];
    }
  },

  async searchNews(query, pageSize = 20) {
    try {
      const response = await fetch(`${NEWS_API_URL}/everything?q=${encodeURIComponent(query)}&pageSize=${pageSize}&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`);
      
      if (!response.ok) {
        console.error('Erro na resposta da API:', response.status, response.statusText);
        throw new Error(`Erro ao buscar notícias: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'error') {
        console.error('Erro da NewsAPI:', data.message);
        throw new Error(data.message);
      }
      
      return data.articles || [];
    } catch (error) {
      console.error('Erro na busca de notícias:', error);
      return [];
    }
  },
  
  async getNewsByCategory(category, country = 'us', pageSize = 20) {
    try {
      const url = `${NEWS_API_URL}/top-headlines?category=${category}&country=${country}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`;
      console.log('Fazendo requisição para:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('Erro na resposta da API:', response.status, response.statusText);
        throw new Error(`Erro ao buscar notícias: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Resposta da API:', data);
      
      if (data.status === 'error') {
        console.error('Erro da NewsAPI:', data.message);
        throw new Error(data.message);
      }
      
      return data.articles || [];
    } catch (error) {
      console.error('Erro ao buscar notícias por categoria:', error);
      
      // Se for erro de CORS, tentar com um proxy simples ou retornar vazio
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.log('Erro de CORS detectado na busca por categoria');
      }
        return [];
    }
  }
};

// Export for use in HTML
window.newsService = newsService;
