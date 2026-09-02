"use client";

import { useState } from "react";

const pedidosIniciales = [
  {
    id: 1,
    nombre: "Agustin Aguirre Ruiz Diaz",
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
    nombre: "Claudia Fernandez",
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
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="border-b border-slate-300 pb-5">
          <p className="text-sm font-medium uppercase text-emerald-700">Banco</p>
          <h1 className="mt-2 text-3xl font-bold">Gestion de pedidos</h1>
          <p className="mt-2 text-slate-600">
            Control diario de viandas solicitadas y entregadas.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <article className="rounded border border-slate-300 bg-white p-4">
            <p className="text-sm text-slate-500">Total</p>
            <p className="mt-1 text-3xl font-semibold">{totalPedidos}</p>
          </article>
          <article className="rounded border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm text-emerald-700">Entregados</p>
            <p className="mt-1 text-3xl font-semibold text-emerald-900">
              {pedidosEntregados}
            </p>
          </article>
          <article className="rounded border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-700">Pendientes</p>
            <p className="mt-1 text-3xl font-semibold text-amber-900">
              {pedidosPendientes}
            </p>
          </article>
        </section>

        <section className="overflow-hidden rounded border border-slate-300 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-lg font-semibold">Pedidos del dia</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nombre</th>
                  <th className="w-24 px-4 py-3 text-center font-semibold">
                    Menu
                  </th>
                  <th className="w-32 px-4 py-3 text-center font-semibold">
                    Entregado
                  </th>
                </tr>
              </thead>

              <tbody>
                {pedidos.map((pedido) => (
                  <tr
                    key={pedido.id}
                    className={
                      pedido.entregado
                        ? "border-b border-slate-200 bg-emerald-50 text-slate-500"
                        : "border-b border-slate-200 bg-white"
                    }
                  >
                    <td className="px-4 py-3 font-medium">{pedido.nombre}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-300 bg-slate-50 font-semibold text-slate-800">
                        {pedido.menu}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={pedido.entregado}
                        onChange={() => cambiarEstadoEntrega(pedido.id)}
                        className="h-5 w-5 accent-emerald-600"
                        aria-label={`Marcar como entregado a ${pedido.nombre}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
