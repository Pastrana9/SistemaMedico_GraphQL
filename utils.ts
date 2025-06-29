import { GraphQLError } from "graphql";
import { API_Phone } from "./type.ts";

const API_KEY = Deno.env.get("API_KEY");
if (!API_KEY) throw new Error("Error con API_KEY");

export const validatePhone = async (telefono: string) => {
  const url = `https://api.api-ninjas.com/v1/validatephone?number=${telefono}`;
  const res = await fetch(url, { headers: { "X-Api-Key": API_KEY } });
  if (res.status !== 200) throw new GraphQLError("Fallo al solicitar a la API");
  const data: API_Phone = await res.json();
  return data.is_valid;
};

/* Devuelve la misma fecha en formato AAAA‑MM‑DD para
   poder comparar “mismo día” sin la hora */
export const onlyDate = (iso: string) => iso.split("T")[0];
