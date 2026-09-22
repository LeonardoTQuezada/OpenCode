# Revisión Weather CLI

<<<<<<< HEAD
-[X] **Colores:** no hay ninguno; falta definir cyan (menú), amarillo (temp), verde/rojo (ok/error).
-[] **AGENTS.md:** dice que `index.ts` es stub, pero la app ya funciona — hay que actualizarlo.
-[] **Ciudades:** geocoding solo trae 1 resultado; nombres ambiguos pueden fallar.
-[] **Tests:** no existen; conviene al menos probar storage y las APIs con mocks.
-[] **Binario:** compila bien; revisar que `./weather` guarde datos en `~/.config/weather-cli/`.
-[] **Escalabilidad:** ¿qué tan fácil será expandir con nuevas funcionalidades?
-[] **Carga:** ¿hay estado de carga en las tareas asíncronas?
=======
- [x] **Colores:** cyan (menú), amarillo (temp), verde/rojo (ok/error) implementados en `src/utils/colors.ts`.
- [ ] **AGENTS.md:** dice que `index.ts` es stub, pero la app ya funciona — hay que actualizarlo.
- [ ] **Ciudades:** geocoding solo trae 1 resultado; nombres ambiguos pueden fallar.
- [ ] **Tests:** no existen; conviene al menos probar storage y las APIs con mocks.
- [ ] **Binario:** compila bien; revisar que `./weather` guarde datos en `~/.config/weather-cli/`.
- [ ] **Escalabilidad:** ¿qué tan fácil será expandir con nuevas funcionalidades?
- [ ] **Carga:** ¿hay estado de carga en las tareas asíncronas?
- [ ] **7 day forecast**  agrega la posibilidad de obtener el pronóstico del clima para los próximos 7 días. 
>>>>>>> 01-colors
