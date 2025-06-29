// resolvers.ts
import { Collection, ObjectId } from "mongodb";
import { GraphQLError } from "graphql";

export type PacienteModel = {
  _id?: ObjectId;
  nombre: string;
  telefono: string;
  correo: string;
};

export type CitaModel = {
  _id?: ObjectId;
  paciente: ObjectId;
  fecha: string;
  tipo: string;
};

// Tipo para cita con paciente embebido
export type CitaConPaciente = {
  _id?: ObjectId;
  fecha: string;
  tipo: string;
  paciente: PacienteModel;
};

type Context = {
  PacientesCollection: Collection<PacienteModel>;
  CitasCollection: Collection<CitaModel>;
};

const validatePhone = async (telefono: string) => {
  const API_KEY = Deno.env.get("API_KEY");
  if (!API_KEY) throw new Error("Error con API_KEY");
  const url = `https://api.api-ninjas.com/v1/validatephone?number=${telefono}`;
  const res = await fetch(url, {
    headers: { "X-Api-Key": API_KEY },
  });
  if (res.status !== 200) throw new GraphQLError("Fallo en validación teléfono");
  const data = await res.json();
  return { is_valid: data.is_valid, pais: data.country };
};

export const resolvers = {
  Query: {
    getPacient: async (
      _: unknown,
      args: { id: string },
      context: Context
    ): Promise<PacienteModel> => {
      const paciente = await context.PacientesCollection.findOne({
        _id: new ObjectId(args.id),
      });
      if (!paciente) throw new GraphQLError("Paciente no existe");
      return paciente;
    },

    getAppointments: async (
      _: unknown,
      __: any,
      context: Context
    ): Promise<CitaModel[]> => {
      return await context.CitasCollection.find({}).toArray();
    },
  },

  Mutation: {
    addPatient: async (
      _: unknown,
      args: { nombre: string; telefono: string; correo: string },
      context: Context
    ): Promise<PacienteModel> => {
      // Validar correo duplicado
      const emailExist = await context.PacientesCollection.findOne({
        correo: args.correo,
      });
      if (emailExist)
        throw new GraphQLError("Ese correo ya está registrado");

      // Validar teléfono
      const { is_valid } = await validatePhone(args.telefono);
      if (!is_valid) throw new GraphQLError("Teléfono no válido");

      const { insertedId } = await context.PacientesCollection.insertOne(args);
      return { _id: insertedId, ...args };
    },

    updatePatient: async (
      _: unknown,
      args: {
        id: string;
        nombre?: string;
        telefono?: string;
        correo?: string;
      },
      context: Context
    ): Promise<PacienteModel> => {
      const paciente = await context.PacientesCollection.findOne({
        _id: new ObjectId(args.id),
      });
      if (!paciente) throw new GraphQLError("Paciente no existe");

      if (args.correo && args.correo !== paciente.correo) {
        const emailExist = await context.PacientesCollection.findOne({
          correo: args.correo,
          _id: { $ne: new ObjectId(args.id) },
        });
        if (emailExist)
          throw new GraphQLError("Ese correo ya está registrado");
      }

      if (args.telefono) {
        const { is_valid } = await validatePhone(args.telefono);
        if (!is_valid) throw new GraphQLError("Teléfono no válido");
      }

      const updateFields: Partial<PacienteModel> = {};
      if (args.nombre) updateFields.nombre = args.nombre;
      if (args.telefono) updateFields.telefono = args.telefono;
      if (args.correo) updateFields.correo = args.correo;

      await context.PacientesCollection.updateOne(
        { _id: new ObjectId(args.id) },
        { $set: updateFields }
      );

      const pacienteActualizado = await context.PacientesCollection.findOne({
        _id: new ObjectId(args.id),
      });

      return pacienteActualizado!;
    },

    addAppointment: async (
      _: unknown,
      args: { paciente: string; fecha: string; tipo: string },
      context: Context
    ): Promise<CitaConPaciente> => {
      // Buscar paciente
      const pacienteObj = await context.PacientesCollection.findOne({
        _id: new ObjectId(args.paciente),
      });
      if (!pacienteObj) throw new GraphQLError("Paciente no existe");

      // Validar cita duplicada
      const citaExistente = await context.CitasCollection.findOne({
        paciente: new ObjectId(args.paciente),
        fecha: args.fecha,
      });
      if (citaExistente)
        throw new GraphQLError(
          "Ya existe una cita ese día para este paciente"
        );

      // Insertar cita
      const { insertedId } = await context.CitasCollection.insertOne({
        paciente: new ObjectId(args.paciente),
        fecha: args.fecha,
        tipo: args.tipo,
      });

      return {
        _id: insertedId,
        fecha: args.fecha,
        tipo: args.tipo,
        paciente: pacienteObj as PacienteModel,
      };
    },

    deleteAppointment: async (
      _: unknown,
      args: { id: string },
      context: Context
    ): Promise<boolean> => {
      const { deletedCount } = await context.CitasCollection.deleteOne({
        _id: new ObjectId(args.id),
      });
      return deletedCount === 1;
    },
  },

  Cita: {
    id: (parent: CitaModel) => parent._id!.toString(),
    paciente: async (parent: CitaModel | CitaConPaciente, __: any, context: Context) => {
      if (typeof parent.paciente === "object" && "nombre" in parent.paciente) {
        return parent.paciente as PacienteModel;
      }
      return await context.PacientesCollection.findOne({
        _id: new ObjectId(parent.paciente),
      });
    },
  },

  Paciente: {
    id: (parent: PacienteModel) => parent._id!.toString(),
  },
};