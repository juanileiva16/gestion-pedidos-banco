import { format, isValid, parse, parseISO } from "date-fns";

export const FORMATO_FECHA = "dd-MM-yyyy";

export function formatearFecha(fecha: string) {
  return fecha ? format(parseISO(fecha), FORMATO_FECHA) : "";
}

export function leerFecha(texto: string) {
  const fecha = parse(texto, FORMATO_FECHA, new Date(2000, 0, 1));
  // El recorrido de ida y vuelta exige dos digitos y rechaza fechas inexistentes.
  return isValid(fecha) && format(fecha, FORMATO_FECHA) === texto
    ? fecha
    : null;
}
