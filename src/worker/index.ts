import {
  createGoogleContactWorker,
  excludeGoogleContactWorker,
  updateGoogleContactWorker,
} from "./services/google";
import {
  createNotionContactWorker,
  createNotionTagWorker,
  excludeNotionContactWorker,
  excludeNotionTagWorker,
  updateNotionContactWorker,
  updateNotionTagWorker,
} from "./services/notion";

createGoogleContactWorker.on("completed", (job) => {
  console.log(
    `✅ [Sucesso] [CREATE GOOGLE CONTACT] Tarefa ID ${job.id} processada com sucesso.`,
  );
  console.log(`Detalhes do Job: ${JSON.stringify(job.data)}`);
});

createGoogleContactWorker.on("failed", async (job, err) => {
  console.error(
    `❌ [Erro] [CREATE GOOGLE CONTACT] Falha ao processar a tarefa ID ${job?.id}. Motivo: ${err.message}`,
  );
  console.error(`Detalhes do Job: ${JSON.stringify(job?.data)}`);
});

excludeGoogleContactWorker.on("completed", (job) => {
  console.log(
    `✅ [Sucesso] [EXCLUDE GOOGLE CONTACT] Tarefa ID ${job.id} processada com sucesso.`,
  );
  console.log(`Detalhes do Job: ${JSON.stringify(job.data)}`);
});

excludeGoogleContactWorker.on("failed", async (job, err) => {
  console.error(
    `❌ [Erro] [EXCLUDE GOOGLE CONTACT] Falha ao processar a tarefa ID ${job?.id}. Motivo: ${err.message}`,
  );
  console.error(`Detalhes do Job: ${JSON.stringify(job?.data)}`);
});

updateGoogleContactWorker.on("completed", (job) => {
  console.log(
    `✅ [Sucesso] [UPDATE GOOGLE CONTACT] Tarefa ID ${job.id} processada com sucesso.`,
  );
  console.log(`Detalhes do Job: ${JSON.stringify(job.data)}`);
});

updateGoogleContactWorker.on("failed", async (job, err) => {
  console.error(
    `❌ [Erro] [UPDATE GOOGLE CONTACT] Falha ao processar a tarefa ID ${job?.id}. Motivo: ${err.message}`,
  );
  console.error(`Detalhes do Job: ${JSON.stringify(job?.data)}`);
});

createNotionTagWorker.on("completed", (job) => {
  console.log(
    `✅ [Sucesso] [CREATE NOTION TAG] Tarefa ID ${job.id} processada com sucesso.`,
  );
  console.log(`Detalhes do Job: ${JSON.stringify(job.data)}`);
});

createNotionTagWorker.on("failed", async (job, err) => {
  console.error(
    `❌ [Erro] [CREATE NOTION TAG] Falha ao processar a tarefa ID ${job?.id}. Motivo: ${err.message}`,
  );
  console.error(`Detalhes do Job: ${JSON.stringify(job?.data)}`);
});

updateNotionTagWorker.on("completed", (job) => {
  console.log(
    `✅ [Sucesso] [UPDATE NOTION TAG] Tarefa ID ${job.id} processada com sucesso.`,
  );
  console.log(`Detalhes do Job: ${JSON.stringify(job.data)}`);
});

updateNotionTagWorker.on("failed", async (job, err) => {
  console.error(
    `❌ [Erro] [UPDATE NOTION TAG] Falha ao processar a tarefa ID ${job?.id}. Motivo: ${err.message}`,
  );
  console.error(`Detalhes do Job: ${JSON.stringify(job?.data)}`);
});

excludeNotionTagWorker.on("completed", (job) => {
  console.log(
    `✅ [Sucesso] [EXCLUDE NOTION TAG] Tarefa ID ${job.id} processada com sucesso.`,
  );
  console.log(`Detalhes do Job: ${JSON.stringify(job.data)}`);
});

excludeNotionTagWorker.on("failed", async (job, err) => {
  console.error(
    `❌ [Erro] [EXCLUDE NOTION TAG] Falha ao processar a tarefa ID ${job?.id}. Motivo: ${err.message}`,
  );
  console.error(`Detalhes do Job: ${JSON.stringify(job?.data)}`);
});

createNotionContactWorker.on("completed", (job) => {
  console.log(
    `✅ [Sucesso] [CREATE NOTION CONTACT] Tarefa ID ${job.id} processada com sucesso.`,
  );
  console.log(`Detalhes do Job: ${JSON.stringify(job.data)}`);
});

createNotionContactWorker.on("failed", async (job, err) => {
  console.error(
    `❌ [Erro] [CREATE NOTION CONTACT] Falha ao processar a tarefa ID ${job?.id}. Motivo: ${err.message}`,
  );
  console.error(`Detalhes do Job: ${JSON.stringify(job?.data)}`);
});

updateNotionContactWorker.on("completed", (job) => {
  console.log(
    `✅ [Sucesso] [UPDATE NOTION CONTACT] Tarefa ID ${job.id} processada com sucesso.`,
  );
  console.log(`Detalhes do Job: ${JSON.stringify(job.data)}`);
});

updateNotionContactWorker.on("failed", async (job, err) => {
  console.error(
    `❌ [Erro] [UPDATE NOTION CONTACT] Falha ao processar a tarefa ID ${job?.id}. Motivo: ${err.message}`,
  );
  console.error(`Detalhes do Job: ${JSON.stringify(job?.data)}`);
});

excludeNotionContactWorker.on("completed", (job) => {
  console.log(
    `✅ [Sucesso] [EXCLUDE NOTION CONTACT] Tarefa ID ${job.id} processada com sucesso.`,
  );
  console.log(`Detalhes do Job: ${JSON.stringify(job.data)}`);
});

excludeNotionContactWorker.on("failed", async (job, err) => {
  console.error(
    `❌ [Erro] [EXCLUDE NOTION CONTACT] Falha ao processar a tarefa ID ${job?.id}. Motivo: ${err.message}`,
  );
  console.error(`Detalhes do Job: ${JSON.stringify(job?.data)}`);
});
