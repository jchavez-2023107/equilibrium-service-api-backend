// src/seed/seed.js
import User from "../entities/User/user.model.js";
import Resource from "../entities/Resource/resource.model.js";

/**
 * runSeed: inserta datos por defecto si las colecciones están vacías.
 * - Usuario de prueba
 * - Recurso de prueba
 */
export const runSeed = async () => {
  try {
    console.log("🔄 Ejecutando seed de datos por defecto...");

    // 1) Seed para User
    const usersCount = await User.countDocuments();
    if (usersCount === 0) {
      await User.create({
        name: "Joel Chávez",
        username: "testuser",
        email: "test@equilibrium.local",
        passwordHash:
          "$argon2id$v=19$m=4096,t=3,p=1$eW91clNhbHQ$YmFzZVNuaXBwZXRlcg==",
        role: "USER",
        status: "ACTIVE",
        profile: {
          displayName: "Usuario de Prueba",
          birthDate: new Date("1990-01-01"),
          bio: "Este es un usuario creado por seed.",
          contactNumber: "123456789",
          especialidad: "N/A",
        },
      });
      console.log("✅ Usuario de prueba creado.");
    } else {
      console.log(
        "ℹ️ Ya existe al menos un usuario, omitimos seed de usuarios."
      );
    }

    // 2) Seed para Resource
    const resourcesCount = await Resource.countDocuments();
    if (resourcesCount === 0) {
      await Resource.create([
        {
          type: "article",
          title: "Guía de Bienvenida a Equilibrium",
          description:
            "Documento inicial para entender la plataforma Equilibrium.",
          url: "https://example.com/guia-bienvenida",
          category: "introducción",
          thumbnailUrl: "https://example.com/thumbnail-welcome.png",
        },
        {
          type: "video",
          title: "Charla sobre Apoyo Emocional",
          description: "Video introductorio sobre los servicios de apoyo.",
          url: "https://youtu.be/ejemplo",
          category: "video",
          thumbnailUrl: "https://example.com/thumbnail-video.png",
        },
      ]);
      console.log("✅ Recursos de prueba creados.");
    } else {
      console.log("ℹ️ Ya existen recursos, omitimos seed de recursos.");
    }

    console.log("✅ Seed completado sin errores.");
  } catch (err) {
    console.error("❌ Error ejecutando seed:", err);
    throw err;
  }
};
