'use client';

import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { FiUpload, FiX, FiDownload, FiCheck, FiTrash2, FiInfo, FiAlertCircle } from 'react-icons/fi';

interface ImportExcelProps {
  onDataImported: (data: any[]) => Promise<{
    success: boolean;
    nuevos?: number;
    actualizados?: number;
    duplicados?: any[];
    message?: string;
  }>;
  columnsMapping: {
    excelColumn: string;
    dbColumn: string;
    required?: boolean;
    transform?: (value: any) => any;
  }[];
  templateHeaders?: string[];
  onCancel?: () => void;
  checkDuplicates?: boolean;
}

export default function ImportExcel({ 
  onDataImported, 
  columnsMapping, 
  templateHeaders,
  onCancel,
  checkDuplicates = true
}: ImportExcelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [parsedData, setParsedData] = useState<any[] | null>(null);
  const [duplicateInfo, setDuplicateInfo] = useState<any[] | null>(null);
  const [importStep, setImportStep] = useState<'preview' | 'duplicates' | 'complete'>('preview');
  const [updateStrategy, setUpdateStrategy] = useState<'update' | 'skip' | 'create_new'>('update');
  const [showResults, setShowResults] = useState(false);
  const [resultado, setResultado] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setSuccess(false);
    setParsedData(null);
    setDuplicateInfo(null);
    setImportStep('preview');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setShowResults(false);
    setResultado(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(false);
    setPreview(null);
    setParsedData(null);
    setDuplicateInfo(null);
    setImportStep('preview');
    
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Verificar tipo de archivo
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        setError('El archivo debe ser formato Excel (.xlsx o .xls)');
        return;
      }
      
      setFile(selectedFile);
      
      // Leer archivo Excel para mostrar previsualización
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length < 2) {
            setError('El archivo no contiene datos o solo contiene encabezados');
            return;
          }
          
          // Verificar encabezados
          const headers = jsonData[0] as string[];
          const requiredColumns = columnsMapping
            .filter(col => col.required)
            .map(col => col.excelColumn);
          
          const missingColumns = requiredColumns.filter(
            col => !headers.some(header => header.trim().toLowerCase() === col.toLowerCase())
          );
          
          if (missingColumns.length > 0) {
            setError(`Faltan las siguientes columnas requeridas: ${missingColumns.join(', ')}`);
            return;
          }
          
          // Mostrar vista previa (solo primeras 5 filas)
          const previewData = jsonData.slice(0, 6) as any[];
          setPreview(previewData);
          
          // Mapear datos según la configuración
          const mappedRows = [];
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];
            if (row.length === 0 || (row.length === 1 && !row[0])) continue; // Saltar filas vacías
            
            const mappedRow: Record<string, any> = {};
            
            for (const mapping of columnsMapping) {
              const columnIndex = headers.findIndex(
                header => header.trim().toLowerCase() === mapping.excelColumn.toLowerCase()
              );
              
              if (columnIndex !== -1) {
                let value = row[columnIndex];
                
                // Aplicar transformación si existe
                if (mapping.transform && value !== undefined) {
                  value = mapping.transform(value);
                }
                
                mappedRow[mapping.dbColumn] = value !== undefined ? value : null;
              } else if (!mapping.required) {
                // Si la columna no es requerida y no está en el Excel, usar null
                mappedRow[mapping.dbColumn] = null;
              }
            }
            
            // Solo agregar filas que tengan el nombre de la compañía (que es obligatorio)
            if (mappedRow['nombre'] && String(mappedRow['nombre']).trim() !== '') {
              mappedRows.push(mappedRow);
            }
          }
          
          setParsedData(mappedRows);
        } catch (err) {
          console.error('Error al procesar el archivo Excel:', err);
          setError('Error al procesar el archivo. Asegúrese de que es un archivo Excel válido.');
        }
      };
      
      reader.onerror = () => {
        setError('Error al leer el archivo');
      };
      
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const checkForDuplicates = async () => {
    if (!parsedData || parsedData.length === 0) {
      return;
    }
    
    setImporting(true);
    setError(null);
    
    try {
      // Llamar a un endpoint para verificar duplicados
      const response = await fetch('/api/clientes/check-duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al verificar duplicados');
      }
      
      const resultado = await response.json();
      
      if (resultado.duplicados && resultado.duplicados.length > 0) {
        setDuplicateInfo(resultado.duplicados);
        setImportStep('duplicates');
      } else {
        // Si no hay duplicados, proceder con la importación
        await handleImportConfirmed();
      }
    } catch (err: any) {
      console.error('Error al verificar duplicados:', err);
      setError(err.message || 'Error al verificar duplicados');
    } finally {
      setImporting(false);
    }
  };

  const handleImportConfirmed = async () => {
    if (!parsedData || parsedData.length === 0) {
      setError('No hay datos para importar');
      return;
    }
    
    setImporting(true);
    setError(null);
    
    try {
      // Mostrar información sobre el total de registros
      const recordCount = parsedData.length;
      if (recordCount > 1000) {
        setError(`Procesando ${recordCount} registros. Esto puede tardar algunos minutos...`);
      }
      
      // Incluir la estrategia de actualización si es necesario
      const dataToImport = importStep === 'duplicates' 
        ? { data: parsedData, updateStrategy } 
        : parsedData;
      
      console.log(`Enviando ${recordCount} registros para importar con ${importStep === 'duplicates' ? `estrategia: ${updateStrategy}` : 'procesamiento directo'}`);
      
      const resultado = await onDataImported(dataToImport);
      
      console.log('Resultado de importación:', resultado);
      
      if (resultado.success) {
        // Mostrar mensaje detallado del resultado
        let mensaje = resultado.message || 'Importación completada con éxito';
        
        // Si hay detalles de resultados, mostrarlos
        if (resultado.resultados) {
          const { nuevos, actualizados, omitidos, errores, procesados = 0 } = resultado.resultados;
          const totalProcesados = (nuevos || 0) + (actualizados || 0) + (omitidos || 0) + (errores || 0);
          const totalRegistros = parsedData.length;
          const noReportados = totalRegistros - procesados;
          
          setResultado({
            ...resultado,
            detalles: {
              total: totalRegistros,
              procesados: procesados,
              nuevos: nuevos || 0,
              actualizados: actualizados || 0,
              omitidos: omitidos || 0,
              errores: errores || 0,
              noReportados: noReportados > 0 ? noReportados : 0
            }
          });
        } else {
          setResultado(resultado);
        }
        
        setShowResults(true);
      } else if (resultado.duplicados && resultado.duplicados.length > 0) {
        setDuplicateInfo(resultado.duplicados);
        setImportStep('duplicates');
      } else {
        throw new Error(resultado.message || 'Error desconocido durante la importación');
      }
    } catch (err: any) {
      console.error('Error al importar datos:', err);
      let mensajeError = 'Error desconocido';
      
      if (err.message) {
        mensajeError = err.message;
      }
      
      // Si el error incluye información específica
      if (err.response && err.response.data) {
        mensajeError = err.response.data.error || err.response.data.message || mensajeError;
      }
      
      setError(`Error al importar datos: ${mensajeError}`);
    } finally {
      setImporting(false);
    }
  };

  const handleImport = async () => {
    if (checkDuplicates) {
      await checkForDuplicates();
    } else {
      await handleImportConfirmed();
    }
  };

  const downloadTemplate = () => {
    if (!templateHeaders || templateHeaders.length === 0) return;
    
    // Crear una nueva hoja de cálculo
    const worksheet = XLSX.utils.aoa_to_sheet([templateHeaders]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    
    // Generar el archivo y descargarlo
    XLSX.writeFile(workbook, 'plantilla_importacion_clientes.xlsx');
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Importar Clientes desde Excel</h3>
      
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <FiX className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <FiCheck className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">Importación completada con éxito</p>
            </div>
          </div>
        </div>
      )}
      
      {!file ? (
        <div>
          <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4">
            <div className="text-center">
              <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-2">
                <label htmlFor="file-upload" className="cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                  <span>Seleccionar archivo Excel</span>
                  <input 
                    id="file-upload" 
                    ref={fileInputRef}
                    name="file-upload" 
                    type="file" 
                    className="sr-only" 
                    accept=".xlsx,.xls" 
                    onChange={handleFileChange} 
                  />
                </label>
                <p className="text-sm text-gray-500 mt-1">o arrástralo aquí</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">Excel (.xlsx, .xls)</p>
            </div>
          </div>
          
          {templateHeaders && templateHeaders.length > 0 && (
            <div className="flex justify-center">
              <button
                onClick={downloadTemplate}
                className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
              >
                <FiDownload className="mr-1" /> Descargar plantilla
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <FiUpload className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            <button
              onClick={resetState}
              className="text-red-600 hover:text-red-900"
              title="Eliminar archivo"
            >
              <FiTrash2 className="h-5 w-5" />
            </button>
          </div>
          
          {/* Vista previa */}
          {importStep === 'preview' && preview && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Previsualización:</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border">
                  <thead className="bg-gray-50">
                    <tr>
                      {preview[0].map((header: string, index: number) => (
                        <th key={index} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.slice(1, 6).map((row: any[], rowIndex: number) => (
                      <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-3 py-2 text-xs text-gray-500 border-r truncate max-w-xs">
                            {cell !== undefined && cell !== null ? String(cell) : ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-1">Mostrando las primeras 5 filas de {parsedData?.length || 0} registros encontrados</p>
            </div>
          )}
          
          {/* Información sobre duplicados */}
          {importStep === 'duplicates' && duplicateInfo && duplicateInfo.length > 0 && (
            <div className="mb-6">
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded mb-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <FiAlertCircle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800">
                      Se encontraron {duplicateInfo.length} registros que podrían ser duplicados
                    </h3>
                    <div className="mt-2 text-sm text-amber-700">
                      <p>Por favor, seleccione cómo desea proceder con estos registros:</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-4 mb-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="updateStrategy"
                    value="update"
                    checked={updateStrategy === 'update'}
                    onChange={() => setUpdateStrategy('update')}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Actualizar registros existentes</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="updateStrategy"
                    value="skip"
                    checked={updateStrategy === 'skip'}
                    onChange={() => setUpdateStrategy('skip')}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Omitir duplicados</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="updateStrategy"
                    value="create_new"
                    checked={updateStrategy === 'create_new'}
                    onChange={() => setUpdateStrategy('create_new')}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Crear como nuevos registros</span>
                </label>
              </div>
              
              <div className="overflow-x-auto bg-gray-50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Posibles duplicados:</h4>
                <table className="min-w-full divide-y divide-gray-200 border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                        En archivo
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                        En sistema
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                        Campos coincidentes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {duplicateInfo.map((dup, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2 text-xs text-gray-700 border-r">
                          <div><strong>Nombre:</strong> {dup.nuevo.nombre}</div>
                          {dup.nuevo.email && <div><strong>Email:</strong> {dup.nuevo.email}</div>}
                          {dup.nuevo.id_fiscal && <div><strong>ID Fiscal:</strong> {dup.nuevo.id_fiscal}</div>}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-700 border-r">
                          <div><strong>Nombre:</strong> {dup.existente.nombre}</div>
                          {dup.existente.email && <div><strong>Email:</strong> {dup.existente.email}</div>}
                          {dup.existente.id_fiscal && <div><strong>ID Fiscal:</strong> {dup.existente.id_fiscal}</div>}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-700 border-r">
                          {dup.coincidencias.join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel || resetState}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={importing}
            >
              Cancelar
            </button>
            
            {importStep === 'preview' && (
              <button
                type="button"
                onClick={handleImport}
                disabled={importing || !parsedData || parsedData.length === 0}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <span className="inline-block animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    Verificando...
                  </>
                ) : (
                  <>Importar {parsedData?.length || 0} registros</>
                )}
              </button>
            )}
            
            {importStep === 'duplicates' && (
              <button
                type="button"
                onClick={handleImportConfirmed}
                disabled={importing}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <span className="inline-block animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    Importando...
                  </>
                ) : (
                  <>Continuar con la importación</>
                )}
              </button>
            )}
          </div>
        </div>
      )}
      
      {resultado && showResults && (
        <div className="mb-6 p-4 rounded-md bg-green-50 text-green-800 border border-green-200">
          <h3 className="text-lg font-medium mb-2">Resultado de la importación</h3>
          <p>{resultado.message}</p>
          
          {resultado.detalles && (
            <div className="mt-3 border-t border-green-200 pt-3">
              <h4 className="font-medium mb-2">Detalles:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Total registros:</div>
                <div className="font-medium">{resultado.detalles.total}</div>
                
                <div>Procesados por el servidor:</div>
                <div className="font-medium">{resultado.detalles.procesados}</div>
                
                <div>Nuevos registros:</div>
                <div className="font-medium text-green-700">{resultado.detalles.nuevos}</div>
                
                <div>Actualizados:</div>
                <div className="font-medium text-blue-700">{resultado.detalles.actualizados}</div>
                
                <div>Omitidos:</div>
                <div className="font-medium text-gray-700">{resultado.detalles.omitidos}</div>
                
                {resultado.detalles.errores > 0 && (
                  <>
                    <div>Errores:</div>
                    <div className="font-medium text-red-700">{resultado.detalles.errores}</div>
                  </>
                )}
                
                {resultado.detalles.noReportados > 0 && (
                  <>
                    <div>No procesados por el servidor:</div>
                    <div className="font-medium text-yellow-700">{resultado.detalles.noReportados}</div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 