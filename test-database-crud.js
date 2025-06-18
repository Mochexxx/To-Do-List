// Script para testar CRUD completo da database
// Este script testa Users, Tasks e Events

const API_BASE_URL = 'http://localhost:5000/api';

class DatabaseCRUDTester {
    constructor() {
        this.testResults = {
            users: { create: false, read: false, update: false, delete: false },
            tasks: { create: false, read: false, update: false, delete: false },
            events: { create: false, read: false, update: false, delete: false }
        };
        this.authToken = null;
        this.testUserId = null;
        this.testTaskId = null;
        this.testEventId = null;
    }

    async makeRequest(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        return response.json();
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
        console.log(`[${timestamp}] ${emoji} ${message}`);
    }

    // ==================== USERS CRUD ====================
    async testUsersCRUD() {
        this.log('🔐 Testando CRUD de Usuários...', 'info');

        try {
            // CREATE - Registrar usuário
            const userData = {
                name: 'Test User CRUD',
                email: `test.crud.${Date.now()}@example.com`,
                password: 'TestPassword123!',
                country: 'pt'
            };

            const registerResponse = await this.makeRequest(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                body: JSON.stringify(userData)
            });

            this.authToken = registerResponse.token;
            this.testUserId = registerResponse.user.id;
            this.testResults.users.create = true;
            this.log('Usuário criado com sucesso', 'success');

            // READ - Buscar perfil do usuário
            const profileResponse = await this.makeRequest(`${API_BASE_URL}/auth/profile`);
            if (profileResponse.user.email === userData.email) {
                this.testResults.users.read = true;
                this.log('Perfil do usuário lido com sucesso', 'success');
            }

            // UPDATE - Atualizar perfil
            const updateData = {
                name: 'Test User CRUD Updated',
                email: userData.email, // Manter o mesmo email
                country: 'br'
            };

            const updateResponse = await this.makeRequest(`${API_BASE_URL}/auth/profile`, {
                method: 'PUT',
                body: JSON.stringify(updateData)
            });

            if (updateResponse.user.name === updateData.name && updateResponse.user.country === updateData.country) {
                this.testResults.users.update = true;
                this.log('Perfil do usuário atualizado com sucesso', 'success');
            }            // DELETE - Excluir usuário
            await this.makeRequest(`${API_BASE_URL}/auth/profile`, {
                method: 'DELETE',
                body: JSON.stringify({ confirmation: 'ELIMINAR' })
            });
            this.testResults.users.delete = true;
            this.log('Usuário excluído com sucesso', 'success');

        } catch (error) {
            this.log(`Erro no teste de usuários: ${error.message}`, 'error');
        }
    }

    // ==================== TASKS CRUD ====================
    async testTasksCRUD() {
        this.log('📝 Testando CRUD de Tarefas...', 'info');

        try {
            // Primeiro, criar um usuário para os testes de tasks
            await this.createTestUser();            // CREATE - Criar tarefa
            const taskData = {
                title: 'Tarefa de Teste CRUD',
                description: 'Esta é uma tarefa para testar o CRUD',
                priority: 'alta',
                category: 'trabalho',
                estimatedDuration: '2h',
                dueDate: new Date(Date.now() + 86400000).toISOString() // Amanhã
            };            const createTaskResponse = await this.makeRequest(`${API_BASE_URL}/tasks`, {
                method: 'POST',
                body: JSON.stringify(taskData)
            });

            this.testTaskId = createTaskResponse._id;
            this.testResults.tasks.create = true;
            this.log('Tarefa criada com sucesso', 'success');            // READ - Buscar tarefas
            const tasksResponse = await this.makeRequest(`${API_BASE_URL}/tasks`);
            if (tasksResponse.length > 0 && tasksResponse.some(t => t._id === this.testTaskId)) {
                this.testResults.tasks.read = true;
                this.log('Tarefas lidas com sucesso', 'success');
            }// UPDATE - Atualizar tarefa
            const updateTaskData = {
                title: 'Tarefa de Teste CRUD Atualizada',
                description: 'Descrição atualizada',
                priority: 'média',
                status: 'em progresso'
            };            const updateTaskResponse = await this.makeRequest(`${API_BASE_URL}/tasks/${this.testTaskId}`, {
                method: 'PUT',
                body: JSON.stringify(updateTaskData)
            });

            if (updateTaskResponse.title === updateTaskData.title) {
                this.testResults.tasks.update = true;
                this.log('Tarefa atualizada com sucesso', 'success');
            }

            // DELETE - Excluir tarefa
            await this.makeRequest(`${API_BASE_URL}/tasks/${this.testTaskId}`, {
                method: 'DELETE'
            });
            this.testResults.tasks.delete = true;
            this.log('Tarefa excluída com sucesso', 'success');

        } catch (error) {
            this.log(`Erro no teste de tarefas: ${error.message}`, 'error');
        }
    }

    // ==================== EVENTS CRUD ====================
    async testEventsCRUD() {
        this.log('📅 Testando CRUD de Eventos...', 'info');

        try {
            // Usar o mesmo usuário de teste
            if (!this.authToken) {
                await this.createTestUser();
            }

            // CREATE - Criar evento
            const eventData = {
                title: 'Evento de Teste CRUD',
                description: 'Este é um evento para testar o CRUD',
                date: new Date().toISOString().split('T')[0], // Hoje
                time: '14:30',
                type: 'meeting',
                priority: 'high'
            };

            const createEventResponse = await this.makeRequest(`${API_BASE_URL}/events`, {
                method: 'POST',
                body: JSON.stringify(eventData)
            });

            this.testEventId = createEventResponse.event._id;
            this.testResults.events.create = true;
            this.log('Evento criado com sucesso', 'success');

            // READ - Buscar eventos
            const eventsResponse = await this.makeRequest(`${API_BASE_URL}/events`);
            if (eventsResponse.events.length > 0 && eventsResponse.events.some(e => e._id === this.testEventId)) {
                this.testResults.events.read = true;
                this.log('Eventos lidos com sucesso', 'success');
            }

            // UPDATE - Atualizar evento
            const updateEventData = {
                title: 'Evento de Teste CRUD Atualizado',
                description: 'Descrição atualizada do evento',
                time: '15:30',
                priority: 'medium'
            };

            const updateEventResponse = await this.makeRequest(`${API_BASE_URL}/events/${this.testEventId}`, {
                method: 'PUT',
                body: JSON.stringify(updateEventData)
            });

            if (updateEventResponse.event.title === updateEventData.title) {
                this.testResults.events.update = true;
                this.log('Evento atualizado com sucesso', 'success');
            }

            // DELETE - Excluir evento
            await this.makeRequest(`${API_BASE_URL}/events/${this.testEventId}`, {
                method: 'DELETE'
            });
            this.testResults.events.delete = true;
            this.log('Evento excluído com sucesso', 'success');

        } catch (error) {
            this.log(`Erro no teste de eventos: ${error.message}`, 'error');
        }
    }    // Método auxiliar para criar usuário de teste
    async createTestUser() {
        const uniqueId = Date.now() + Math.random();
        const userData = {
            name: `Test User for CRUD ${uniqueId}`,
            email: `test.crud.${uniqueId}@example.com`,
            password: 'TestPassword123!',
            country: 'pt'
        };

        const registerResponse = await this.makeRequest(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        this.authToken = registerResponse.token;
        this.testUserId = registerResponse.user.id;
    }

    // ==================== EXECUTAR TODOS OS TESTES ====================
    async runAllTests() {
        this.log('🚀 Iniciando testes de CRUD da Database...', 'info');
        this.log('='.repeat(50), 'info');

        await this.testUsersCRUD();
        await this.testTasksCRUD();
        await this.testEventsCRUD();

        this.log('='.repeat(50), 'info');
        this.log('📊 RELATÓRIO FINAL DOS TESTES', 'info');
        this.log('='.repeat(50), 'info');

        // Relatório detalhado
        Object.keys(this.testResults).forEach(entity => {
            this.log(`\n${entity.toUpperCase()}:`, 'info');
            Object.keys(this.testResults[entity]).forEach(operation => {
                const status = this.testResults[entity][operation];
                const emoji = status ? '✅' : '❌';
                this.log(`  ${operation.toUpperCase()}: ${emoji} ${status ? 'PASSOU' : 'FALHOU'}`, status ? 'success' : 'error');
            });
        });

        // Resumo geral
        const totalTests = Object.values(this.testResults).reduce((total, entity) => 
            total + Object.keys(entity).length, 0);
        const passedTests = Object.values(this.testResults).reduce((total, entity) => 
            total + Object.values(entity).filter(Boolean).length, 0);

        this.log('='.repeat(50), 'info');
        this.log(`📈 RESUMO: ${passedTests}/${totalTests} testes passaram (${Math.round(passedTests/totalTests*100)}%)`, 
            passedTests === totalTests ? 'success' : 'error');
        
        if (passedTests === totalTests) {
            this.log('🎉 Todos os testes de CRUD passaram! Database está funcionando corretamente.', 'success');
        } else {
            this.log('⚠️ Alguns testes falharam. Verifique os logs acima para detalhes.', 'error');
        }
    }
}

// Executar os testes quando o script for carregado
if (typeof window !== 'undefined') {
    // Executar no navegador
    window.DatabaseCRUDTester = DatabaseCRUDTester;
    window.testDatabaseCRUD = async () => {
        const tester = new DatabaseCRUDTester();
        await tester.runAllTests();
    };
    
    console.log('🔧 Script de teste de CRUD carregado!');
    console.log('💡 Execute: testDatabaseCRUD() para iniciar os testes');
} else {
    // Executar no Node.js
    const tester = new DatabaseCRUDTester();
    tester.runAllTests().catch(console.error);
}
