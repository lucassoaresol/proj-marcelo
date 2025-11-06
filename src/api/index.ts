import { env } from "../config/env";
import { getLocalIPs } from "../utils/getLocalIP";

import app from "./app";

async function main() {
  await app.listen({ host: "0.0.0.0", port: env.port });

  const ips = getLocalIPs();

  console.log(`🚀 Servidor iniciado na porta ${env.port}`);
  console.log("🌐 Acessível em:");

  for (const ip of ips) {
    console.log(`   → http://${ip}:${env.port}`);
  }
}

main();
