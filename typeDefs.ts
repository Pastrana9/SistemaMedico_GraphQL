// typeDefs.ts
export const typeDefs = `#graphql
  type Paciente {
    id: ID!
    nombre: String!
    telefono: String!
    correo: String!
  }

  type Cita {
    id: ID!
    fecha: String!
    tipo: String!
    paciente: Paciente!
  }

  type Query {
    getPacient(id: ID!): Paciente!
    getAppointments: [Cita!]!
  }

  type Mutation {
    addPatient(
      nombre: String!
      telefono: String!
      correo: String!
    ): Paciente!

    updatePatient(
      id: ID!
      nombre: String
      telefono: String
      correo: String
    ): Paciente!

    addAppointment(
      paciente: ID!
      fecha: String!
      tipo: String!
    ): Cita!

    deleteAppointment(id: ID!): Boolean
  }
`;
