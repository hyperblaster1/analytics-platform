// src/lib/prpc-client.ts
import * as http from 'http';
import * as https from 'https';

export type PrpcResponse<T> = {
  jsonrpc: string;
  result?: T;
  error?: { code: number; message: string; data?: unknown };
  id: number;
};

export type PodInfo = {
  address: string;             // "ip:port"
  version?: string;
  last_seen?: string;          // human-readable
  last_seen_timestamp?: number;
};

export type GetPodsResult = {
  count?: number;
  pods?: PodInfo[];
  // Handle case where result might be an array directly
} | PodInfo[];

// This is a guess; refine it based on actual get-stats response structure
export type GetStatsResult = {
  cpu_percent?: number;
  uptime_seconds?: number;
  ram?: {
    used?: number;
    total?: number;
  };
  network?: {
    packets_in_per_sec?: number;
    packets_out_per_sec?: number;
    active_streams?: number;
  };
  storage?: {
    total_bytes?: number;
    total_pages?: number;
  };
};

async function prpcCall<T>(
  baseUrl: string,
  method: string
): Promise<T> {
  // Parse the base URL and construct the full RPC endpoint URL
  const cleanBaseUrl = baseUrl.trim().replace(/\/$/, '');
  
  // Validate and parse the URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(cleanBaseUrl);
  } catch (e) {
    throw new Error(`Invalid base URL format: ${cleanBaseUrl}. Error: ${e}`);
  }
  
  // Ensure it's http or https
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error(`Unsupported protocol: ${parsedUrl.protocol}. Only http and https are supported.`);
  }
  
  // Construct the RPC endpoint URL
  const rpcUrl = new URL('/rpc', parsedUrl);
  
  console.log(`[prpcCall] Calling ${method} at ${rpcUrl.toString()}`);
  
  // Use native http/https modules as undici has issues with some URLs
  const requestModule = rpcUrl.protocol === 'https:' ? https : http;
  
  const requestBody = JSON.stringify({
    jsonrpc: '2.0',
    method,
    id: 1,
  });

  const json = await new Promise<PrpcResponse<T>>((resolve, reject) => {
    const req = requestModule.request(
      rpcUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody),
        },
      },
      (res) => {
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          reject(new Error(`pRPC HTTP error ${res.statusCode} for ${method}`));
          return;
        }

        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(data) as PrpcResponse<T>;
            // Debug logging for get-pods to see actual response structure
            if (method === 'get-pods') {
              console.log(`[prpcCall] Response for ${method}:`, JSON.stringify(json, null, 2));
            }
            resolve(json);
          } catch (e) {
            reject(new Error(`Failed to parse JSON response: ${e}`));
          }
        });
      }
    );

    req.on('error', (err) => {
      reject(new Error(`pRPC request failed for ${method}: ${err.message}`));
    });

    req.write(requestBody);
    req.end();
  });

  if (json.error) {
    throw new Error(
      `pRPC error for ${method}: ${json.error.code} ${json.error.message}`
    );
  }

  if (!json.result) {
    throw new Error(`pRPC: missing result for ${method}`);
  }

  return json.result;
}

export async function getPods(baseUrl: string): Promise<GetPodsResult> {
  return prpcCall<GetPodsResult>(baseUrl, 'get-pods');
}

export async function getStats(baseUrl: string): Promise<GetStatsResult> {
  return prpcCall<GetStatsResult>(baseUrl, 'get-stats');
}

