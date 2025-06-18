const mongoose = require('mongoose');

async function cleanDatabase() {
    try {
        // Conectar ao MongoDB
        await mongoose.connect('mongodb://localhost:27017/todolist');
        console.log('✅ Conectado ao MongoDB');

        // Apagar a database completamente
        await mongoose.connection.db.dropDatabase();
        console.log('🗑️ Database apagada completamente');

        console.log('✅ Database limpa com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao limpar database:', error);
        process.exit(1);
    }
}

cleanDatabase();
