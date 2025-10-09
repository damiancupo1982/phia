export interface Car {
  id: string;
  name: string;
  type?: string;
  fuel?: string;
  deposit?: number;
  lowSeasonPrice: number;
  highSeasonPrice: number;
  seats?: number;
}

export interface SeasonSettings {
  highSeasonStart: string;
  highSeasonEnd: string;
}

export interface BudgetItem {
  carId: string;
  carName: string;
  carType?: string;
  carFuel?: string;
  price: number;
  pricePerDay: number;
  season: 'alta' | 'baja';
  originalPricePerDay: number;
  manuallyEdited: boolean;
}

export interface Budget {
  id: string;
  reservationNumber: string;
  clientName: string;
  startDate: string;
  endDate: string;
  items: BudgetItem[];
  total: number;
  createdAt: string;
  days: number;
  pdfBase64?: string;
  imageBase64?: string;
}

export interface CarFilters {
  type: string;
  fuel: string;
  seats: string;
  priceRange: [number, number];
  searchTerm: string;
}