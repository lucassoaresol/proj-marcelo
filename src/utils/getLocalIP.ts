import { networkInterfaces } from "node:os";

export function getLocalIPs(): string[] {
  const interfaces = networkInterfaces();
  const addresses: string[] = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === "IPv4" && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }

  return addresses.length > 0 ? addresses : ["localhost"];
}
