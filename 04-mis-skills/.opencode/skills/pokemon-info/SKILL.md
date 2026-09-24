---
name: Pokémon Info
description: Usar cuando la conversación mencione o pregunte sobre cualquier Pokémon (por nombre o ID). Consulta PokeAPI (https://pokeapi.co/api/v2/pokemon/{id-o-nombre}) para responder con datos reales: tipos, estadísticas, habilidades, peso, altura, evoluciones y más.
---

# Pokémon Info

Consulta información oficial de Pokémon desde [PokeAPI](https://pokeapi.co)
(gratuita, sin API key).

## Cuándo usar

Cualquier tema de conversación sobre un Pokémon: nombre, ID, tipos,
estadísticas, habilidades, evoluciones, peso, altura, etc. Si el usuario
menciona un Pokémon aunque sea de pasada, consultar la API antes de responder.

## Flujo de trabajo

1. **Identificar el Pokémon**: acepta nombre (`ditto`) o ID (`1`).
   Normalizar nombres a minúsculas y sin espacios extra.
2. **Consultar la API base**:
   - `https://pokeapi.co/api/v2/pokemon/ditto`
   - `https://pokeapi.co/api/v2/pokemon/1`
   - Usar `webfetch` (respaldo: `curl` por shell).
3. **Campos a extraer**: `name`, `id`, `types`, `height`, `weight`,
   `abilities`, `stats` (HP, Ataque, Defensa, Velocidad...), `sprites`.
4. **Consulta extendida** (solo si la pregunta lo requiere):
   - Descripción/especie/generación →
     `https://pokeapi.co/api/v2/pokemon-species/{id-o-nombre}`
   - Evoluciones → seguir `evolution_chain.url` de la respuesta de species.
5. **Manejo de errores**:
   - HTTP 404 → indicar que no existe ese nombre/ID y sugerir verificar.
   - Error de red → decirlo explícitamente, nunca inventar datos.
6. **Responder en el idioma del usuario** con los datos reales obtenidos.
   Si mencionan varios Pokémon, consultar cada uno por separado.
