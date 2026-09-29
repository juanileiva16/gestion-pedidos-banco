type TipoVianda = "C" | "V" | "L";

type DetalleVianda = {
  tipo: TipoVianda;
  pedidas: number;
  entregadas: number;
};

type Pedido = {
  id: number;
  nombre: string;
  viandas: DetalleVianda[];
};

const pedidosIniciales: Pedido[] = [
  {
    id: 1,
    nombre: "Persona de prueba 1",
    viandas: [
      { tipo: "C", pedidas: 1, entregadas: 0 },
      { tipo: "V", pedidas: 2, entregadas: 0 },
    ],
  },
  {
    id: 2,
    nombre: "Persona de prueba 2",
    viandas: [
      { tipo: "C", pedidas: 2, entregadas: 2 },
      { tipo: "L", pedidas: 1, entregadas: 0 },
    ],
  },
  {
    id: 3,
    nombre: "Persona de prueba 3",
    viandas: [
      { tipo: "V", pedidas: 1, entregadas: 1 },
      { tipo: "L", pedidas: 2, entregadas: 2 },
    ],
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

export default function Home() {
  const pedidos = pedidosIniciales.map((pedido) => ({
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

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="border-b border-zinc-300 pb-5">
          <p className="text-sm font-medium uppercase text-emerald-700">Banco</p>
          <h1 className="mt-2 text-3xl font-bold">Gestion de pedidos</h1>
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

        <section aria-labelledby="pedidos-titulo">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-300 py-3">
            <h2 id="pedidos-titulo" className="text-lg font-semibold">Pedidos del dia</h2>
            <p className="text-sm text-zinc-600">{pedidos.length} pedidos</p>
          </div>

          <div
            role="region"
            aria-label="Detalle de pedidos por tipo de vianda"
            tabIndex={0}
            className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            <table className="w-full min-w-[640px] table-fixed border-collapse text-left text-sm">
              <caption className="sr-only">
                Cantidades pedidas, entregadas y pendientes por persona y tipo de vianda.
              </caption>
              <thead className="bg-zinc-200 text-zinc-900">
                <tr>
                  <th scope="col" className="w-[28%] px-4 py-3 font-semibold">Nombre</th>
                  <th scope="col" className="w-[10%] px-2 py-3 text-center font-semibold">Tipo</th>
                  <th scope="col" className="w-[14%] px-2 py-3 text-center font-semibold">Pedidas</th>
                  <th scope="col" className="w-[16%] px-2 py-3 text-center font-semibold">Entregadas</th>
                  <th scope="col" className="w-[16%] px-2 py-3 text-center font-semibold">Pendientes</th>
                  <th scope="col" className="w-[16%] px-2 py-3 text-center font-semibold">Estado</th>
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
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
