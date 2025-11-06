import { ClientsManager, Database } from "pg-utils";

async function getDatabase(id: string): Promise<Database> {
  try {
    const clientsManager = await ClientsManager.getInstance();
    const client = clientsManager.getClientById(id);
    if (!client) {
      throw new Error(`Cliente com ID "${id}" não encontrado na configuração.`);
    }
    return client.getClientDatabase();
  } catch (error) {
    console.error("Erro ao inicializar o banco de dados:", error);
    throw error;
  }
}

export default getDatabase;
