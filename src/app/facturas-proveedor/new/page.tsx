import React, { useState } from 'react';

const handleMaterialChange = (value: string) => {
  setFormData({
    ...formData,
    material: value
  });
};

// Funciones para manejar los items de la factura
const handleAddItem = () => {
  setFormData({
    ...formData,
    items: [
      ...formData.items,
      {
        descripcion: '',
        cantidad: 1,
        peso: 0,
        peso_unidad: 'MT',
        precio_unitario: 0,
        total: 0,
        codigo: ''
      }
    ]
  });
};

const handleRemoveItem = (index: number) => {
  const updatedItems = [...formData.items];
  updatedItems.splice(index, 1);

  // Recalcular el importe total
  const nuevoImporte = updatedItems.reduce((sum, item) => sum + item.total, 0);
  
  setFormData({
    ...formData,
    items: updatedItems,
    importe: nuevoImporte
  });
};

const handleItemChange = (index: number, field: string, value: any) => {
  const updatedItems = [...formData.items];
  updatedItems[index] = {
    ...updatedItems[index],
    [field]: value
  };
  
  // Recalcular el total del item si cambia el precio o la cantidad/peso
  if (field === 'precio_unitario' || field === 'cantidad' || field === 'peso') {
    const item = updatedItems[index];
    // Si hay peso, calculamos por peso, sino por cantidad
    if (item.peso && item.peso > 0) {
      updatedItems[index].total = item.precio_unitario * item.peso;
    } else {
      updatedItems[index].total = item.precio_unitario * item.cantidad;
    }
  }
  
  // Recalcular el importe total de la factura
  const nuevoImporte = updatedItems.reduce((sum, item) => sum + item.total, 0);
  
  setFormData({
    ...formData,
    items: updatedItems,
    importe: nuevoImporte
  });
};