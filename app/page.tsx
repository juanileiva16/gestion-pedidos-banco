"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine, Check, CheckCheck, CircleCheck, ClipboardList,
  Clock3, Inbox, PackageCheck, PieChart, Utensils, X,
} from "lucide-react";
import SelectorFecha from "./components/selector-fecha";
import { formatearFecha } from "./lib/fechas";
import styles from "./page.module.css";

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

function EstadoPedido({ estado }: { estado: string }) {
  const Icono = estado === "Entregado" ? CircleCheck : estado === "Parcial" ? PieChart : Clock3;
  return (
    <span className={`${styles.estado} ${estado === "Entregado" ? styles.entregado : estado === "Parcial" ? styles.parcial : styles.pendiente}`}>
      <Icono size={14} aria-hidden="true" />{estado}
    </span>
  );
}

function AccionesEntrega({ pedido, onTodo, onParcial }: {
  pedido: Pedido;
  onTodo: (id: number) => void;
  onParcial: (id: number) => void;
}) {
  const completo = resumirPedido(pedido).pendientes === 0;
  return (
    <div className={styles.acciones}>
      <button type="button" onClick={() => onTodo(pedido.id)} disabled={completo}
        aria-label={`Entregar todo a ${pedido.nombre}`} className={styles.botonPrimario}>
        <CheckCheck size={16} aria-hidden="true" />Entregar todo
      </button>
      <button type="button" onClick={() => onParcial(pedido.id)} disabled={completo}
        aria-label={`Entrega parcial de ${pedido.nombre}`} aria-haspopup="dialog" className={styles.botonSecundario}>
        <ArrowDownToLine size={16} aria-hidden="true" />Entrega parcial
      </button>
    </div>
  );
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
    <main className={styles.pagina}>
      <a className={styles.saltar} href="#pedidos-del-dia">Ir a los pedidos</a>
      <header className={styles.cabecera}>
        <div className={styles.cabeceraInterior}>
          <div className={styles.marca}>
            <span className={styles.marcaIcono}><Utensils size={24} aria-hidden="true" /></span>
            <div><strong>Viandas</strong><span>Banco de Corrientes</span></div>
          </div>
          <nav aria-label="Navegacion de gestion" className={styles.navegacion}>
            <a href="#resumen"><PieChart size={16} aria-hidden="true" />Resumen</a>
            <a href="#pedidos-del-dia"><ClipboardList size={16} aria-hidden="true" />Pedidos</a>
          </nav>
          <span className={styles.rol}>Administracion</span>
        </div>
      </header>
      <div className={styles.contenido}>
        <section className={styles.encabezado} aria-labelledby="gestion-titulo">
          <div>
            <p className={styles.eyebrow}>ENTREGAS DIARIAS</p>
            <h1 id="gestion-titulo">Gestion de pedidos</h1>
            <p className={styles.subtitulo}>Viandas para el equipo del banco</p>
          </div>
          <SelectorFecha fecha={fechaSeleccionada} onChange={cambiarFecha} />
        </section>

        <section id="resumen" aria-label="Resumen de viandas" className={styles.resumen}>
          <dl className={styles.indicadores}>
            <div className={styles.indicador}>
              <span className={`${styles.iconoIndicador} ${styles.iconoAzul}`}><Utensils size={20} aria-hidden="true" /></span>
              <div><dt>Viandas pedidas</dt><dd>{totalViandas}</dd></div>
            </div>
            <div className={styles.indicador}>
              <span className={`${styles.iconoIndicador} ${styles.iconoVerde}`}><PackageCheck size={20} aria-hidden="true" /></span>
              <div><dt>Viandas entregadas</dt><dd>{viandasEntregadas}</dd></div>
            </div>
            <div className={styles.indicador}>
              <span className={`${styles.iconoIndicador} ${styles.iconoAmarillo}`}><Clock3 size={20} aria-hidden="true" /></span>
              <div><dt>Viandas pendientes</dt><dd>{viandasPendientes}</dd></div>
            </div>
          </dl>
          <div className={styles.progreso}>
            <div><span>Avance de entregas</span><strong>{totalViandas ? Math.round(viandasEntregadas / totalViandas * 100) : 0}%</strong></div>
            <progress aria-label="Avance de entregas" max={totalViandas || 1} value={viandasEntregadas} />
          </div>
        </section>

        <section id="pedidos-del-dia" aria-labelledby="pedidos-titulo">
          <div className={styles.tituloLista}>
            <h2
              id="pedidos-titulo"
              ref={tituloRef}
              tabIndex={-1}
              className={styles.tituloPedidos}
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
            <p aria-live="polite" className={styles.cantidadPedidos}>
              {pedidos.length} {pedidos.length === 1 ? "pedido" : "pedidos"}
            </p>
          </div>

          {pedidos.length === 0 ? (
            <div className={styles.vacio}>
              <Inbox size={32} aria-hidden="true" />
              <p role="status">
              {fechaSeleccionada
                ? `No hay pedidos para el ${formatearFecha(fechaSeleccionada)}.`
                : "Fecha de entrega requerida."}
              </p>
            </div>
          ) : (
            <>
            <div
              role="region"
              aria-label="Detalle de pedidos por tipo de vianda"
              tabIndex={0}
              className={styles.tablaEscritorio}
            >
              <table className={styles.tabla}>
                <caption className="sr-only">
                  Cantidades pedidas, entregadas y pendientes por persona y tipo de vianda
                  para el {formatearFecha(fechaSeleccionada)}.
                </caption>
                <thead>
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
                    className={styles.grupoPedido}
                  >
                    {pedido.viandas.map((vianda, indice) => (
                      <tr key={vianda.tipo}>
                        {indice === 0 && (
                          <th
                            scope="rowgroup"
                            rowSpan={pedido.viandas.length}
                            className="break-words px-4 py-3 align-top font-medium"
                          >
                            <div className={styles.persona}><span className={styles.avatar} aria-hidden="true">{String(pedido.id).padStart(2, "0")}</span><span>{pedido.nombre}</span></div>
                          </th>
                        )}
                        <th scope="row" className="px-2 py-3 text-center font-medium">
                          <span className={styles.tipo}>{vianda.tipo}</span>
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
                            <EstadoPedido estado={pedido.resumen.estado} />
                          </td>
                        )}
                        {indice === 0 && (
                          <td rowSpan={pedido.viandas.length} className="px-3 py-3 align-top">
                            <AccionesEntrega pedido={pedido} onTodo={entregarTodo} onParcial={abrirEntregaParcial} />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                ))}
              </table>
            </div>
            <div className={styles.listaMovil}>
              {pedidos.map((pedido) => (
                <article key={pedido.id} className={styles.pedidoMovil} aria-label={pedido.nombre}>
                  <header><h3>{pedido.nombre}</h3><EstadoPedido estado={pedido.resumen.estado} /></header>
                  <table className={styles.tablaMovil}>
                    <caption className="sr-only">Cantidades de {pedido.nombre}</caption>
                    <thead><tr><th scope="col">Tipo</th><th scope="col">Pedidas</th><th scope="col">Entregadas</th><th scope="col">Pendientes</th></tr></thead>
                    <tbody>{pedido.viandas.map((vianda) => (
                      <tr key={vianda.tipo}><th scope="row"><span className={styles.tipo}>{vianda.tipo}</span></th>
                        <td>{vianda.pedidas}</td><td>{vianda.entregadas}</td><td>{vianda.pedidas - vianda.entregadas}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                  <AccionesEntrega pedido={pedido} onTodo={entregarTodo} onParcial={abrirEntregaParcial} />
                </article>
              ))}
            </div>
            </>
          )}
          <p role="status" className={styles.aviso}>
            {aviso && <><CircleCheck size={17} aria-hidden="true" />{aviso}</>}
          </p>
        </section>

        <footer className={styles.pie}>
          <span><span className={styles.puntoDemo} />Datos de prueba</span>
          <span>Viandas &middot; Banco de Corrientes</span>
        </footer>

        <dialog
          ref={dialogoRef}
          onClose={() => setPedidoEnEdicion(null)}
          aria-labelledby="entrega-titulo"
          aria-describedby="entrega-persona"
          className={styles.dialogo}
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
              <div className={styles.dialogoTitulo}>
                <h2 id="entrega-titulo">Entrega parcial</h2>
                <button type="button" onClick={() => dialogoRef.current?.close()} className={styles.botonIcono} aria-label="Cerrar entrega parcial" title="Cerrar entrega parcial"><X size={20} aria-hidden="true" /></button>
              </div>
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
                        className={styles.cantidadInput}
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
                  className={styles.botonSecundario}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.botonPrimario}
                >
                  <Check size={17} aria-hidden="true" />Registrar entrega
                </button>
              </div>
            </form>
          )}
        </dialog>
      </div>
    </main>
  );
}
