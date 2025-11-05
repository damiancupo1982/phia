import React, { useState, useEffect, useRef } from 'react';
import { Car, GalleryItem } from '../types';
import { 
  Images, 
  Upload, 
  Trash2, 
  Share2, 
  Copy, 
  Play, 
  FolderOpen, 
  Image as ImageIcon,
  Video,
  ExternalLink,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface Props {
  cars: Car[];
}

export default function Gallery({ cars }: Props) {
  const [galleries, setGalleries] = useState<Record<string, GalleryItem[]>>({});
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<{ type: 'image' | 'video', url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar galerías del localStorage
  useEffect(() => {
    const savedGalleries = localStorage.getItem('phia-rental-galleries');
    if (savedGalleries) {
      setGalleries(JSON.parse(savedGalleries));
    }
  }, []);

  // Guardar galerías en localStorage
  useEffect(() => {
    localStorage.setItem('phia-rental-galleries', JSON.stringify(galleries));
  }, [galleries]);

  // Limpiar galerías de autos eliminados
  useEffect(() => {
    const currentCarIds = new Set(cars.map(car => car.id));
    const galleryCarIds = Object.keys(galleries);
    
    const updatedGalleries = { ...galleries };
    let hasChanges = false;

    galleryCarIds.forEach(carId => {
      if (!currentCarIds.has(carId)) {
        delete updatedGalleries[carId];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setGalleries(updatedGalleries);
    }
  }, [cars, galleries]);

  const handleFileUpload = (carId: string, files: FileList | null) => {
    if (!files) return;

    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const maxFilesPerCar = 20;

    Array.from(files).forEach(file => {
      if (file.size > maxFileSize) {
        showSuccess(`Archivo ${file.name} es muy grande (máximo 10MB)`);
        return;
      }

      const currentItems = galleries[carId] || [];
      if (currentItems.length >= maxFilesPerCar) {
        showSuccess(`Máximo ${maxFilesPerCar} archivos por auto`);
        return;
      }

      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        showSuccess(`Formato no soportado: ${file.name}`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newItem: GalleryItem = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          carId,
          type: isImage ? 'image' : 'video',
          url: e.target?.result as string,
          name: file.name,
          uploadedAt: new Date().toISOString()
        };

        setGalleries(prev => ({
          ...prev,
          [carId]: [...(prev[carId] || []), newItem]
        }));
      };
      reader.readAsDataURL(file);
    });

    showSuccess('Archivos subidos exitosamente');
  };

  const deleteItem = (carId: string, itemId: string) => {
    setGalleries(prev => ({
      ...prev,
      [carId]: (prev[carId] || []).filter(item => item.id !== itemId)
    }));
    showSuccess('Archivo eliminado');
  };

  const generateShareLink = (carId: string) => {
    const car = cars.find(c => c.id === carId);
    if (!car) return '';

    const galleryData = galleries[carId] || [];
    const shareData = {
      carName: car.name,
      carType: car.type,
      items: galleryData,
      timestamp: Date.now()
    };

    // En una implementación real, esto sería un endpoint del servidor
    // Por ahora, creamos un link simulado con los datos codificados
    const encodedData = btoa(JSON.stringify(shareData));
    return `${window.location.origin}/gallery-share/${encodedData}`;
  };

  const copyShareLink = (carId: string) => {
    const link = generateShareLink(carId);
    navigator.clipboard.writeText(link).then(() => {
      showSuccess('Link copiado al portapapeles');
      setShowShareModal(null);
    });
  };

  const showSuccess = (message: string) => {
    setShowSuccessMessage(message);
    setTimeout(() => setShowSuccessMessage(null), 3000);
  };

  const selectedCar = cars.find(car => car.id === selectedCarId);
  const selectedGallery = selectedCarId ? galleries[selectedCarId] || [] : [];
  const images = selectedGallery.filter(item => item.type === 'image');
  const videos = selectedGallery.filter(item => item.type === 'video');

  return (
    <div className="space-y-8">
      {/* Mensaje de éxito */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          {showSuccessMessage}
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <Images className="h-6 w-6 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-800">Galería de Vehículos</h2>
        </div>

        {!selectedCarId ? (
          // Vista de carpetas
          <div>
            <p className="text-gray-600 mb-6">
              Selecciona un vehículo para ver y gestionar su galería de imágenes y videos
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cars.map(car => {
                const itemCount = (galleries[car.id] || []).length;
                const imageCount = (galleries[car.id] || []).filter(item => item.type === 'image').length;
                const videoCount = (galleries[car.id] || []).filter(item => item.type === 'video').length;

                return (
                  <div
                    key={car.id}
                    onClick={() => setSelectedCarId(car.id)}
                    className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl p-6 border border-blue-200 hover:border-blue-400 cursor-pointer transition-all transform hover:scale-105 hover:shadow-lg"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <FolderOpen className="h-8 w-8 text-indigo-600" />
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 text-sm leading-tight">{car.name}</h3>
                        <p className="text-xs text-gray-600">{car.type || 'Auto'}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Total archivos:</span>
                        <span className="font-bold text-indigo-700">{itemCount}</span>
                      </div>
                      
                      {itemCount > 0 && (
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            <ImageIcon className="h-3 w-3 text-blue-500" />
                            <span className="text-blue-600">{imageCount}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Video className="h-3 w-3 text-blue-600" />
                            <span className="text-blue-700">{videoCount}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {cars.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg">No hay vehículos en el inventario</p>
                <p className="text-sm">Agrega vehículos para crear sus galerías</p>
              </div>
            )}
          </div>
        ) : (
          // Vista de galería específica
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedCarId(null)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ← Volver
                </button>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{selectedCar?.name}</h3>
                  <p className="text-sm text-gray-600">{selectedCar?.type || 'Auto'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowShareModal(selectedCarId)}
                  disabled={selectedGallery.length === 0}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:text-blue-900 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Compartir Galería
                </button>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileUpload(selectedCarId, e.target.files)}
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Subir Archivos
                </button>
              </div>
            </div>

            {/* Galería de imágenes */}
            {images.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-blue-500" />
                  Imágenes ({images.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {images.map(item => (
                    <div key={item.id} className="relative group">
                      <div 
                        className="aspect-square bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => setShowPreview({ type: 'image', url: item.url })}
                      >
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <button
                        onClick={() => deleteItem(selectedCarId, item.id)}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Galería de videos */}
            {videos.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Video className="h-5 w-5 text-blue-600" />
                  Videos ({videos.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {videos.map(item => (
                    <div key={item.id} className="relative group">
                      <div 
                        className="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg overflow-hidden cursor-pointer relative"
                        onClick={() => setShowPreview({ type: 'video', url: item.url })}
                      >
                        <video
                          src={item.url}
                          className="w-full h-full object-cover"
                          muted
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                          <Play className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      <button
                        onClick={() => deleteItem(selectedCarId, item.id)}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                      <p className="text-xs text-gray-600 mt-1 truncate">{item.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedGallery.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Upload className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg">No hay archivos en esta galería</p>
                <p className="text-sm">Sube imágenes y videos para comenzar</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                >
                  Subir Primer Archivo
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de compartir */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Compartir Galería</h3>
              <button
                onClick={() => setShowShareModal(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-800">Link de solo lectura</span>
                </div>
                <p className="text-xs text-blue-700">
                  Este link permite ver la galería sin poder editarla
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-gray-600 font-mono break-all">
                  {generateShareLink(showShareModal)}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => copyShareLink(showShareModal)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copiar Link
                </button>
                
                <button
                  onClick={() => {
                    const link = generateShareLink(showShareModal);
                    const car = cars.find(c => c.id === showShareModal);
                    const message = `🚗 *Galería de ${car?.name}* 🌴\n\nMira las fotos y videos de este vehículo:\n${link}\n\n📱 Phia Rental Miami`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                  }}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de preview */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-full p-4">
            <button
              onClick={() => setShowPreview(null)}
              className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all z-10"
            >
              <X className="h-6 w-6" />
            </button>
            
            {showPreview.type === 'image' ? (
              <img
                src={showPreview.url}
                alt="Preview"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            ) : (
              <video
                src={showPreview.url}
                controls
                autoPlay
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            )}
          </div>
        </div>
      )}

      {/* Información de almacenamiento */}
      <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-800">Información de Almacenamiento</span>
        </div>
        <div className="text-xs text-blue-700 space-y-1">
          <p>• Máximo 20 archivos por vehículo</p>
          <p>• Tamaño máximo por archivo: 10MB</p>
          <p>• Formatos soportados: JPG, PNG, WEBP, MP4, WEBM, MOV</p>
          <p>• Los archivos se almacenan localmente en tu navegador</p>
        </div>
      </div>
    </div>
  );
}