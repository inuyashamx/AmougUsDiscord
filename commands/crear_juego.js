const { gameState, resetGame, addPlayer } = require("../gameState");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  name: "crear_juego",
  async execute(message, args) {
    try {
      // Verificar que estamos en el canal correcto
      if (message.channel.name !== "impostor") {
        console.log("Error: Canal incorrecto");
        return message.reply(
          "❌ Este comando solo funciona en el canal #impostor"
        );
      }

      console.log("\n=== Creando Nuevo Juego ===");
      console.log("Solicitado por:", {
        usuario: message.author.username,
        id: message.author.id,
        canal: message.channel.name,
      });

      // Verificar si ya hay un juego activo
      if (gameState.isActive) {
        console.log("Error: Ya hay un juego activo");
        return message.reply(
          "❌ Ya hay un juego en curso. Usa !terminar_juego para finalizarlo."
        );
      }

      // Reiniciar el estado del juego
      console.log("Reiniciando estado del juego...");
      if (!resetGame()) {
        console.log("Error al reiniciar el estado del juego");
        return message.reply(
          "❌ Hubo un error al reiniciar el estado del juego."
        );
      }

      // Activar el juego ANTES de agregar jugadores
      gameState.isActive = true;
      console.log("Juego activado:", {
        activo: gameState.isActive,
        maxJugadores: gameState.maxPlayers,
        minJugadores: gameState.minPlayers,
      });

      // Agregar al creador del juego
      console.log("Intentando agregar al creador del juego...");
      if (!addPlayer(message.author.id)) {
        console.log("Error al agregar al creador del juego");
        // Si falla, desactivar el juego
        gameState.isActive = false;
        resetGame();
        return message.reply("❌ Hubo un error al agregarte al juego.");
      }

      console.log("Estado final del juego:", {
        activo: gameState.isActive,
        jugadores: gameState.players,
        ubicaciones: gameState.locations,
        tareas: Object.keys(gameState.tasks).length,
      });
      console.log("=== Juego Creado Exitosamente ===\n");

      // Función para obtener la lista de jugadores formateada
      const getPlayerList = () => {
        if (gameState.players.length === 0) return "Ningún jugador";
        return gameState.players.map((id) => `<@${id}>`).join("\n");
      };

      // Crear el embed message
      const embed = new EmbedBuilder()
        .setColor("#5B347F")
        .setTitle("🎮 ¡Juego Creado!")
        .setDescription("Un nuevo juego ha sido creado. ¡Únete ahora!")
        .addFields(
          {
            name: "👤 Creador",
            value: `<@${message.author.id}>`,
            inline: true,
          },
          {
            name: "👥 Jugadores",
            value: `${gameState.players.length}/${gameState.maxPlayers}`,
            inline: true,
          },
          {
            name: "⚠️ Mínimo necesario",
            value: `${gameState.minPlayers} jugadores`,
            inline: true,
          },
          { name: "🎮 Lista de Jugadores", value: getPlayerList() }
        )
        .setFooter({ text: "Usa !iniciar cuando todos estén listos" });

      // Crear los botones
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("join_game")
          .setLabel("Unirse al Juego")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("🎮"),
        new ButtonBuilder()
          .setCustomId("leave_game")
          .setLabel("Salirse")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("🚪")
      );

      // Enviar el mensaje con el embed y los botones
      const gameMessage = await message.channel.send({
        embeds: [embed],
        components: [row],
      });

      // Función para actualizar el embed
      const updateEmbed = async () => {
        embed.setFields(
          {
            name: "👤 Creador",
            value: `<@${message.author.id}>`,
            inline: true,
          },
          {
            name: "👥 Jugadores",
            value: `${gameState.players.length}/${gameState.maxPlayers}`,
            inline: true,
          },
          {
            name: "⚠️ Mínimo necesario",
            value: `${gameState.minPlayers} jugadores`,
            inline: true,
          },
          { name: "👥 Lista de Jugadores", value: getPlayerList() }
        );
        await gameMessage.edit({ embeds: [embed] });
      };

      // Crear un collector para los botones
      const filter = (i) => ["join_game", "leave_game"].includes(i.customId);
      const collector = gameMessage.createMessageComponentCollector({
        filter,
        time: 600000,
      }); // 10 minutos

      collector.on("collect", async (i) => {
        try {
          if (i.customId === "join_game") {
            // Verificar que el juego sigue activo
            if (!gameState.isActive) {
              await i.reply({
                content: "❌ El juego ya no está activo.",
                ephemeral: true,
              });
              return;
            }

            // Verificar que el jugador no esté ya en el juego
            if (gameState.players.includes(i.user.id)) {
              await i.reply({
                content: "❌ Ya estás en el juego.",
                ephemeral: true,
              });
              return;
            }

            // Verificar que haya espacio
            if (gameState.players.length >= gameState.maxPlayers) {
              await i.reply({
                content: `❌ El juego está lleno (${gameState.players.length}/${gameState.maxPlayers} jugadores).`,
                ephemeral: true,
              });
              return;
            }

            // Verificar que el juego no haya comenzado
            if (Object.keys(gameState.roles).length > 0) {
              await i.reply({
                content: "❌ El juego ya ha comenzado. No puedes unirte ahora.",
                ephemeral: true,
              });
              return;
            }

            // Intentar agregar al jugador
            if (!addPlayer(i.user.id)) {
              await i.reply({
                content: "❌ Hubo un error al unirte al juego.",
                ephemeral: true,
              });
              return;
            }

            // Actualizar el embed
            await updateEmbed();

            // Enviar mensaje de unión
            await message.channel.send(
              `🎮 <@${i.user.id}> se ha unido al juego! (${gameState.players.length}/${gameState.maxPlayers} jugadores)`
            );

            // Responder al usuario
            await i.reply({
              content: `✅ ¡Te has unido al juego!\n📊 Jugadores: ${gameState.players.length}/${gameState.maxPlayers}`,
              ephemeral: true,
            });
          } else if (i.customId === "leave_game") {
            // Verificar que el jugador esté en el juego
            if (!gameState.players.includes(i.user.id)) {
              await i.reply({
                content: "❌ No estás en el juego.",
                ephemeral: true,
              });
              return;
            }

            // No permitir que el creador se salga
            if (i.user.id === message.author.id) {
              await i.reply({
                content:
                  "❌ No puedes salirte del juego porque eres el creador. Usa !terminar_juego para finalizarlo.",
                ephemeral: true,
              });
              return;
            }

            // Remover al jugador
            const index = gameState.players.indexOf(i.user.id);
            if (index > -1) {
              gameState.players.splice(index, 1);
              delete gameState.locations[i.user.id];
              delete gameState.tasks[i.user.id];
            }

            // Actualizar el embed
            await updateEmbed();

            // Enviar mensaje de salida
            await message.channel.send(
              `🚪 <@${i.user.id}> ha abandonado el juego. (${gameState.players.length}/${gameState.maxPlayers} jugadores)`
            );

            // Responder al usuario
            await i.reply({
              content: "✅ Te has salido del juego.",
              ephemeral: true,
            });
          }
        } catch (error) {
          console.error("Error en la interacción del botón:", error);
          await i.reply({
            content: "❌ Hubo un error al procesar tu solicitud.",
            ephemeral: true,
          });
        }
      });

      collector.on("end", (collected) => {
        console.log(`Se recolectaron ${collected.size} interacciones`);
      });
    } catch (error) {
      console.error("Error al crear el juego:", error);
      // Asegurarse de que el juego no quede en estado inconsistente
      resetGame();
      return message.reply(
        "❌ Hubo un error al crear el juego. Por favor, inténtalo de nuevo."
      );
    }
  },
};
