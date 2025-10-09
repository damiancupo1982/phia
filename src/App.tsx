import React, { useState, useEffect } from 'react';
import { Car, SeasonSettings, Budget } from './types';
import CarManagement from './components/CarManagement';
import BudgetGenerator from './components/BudgetGenerator';
import BudgetHistory from './components/BudgetHistory';
import Gallery from './components/Gallery';
import { Car as CarIcon, FileText, History, Palmtree, Heart, Images } from 'lucide-react';
import { initialInventory } from './data/initialInventory';

function App() {
  const [activeTab, setActiveTab] = useState<'budget' | 'cars' | 'history' | 'gallery'>('budget');
  const [cars, setCars] = useState<Car[]>([]);
  const [seasonSettings, setSeasonSettings] = useState<SeasonSettings>({
    highSeasonStart: '',
    highSeasonEnd: ''
  });
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [lastClientName, setLastClientName] = useState<string>('');
  const [reservationCounter, setReservationCounter] = useState<number>(1);

  // Cargar datos del localStorage
  useEffect(() => {
    // Limpiar inventario anterior y cargar el nuevo
    localStorage.removeItem('autosInventario');
    
    const savedCars = localStorage.getItem('autosInventario');
    const savedSeasonSettings = localStorage.getItem('miami-rental-season');
    const savedBudgets = localStorage.getItem('miami-rental-budgets');
    const savedLogo = localStorage.getItem('logoPhia');
    const savedLastClient = localStorage.getItem('miami-rental-last-client');
    const savedCounter = localStorage.getItem('reservaCounter');

    if (savedCars) {
      setCars(JSON.parse(savedCars));
    } else {
      // Cargar inventario inicial actualizado de Phia Rental Miami
      setCars(initialInventory);
      localStorage.setItem('autosInventario', JSON.stringify(initialInventory));
    }

    if (savedSeasonSettings) {
      setSeasonSettings(JSON.parse(savedSeasonSettings));
    }

    if (savedBudgets) {
      setBudgets(JSON.parse(savedBudgets));
    }

    if (savedLogo) {
      setCompanyLogo(savedLogo);
    }

    if (savedLastClient) {
      setLastClientName(savedLastClient);
    }

    if (savedCounter) {
      setReservationCounter(parseInt(savedCounter));
    }
  }, []);

  // Guardar datos en localStorage
  useEffect(() => {
    localStorage.setItem('autosInventario', JSON.stringify(cars));
  }, [cars]);

  useEffect(() => {
    localStorage.setItem('miami-rental-season', JSON.stringify(seasonSettings));
  }, [seasonSettings]);

  useEffect(() => {
    localStorage.setItem('miami-rental-budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    if (companyLogo) {
      localStorage.setItem('logoPhia', companyLogo);
    }
  }, [companyLogo]);

  useEffect(() => {
    if (lastClientName) {
      localStorage.setItem('miami-rental-last-client', lastClientName);
    }
  }, [lastClientName]);

  useEffect(() => {
    localStorage.setItem('reservaCounter', reservationCounter.toString());
  }, [reservationCounter]);

  const tabs = [
    { id: 'budget' as const, name: 'Generar Presupuesto', icon: FileText, color: 'text-pink-600' },
    { id: 'cars' as const, name: 'Gestión de Autos', icon: CarIcon, color: 'text-emerald-600' },
    { id: 'history' as const, name: 'Historial', icon: History, color: 'text-purple-600' },
    { id: 'gallery' as const, name: 'Galería', icon: Images, color: 'text-indigo-600' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-pink-500 via-coral-500 to-orange-400 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-full flex items-center gap-1">
                <Heart className="h-6 w-6 text-white fill-white" />
                <Palmtree className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Phia Rental Miami</h1>
                <p className="text-pink-100 text-sm">Sistema de Gestión y Presupuestos</p>
              </div>
            </div>
            <div className="hidden md:flex items-center text-white/80 text-sm">
              <span>🌴 Welcome to Miami 🌴</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                    activeTab === tab.id
                      ? `border-pink-500 ${tab.color}`
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'budget' && (
          <BudgetGenerator
            cars={cars}
            seasonSettings={seasonSettings}
            budgets={budgets}
            setBudgets={setBudgets}
            companyLogo={companyLogo}
            lastClientName={lastClientName}
            setLastClientName={setLastClientName}
            reservationCounter={reservationCounter}
            setReservationCounter={setReservationCounter}
          />
        )}
        
        {activeTab === 'cars' && (
          <CarManagement
            cars={cars}
            setCars={setCars}
            seasonSettings={seasonSettings}
            setSeasonSettings={setSeasonSettings}
            companyLogo={companyLogo}
            setCompanyLogo={setCompanyLogo}
          />
        )}
        
        {activeTab === 'history' && (
          <BudgetHistory 
            budgets={budgets} 
            setBudgets={setBudgets}
            companyLogo={companyLogo}
            onDuplicateBudget={(budget) => {
              // Cambiar a la pestaña de presupuesto y cargar los datos
              setActiveTab('budget');
              // Aquí podrías implementar la lógica para precargar el formulario
              // con los datos del presupuesto duplicado
            }}
          />
        )}
        
        {activeTab === 'gallery' && (
          <Gallery cars={cars} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-300">
              © 2024 Phia Rental Miami Management System
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Desarrollado con ❤️ para Phia Rental Miami 🚗🌴
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;