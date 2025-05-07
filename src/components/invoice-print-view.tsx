import { forwardRef } from 'react';
import { CUENTAS_BANCARIAS } from '@/lib/constants';

// Interfaz para los items de factura
interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  totalValue: number;
  weight?: number;
  packaging?: string;
  packagingType?: string;
}

// Interfaz para los datos de factura
interface Invoice {
  id?: string;
  number: string;
  date: string;
  customerName: string;
  taxId: string;
  paymentTerms: string;
  invoiceNotes: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  bankAccount: string;
  estado: string;
  puerto_origen?: string;
  puerto_destino?: string;
  deliveryTerms?: string;
  origen?: string;
  contenedores?: string;
  pesoTotal?: number;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  codigo_postal?: string;
}

// Componente para la vista de impresión de factura
const InvoicePrintView = forwardRef<HTMLDivElement, { invoice: Invoice }>(
  ({ invoice }, ref) => {
    // Extraer fecha formateada
    const formattedDate = new Date(invoice.date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    // Calcular totales
    const subtotal = invoice.items.reduce((sum, item) => sum + item.totalValue, 0);
    const taxAmount = invoice.items.reduce((sum, item) => sum + (item.totalValue * (item.taxRate / 100)), 0);
    const totalAmount = subtotal + taxAmount;

    // Obtener detalles bancarios a partir de la cuenta seleccionada
    const selectedBank = CUENTAS_BANCARIAS.find(cuenta => cuenta.descripcion === invoice.bankAccount);
    const bankName = selectedBank?.banco || '';
    const iban = selectedBank?.iban || '';
    const swift = selectedBank?.swift || '';
    const currency = selectedBank?.moneda || '';

    return (
      <div ref={ref} className="bg-white p-8 max-w-[21cm] mx-auto shadow-none" style={{ display: 'none' }}>
        {/* Cabecera con logo */}
        <div className="mb-8 flex justify-between items-start border-b pb-6">
          <div className="flex items-center">
            <img 
              src="/images/logo.png" 
              alt="Logo TriCycle CRM" 
              className="h-20 mr-4" 
              style={{ objectFit: 'contain' }}
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">TRICYCLE CRM</h1>
              <p className="text-gray-600">C/ Principal 123</p>
              <p className="text-gray-600">28001 Madrid, España</p>
              <p className="text-gray-600">CIF: B12345678</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-gray-800 mb-2">FACTURA</div>
            <table className="ml-auto text-right">
              <tbody>
                <tr key="numero">
                  <td className="pr-2 text-gray-600 font-medium">Número:</td>
                  <td className="font-bold">{invoice.number}</td>
                </tr>
                <tr key="fecha">
                  <td className="pr-2 text-gray-600 font-medium">Fecha:</td>
                  <td>{formattedDate}</td>
                </tr>
                <tr key="estado">
                  <td className="pr-2 text-gray-600 font-medium">Estado:</td>
                  <td>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      invoice.estado === 'pagada' ? 'bg-green-100 text-green-800' :
                      invoice.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {invoice.estado.charAt(0).toUpperCase() + invoice.estado.slice(1)}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Información del cliente */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
            <h2 className="text-lg font-semibold mb-2 text-gray-700 border-b pb-1">Cliente</h2>
            <p className="font-medium text-lg">{invoice.customerName}</p>
            {invoice.taxId && <p className="text-gray-600">CIF/NIF: {invoice.taxId}</p>}
            {invoice.direccion && <p className="text-gray-600">{invoice.direccion}</p>}
            {(invoice.ciudad || invoice.codigo_postal) && (
              <p className="text-gray-600">
                {invoice.ciudad}
                {invoice.codigo_postal && invoice.ciudad ? `, ${invoice.codigo_postal}` : invoice.codigo_postal}
              </p>
            )}
            {invoice.pais && <p className="text-gray-600">{invoice.pais}</p>}
          </div>
          
          {/* Términos de pago */}
          <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
            <h2 className="text-lg font-semibold mb-2 text-gray-700 border-b pb-1">Términos de pago</h2>
            <p>{invoice.paymentTerms || "No especificado"}</p>
          </div>
        </div>

        {/* Términos de Entrega */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Términos de Entrega</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Puerto de Descarga</label>
            <div className="p-2 border rounded-md">
              {invoice.puerto_destino || "No especificado"}
            </div>
          </div>
        </div>

        {/* Líneas de factura */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-1">Detalle de factura</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 text-left border border-gray-300">Descripción</th>
                <th className="py-2 px-4 text-right border border-gray-300">Cantidad</th>
                <th className="py-2 px-4 text-right border border-gray-300">Peso (MT)</th>
                <th className="py-2 px-4 text-right border border-gray-300">Precio unitario</th>
                <th className="py-2 px-4 text-center border border-gray-300">Tipo Empaque</th>
                <th className="py-2 px-4 text-right border border-gray-300">IVA %</th>
                <th className="py-2 px-4 text-right border border-gray-300">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-2 px-4 border border-gray-300">{item.description}</td>
                  <td className="py-2 px-4 text-right border border-gray-300">{item.quantity}</td>
                  <td className="py-2 px-4 text-right border border-gray-300">{item.weight || 0}</td>
                  <td className="py-2 px-4 text-right border border-gray-300">{(item.unitPrice || 0).toFixed(2)} €</td>
                  <td className="py-2 px-4 text-center border border-gray-300">{item.packagingType || "N/A"}</td>
                  <td className="py-2 px-4 text-right border border-gray-300">{item.taxRate}%</td>
                  <td className="py-2 px-4 text-right border border-gray-300">{(item.totalValue || 0).toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumen */}
        <div className="mb-6 flex justify-end">
          <div className="w-64 border border-gray-300 rounded-md overflow-hidden">
            <div className="flex justify-between py-2 px-4 bg-gray-50 border-b">
              <span className="font-medium">Subtotal:</span>
              <span>{(subtotal || 0).toFixed(2)} €</span>
            </div>
            <div className="flex justify-between py-2 px-4 bg-white border-b">
              <span className="font-medium">IVA:</span>
              <span>{(taxAmount || 0).toFixed(2)} €</span>
            </div>
            <div className="flex justify-between py-3 px-4 bg-gray-100 font-bold">
              <span>Total:</span>
              <span>{(totalAmount || 0).toFixed(2)} €</span>
            </div>
          </div>
        </div>
        
        {/* Información Bancaria */}
        <div className="mb-8 border border-gray-300 rounded-md p-4 bg-gray-50">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">Información Bancaria</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><span className="font-medium">Banco:</span> {bankName}</p>
              <p><span className="font-medium">IBAN:</span> {iban}</p>
            </div>
            <div>
              <p><span className="font-medium">SWIFT:</span> {swift}</p>
              <p><span className="font-medium">Moneda:</span> {currency}</p>
            </div>
          </div>
        </div>
        
        {/* Notas */}
        {invoice.invoiceNotes && (
          <div className="mb-8 border-t pt-4">
            <h2 className="text-lg font-semibold mb-2 text-gray-700">Notas</h2>
            <p className="text-gray-600 whitespace-pre-line">{invoice.invoiceNotes}</p>
          </div>
        )}
        
      </div>
    );
  }
);

InvoicePrintView.displayName = 'InvoicePrintView';

export default InvoicePrintView; 