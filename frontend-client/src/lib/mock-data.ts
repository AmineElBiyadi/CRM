export interface Client {
  id: string;
  name: string;
  type: "Acheteur" | "Vendeur";
  email: string;
  phone: string;
  budget: string;
  source: string;
  agent: string;
  stage: "froid" | "tiede" | "chaud" | "negociation" | "cloture" | "perdu";
  score: number;
  lastInteraction: string;
  recommendation: string;
}

export const clients: Client[] = [
  { id: "1", name: "Karim Benchekroun", type: "Acheteur", email: "karim.b@mail.com", phone: "+212 661 12 34 56", budget: "2.4M MAD", source: "Site web", agent: "Sara El Idrissi", stage: "chaud", score: 86, lastInteraction: "il y a 2j", recommendation: "Proposer 3 biens à Anfa cette semaine" },
  { id: "2", name: "Leila Tazi", type: "Vendeur", email: "leila.t@mail.com", phone: "+212 662 99 88 77", budget: "5.0M MAD", source: "Recommandation", agent: "Sara El Idrissi", stage: "negociation", score: 78, lastInteraction: "hier", recommendation: "Relancer pour signature compromis" },
  { id: "3", name: "Youssef Amrani", type: "Acheteur", email: "youssef.a@mail.com", phone: "+212 663 45 67 89", budget: "1.2M MAD", source: "Facebook Ads", agent: "Mehdi Bouazza", stage: "tiede", score: 62, lastInteraction: "il y a 5j", recommendation: "Envoyer sélection appartements Maarif" },
  { id: "4", name: "Nadia Cherkaoui", type: "Acheteur", email: "nadia.c@mail.com", phone: "+212 664 11 22 33", budget: "3.8M MAD", source: "Site web", agent: "Sara El Idrissi", stage: "froid", score: 34, lastInteraction: "il y a 12j", recommendation: "Email de réveil personnalisé" },
  { id: "5", name: "Omar Slaoui", type: "Vendeur", email: "omar.s@mail.com", phone: "+212 665 77 88 99", budget: "8.5M MAD", source: "LinkedIn", agent: "Mehdi Bouazza", stage: "cloture", score: 95, lastInteraction: "il y a 1j", recommendation: "Demander recommandation et avis" },
  { id: "6", name: "Imane Bennani", type: "Acheteur", email: "imane.b@mail.com", phone: "+212 666 33 44 55", budget: "1.8M MAD", source: "Bouche-à-oreille", agent: "Sara El Idrissi", stage: "chaud", score: 81, lastInteraction: "il y a 3j", recommendation: "Planifier visite ce week-end" },
  { id: "7", name: "Hicham Drissi", type: "Acheteur", email: "hicham.d@mail.com", phone: "+212 667 22 11 00", budget: "2.0M MAD", source: "Instagram", agent: "Mehdi Bouazza", stage: "perdu", score: 12, lastInteraction: "il y a 28j", recommendation: "Marquer perdu — concurrent" },
  { id: "8", name: "Fatima Ouali", type: "Vendeur", email: "fatima.o@mail.com", phone: "+212 668 55 66 77", budget: "4.2M MAD", source: "Site web", agent: "Yasmine Chraibi", stage: "negociation", score: 73, lastInteraction: "il y a 4j", recommendation: "Préparer contre-proposition" },
];

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  active: boolean;
  activeClients: number;
  closedThisMonth: number;
  lastActivity: string;
}

export const agents: Agent[] = [
  { id: "a1", name: "Sara El Idrissi", email: "sara@smartestate.ma", phone: "+212 661 00 11 22", active: true, activeClients: 18, closedThisMonth: 4, lastActivity: "il y a 12 min" },
  { id: "a2", name: "Mehdi Bouazza", email: "mehdi@smartestate.ma", phone: "+212 661 33 44 55", active: true, activeClients: 14, closedThisMonth: 2, lastActivity: "il y a 1h" },
  { id: "a3", name: "Yasmine Chraibi", email: "yasmine@smartestate.ma", phone: "+212 661 66 77 88", active: true, activeClients: 22, closedThisMonth: 5, lastActivity: "il y a 3h" },
  { id: "a4", name: "Anas Filali", email: "anas@smartestate.ma", phone: "+212 661 99 00 11", active: false, activeClients: 0, closedThisMonth: 0, lastActivity: "il y a 14j" },
  { id: "a5", name: "Salma Berrada", email: "salma@smartestate.ma", phone: "+212 662 12 34 56", active: true, activeClients: 11, closedThisMonth: 3, lastActivity: "hier" },
  { id: "a6", name: "Tarik Hassani", email: "tarik@smartestate.ma", phone: "+212 662 78 90 12", active: true, activeClients: 9, closedThisMonth: 1, lastActivity: "il y a 2j" },
];

export interface Property {
  id: string;
  address: string;
  city: string;
  price: string;
  surface: string;
  rooms: number;
  floor: string;
  status: "En examen" | "Visitée" | "Écartée" | "Proposée";
  image: string;
  source: string;
}

export const properties: Property[] = [
  { id: "p1", address: "Résidence Al Manar, Anfa", city: "Casablanca", price: "2.3M MAD", surface: "120 m²", rooms: 3, floor: "5ème", status: "Visitée", image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600", source: "Mubawab" },
  { id: "p2", address: "Villa Bois de Boulogne", city: "Casablanca", price: "5.8M MAD", surface: "320 m²", rooms: 5, floor: "RDC + 1", status: "En examen", image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600", source: "Avito" },
  { id: "p3", address: "Appt. Maarif Extension", city: "Casablanca", price: "1.4M MAD", surface: "85 m²", rooms: 2, floor: "3ème", status: "Proposée", image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600", source: "Mubawab" },
  { id: "p4", address: "Duplex Gauthier", city: "Casablanca", price: "3.2M MAD", surface: "180 m²", rooms: 4, floor: "6/7", status: "En examen", image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600", source: "Sarouty" },
];

export const pipelineStages = [
  { key: "froid", label: "Froid", color: "bg-alice" },
  { key: "tiede", label: "Tiède", color: "bg-honeydew" },
  { key: "chaud", label: "Chaud", color: "bg-vanilla" },
  { key: "negociation", label: "Négociation", color: "bg-[oklch(0.82_0.1_55)]" },
  { key: "cloture", label: "Clôturé", color: "bg-[oklch(0.75_0.12_145)]" },
  { key: "perdu", label: "Perdu", color: "bg-[oklch(0.78_0.01_270)]" },
] as const;
