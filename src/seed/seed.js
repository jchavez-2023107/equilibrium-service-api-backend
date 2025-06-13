// src/seed/seed.js
import mongoose from "mongoose";
import User from "../entities/User/user.model.js";
import { encrypt } from "../utils/encrypt.js";

/**
 * runSeed: inserta datos por defecto si la colección User está vacía.
 */
export const runSeed = async () => {
  try {
    console.log("🔄 Ejecutando seed de usuarios por defecto...");

    const usersCount = await User.countDocuments();
    if (usersCount === 0) {
      // 2 Admins definidos con campos completos
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

      // 10 Voluntarios (solo nombres)
      const volunteerNames = [
        "Pedro Bautista", "Sergio Matheu", "Pablo Palacios", "Alejandro Abascal", "Andrés Oliva",
        "Alexander Solares", "Diego Chupina", "André Méndez", "Joel Chávez", "Alejandro Pérez"
      ];

      // 10 Usuarios normales (nombres guatemaltecos reales)
      const userNames = [
        "Juan Pérez", "María García", "Carlos Hernández", "Ana López", "Luis Morales",
        "José Martínez", "Marta Rivera", "Julio Escobar", "Claudia Ramírez", "Ricardo Castillo"
      ];

      // Crear Admins
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

      // Función para crear Voluntarios y Usuarios
      const seedByRole = async (names, role, status) => {
        for (const fullName of names) {
          const [first, last] = fullName.split(' ');
          const username = `${first.toLowerCase()}.${last.toLowerCase()}`;
          // Contraseña fija por rol
          const plainPwd = role === 'VOLUNTEER' ? 'volunteer' : 'user';
          const hashed = await encrypt(plainPwd);

          const profile = {
            displayName: fullName,
            displayUsername: username,
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
                linkedIn: `https://www.linkedin.com/in/${username}`,
                contactNumber: "3295-0447"
              }
            : undefined;

          await User.create({
            username,
            email: `${username}@equilibrium.local`,
            password: hashed,
            role,
            status,
            profile,
            ...(role === 'VOLUNTEER' && { volunteerData })
          });
          console.log(`✅ ${role} creado: ${username} (pwd: ${plainPwd})`);
        }
      };

      // Ejecutar seeds
      await seedByRole(volunteerNames, 'VOLUNTEER', 'ACTIVE');
      await seedByRole(userNames, 'USER', 'ACTIVE');
    } else {
      console.log("ℹ️ Ya existen usuarios, se omite seed de usuarios.");
    }

    console.log("✅ Seed de usuarios completado sin errores.");
  } catch (err) {
    console.error("❌ Error ejecutando seed de usuarios:", err);
    throw err;
  }
};
