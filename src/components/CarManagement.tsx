import React, { useState, useEffect, useRef } from 'react';
import { Car, SeasonSettings } from '../types';
import { Plus, Edit2, Trash2, Save, X, Calendar, Upload } from 'lucide-react';
import FileImporter from './FileImporter';

interface Props {
  cars: Car[];
  setCars: React.Dispatch<React.SetStateAction<Car[]>>;
  seasonSettings: SeasonSettings;
  setSeasonSettings: React.Dispatch<React.SetStateAction<SeasonSettings>>;
  companyLogo: string | null;
  setCompanyLogo: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function CarManagement({ cars, setCars, seasonSettings, setSeasonSettings, companyLogo, setCompanyLogo }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    fuel: '',
    deposit: '',
    lowSeasonPrice: '',
    highSeasonPrice: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Car>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.lowSeasonPrice || !formData.highSeasonPrice) return;

    const newCar: Car = {
      id: Date.now().toString(),
      name: formData.name,
      type: formData.type || undefined,
      fuel: formData.fuel || undefined,
      deposit: formData.deposit ? parseFloat(formData.deposit) : undefined,
      lowSeasonPrice: parseFloat(formData.lowSeasonPrice),
      highSeasonPrice: parseFloat(formData.highSeasonPrice)
    };

    setCars(prev => [...prev, newCar]);
    setFormData({ name: '', type: '', fuel: '', deposit: '', lowSeasonPrice: '', highSeasonPrice: '' });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setCompanyLogo(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const startEdit = (car: Car) => {
    setEditingId(car.id);
    setEditData(car);
  };

  const saveEdit = () => {
    if (!editingId || !editData.name || !editData.lowSeasonPrice || !editData.highSeasonPrice) return;
    
    setCars(prev => prev.map(car => 
      car.id === editingId 
        ? { ...car, ...editData }
        : car
    ));
    setEditingId(null);
    setEditData({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const deleteCar = (id: string) => {
    setCars(prev => prev.filter(car => car.id !== id));
  };

  return (
    <div className="space-y-8">
      {/* Importador de Archivos */}
      <FileImporter cars={cars} setCars={setCars} />

      {/* Logo de la Empresa */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <Upload className="h-6 w-6 text-orange-600" />
          <h2 className="text-2xl font-bold text-gray-800">Logo de la Empresa</h2>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleLogoUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2"
          >
            <Upload className="h-5 w-5" />
            {companyLogo ? 'Cambiar Logo' : 'Subir Logo'}
          </button>
          {companyLogo && (
            <div className="flex items-center gap-4">
              <img 
                src={companyLogo} 
                alt="Logo de la empresa" 
                className="h-12 w-auto object-contain border border-gray-200 rounded"
              />
              <span className="text-green-600 font-semibold">✓ Logo guardado</span>
            </div>
          )}
        </div>
      </div>

      {/* Configuración de Temporada */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="h-6 w-6 text-sky-600" />
          <h2 className="text-2xl font-bold text-gray-800">Configuración de Temporada Alta</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Fecha de Inicio
            </label>
            <input
              type="date"
              value={seasonSettings.highSeasonStart}
              onChange={(e) => setSeasonSettings(prev => ({ ...prev, highSeasonStart: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Fecha de Fin
            </label>
            <input
              type="date"
              value={seasonSettings.highSeasonEnd}
              onChange={(e) => setSeasonSettings(prev => ({ ...prev, highSeasonEnd: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Formulario para Agregar Autos */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <Plus className="h-6 w-6 text-emerald-600" />
          <h2 className="text-2xl font-bold text-gray-800">Agregar Nuevo Auto</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre del Auto
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                placeholder="Ej: Toyota Camry 2024"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo
              </label>
              <input
                type="text"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                placeholder="Ej: SUV, Sedan"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Combustible
              </label>
              <input
                type="text"
                value={formData.fuel}
                onChange={(e) => setFormData(prev => ({ ...prev, fuel: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                placeholder="Ej: Gasolina, Híbrido"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Depósito ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.deposit}
                onChange={(e) => setFormData(prev => ({ ...prev, deposit: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Precio Temporada Baja ($/día)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.lowSeasonPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, lowSeasonPrice: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Precio Temporada Alta ($/día)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.highSeasonPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, highSeasonPrice: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                placeholder="0.00"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Agregar Auto
          </button>
        </form>
      </div>

      {/* Tabla de Autos */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Inventario de Autos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Auto</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Combustible</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Depósito ($)</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Temp. Baja ($/día)</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Temp. Alta ($/día)</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cars.map((car) => (
                <tr key={car.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    {editingId === car.id ? (
                      <input
                        type="text"
                        value={editData.name || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                      />
                    ) : (
                      <span className="font-semibold text-gray-900">{car.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === car.id ? (
                      <input
                        type="text"
                        value={editData.type || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                      />
                    ) : (
                      <span className="text-gray-900">{car.type || '-'}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === car.id ? (
                      <input
                        type="text"
                        value={editData.fuel || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, fuel: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                      />
                    ) : (
                      <span className="text-gray-900">{car.fuel || '-'}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === car.id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editData.deposit || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, deposit: parseFloat(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                      />
                    ) : (
                      <span className="text-gray-900">
                        {car.deposit ? `$${car.deposit.toFixed(2)}` : '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === car.id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editData.lowSeasonPrice || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, lowSeasonPrice: parseFloat(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                      />
                    ) : (
                      <span className="text-gray-900">${car.lowSeasonPrice.toFixed(2)}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === car.id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editData.highSeasonPrice || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, highSeasonPrice: parseFloat(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                      />
                    ) : (
                      <span className="text-gray-900">${car.highSeasonPrice.toFixed(2)}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      {editingId === car.id ? (
                        <>
                          <button
                            onClick={saveEdit}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg transition-colors"
                            title="Guardar"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
                            title="Cancelar"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(car)}
                            className="bg-sky-500 hover:bg-sky-600 text-white p-2 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteCar(car.id)}
                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {cars.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No hay autos en el inventario</p>
              <p className="text-sm">Agrega tu primer auto usando el formulario de arriba</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}