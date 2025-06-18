const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Task = require('./models/Task');
const Event = require('./models/Event');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/todolist';

async function testDatabase() {
  try {
    console.log('🔄 Conectando à base de dados...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Conexão com MongoDB estabelecida com sucesso!');
    console.log(`📍 URI: ${mongoUri}`);
    
    // Testar se as coleções existem
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📋 Coleções disponíveis:');
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });
    
    // Contar documentos em cada modelo
    console.log('\n📊 Estatísticas:');
    const userCount = await User.countDocuments();
    const taskCount = await Task.countDocuments();
    const eventCount = await Event.countDocuments();
    
    console.log(`  👤 Utilizadores: ${userCount}`);
    console.log(`  📝 Tarefas: ${taskCount}`);
    console.log(`  📅 Eventos: ${eventCount}`);
    
    console.log('\n✅ Teste da base de dados concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao conectar à base de dados:', error.message);
    console.log('\n🔧 Soluções possíveis:');
    console.log('  1. Certifique-se de que o MongoDB está a correr');
    console.log('  2. Execute: start-mongodb.bat');
    console.log('  3. Verifique se a porta 27017 está disponível');
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Conexão fechada.');
    process.exit(0);
  }
}

testDatabase();
