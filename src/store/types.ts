export type PackSizeMl = 250 | 500 | 1000 | 5000;

export type Product = {
  productId: string;
  name: string;
  articleNo: string;
  viscosity?: string;
  makeTimeMinPerL: number;
  fillFactor?: number;
};

export type Line = {
  lineId: string;
  name: string;
  fillRates: Record<PackSizeMl, number>;
};

export type Stirrer = {
  rwId: string;
  name: string;
};

export type MasterData = {
  products: Product[];
  lines: Line[];
  stirrers: Stirrer[];
};

export type Order = {
  id: string;
  orderNo: string;
  productId: string;
  amountL: number;
  packSizeMl: PackSizeMl;
  lineId: string;
  fillStart: string;
  fillEnd: string;
  makeStart: string;
  makeEnd: string;
  parentOrderId?: string;
  optionalOrderRef?: string;
  createdAt: string;
  updatedAt: string;
};

export type RWAssignment = {
  orderId: string;
  rwId: string;
  rwStart: string;
  rwEnd: string;
};

export type ProductionStatus = 'läuft' | 'pausiert' | 'fertig';

export type ISTUpdate = {
  id: string;
  orderId: string;
  rwId: string;
  status: ProductionStatus;
  remainingL: number;
  filledL: number;
  timestamp: string;
};

export type HistoryEntryType =
  | 'create'
  | 'edit'
  | 'move'
  | 'split'
  | 'assign'
  | 'ist'
  | 'masterdata'
  | 'import'
  | 'delete';

export type HistoryEntry = {
  id: string;
  timestamp: string;
  type: HistoryEntryType;
  message: string;
  payload?: Record<string, unknown>;
};

export type AppMeta = {
  usedOrderNumbers: string[];
  ui: {
    workWindowHours: number;
    zoomLevel: number;
  };
  config?: {
    defaultLineId?: string;
    autoAssignRW?: boolean;
  };
};
