export type ResourceKey = "pluma" | "caroco" | "fibrilha" | "briquete";

export type Resource = {
  title: string;
  color: string;
  icon: string;
  value: string;
  stats: { fila: number; carregando: number; concluidos: number };
  vehicles: string[];
};

export type DriverStatus = "normal" | "lenta" | "atrasada";

export type Driver = {
  pos: number;
  name: string;
  placa: string;
  rolos: number;
  viagens: number;
  status: DriverStatus;
};

export type Ranking = {
  hoje: number;
  mes: number;
  drivers: Driver[];
};

export type Viagem = {
  title: string;
  lavoura: string;
  algodoeira: string;
  total: string;
  status: DriverStatus;
  when: string; // ISO timestamp of the viagem
};

export const initialResources: Record<ResourceKey, Resource> = {
  pluma: {
    title: "PLUMA",
    color: "#1E88E5",
    icon: "🪶",
    value: "475 Fardos",
    stats: { fila: 12, carregando: 3, concluidos: 460 },
    vehicles: ["ABC-1234 - 1ª Viagem", "DEF-5678 - 2ª Viagem"],

  caroco: {
    title: "CAROÇO",
    color: "#43A047",
    icon: "🌾",
    value: "41.680 KG",
    stats: { fila: 4, carregando: 1, concluidos: 200 },
    vehicles: ["GHI-9012 - 1ª Viagem"],
  },
  fibrilha: {
    title: "FIBRILHA",
    color: "#00BCD4",
    icon: "🌀",
    value: "1.240 KG",
    stats: { fila: 2, carregando: 0, concluidos: 80 },
    vehicles: ["JKL-3456 - 1ª Viagem"],
  },
  briquete: {
    title: "BRIQUETE",
    color: "#FFB300",
    icon: "🔥",
    value: "98 Unid.",
    stats: { fila: 0, carregando: 0, concluidos: 98 },
    vehicles: ["MNO-7890 - 1ª Viagem"],
  },
};

export const initialRanking: Ranking = {
  hoje: 58,
  mes: 1240,
  drivers: [
    {
      pos: 1,
      name: "João Silva",
      placa: "ABC-1234",
      rolos: 24,
      viagens: 3,
      status: "normal",
    },
    {
      pos: 2,
      name: "Marcos Lima",
      placa: "DEF-5678",
      rolos: 20,
      viagens: 4,
      status: "lenta",
    },
    {
      pos: 3,
      name: "Ana Costa",
      placa: "GHI-9012",
      rolos: 18,
      viagens: 2,
      status: "atrasada",
    },
  ],
};
