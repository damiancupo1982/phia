import React, { useState, useRef, useEffect } from 'react';
import { Car, SeasonSettings, Budget, BudgetItem, CarFilters } from '../types';
import { FileText, Upload, Download, Calculator, Share2, Copy, MessageCircle, Search, Filter, X } from 'lucide-react';
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

export default function BudgetGenerator({ cars, seasonSettings, budgets, setBudgets, companyLogo, lastClientName, setLastClientName, reservationCounter, setReservationCounter }: Props) {
  const [formData, setFormData] = useState({
    clientName: lastClientName,
    reservationNumber: `#${reservationCounter.toString().padStart(4, '0')}`,
    startDate: '',
    endDate: ''
  });
  const [selectedCars, setSelectedCars] = useState<Map<string, BudgetItem>>(new Map());
  const budgetRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<CarFilters>({
    type: '',
    fuel: '',
    seats: '',
    priceRange: [0, 300],
    searchTerm: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Actualizar el último nombre de cliente cuando cambie
  useEffect(() => {
    if (formData.clientName !== lastClientName) {
      setLastClientName(formData.clientName);
    }
  }, [formData.clientName, lastClientName, setLastClientName]);

  // Generar nuevo número de reserva cuando se inicia un nuevo presupuesto
  useEffect(() => {
    if (!formData.reservationNumber || formData.reservationNumber === '') {
      setFormData(prev => ({
        ...prev,
        reservationNumber: `#${reservationCounter.toString().padStart(4, '0')}`
      }));
    }
  }, [reservationCounter, formData.reservationNumber]);

  // Filtrar autos según los criterios
  const filteredCars = cars.filter(car => {
    const matchesType = !filters.type || car.type?.toLowerCase().includes(filters.type.toLowerCase());
    const matchesFuel = !filters.fuel || car.fuel?.toLowerCase().includes(filters.fuel.toLowerCase());
    const matchesSeats = !filters.seats || (car.seats && car.seats.toString() === filters.seats);
    const matchesPrice = car.lowSeasonPrice >= filters.priceRange[0] && car.lowSeasonPrice <= filters.priceRange[1];
    const matchesSearch = !filters.searchTerm || car.name.toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    return matchesType && matchesFuel && matchesSeats && matchesPrice && matchesSearch;
  });

  // Obtener valores únicos para los filtros
  const uniqueTypes = [...new Set(cars.map(car => car.type).filter(Boolean))];
  const uniqueFuels = [...new Set(cars.map(car => car.fuel).filter(Boolean))];
  const uniqueSeats = [...new Set(cars.map(car => car.seats).filter(Boolean))].sort((a, b) => a! - b!);

  const clearFilters = () => {
    setFilters({
      type: '',
      fuel: '',
      seats: '',
      priceRange: [0, 300],
      searchTerm: ''
    });
  };

  const isHighSeason = (startDate: string, endDate: string): boolean => {
    if (!seasonSettings.highSeasonStart || !seasonSettings.highSeasonEnd) return false;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const highStart = new Date(seasonSettings.highSeasonStart);
    const highEnd = new Date(seasonSettings.highSeasonEnd);
    
    return (start >= highStart && start <= highEnd) || (end >= highStart && end <= highEnd);
  };

  const calculateDays = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const toggleCarSelection = (carId: string) => {
    const newSelected = new Map(selectedCars);
    if (newSelected.has(carId)) {
      newSelected.delete(carId);
    } else {
      const car = cars.find(c => c.id === carId)!;
      const season = formData.startDate && formData.endDate ? 
        (isHighSeason(formData.startDate, formData.endDate) ? 'alta' : 'baja') : 'baja';
      const pricePerDay = season === 'alta' ? car.highSeasonPrice : car.lowSeasonPrice;
      
      const budgetItem: BudgetItem = {
        carId,
        carName: car.name,
        carType: car.type || 'Auto',
        carFuel: car.fuel,
        price: 0, // Se calculará después
        pricePerDay,
        originalPricePerDay: pricePerDay,
        season,
        manuallyEdited: false
      };
      
      newSelected.set(carId, budgetItem);
    }
    setSelectedCars(newSelected);
  };

  const updateCarPrice = (carId: string, newPrice: number) => {
    const newSelected = new Map(selectedCars);
    const item = newSelected.get(carId);
    if (item) {
      item.pricePerDay = newPrice;
      item.manuallyEdited = true;
      newSelected.set(carId, item);
      setSelectedCars(newSelected);
    }
  };

  const updateCarSeason = (carId: string, newSeason: 'alta' | 'baja') => {
    const newSelected = new Map(selectedCars);
    const item = newSelected.get(carId);
    const car = cars.find(c => c.id === carId);
    
    if (item && car) {
      item.season = newSeason;
      
      // Solo actualizar el precio si no ha sido editado manualmente
      if (!item.manuallyEdited) {
        const newPrice = newSeason === 'alta' ? car.highSeasonPrice : car.lowSeasonPrice;
        item.pricePerDay = newPrice;
        item.originalPricePerDay = newPrice;
      }
      
      newSelected.set(carId, item);
      setSelectedCars(newSelected);
    }
  };

  const generateBudget = async () => {
    if (!formData.clientName || !formData.reservationNumber || !formData.startDate || !formData.endDate || selectedCars.size === 0) {
      alert('Por favor, completa todos los campos y selecciona al menos un auto.');
      return;
    }

    setIsGenerating(true);
    const days = calculateDays(formData.startDate, formData.endDate);
    
    const items: BudgetItem[] = Array.from(selectedCars.values()).map(item => {
      return {
        ...item,
        price: item.pricePerDay * days
      };
    });

    // Ordenar por precio de menor a mayor
    items.sort((a, b) => a.pricePerDay - b.pricePerDay);

    const total = items.reduce((sum, item) => sum + item.price, 0);

    const budget: Budget = {
      id: Date.now().toString(),
      reservationNumber: formData.reservationNumber,
      clientName: formData.clientName,
      startDate: formData.startDate,
      endDate: formData.endDate,
      items,
      total,
      createdAt: new Date().toISOString(),
      days
    };

    // Esperar a que el DOM se actualice
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const { pdfBase64, imageBase64 } = await generatePDFAndImage(budget);
    
    // Agregar las imágenes al presupuesto
    const budgetWithAssets = {
      ...budget,
      pdfBase64,
      imageBase64
    };

    setBudgets(prev => [...prev, budgetWithAssets]);
    setIsGenerating(false);

    // Incrementar contador de reservas
    setReservationCounter(prev => prev + 1);

    // Limpiar formulario
    const nextReservationNumber = `#${(reservationCounter + 1).toString().padStart(4, '0')}`;
    setFormData({ 
      clientName: '', 
      reservationNumber: nextReservationNumber, 
      startDate: '', 
      endDate: '' 
    });
    setSelectedCars(new Map());
    
    showSuccess('Presupuesto generado exitosamente');
  };

  const generatePDFAndImage = async (budget: Budget) => {
    const element = budgetRef.current;
    if (!element) return { pdfBase64: '', imageBase64: '' };

    // Temporarily show the element for rendering
    element.style.position = 'static';
    element.style.top = 'auto';
    element.style.left = 'auto';
    element.style.opacity = '1';
    element.style.pointerEvents = 'auto';
    element.style.zIndex = '9999';
    
    // Wait for rendering
    await new Promise(resolve => setTimeout(resolve, 100));

    let pdfBase64 = '';
    let imageBase64 = '';

    try {
      // Generate image first
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        logging: false
      });
      
      imageBase64 = canvas.toDataURL('image/png');

      // Generate PDF
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `presupuesto-${budget.reservationNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: element.scrollWidth,
          height: element.scrollHeight
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        }
      };

      const pdfBlob = await html2pdf().from(element).set(opt).outputPdf('datauristring');
      pdfBase64 = pdfBlob;

      // Also save the PDF file
      await html2pdf().from(element).set(opt).save();
      
    } catch (error) {
      console.error('Error generating PDF/Image:', error);
    } finally {
      // Hide the element again
      element.style.position = 'fixed';
      element.style.top = '-9999px';
      element.style.left = '0';
      element.style.opacity = '0';
      element.style.pointerEvents = 'none';
      element.style.zIndex = 'auto';
    }

    return { pdfBase64, imageBase64 };
  };

  const generatePDF = async () => {
    if (!formData.clientName || !formData.reservationNumber || !formData.startDate || !formData.endDate || selectedCars.size === 0) {
      alert('Por favor, completa todos los campos y selecciona al menos un auto.');
      return;
    }

    const element = budgetRef.current;
    if (!element) return;

    // Temporarily show the element for rendering
    element.style.position = 'static';
    element.style.top = 'auto';
    element.style.left = 'auto';
    element.style.opacity = '1';
    element.style.pointerEvents = 'auto';
    element.style.zIndex = '9999';
    
    // Wait for rendering
    await new Promise(resolve => setTimeout(resolve, 200));

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `presupuesto-${formData.reservationNumber || 'phia-rental'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true
      }
    };

    try {
      await html2pdf().from(element).set(opt).save();
      showSuccess('PDF generado exitosamente');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF');
    } finally {
      // Hide the element again
      element.style.position = 'fixed';
      element.style.top = '-9999px';
      element.style.left = '0';
      element.style.opacity = '0';
      element.style.pointerEvents = 'none';
      element.style.zIndex = 'auto';
    }
  };

  const copyAsImage = async () => {
    if (!formData.clientName || !formData.reservationNumber || !formData.startDate || !formData.endDate || selectedCars.size === 0) {
      alert('Por favor, completa todos los campos y selecciona al menos un auto.');
      return;
    }

    const element = budgetRef.current;
    if (!element) return;

    // Temporarily show the element for rendering
    element.style.position = 'static';
    element.style.top = 'auto';
    element.style.left = 'auto';
    element.style.opacity = '1';
    element.style.pointerEvents = 'auto';
    element.style.zIndex = '9999';
    
    // Wait for rendering
    await new Promise(resolve => setTimeout(resolve, 200));

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        logging: false,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('[data-budget-template]');
          if (clonedElement) {
            clonedElement.style.position = 'static';
            clonedElement.style.opacity = '1';
          }
        }
      });

      canvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard && navigator.clipboard.write) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            showSuccess('Imagen copiada al portapapeles');
          } catch (err) {
            console.error('Error copying to clipboard:', err);
            downloadImage(canvas);
          }
        } else {
          downloadImage(canvas);
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Error al generar la imagen');
    } finally {
      // Hide the element again
      element.style.position = 'fixed';
      element.style.top = '-9999px';
      element.style.left = '0';
      element.style.opacity = '0';
      element.style.pointerEvents = 'none';
      element.style.zIndex = 'auto';
    }
  };

  const downloadImage = (canvas: HTMLCanvasElement) => {
    const link = document.createElement('a');
    link.download = `presupuesto-${formData.reservationNumber || 'phia-rental'}.png`;
    link.href = canvas.toDataURL();
    link.click();
    showSuccess('Imagen descargada');
  };

  const shareWhatsApp = async () => {
    if (!formData.clientName || !formData.reservationNumber || !formData.startDate || !formData.endDate || selectedCars.size === 0) {
      alert('Por favor, completa todos los campos y selecciona al menos un auto.');
      return;
    }

    const element = budgetRef.current;
    if (!element) return;

    // Temporarily show the element for rendering
    element.style.position = 'static';
    element.style.top = 'auto';
    element.style.left = 'auto';
    element.style.opacity = '1';
    element.style.pointerEvents = 'auto';
    element.style.zIndex = '9999';
    
    // Wait for rendering
    await new Promise(resolve => setTimeout(resolve, 200));

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        logging: false,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('[data-budget-template]');
          if (clonedElement) {
            clonedElement.style.position = 'static';
            clonedElement.style.opacity = '1';
          }
        }
      });

      const imageData = canvas.toDataURL('image/png');
      const days = calculateDays(formData.startDate, formData.endDate);
      const message = `🚗 *Te envío el presupuesto de Phia Rental Miami* 🌴\n\n` +
                     `Cliente: ${formData.clientName}\n` +
                     `Período: ${formData.startDate} al ${formData.endDate}\n` +
                     `Días: ${days} días\n\n` +
                     `¡Consulta nuestras mejores ofertas para tu viaje a Miami!\n\n` +
                     `(Ver imagen adjunta con detalles completos)`;

      // Crear un enlace temporal para descargar la imagen
      const link = document.createElement('a');
      link.download = `presupuesto-phia-${formData.reservationNumber}.png`;
      link.href = imageData;
      link.click();

      // Abrir WhatsApp con el mensaje
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
      showSuccess('Imagen descargada y WhatsApp abierto');
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
      alert('Error al compartir por WhatsApp');
    } finally {
      // Hide the element again
      element.style.position = 'fixed';
      element.style.top = '-9999px';
      element.style.left = '0';
      element.style.opacity = '0';
      element.style.pointerEvents = 'none';
      element.style.zIndex = 'auto';
    }
  };

  const showSuccess = (message: string) => {
    setShowSuccessMessage(message);
    setTimeout(() => setShowSuccessMessage(null), 3000);
  };

  const days = formData.startDate && formData.endDate ? calculateDays(formData.startDate, formData.endDate) : 0;
  const season = formData.startDate && formData.endDate ? (isHighSeason(formData.startDate, formData.endDate) ? 'alta' : 'baja') : null;
  const selectedCarsData = Array.from(selectedCars.values());
  const total = selectedCarsData.reduce((sum, item) => sum + (item.pricePerDay * days), 0);

  return (
    <div className="space-y-8">
      {/* Formulario de Presupuesto */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-pink-100">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="h-6 w-6 text-pink-600" />
          <h2 className="text-2xl font-bold text-gray-800">Generar Presupuesto</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre del Cliente
            </label>
            <input
              type="text"
              value={formData.clientName}
              onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
              placeholder="Ej: Juan Pérez"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Número de Reserva
            </label>
            <input
              type="text"
              value={formData.reservationNumber}
              readOnly
              className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 font-mono font-bold"
            />
            <p className="text-xs text-gray-500 mt-1">Número generado automáticamente</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Fecha de Inicio
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Fecha de Fin
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        {/* Información del Período */}
        {days > 0 && (
          <div className="bg-gradient-to-r from-pink-50 to-orange-50 rounded-lg p-4 mb-6 border border-pink-200">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-pink-600" />
                <span className="font-semibold text-gray-700">Duración:</span>
                <span className="text-pink-700 font-bold">{days} días</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">Temporada:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  season === 'alta' 
                    ? 'bg-orange-100 text-orange-700' 
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {season === 'alta' ? 'ALTA' : 'BAJA'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Filtros de Autos */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Seleccionar Autos del Inventario</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </button>
          </div>

          {showFilters && (
            <div className="bg-gradient-to-r from-pink-50 to-orange-50 rounded-lg p-6 mb-6 border border-pink-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                {/* Búsqueda por nombre */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Buscar por nombre
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={filters.searchTerm}
                      onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                      placeholder="Ej: Toyota, BMW..."
                    />
                  </div>
                </div>

                {/* Filtro por tipo */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tipo de auto
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                  >
                    <option value="">Todos los tipos</option>
                    {uniqueTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Filtro por combustible */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Combustible
                  </label>
                  <select
                    value={filters.fuel}
                    onChange={(e) => setFilters(prev => ({ ...prev, fuel: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                  >
                    <option value="">Todos</option>
                    {uniqueFuels.map(fuel => (
                      <option key={fuel} value={fuel}>{fuel}</option>
                    ))}
                  </select>
                </div>

                {/* Filtro por plazas */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Plazas
                  </label>
                  <select
                    value={filters.seats}
                    onChange={(e) => setFilters(prev => ({ ...prev, seats: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                  >
                    <option value="">Todas</option>
                    {uniqueSeats.map(seats => (
                      <option key={seats} value={seats}>{seats} plazas</option>
                    ))}
                  </select>
                </div>

                {/* Rango de precios */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Precio máximo: ${filters.priceRange[1]}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="300"
                    value={filters.priceRange[1]}
                    onChange={(e) => setFilters(prev => ({ ...prev, priceRange: [0, parseInt(e.target.value)] }))}
                    className="w-full h-2 bg-pink-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Mostrando {filteredCars.length} de {cars.length} autos
                </div>
                <button
                  onClick={clearFilters}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Limpiar Filtros
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Selección de Autos */}
        <div className="mb-8">
          <div className="space-y-4">
            {filteredCars.map((car) => {
              const isSelected = selectedCars.has(car.id);
              const selectedItem = selectedCars.get(car.id);
              
              return (
                <div 
                  key={car.id}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-pink-500 bg-pink-50 shadow-md'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCarSelection(car.id)}
                        className="h-5 w-5 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                      />
                      <div>
                        <h4 className="font-bold text-gray-900">{car.name}</h4>
                        <p className="text-sm text-gray-600">{car.type || 'Auto'}</p>
                        {car.seats && (
                          <p className="text-xs text-gray-500">{car.seats} plazas</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {isSelected && selectedItem && (
                    <div className="mt-4 space-y-4 border-t border-gray-200 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Temporada
                          </label>
                          <select
                            value={selectedItem.season}
                            onChange={(e) => updateCarSeason(car.id, e.target.value as 'alta' | 'baja')}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                          >
                            <option value="baja">Baja</option>
                            <option value="alta">Alta</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Precio por día ($)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={selectedItem.pricePerDay}
                            onChange={(e) => updateCarPrice(car.id, parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Total ({days} días)
                          </label>
                          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                            <span className="font-bold text-pink-700">
                              ${(selectedItem.pricePerDay * days).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {selectedItem.manuallyEdited && (
                        <div className="text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                          ⚠️ Precio editado manualmente
                        </div>
                      )}
                    </div>
                  )}

                  {!isSelected && (
                    <div className="text-sm text-gray-600 space-y-1">
                      {car.seats && <div>Plazas: <span className="font-semibold">{car.seats}</span></div>}
                      <div>Temp. Baja: <span className="font-semibold">${car.lowSeasonPrice.toFixed(2)}/día</span></div>
                      <div>Temp. Alta: <span className="font-semibold">${car.highSeasonPrice.toFixed(2)}/día</span></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {filteredCars.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No se encontraron autos con los filtros aplicados</p>
              <p className="text-sm">Intenta ajustar los criterios de búsqueda</p>
            </div>
          )}
        </div>

        {/* Resumen y Total */}
        {selectedCars.size > 0 && days > 0 && (
          <div className="bg-gradient-to-r from-pink-50 to-orange-50 rounded-lg p-6 mb-6 border border-pink-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen del Presupuesto</h3>
            <div className="space-y-3">
              {selectedCarsData.map((item) => {
                const carTotal = item.pricePerDay * days;
                return (
                  <div key={item.carId} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">
                      {item.carName} - {item.season === 'alta' ? 'Temp. Alta' : 'Temp. Baja'} ({days} días)
                    </span>
                    <span className="font-semibold text-gray-900">${carTotal.toFixed(2)}</span>
                  </div>
                );
              })}
              <hr className="border-gray-300" />
              <div className="flex justify-between items-center text-lg font-bold">
                <span className="text-gray-800">Total General:</span>
                <span className="text-pink-700">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={generateBudget}
          disabled={!formData.clientName || !formData.reservationNumber || !formData.startDate || !formData.endDate || selectedCars.size === 0 || isGenerating}
          className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white px-8 py-4 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:transform-none flex items-center gap-3"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Generando...
            </>
          ) : (
            <>
              <Download className="h-5 w-5" />
              Generar Presupuesto PDF
            </>
          )}
        </button>

        {/* Botones adicionales cuando hay datos */}
        {formData.clientName && formData.reservationNumber && formData.startDate && formData.endDate && selectedCars.size > 0 && (
          <div className="flex flex-wrap gap-4 mt-4">
            <button
              onClick={copyAsImage}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copiar como Imagen
            </button>
            
            <button
              onClick={shareWhatsApp}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
      {/* Mensaje de éxito */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          {showSuccessMessage}
        </div>
      )}

      {/* Template PDF (oculto) */}
      <div 
        ref={budgetRef} 
        data-budget-template
        className="fixed -top-[9999px] left-0 opacity-0 pointer-events-none"
        style={{ zIndex: -1 }}
      >
        <div className="w-[210mm] min-h-[297mm] p-8 bg-white font-sans" style={{ fontFamily: "'Segoe UI', 'Poppins', sans-serif", minWidth: '210mm' }}>
          {/* Header */}
          <div className="text-center mb-8">
            {companyLogo && (
              <div className="mb-6">
                <img src={companyLogo} alt="Phia Rental Miami" className="max-h-16 mx-auto object-contain" />
              </div>
            )}
            <div className="bg-gradient-to-r from-pink-500 to-orange-500 text-white p-4 rounded-lg mb-6">
              <h1 className="text-2xl font-bold mb-1">PHIA RENTAL MIAMI</h1>
              <h2 className="text-lg font-semibold">PRESUPUESTO DE RENTA DE AUTOS</h2>
              <p className="text-sm mt-2">Reserva: {formData.reservationNumber}</p>
            </div>
          </div>

          {/* Client Info */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 gap-3 text-lg">
              <div className="flex items-center">
                <span className="font-bold text-gray-700 w-24">Cliente:</span>
                <span className="text-gray-900">{formData.clientName}</span>
              </div>
              <div className="flex items-center">
                <span className="font-bold text-gray-700 w-24">Período:</span>
                <span className="text-gray-900">{formData.startDate} al {formData.endDate}</span>
              </div>
              <div className="flex items-center">
                <span className="font-bold text-gray-700 w-24">Días:</span>
                <span className="text-gray-900 font-bold text-pink-600">{days} días</span>
              </div>
            </div>
          </div>

          {/* Cars Table */}
          {selectedCarsData.length > 0 && (
            <div className="mb-8">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-pink-500 to-orange-500 text-white">
                  <th className="border border-gray-300 px-4 py-3 text-left font-bold">Tipo</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-bold">Vehículo</th>
                  <th className="border border-gray-300 px-4 py-3 text-right font-bold">Precio/Día</th>
                  <th className="border border-gray-300 px-4 py-3 text-right font-bold">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedCarsData
                  .sort((a, b) => a.pricePerDay - b.pricePerDay)
                  .map((item, index) => {
                  const carTotal = item.pricePerDay * days;
                  const vehicleName = item.carFuel ? `${item.carName} - ${item.carFuel}` : item.carName;
                  return (
                    <tr key={item.carId} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="border border-gray-300 px-4 py-3 font-semibold text-gray-700">{item.carType || 'Auto'}</td>
                      <td className="border border-gray-300 px-4 py-3 text-gray-900">{vehicleName}</td>
                      <td className="border border-gray-300 px-4 py-3 text-right font-bold text-pink-600">${item.pricePerDay.toFixed(2)}</td>
                      <td className="border border-gray-300 px-4 py-3 text-right font-bold text-orange-600">${carTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
              {selectedCarsData.length === 1 && (
                <tfoot>
                  <tr className="bg-gradient-to-r from-pink-100 to-orange-100">
                    <td colSpan={3} className="border border-gray-300 px-4 py-3 text-right font-bold text-gray-800">TOTAL GENERAL:</td>
                    <td className="border border-gray-300 px-4 py-3 text-right font-bold text-2xl text-pink-600">${total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
            </div>
          )}

          {/* Legal Text */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 text-sm text-gray-800 leading-relaxed">
            <div className="space-y-1 mb-4">
              <p>✓ Conductores adicionales sin cargo</p>
              <p>✓ Recepción de paquetería Sin Cargo</p>
              <p>✓ Entrega en puerta de aeropuerto MIA BONIFICADA</p>
              <p>✓ Devolución en Aeropuerto MIA BONIFICADA</p>
              <p>• Peaje libre (opcional) 5 dol x día</p>
              <p>• Wifi libre (opcional) 5 dol x día</p>
              <p>-Deposito en garantia se hace con bloqueo de tarjeta de credito, se devuelve 7 dias despues de recibir el auto si no hay multas o infracciones y el Contrato se firma digital</p>
            </div>
            
            <div className="border-t border-gray-300 pt-4 mb-4">
              <p className="font-bold text-lg text-pink-600">PRECIO FINAL</p>
              <p className="text-gray-700">(incluye seguro obligatorio y taxes)</p>
            </div>
            
            <div className="bg-orange-100 border-l-4 border-orange-500 p-3 rounded">
              <p className="font-bold text-orange-800">SI LA ENTREGA O RECEPCIÓN ES FUERA DE HORARIO DE OFICINA SE DEBE ABONAR</p>
              <p className="font-bold text-orange-800">EL TICKET DEL PARKING DEL AEROPUERTO.</p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 pt-4 border-t border-gray-200">
            <p className="text-gray-600 text-sm">🌴 Phia Rental Miami - Tu mejor opción en Miami 🌴</p>
          </div>
        </div>
      </div>
    </div>
  );
}