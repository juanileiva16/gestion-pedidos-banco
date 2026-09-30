"use client";

import { useEffect, useRef, useState } from "react";
import SelectorFecha from "./components/selector-fecha";
import { formatearFecha } from "./lib/fechas";

const tiposVianda = ["C", "V", "L"] as const;
type TipoVianda = (typeof tiposVianda)[number];
type CantidadesEntrega = Record<TipoVianda, number>;

type DetalleVianda = {
  tipo: TipoVianda;
  pedidas: number;
  entregadas: number;
};

type Pedido = {
  id: number;
  nombre: string;
  fechaEntrega: string;
  viandas: DetalleVianda[];
};

const fechaInicial = "2026-09-30";

const pedidosIniciales: Pedido[] = [
  {
    id: 1,
    nombre: "Persona de prueba 1",
    fechaEntrega: fechaInicial,
    viandas: [
      { tipo: "C", pedidas: 1, entregadas: 0 },
      { tipo: "V", pedidas: 2, entregadas: 0 },
    ],
  },
  {
    id: 2,
    nombre: "Persona de prueba 2",
    fechaEntrega: fechaInicial,
    viandas: [
      { tipo: "C", pedidas: 2, entregadas: 2 },
      { tipo: "L", pedidas: 1, entregadas: 0 },
    ],
  },
  {
    id: 3,
    nombre: "Persona de prueba 3",
    fechaEntrega: fechaInicial,
    viandas: [
      { tipo: "V", pedidas: 1, entregadas: 1 },
      { tipo: "L", pedidas: 2, entregadas: 2 },
    ],
  },
  {
    id: 4,
    nombre: "Persona de prueba 1",
    fechaEntrega: "2026-10-01",
    viandas: [
      { tipo: "C", pedidas: 2, entregadas: 0 },
      { tipo: "L", pedidas: 1, entregadas: 0 },
    ],
  },
  {
    id: 5,
    nombre: "Persona de prueba 2",
    fechaEntrega: "2026-10-01",
    viandas: [{ tipo: "V", pedidas: 2, entregadas: 0 }],
  },
];

// El estado y los pendientes se calculan para no guardar datos duplicados.
function resumirPedido(pedido: Pedido) {
  const pedidas = pedido.viandas.reduce((total, vianda) => total + vianda.pedidas, 0);
  const entregadas = pedido.viandas.reduce(
    (total, vianda) => total + vianda.entregadas,
    0,
  );
  const pendientes = pedidas - entregadas;
  const estado =
    entregadas === 0
      ? "Pendiente"
      : pendientes === 0
        ? "Entregado"
        : "Parcial";

  return { pedidas, entregadas, pendientes, estado };
}

function validarEntrega(pedido: Pedido, cantidades: CantidadesEntrega) {
  for (const tipo of tiposVianda) {
    const cantidad = cantidades[tipo];
    const vianda = pedido.viandas.find((detalle) => detalle.tipo === tipo);
    const pendientes = vianda ? vianda.pedidas - vianda.entregadas : 0;

    if (!Number.isSafeInteger(cantidad) || cantidad < 0) {
      return `La cantidad de ${tipo} debe ser un numero entero igual o mayor a cero.`;
    }
    if (cantidad > pendientes) {
      return `Solo quedan ${pendientes} viandas de tipo ${tipo} pendientes.`;
    }
  }

  if (tiposVianda.every((tipo) => cantidades[tipo] === 0)) {
    return "Indica al menos una vianda para registrar la entrega.";
  }

  return null;
}

function registrarEntrega(pedido: Pedido, cantidades: CantidadesEntrega) {
  // Se valida sobre el pedido actual, incluso si hubo otra actualizacion.
  if (validarEntrega(pedido, cantidades)) return pedido;

  return {
    ...pedido,
    viandas: pedido.viandas.map((vianda) => ({
      ...vianda,
      entregadas: vianda.entregadas + cantidades[vianda.tipo],
    })),
  };
}

function completarEntrega(pedido: Pedido) {
  return {
    ...pedido,
    viandas: pedido.viandas.map((vianda) => ({
      ...vianda,
      entregadas: vianda.pedidas,
    })),
  };
}

export default function Home() {
  const [datosPedidos, setPedidos] = useState(pedidosIniciales);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(fechaInicial);
  const [pedidoEnEdicion, setPedidoEnEdicion] = useState<number | null>(null);
  const [cantidades, setCantidades] = useState<Record<TipoVianda, string>>({
    C: "0",
    V: "0",
    L: "0",
  });
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");
  const dialogoRef = useRef<HTMLDialogElement>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const pedidoSeleccionado = datosPedidos.find(
    (pedido) =>
      pedido.id === pedidoEnEdicion && pedido.fechaEntrega === fechaSeleccionada,
  );

  useEffect(() => {
    if (pedidoEnEdicion !== null) {
      dialogoRef.current?.showModal();
    } else {
      dialogoRef.current?.close();
    }
  }, [pedidoEnEdicion]);

  const pedidos = datosPedidos
    .filter((pedido) => pedido.fechaEntrega === fechaSeleccionada)
    .map((pedido) => ({
      ...pedido,
      resumen: resumirPedido(pedido),
    }));
  const totalViandas = pedidos.reduce(
    (total, pedido) => total + pedido.resumen.pedidas,
    0,
  );
  const viandasEntregadas = pedidos.reduce(
    (total, pedido) => total + pedido.resumen.entregadas,
    0,
  );
  const viandasPendientes = totalViandas - viandasEntregadas;

  function cambiarFecha(fecha: string) {
    if (fecha === fechaSeleccionada) return;

    dialogoRef.current?.close();
    setPedidoEnEdicion(null);
    setCantidades({ C: "0", V: "0", L: "0" });
    setError(null);
    setAviso("");
    setFechaSeleccionada(fecha);
  }

  function entregarTodo(id: number) {
    const pedido = datosPedidos.find(
      (actual) => actual.id === id && actual.fechaEntrega === fechaSeleccionada,
    );
    if (!pedido || resumirPedido(pedido).pendientes === 0) return;

    setPedidos((actuales) =>
      actuales.map((actual) =>
        actual.id === id ? completarEntrega(actual) : actual,
      ),
    );
    setAviso(`Entrega completada para ${pedido.nombre} del ${formatearFecha(pedido.fechaEntrega)}.`);
    tituloRef.current?.focus({ preventScroll: true });
  }

  function abrirEntregaParcial(id: number) {
    const pedido = datosPedidos.find(
      (actual) => actual.id === id && actual.fechaEntrega === fechaSeleccionada,
    );
    if (!pedido || resumirPedido(pedido).pendientes === 0) return;

    setCantidades({ C: "0", V: "0", L: "0" });
    setError(null);
    setPedidoEnEdicion(id);
  }

  function confirmarEntregaParcial() {
    if (!pedidoSeleccionado) return;

    const entrega = {
      C: Number(cantidades.C),
      V: Number(cantidades.V),
      L: Number(cantidades.L),
    };
    const mensajeError = validarEntrega(pedidoSeleccionado, entrega);
    if (mensajeError) {
      setError(mensajeError);
      return;
    }

    setPedidos((actuales) =>
      actuales.map((pedido) =>
        pedido.id === pedidoSeleccionado.id
          ? registrarEntrega(pedido, entrega)
          : pedido,
      ),
    );
    setAviso(`Entrega de ${entrega.C + entrega.V + entrega.L} viandas registrada para ${pedidoSeleccionado.nombre} del ${formatearFecha(pedidoSeleccionado.fechaEntrega)}.`);
    dialogoRef.current?.close();
    if (resumirPedido(registrarEntrega(pedidoSeleccionado, entrega)).pendientes === 0) {
      tituloRef.current?.focus({ preventScroll: true });
    }
  }

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-5 border-b border-zinc-300 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase text-emerald-700">Banco</p>
            <h1 className="mt-2 text-3xl font-bold">Gestion de pedidos</h1>
          </div>
          <SelectorFecha fecha={fechaSeleccionada} onChange={cambiarFecha} />
        </header>

        <section aria-label="Resumen de viandas">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="border-l-4 border-zinc-400 px-4 py-2">
              <dt className="text-sm text-zinc-600">Viandas pedidas</dt>
              <dd className="mt-1 text-3xl font-semibold tabular-nums">{totalViandas}</dd>
            </div>
            <div className="border-l-4 border-emerald-600 px-4 py-2">
              <dt className="text-sm text-emerald-800">Viandas entregadas</dt>
              <dd className="mt-1 text-3xl font-semibold tabular-nums text-emerald-900">
                {viandasEntregadas}
              </dd>
            </div>
            <div className="border-l-4 border-amber-500 px-4 py-2">
              <dt className="text-sm text-amber-800">Viandas pendientes</dt>
              <dd className="mt-1 text-3xl font-semibold tabular-nums text-amber-900">
                {viandasPendientes}
              </dd>
            </div>
          </dl>
        </section>

        <section id="pedidos-del-dia" aria-labelledby="pedidos-titulo">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-300 py-3">
            <h2
              id="pedidos-titulo"
              ref={tituloRef}
              tabIndex={-1}
              className="text-lg font-semibold focus-visible:outline-2 focus-visible:outline-emerald-700"
            >
              {fechaSeleccionada ? (
                <>
                  Pedidos del{" "}
                  <time dateTime={fechaSeleccionada}>
                    {formatearFecha(fechaSeleccionada)}
                  </time>
                </>
              ) : (
                "Pedidos"
              )}
            </h2>
            <p aria-live="polite" className="text-sm text-zinc-600">
              {pedidos.length} {pedidos.length === 1 ? "pedido" : "pedidos"}
            </p>
          </div>

          {pedidos.length === 0 ? (
            <p role="status" className="border-b border-zinc-300 py-10 text-center text-zinc-600">
              {fechaSeleccionada
                ? `No hay pedidos para el ${formatearFecha(fechaSeleccionada)}.`
                : "Fecha de entrega requerida."}
            </p>
          ) : (
            <div
              role="region"
              aria-label="Detalle de pedidos por tipo de vianda"
              tabIndex={0}
              className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              <table className="w-full min-w-[820px] table-fixed border-collapse text-left text-sm">
                <caption className="sr-only">
                  Cantidades pedidas, entregadas y pendientes por persona y tipo de vianda
                  para el {formatearFecha(fechaSeleccionada)}.
                </caption>
                <thead className="bg-zinc-200 text-zinc-900">
                  <tr>
                    <th scope="col" className="w-[22%] px-4 py-3 font-semibold">Nombre</th>
                    <th scope="col" className="w-[7%] px-2 py-3 text-center font-semibold">Tipo</th>
                    <th scope="col" className="w-[11%] px-2 py-3 text-center font-semibold">Pedidas</th>
                    <th scope="col" className="w-[13%] px-2 py-3 text-center font-semibold">Entregadas</th>
                    <th scope="col" className="w-[13%] px-2 py-3 text-center font-semibold">Pendientes</th>
                    <th scope="col" className="w-[13%] px-2 py-3 text-center font-semibold">Estado</th>
                    <th scope="col" className="w-[21%] px-3 py-3 text-center font-semibold">Acciones</th>
                  </tr>
                </thead>

                {pedidos.map((pedido) => (
                  <tbody
                    key={pedido.id}
                    className={
                      pedido.resumen.estado === "Entregado"
                        ? "border-b-2 border-zinc-300 bg-emerald-50"
                        : pedido.resumen.estado === "Parcial"
                          ? "border-b-2 border-zinc-300 bg-amber-50"
                          : "border-b-2 border-zinc-300 bg-white"
                    }
                  >
                    {pedido.viandas.map((vianda, indice) => (
                      <tr key={vianda.tipo} className="border-b border-zinc-200">
                        {indice === 0 && (
                          <th
                            scope="rowgroup"
                            rowSpan={pedido.viandas.length}
                            className="break-words px-4 py-3 align-top font-medium"
                          >
                            {pedido.nombre}
                          </th>
                        )}
                        <th scope="row" className="px-2 py-3 text-center font-medium">
                          {vianda.tipo}
                        </th>
                        <td className="px-2 py-3 text-center tabular-nums">{vianda.pedidas}</td>
                        <td className="px-2 py-3 text-center tabular-nums">{vianda.entregadas}</td>
                        <td className="px-2 py-3 text-center font-semibold tabular-nums">
                          {vianda.pedidas - vianda.entregadas}
                        </td>
                        {indice === 0 && (
                          <td
                            rowSpan={pedido.viandas.length}
                            className="px-2 py-3 text-center align-top font-medium"
                          >
                            {pedido.resumen.estado}
                          </td>
                        )}
                        {indice === 0 && (
                          <td rowSpan={pedido.viandas.length} className="px-3 py-3 align-top">
                            <div className="flex flex-col gap-2">
                              <button
                                type="button"
                                onClick={() => entregarTodo(pedido.id)}
                                disabled={pedido.resumen.pendientes === 0}
                                aria-label={`Entregar todo a ${pedido.nombre}`}
                                className="min-h-10 rounded bg-emerald-700 px-3 py-2 font-medium text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
                              >
                                Entregar todo
                              </button>
                              <button
                                type="button"
                                onClick={() => abrirEntregaParcial(pedido.id)}
                                disabled={pedido.resumen.pendientes === 0}
                                aria-label={`Entrega parcial de ${pedido.nombre}`}
                                aria-haspopup="dialog"
                                className="min-h-10 rounded border border-zinc-400 bg-white px-3 py-2 font-medium hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-500"
                              >
                                Entrega parcial
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                ))}
              </table>
            </div>
          )}
          <p role="status" className="min-h-10 pt-3 text-sm text-emerald-800">
            {aviso}
          </p>
        </section>

        <dialog
          ref={dialogoRef}
          onClose={() => setPedidoEnEdicion(null)}
          aria-labelledby="entrega-titulo"
          aria-describedby="entrega-persona"
          className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto rounded-lg border border-zinc-300 bg-white p-5 text-zinc-950 shadow-xl backdrop:bg-black/40"
        >
          {pedidoSeleccionado && (
            <form
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                const hayNumeroInvalido = Array.from(event.currentTarget.elements).some(
                  (elemento) =>
                    elemento instanceof HTMLInputElement && elemento.validity.badInput,
                );
                if (hayNumeroInvalido) {
                  setError("Ingresa cantidades numericas validas.");
                  return;
                }
                confirmarEntregaParcial();
              }}
            >
              <h2 id="entrega-titulo" className="text-xl font-semibold">Entrega parcial</h2>
              <p id="entrega-persona" className="mt-1 break-words text-sm text-zinc-600">
                {pedidoSeleccionado.nombre} - {formatearFecha(pedidoSeleccionado.fechaEntrega)}
              </p>
              <fieldset className="mt-5 space-y-3">
                <legend className="mb-3 font-medium">Cantidades a entregar ahora</legend>
                {pedidoSeleccionado.viandas.map((vianda) => {
                  const pendientes = vianda.pedidas - vianda.entregadas;
                  return (
                    <div key={vianda.tipo} className="flex items-center justify-between gap-4">
                      <div>
                        <label htmlFor={`cantidad-${vianda.tipo}`} className="font-medium">
                          Tipo {vianda.tipo}
                        </label>
                        <p id={`saldo-${vianda.tipo}`} className="text-sm text-zinc-600">
                          Pendientes: {pendientes}
                        </p>
                      </div>
                      <input
                        id={`cantidad-${vianda.tipo}`}
                        type="number"
                        min={0}
                        max={pendientes}
                        step={1}
                        disabled={pendientes === 0}
                        value={cantidades[vianda.tipo]}
                        aria-describedby={`saldo-${vianda.tipo}`}
                        onChange={(event) => {
                          const valor = event.target.value;
                          setCantidades((actuales) => ({ ...actuales, [vianda.tipo]: valor }));
                          setError(null);
                        }}
                        className="h-11 w-24 shrink-0 rounded border border-zinc-400 px-3 tabular-nums focus-visible:outline-2 focus-visible:outline-emerald-700 disabled:bg-zinc-100 disabled:text-zinc-500"
                      />
                    </div>
                  );
                })}
              </fieldset>
              {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => dialogoRef.current?.close()}
                  className="min-h-11 rounded border border-zinc-400 px-4 py-2 font-medium hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-11 rounded bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                >
                  Registrar entrega
                </button>
              </div>
            </form>
          )}
        </dialog>
      </div>
    </main>
  );
}
