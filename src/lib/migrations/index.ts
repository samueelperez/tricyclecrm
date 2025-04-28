import { addProformaIdToFacturasCliente, updateExistingFacturasClienteProforma } from './add-proforma-id-to-facturas-cliente';

export async function runMigrations() {
  // Migración: Añadir proforma_id a facturas_cliente
  const proformaIdAdded = await addProformaIdToFacturasCliente();
  if (proformaIdAdded) {
    await updateExistingFacturasClienteProforma();
  }
} 