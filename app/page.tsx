"use client";

import { useState } from "react";

const pedidosIniciales = [
  {
    id: 1,
    nombre: "Agustín Aguirre Ruiz Díaz",
    menu: "L",
    entregado: false,
  },
  {
    id: 2,
    nombre: "Antonella Sonza",
    menu: "D",
    entregado: false,
  },
  {
    id: 3,
    nombre: "Claudia Fernández",
    menu: "L",
    entregado: true,
  },
];

export default function Home() {
  const [pedidos, setPedidos] = useState(pedidosIniciales);
  const totalPedidos = pedidos.length;
  const pedidosEntregados = pedidos.filter((pedido) => pedido.entregado).length;
  const pedidosPendientes = totalPedidos - pedidosEntregados;

  function cambiarEstadoEntrega(id: number) {
    const pedidosActualizados = pedidos.map((pedido) => {
      if (pedido.id === id) {
        return {
          ...pedido,
          entregado: !pedido.entregado,
        };
      }

      return pedido;
    });

    setPedidos(pedidosActualizados);
  }

  return (
    <main>
      <h1>Gestión de pedidos de viandas</h1>
      <h2>Pedidos del día</h2>

      <section>
        <p>Total: {totalPedidos}</p>
        <p>Entregados: {pedidosEntregados}</p>
        <p>Pendientes: {pedidosPendientes}</p>
      </section>
      
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Menú</th>
            <th>Entregado</th>
          </tr>
        </thead>

        <tbody>
          {pedidos.map((pedido) => (
            <tr key={pedido.id}>
              <td>{pedido.nombre}</td>
              <td>{pedido.menu}</td>
              <td>
                <input
                  type="checkbox"
                  checked={pedido.entregado}
                  onChange={() => cambiarEstadoEntrega(pedido.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </main>
  );
}