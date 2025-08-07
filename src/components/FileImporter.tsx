import React, { useState, useRef } from 'react';
import { Car } from '../types';
import { Upload, FileSpreadsheet, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Props {
  cars: Car[];
  setCars: React.Dispatch<React.SetStateAction<Car[]>>;
}

interface ImportResult {
  success: boolean;
  message: string;
  importedCount: number;
  duplicatesCount: number;
  errors: string[];
}

export default function FileImporter({ cars, setCars }: Props) {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseExcelFile = async (file: File): Promise<Car[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          const parsedCars: Car[] = [];
          
          // Skip header row (index 0)
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];
            if (row.length < 6) continue; // Skip incomplete rows

            const [name, type, fuel, deposit, highSeasonPrice, lowSeasonPrice] = row;
            
            if (name && highSeasonPrice && lowSeasonPrice) {
              parsedCars.push({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                name: String(name).trim(),
                type: type ? String(type).trim() : undefined,
                fuel: fuel ? String(fuel).trim() : undefined,
                deposit: deposit ? Number(deposit) : undefined,
                highSeasonPrice: Number(highSeasonPrice),
                lowSeasonPrice: Number(lowSeasonPrice)
              });
            }
          }
          
          resolve(parsedCars);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const parsePdfFile = async (file: File): Promise<Car[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument(typedArray).promise;
          
          let fullText = '';
          
          // Extract text from all pages
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ');
            fullText += pageText + '\n';
          }

          // Parse the extracted text
          const parsedCars = parseTextToCars(fullText);
          resolve(parsedCars);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Error reading PDF file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const parseTextToCars = (text: string): Car[] => {
    const cars: Car[] = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    // Try to find patterns that look like car data
    // This is a basic parser - you might need to adjust based on your PDF format
    for (const line of lines) {
      // Look for lines with car information (adjust regex based on your PDF format)
      const carMatch = line.match(/(.+?)\s+(\w+)\s+(\w+)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/);
      
      if (carMatch) {
        const [, name, type, fuel, deposit, highPrice, lowPrice] = carMatch;
        
        if (name && highPrice && lowPrice) {
          cars.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: name.trim(),
            type: type?.trim(),
            fuel: fuel?.trim(),
            deposit: deposit ? Number(deposit) : undefined,
            highSeasonPrice: Number(highPrice),
            lowSeasonPrice: Number(lowPrice)
          });
        }
      }
    }
    
    return cars;
  };

  const isDuplicateCar = (newCar: Car, existingCars: Car[]): boolean => {
    return existingCars.some(car => 
      car.name.toLowerCase() === newCar.name.toLowerCase() && 
      car.type?.toLowerCase() === newCar.type?.toLowerCase()
    );
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      let parsedCars: Car[] = [];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        parsedCars = await parseExcelFile(file);
      } else if (fileExtension === 'pdf') {
        parsedCars = await parsePdfFile(file);
      } else {
        throw new Error('Formato de archivo no soportado. Use .xlsx o .pdf');
      }

      // Filter out duplicates and invalid entries
      const validCars: Car[] = [];
      const duplicates: Car[] = [];
      const errors: string[] = [];

      for (const car of parsedCars) {
        // Validate required fields
        if (!car.name || !car.highSeasonPrice || !car.lowSeasonPrice) {
          errors.push(`Auto inválido: ${car.name || 'Sin nombre'} - faltan datos requeridos`);
          continue;
        }

        // Check for duplicates
        if (isDuplicateCar(car, [...cars, ...validCars])) {
          duplicates.push(car);
          continue;
        }

        validCars.push(car);
      }

      // Add valid cars to the existing list
      if (validCars.length > 0) {
        setCars(prev => [...prev, ...validCars]);
      }

      setImportResult({
        success: true,
        message: `Importación completada`,
        importedCount: validCars.length,
        duplicatesCount: duplicates.length,
        errors
      });

    } catch (error) {
      setImportResult({
        success: false,
        message: `Error al importar archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        importedCount: 0,
        duplicatesCount: 0,
        errors: []
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const closeResult = () => {
    setImportResult(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <Upload className="h-6 w-6 text-indigo-600" />
        <h2 className="text-2xl font-bold text-gray-800">Importar Autos desde Archivo</h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileImport}
            accept=".xlsx,.xls,.pdf"
            className="hidden"
            disabled={isImporting}
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:transform-none flex items-center gap-2"
          >
            {isImporting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Importando...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                Seleccionar Archivo
              </>
            )}
          </button>

          <div className="text-sm text-gray-600">
            <p className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Archivos Excel (.xlsx, .xls)
            </p>
            <p className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Archivos PDF (.pdf)
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Formato esperado para Excel:</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Columna A:</strong> Nombre del auto</p>
            <p><strong>Columna B:</strong> Tipo (opcional)</p>
            <p><strong>Columna C:</strong> Combustible (opcional)</p>
            <p><strong>Columna D:</strong> Depósito (opcional)</p>
            <p><strong>Columna E:</strong> Precio temporada alta</p>
            <p><strong>Columna F:</strong> Precio temporada baja</p>
          </div>
        </div>
      </div>

      {/* Import Result Modal */}
      {importResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {importResult.success ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-red-600" />
                )}
                <h3 className="text-lg font-semibold text-gray-800">
                  {importResult.success ? 'Importación Exitosa' : 'Error de Importación'}
                </h3>
              </div>
              <button
                onClick={closeResult}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-gray-700">{importResult.message}</p>
              
              {importResult.success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-sm space-y-1">
                    <p className="text-green-800">
                      <strong>Autos importados:</strong> {importResult.importedCount}
                    </p>
                    {importResult.duplicatesCount > 0 && (
                      <p className="text-orange-700">
                        <strong>Duplicados omitidos:</strong> {importResult.duplicatesCount}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {importResult.errors.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-yellow-800 mb-2">Advertencias:</p>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {importResult.errors.slice(0, 5).map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                    {importResult.errors.length > 5 && (
                      <li>• ... y {importResult.errors.length - 5} más</li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={closeResult}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}