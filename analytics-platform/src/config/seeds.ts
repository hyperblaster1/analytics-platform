// src/config/seeds.ts
export type SeedConfig = {
  name: string;
  baseUrl: string;
};

export const DEFAULT_SEEDS: readonly SeedConfig[] = [
  {
    name: 'Seed 1 (192.190.136.36:6000)',
    baseUrl: 'http://192.190.136.36:6000',
  },
  {
    name: 'Seed 2 (173.212.203.145:6000)',
    baseUrl: 'http://173.212.203.145:6000',
  },
  {
    name: 'Seed 3 (173.212.220.65:6000)',
    baseUrl: 'http://173.212.220.65:6000',
  },
  {
    name: 'Seed 4 (161.97.97.41:6000)',
    baseUrl: 'http://161.97.97.41:6000',
  },
  {
    name: 'Seed 5 (192.190.136.37:6000)',
    baseUrl: 'http://192.190.136.37:6000',
  },
  {
    name: 'Seed 6 (192.190.136.38:6000)',
    baseUrl: 'http://192.190.136.38:6000',
  },
  {
    name: 'Seed 7 (192.190.136.28:6000)',
    baseUrl: 'http://192.190.136.28:6000',
  },
  {
    name: 'Seed 8 (192.190.136.29:6000)',
    baseUrl: 'http://192.190.136.29:6000',
  },
] as const;
