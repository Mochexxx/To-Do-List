const NEWS_API_KEY = '100879ca703f4ce4b4aee80bcca895f3';
const NEWS_API_URL = 'https://newsapi.org/v2';

// News Service
const newsService = {
  async getTopHeadlines(country = 'pt', pageSize = 20) {
    try {
      const response = await fetch(`${NEWS_API_URL}/top-headlines?country=${country}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar notícias');
      }
      
      const data = await response.json();
      return data.articles || [];
    } catch (error) {
      console.error('Erro no serviço de notícias:', error);
      return [];
    }
  },

  async searchNews(query, pageSize = 20) {
    try {
      const response = await fetch(`${NEWS_API_URL}/everything?q=${encodeURIComponent(query)}&pageSize=${pageSize}&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar notícias');
      }
      
      const data = await response.json();
      return data.articles || [];
    } catch (error) {
      console.error('Erro na busca de notícias:', error);
      return [];
    }
  },
  async getNewsByCategory(category, country = 'us', pageSize = 20) {
    try {
      const response = await fetch(`${NEWS_API_URL}/top-headlines?category=${category}&country=${country}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar notícias');
      }
      
      const data = await response.json();
      return data.articles || [];
    } catch (error) {
      console.error('Erro ao buscar notícias por categoria:', error);
      return [];
    }
  }
};

// Export for use in HTML
window.newsService = newsService;
