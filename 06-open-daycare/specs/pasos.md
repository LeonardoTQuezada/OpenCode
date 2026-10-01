## Flujo de trabajo recomendado

1. **Describir el problema:**  
   Utiliza la skill `/spec` para crear el artefacto SDD.

2. **Revisión y aprobación:**  
   Revisa el artefacto generado y apruébalo si cumple los requisitos.

3. **Implementación:**  
   Ejecuta `/spec-impl` para comenzar la implementación guiada por el SDD.

4. **Revisión paso a paso:**  
   Verifica cada avance de la implementación de forma iterativa.

5. **Ajustes rápidos:**  
   Para cambios menores o correcciones, usa *one shot prompts*.

6. **Verificación automática:**  
   Apóyate en el agente `@spec-verifier` para validar la implementación.

7. **Marcar como implementado:**  
   Actualiza el estado del spec a **"implementado"**.

8. **Publicar cambios:**  
   Sube la rama al repositorio de Github y abre un *pull request*.

9. **Merge y limpieza remota:**  
   Haz *merge* en Github y elimina la rama en el repositorio remoto.

10. **Sincroniza tu entorno local:**  
    Cambia a la rama `main`, haz *pull* para traer los cambios y elimina la rama local si es necesario.