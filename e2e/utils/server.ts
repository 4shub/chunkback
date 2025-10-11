import { createServer } from '../../src/server/create-server/create-server';
import type { Express } from 'express';

let serverInstance: Express | null = null;
let serverHandle: any = null;

export async function startTestServer(port: number = 3001): Promise<string> {
  if (serverInstance) {
    return `http://localhost:${port}`;
  }

  serverInstance = createServer();

  return new Promise((resolve, reject) => {
    serverHandle = serverInstance!.listen(port, () => {
      resolve(`http://localhost:${port}`);
    }).on('error', reject);
  });
}

export async function stopTestServer(): Promise<void> {
  if (serverHandle) {
    return new Promise((resolve, reject) => {
      serverHandle.close((err: Error) => {
        if (err) reject(err);
        else {
          serverInstance = null;
          serverHandle = null;
          resolve();
        }
      });
    });
  }
}
