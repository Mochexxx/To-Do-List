// Teste para verificar se as alterações de perfil são persistidas e exibidas

// Função para testar a atualização do perfil
async function testProfileUpdate() {
  console.log('🧪 Iniciando teste de atualização de perfil...');
  
  try {
    // 1. Verificar se o usuário está logado
    const currentUser = authService.getUser();
    if (!currentUser) {
      console.error('❌ Nenhum usuário logado para testar');
      return;
    }
    
    console.log('👤 Usuário atual:', currentUser.username, currentUser.email);
    
    // 2. Preparar dados de teste
    const originalUsername = currentUser.username;
    const testUsername = `${originalUsername}_teste_${Date.now()}`;
    const testData = {
      username: testUsername,
      email: currentUser.email,
      profileImage: currentUser.profileImage,
      language: 'en',
      timezone: 'America/New_York',
      notifications: false,
      defaultPriority: 'alta'
    };
    
    console.log('📝 Dados de teste:', testData);
    
    // 3. Executar atualização
    console.log('⏳ Atualizando perfil...');
    const result = await authService.updateUserInfo(testData);
    console.log('✅ Resultado da atualização:', result);
    
    // 4. Verificar se foi salvo
    const updatedUser = authService.getUser();
    console.log('👤 Usuário após atualização:', updatedUser.username, updatedUser.email);
    
    // 5. Verificar se o nome mudou na interface
    setTimeout(() => {
      const usernameElements = document.querySelectorAll('*');
      let foundUpdatedName = false;
      
      usernameElements.forEach(element => {
        if (element.textContent && element.textContent.includes(testUsername)) {
          foundUpdatedName = true;
          console.log('✅ Nome atualizado encontrado na interface:', element.textContent);
        }
      });
      
      if (!foundUpdatedName) {
        console.warn('⚠️ Nome atualizado não encontrado na interface - pode ser necessário recarregar a página');
      }
      
      // 6. Restaurar nome original
      setTimeout(async () => {
        console.log('🔄 Restaurando nome original...');
        await authService.updateUserInfo({
          username: originalUsername,
          email: currentUser.email
        });
        console.log('✅ Nome original restaurado');
      }, 2000);
      
    }, 1000);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Função para testar conectividade com backend
async function testBackendConnectivity() {
  console.log('🌐 Testando conectividade com backend...');
  
  try {
    const response = await fetch('http://localhost:5000/', { 
      method: 'GET',
      timeout: 3000 
    });
    
    if (response.ok) {
      console.log('✅ Backend está online - usando modo online');
      console.log('📊 Status do authService:', {
        isOnlineMode: authService.isOnlineMode,
        hasToken: !!authService.getToken(),
        hasUser: !!authService.getUser()
      });
    } else {
      console.log('⚠️ Backend respondeu mas com erro:', response.status);
    }
  } catch (error) {
    console.log('❌ Backend offline - usando modo offline');
    console.log('📊 Status do authService:', {
      isOnlineMode: authService.isOnlineMode,
      hasToken: !!authService.getToken(),
      hasUser: !!authService.getUser()
    });
  }
}

// Função para verificar se os dados estão sendo salvos corretamente
function verifyDataPersistence() {
  console.log('💾 Verificando persistência de dados...');
  
  const user = localStorage.getItem('user');
  const preferences = localStorage.getItem('userPreferences');
  const token = localStorage.getItem('token');
  
  console.log('🗂️ Dados no localStorage:');
  console.log('- Usuário:', user ? JSON.parse(user) : 'Não encontrado');
  console.log('- Preferências:', preferences ? JSON.parse(preferences) : 'Não encontrado');
  console.log('- Token:', token ? 'Presente' : 'Ausente');
  
  if (authService.isOnlineMode) {
    console.log('🌐 Modo online ativo - dados também devem estar no backend');
  } else {
    console.log('💻 Modo offline ativo - dados apenas no localStorage');
  }
}

// Disponibilizar funções no console para testes manuais
window.testProfileUpdate = testProfileUpdate;
window.testBackendConnectivity = testBackendConnectivity;
window.verifyDataPersistence = verifyDataPersistence;

console.log('🔧 Funções de teste disponíveis:');
console.log('- testProfileUpdate() - Testa atualização de perfil');
console.log('- testBackendConnectivity() - Verifica conectividade');
console.log('- verifyDataPersistence() - Verifica persistência');
