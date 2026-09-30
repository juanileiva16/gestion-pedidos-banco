"use client";

import { useState } from "react";
import DatePicker from "react-datepicker";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { FORMATO_FECHA, formatearFecha, leerFecha } from "../lib/fechas";

type SelectorFechaProps = {
  fecha: string;
  onChange: (fecha: string) => void;
};

export default function SelectorFecha({ fecha, onChange }: SelectorFechaProps) {
  const [texto, setTexto] = useState(() => formatearFecha(fecha));
  const [error, setError] = useState(false);

  function seleccionarFecha(dia: Date | null) {
    const valor = dia ? format(dia, "yyyy-MM-dd") : "";
    setTexto(formatearFecha(valor));
    setError(false);
    onChange(valor);
  }

  return (
    <div className="selector-fecha w-full sm:w-52 sm:shrink-0">
      <label htmlFor="fecha-entrega" className="text-sm font-medium text-zinc-700">
        Fecha de entrega
      </label>
      <div className="mt-2">
        <DatePicker
          id="fecha-entrega"
          selected={fecha ? parseISO(fecha) : null}
          value={texto}
          onChange={seleccionarFecha}
          onChangeRaw={(event) => {
            if (!event || !(event.target instanceof HTMLInputElement)) return;
            event.preventDefault();
            const valor = event.target.value;
            const dia = leerFecha(valor);
            setTexto(valor);
            setError(valor !== "" && !dia);
            onChange(dia ? format(dia, "yyyy-MM-dd") : "");
          }}
          dateFormat={FORMATO_FECHA}
          locale={es}
          strictParsing
          placeholderText="DD-MM-AAAA"
          autoComplete="off"
          required
          showIcon
          toggleCalendarOnIconClick
          isClearable
          clearButtonTitle="Borrar fecha"
          ariaLabelClose="Borrar fecha"
          previousMonthAriaLabel="Mes anterior"
          nextMonthAriaLabel="Mes siguiente"
          previousMonthButtonLabel="Mes anterior"
          nextMonthButtonLabel="Mes siguiente"
          chooseDayAriaLabelPrefix="Elegir"
          disabledDayAriaLabelPrefix="No disponible"
          monthAriaLabelPrefix="Mes"
          previousYearAriaLabel="Anio anterior"
          nextYearAriaLabel="Anio siguiente"
          ariaInvalid={error ? "true" : undefined}
          ariaDescribedBy={error ? "fecha-error" : undefined}
          wrapperClassName="w-full"
          popperClassName="calendario-entrega"
          className="block min-h-11 w-full min-w-0 rounded border border-zinc-400 bg-white text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        />
      </div>
      {error && (
        <p id="fecha-error" role="alert" className="mt-2 text-sm text-red-700">
          Fecha invalida. Usa DD-MM-AAAA.
        </p>
      )}
    </div>
  );
}
