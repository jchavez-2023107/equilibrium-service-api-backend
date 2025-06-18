import mongoose from "mongoose";
import User from "../entities/User/user.model.js";
import Chat from "../entities/Chat/chat.model.js";
import { encrypt } from "../utils/encrypt.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Normaliza nombres para que coincidan con los usernames generados
 */
const normalizeUsername = (name) =>
  name
    .normalize("NFD") // separar letras con acentos
    .replace(/[\u0300-\u036f]/g, "") // eliminar acentos
    .replace(/\s/g, "") // quitar espacios
    .toLowerCase();

/**
 * runSeed: inserta datos por defecto si la colección User está vacía.
 */
export const runSeed = async () => {
  try {
    console.log("🔄 Ejecutando seed de usuarios por defecto...");

    const usersCount = await User.countDocuments();
    if (usersCount === 0) {
      // Admins
      const admins = [
        {
          displayName: "Administrador",
          username: "admin",
          password: "admin",
          email: "admin@equilibrium.local",
          contactNumber: "5591-5715"
        },
        {
          displayName: "Joel Chávez",
          username: "adminjchavez",
          password: "adminjchavez",
          email: "adminjchavez@equilibrium.local",
          contactNumber: "5460-5890"
        }
      ];

      const volunteerNames = [
        "Pedro Bautista", "Sergio Matheu", "Pablo Palacios", "Alejandro Abascal", "Andrés Oliva",
        "Alexander Solares", "Diego Chupina", "André Méndez", "Joel Chávez", "Alejandro Pérez"
      ];

      const userNames = [
        "Juan Pérez", "María García", "Carlos Hernández", "Ana López", "Luis Morales",
        "José Martínez", "Marta Rivera", "Julio Escobar", "Claudia Ramírez", "Ricardo Castillo"
      ];

      // Crear admins
      for (const adminData of admins) {
        const hashed = await encrypt(adminData.password);
        const profile = {
          displayName: adminData.displayName,
          displayUsername: adminData.username,
          birthDate: new Date("1980-01-01"),
          bio: `Hola, soy ${adminData.displayName}`,
          contactNumber: adminData.contactNumber,
          especialidad: "Administrador"
        };
        await User.create({
          username: adminData.username,
          email: adminData.email,
          password: hashed,
          role: 'ADMIN',
          status: 'ACTIVE',
          profile
        });
        console.log(`✅ ADMIN creado: ${adminData.username}`);
      }

      // Crear usuarios y voluntarios
      const seedByRole = async (names, role, status) => {
        for (const fullName of names) {
          const uname = normalizeUsername(fullName);
          const emailLocal = uname;

          const plainPwd = role === 'VOLUNTEER' ? 'volun' : 'user1';
          const hashed = await encrypt(plainPwd);

          const profile = {
            displayName: fullName,
            displayUsername: uname,
            birthDate: new Date(role === 'VOLUNTEER' ? '1995-06-15' : '2000-06-15'),
            bio: `Hola, soy ${fullName}`,
            contactNumber: role === 'VOLUNTEER' ? '3295-0447' : '5895-5677',
            especialidad: role === 'VOLUNTEER' ? 'Voluntario' : 'Usuario'
          };

          const volunteerData = role === 'VOLUNTEER'
            ? {
                available: false,
                schedules: [],
                needs: [],
                ratings: [],
                university: "UVG",
                graduateTerm: "2023",
                hasVolunteered: false,
                motivation: "Quiero ayudar a la comunidad",
                availability: "Lunes a Viernes 9:00-17:00",
                linkedIn: `https://www.linkedin.com/in/${uname}`,
                contactNumber: "3295-0447"
              }
            : undefined;

          await User.create({
            username: uname,
            email: `${emailLocal}@equilibrium.local`,
            password: hashed,
            role,
            status,
            profile,
            ...(role === 'VOLUNTEER' && { volunteerData })
          });
          console.log(`✅ ${role} creado: ${uname} (pwd: ${plainPwd})`);
        }
      };

      await seedByRole(volunteerNames, 'VOLUNTEER', 'ACTIVE');
      await seedByRole(userNames, 'USER', 'ACTIVE');

      // Obtener IDs para chats
      const getUserId = async (rawName) => {
        const uname = normalizeUsername(rawName);
        const user = await User.findOne({ username: uname });
        if (!user) throw new Error(`Usuario ${rawName} no encontrado (username: ${uname})`);
        return user._id;
      };

      const chats = [
        {
          sessionId: uuidv4(),
          userId: await getUserId("Juan Pérez"),
          volunteerId: await getUserId("Pedro Bautista"),
          status: "ACTIVE",
          messages: [
            {
              senderId: await getUserId("Juan Pérez"),
              text: "Hola, necesito hablar con alguien.",
              timestamp: new Date(),
              isEmergency: false
            }
          ]
        },
        {
          sessionId: uuidv4(),
          userId: await getUserId("Ana López"),
          volunteerId: await getUserId("Andrés Oliva"),
          status: "ENDED",
          messages: [
            {
              senderId: await getUserId("Ana López"),
              text: "Gracias por tu ayuda.",
              timestamp: new Date(),
              isEmergency: false
            }
          ]
        },
        {
          sessionId: uuidv4(),
          userId: await getUserId("Luis Morales"),
          volunteerId: await getUserId("Diego Chupina"),
          status: "ACTIVE",
          messages: [
            {
              senderId: await getUserId("Luis Morales"),
              text: "¡Ayuda urgente, por favor!",
              timestamp: new Date(),
              isEmergency: true
            }
          ]
        },
        {
          sessionId: uuidv4(),
          userId: await getUserId("Marta Rivera"),
          volunteerId: await getUserId("Sergio Matheu"),
          status: "PENDING",
          messages: []
        },
        {
          sessionId: uuidv4(),
          userId: await getUserId("Claudia Ramírez"),
          volunteerId: await getUserId("André Méndez"),
          emergencyTakenBy: await getUserId("André Méndez"),
          status: "ACTIVE",
          messages: [
            {
              senderId: await getUserId("Claudia Ramírez"),
              text: "¡Emergencia reportada!",
              isEmergency: true,
              isSystem: true,
              timestamp: new Date()
            },
            {
              senderId: await getUserId("André Méndez"),
              text: "Estoy contigo, tranquila.",
              isEmergency: false,
              timestamp: new Date()
            }
          ]
        }
      ];

      await Chat.insertMany(chats);
      console.log("✅ Chats de ejemplo insertados.");
    } else {
      console.log("ℹ️ Ya existen usuarios, se omite seed de usuarios y chats.");
    }

    console.log("✅ Seed completado sin errores.");
  } catch (err) {
    console.error("❌ Error ejecutando seed:", err);
    throw err;
  }
};
