// src/components/BudgetGenerator.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Car, SeasonSettings, Budget, BudgetItem, CarFilters } from '../types';
import { FileText, Download, Calculator, MessageCircle, Search, Filter, X, Copy } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import html2canvas from 'html2canvas';

interface Props {
  cars: Car[];
  seasonSettings: SeasonSettings;
  budgets: Budget[];
  setBudgets: React.Dispatch<React.SetStateAction<Budget[]>>;
  companyLogo: string | null;
  lastClientName: string;
  setLastClientName: React.Dispatch<React.SetStateAction<string>>;
  reservationCounter: number;
  setReservationCounter: React.Dispatch<React.SetStateAction<number>>;
}

/** Normaliza distintos esquemas de autos que pueden venir desde "Gestión de autos" */
type CarNormalized = {
  id: string;
  name: string;
  type?: string;
  fuel?: string;
  seats?: number;
  lowSeasonPrice: number;   // siempre numérico (0 si no hay)
  highSeasonPrice: number;  // siempre numérico (>= lowSeasonPrice si solo hay un precio)
};

function toNumberSafe(v: any, fallback = 0): number {
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeCar(c: any): CarNormalized {
  // Intentar mapear múltiples nombres posibles
  const low =
    toNumberSafe(c.lowSeasonPrice) ||
    toNumberSafe(c.priceLow) ||
    toNumberSafe(c.precioBaja) ||
    toNumberSafe(c.price) ||               // precio único
    toNumberSafe(c.pricePerDay) ||
    0;

  const high =
    toNumberSafe(c.highSeasonPrice) ||
    toNumberSafe(c.priceHigh) ||
    toNumberSafe(c.precioAlta) ||
    low; // si no hay alta, usar el de baja

  const seats =
    c.seats != null
      ? Number(c.seats)
      : c.plazas != null
      ? Number(c.plazas)
      : undefined;

  return {
    id: String(c.id ?? c._id ?? crypto.randomUUID()),
    name: String(c.name ?? c.modelo ?? c.title ?? 'Vehículo'),
    type: c.type ?? c.tipo ?? c.category ?? undefined,
    fuel: c.fuel ?? c.combustible ?? undefined,
    seats: Number.isFinite(seats as number) ? (seats as number) : undefined,
    lowSeasonPrice: low,
    highSeasonPrice: Math.max(high, low),
  };
}

export default function BudgetGenerator({
  cars,
  seasonSettings,
  budgets,
  setBudgets,
  companyLogo,
  lastClientName,
  setLastClientName,
  reservationCounter,
  setReservationCounter,
}: Props) {
  // Normalizar inventario UNA vez por cambio de cars
  const normalizedCars = useMemo<CarNormalized[]>(
    () => (Array.isArray(cars) ? cars.map(normalizeCar) : []),
    [cars]
  );

  // Calcular máximos dinámicos para el slider de precio (según inventario)
  const maxLowPrice = useMemo(
    () =>
      normalizedCars.length
        ? Math.max(...normalizedCars.map((c) => c.lowSeasonPrice || 0), 300)
        : 300,
    [normalizedCars]
  );

  const [formData, setFormData] = useState({
    clientName: lastClientName,
    reservationNumber: `#${reservationCounter.toString().padStart(4, '0')}`,
    startDate: '',
    endDate: '',
  });

  // NUEVO: días editables y flag si el usuario los tocó
  const [durationDays, setDurationDays] = useState<number>(0);
  const [durationEdited, setDurationEdited] = useState<boolean>(false);

  const [selectedCars, setSelectedCars] = useState<Map<string, BudgetItem>>(new Map());
  const budgetRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);

  const [filters, setFilters] = useState<CarFilters>({
    type: '',
    fuel: '',
    seats: '',
    priceRange: [0, maxLowPrice], // usar máximo dinámico
    searchTerm: '',
  });

  // Si cambia el máximo por un cambio en el inventario, ajustar filtro
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      priceRange: [prev.priceRange?.[0] ?? 0, Math.max(prev.priceRange?.[1] ?? maxLowPrice, maxLowPrice)],
    }));
  }, [maxLowPrice]);

  // Actualizar el último nombre de cliente cuando cambie
  useEffect(() => {
    if (formData.clientName !== lastClientName) {
      setLastClientName(formData.clientName);
    }
  }, [formData.clientName, lastClientName, setLastClientName]);

  // Generar nuevo número de reserva cuando se inicia un nuevo presupuesto
  useEffect(() => {
    if (!formData.reservationNumber || formData.reservationNumber === '') {
      setFormData((prev) => ({
        ...prev,
        reservationNumber: `#${reservationCounter.toString().padStart(4, '0')}`,
      }));
    }
  }, [reservationCounter, formData.reservationNumber]);

  // --------- Utilidades ---------
  const isHighSeason = (startDate: string, endDate: string): boolean => {
    if (!seasonSettings.highSeasonStart || !seasonSettings.highSeasonEnd) return false;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const highStart = new Date(seasonSettings.highSeasonStart);
    const highEnd = new Date(seasonSettings.highSeasonEnd);
    return (start >= highStart && start <= highEnd) || (end >= highStart && end
