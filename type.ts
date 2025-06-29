import { OptionalId, ObjectId } from "mongodb";

/* ──────────────────────────
   MODELOS MongoDB
───────────────────────────*/
export type PacienteModel = OptionalId<{
  nombre:   string;
  telefono: string;
  correo:   string;
}>;

export type CitaModel = OptionalId<{
  paciente:  ObjectId;       // referencia al Paciente
  fecha:     string;         // ISO‑8601
  tipo:      string;
}>;

/* ──────────────────────────
   RESPUESTAS API Ninjas
───────────────────────────*/
export type API_Phone = { is_valid: boolean; country: string };
