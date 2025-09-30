// src/data/initialInventory.ts
// Inventario Phia Rental Miami actualizado según la lista “Whole Sale List of Price Phia 2025”.
// Formato idéntico al archivo original.

export const initialInventory = [
  // ECON
  { id: '1',  name: 'Mazda CX-5',                      type: 'Econ',        fuel: 'Gasolina',  deposit: 400, lowSeasonPrice: 60,  highSeasonPrice: 72 },
  { id: '2',  name: 'Chevrolet Equinox',               type: 'Econ',        fuel: 'Gasolina',  deposit: 400, lowSeasonPrice: 60,  highSeasonPrice: 72 },
  { id: '3',  name: 'New Beetle',                      type: 'Econ',        fuel: 'Gasolina',  deposit: 400, lowSeasonPrice: 56,  highSeasonPrice: 62 },

  // SEDAN
  { id: '4',  name: 'Toyota Camry',                    type: 'Sedan',       fuel: 'Gasolina',  deposit: 500, lowSeasonPrice: 62,  highSeasonPrice: 69 },

  // ELÉCTRICO
  { id: '5',  name: 'Tesla Modelo 3 (5 plazas)',       type: 'Electrico',   fuel: 'Eléctrico', deposit: 600, lowSeasonPrice: 75,  highSeasonPrice: 87 },

  // PICK UP
  { id: '6',  name: 'Dodge Ram 1500 (5 plazas)',       type: 'Pick Up',     fuel: 'Gasolina',  deposit: 500, lowSeasonPrice: 97,  highSeasonPrice: 112 },

  // SUV
  { id: '7',  name: 'Volkswagen Tiguan (gasolina)',    type: 'Suv',         fuel: 'Gasolina',  deposit: 500, lowSeasonPrice: 72,  highSeasonPrice: 82 },
  { id: '8',  name: 'BMW X3',                           type: 'Suv',         fuel: 'Gasolina',  deposit: 500, lowSeasonPrice: 72,  highSeasonPrice: 82 },
  { id: '9',  name: 'Hyundai Santa Fe',                 type: 'Suv',         fuel: 'Gasolina',  deposit: 500, lowSeasonPrice: 72,  highSeasonPrice: 82 },
  { id: '10', name: 'Toyota RAV4 Híbrida',              type: 'Suv',         fuel: 'Híbrido',   deposit: 500, lowSeasonPrice: 72,  highSeasonPrice: 82 },
  { id: '11', name: 'Nissan Rogue',                     type: 'Suv',         fuel: 'Gasolina',  deposit: 500, lowSeasonPrice: 72,  highSeasonPrice: 82 },

  // SUV PREMIUM
  { id: '12', name: 'BMW X1',                           type: 'Suv Premium', fuel: 'Gasolina',  deposit: 500, lowSeasonPrice: 85,  highSeasonPrice: 95 },
  { id: '13', name: 'Audi Q5',                          type: 'Suv Premium', fuel: 'Gasolina',  deposit: 500, lowSeasonPrice: 85,  highSeasonPrice: 95 },
  { id: '14', name: 'BMW X4',                           type: 'Suv Premium', fuel: 'Gasolina',  deposit: 500, lowSeasonPrice: 85,  highSeasonPrice: 95 },
  { id: '15', name: 'Mercedes-Benz A220',               type: 'Suv Premium', fuel: 'Gasolina',  deposit: 500, lowSeasonPrice: 85,  highSeasonPrice: 95 },

  // SUV FAMILIAR
  { id: '16', name: 'Chrysler Pacifica (7 plazas)',     type: 'Suv Familiar', fuel: 'Gasolina', deposit: 500, lowSeasonPrice: 85,  highSeasonPrice: 95,  seats: 7 },
  { id: '17', name: 'Toyota Highlander (7 plazas)',     type: 'Suv Familiar', fuel: 'Gasolina', deposit: 500, lowSeasonPrice: 85,  highSeasonPrice: 95,  seats: 7 },
  { id: '18', name: 'Kia Carnival (8 plazas)',          type: 'Suv Familiar', fuel: 'Gasolina', deposit: 500, lowSeasonPrice: 95,  highSeasonPrice: 112, seats: 8 },
  { id: '19', name: 'Ford Expedition (7 plazas)',       type: 'Suv Familiar', fuel: 'Gasolina', deposit: 500, lowSeasonPrice: 95,  highSeasonPrice: 110, seats: 7 },
  { id: '20', name: 'Chevrolet Suburban (7 plazas)',    type: 'Suv Familiar', fuel: 'Gasolina', deposit: 500, lowSeasonPrice: 95,  highSeasonPrice: 110, seats: 7 },
  { id: '21', name: 'Cadillac Escalade (7 plazas)',     type: 'Suv Familiar', fuel: 'Gasolina', deposit: 500, lowSeasonPrice: 199, highSeasonPrice: 220, seats: 7 },

  // SUV LUX
  { id: '22', name: 'Jeep Grand Cherokee (5 plazas)',   type: 'Suv Lux',     fuel: 'Gasolina',  deposit: 500, lowSeasonPrice: 92,  highSeasonPrice: 112, seats: 5 },
  { id: '23', name: 'BMW X7 (7 plazas)',                type: 'Suv Lux',     fuel: 'Gasolina',  deposit: 800, lowSeasonPrice: 180, highSeasonPrice: 210, seats: 7 },

  // LUX (DEPORTIVOS / CABRIO)
  { id: '24', name: 'Mustang Cabrio (5 asientos)',      type: 'Lux',         fuel: 'Gasolina',  deposit: 500, lowSeasonPrice: 75,  highSeasonPrice: 90,  seats: 5 },
  { id: '25', name: 'Porsche Boxter',                   type: 'Lux',         fuel: 'Gasolina',  deposit: 500, lowSeasonPrice: 220, highSeasonPrice: 250, seats: 2 }
];
