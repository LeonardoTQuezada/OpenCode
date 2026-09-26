type AvatarProps = {
  /** Inicial mostrada, ej. "M". */
  label: string;
  /** Diámetro en px (48 listado, 84 perfil, 40 padres). */
  size: number;
  /** Clase de token para el fondo, ej. "bg-kid-blue". */
  bg: string;
  /** Clase de token para la letra, ej. "text-kid-blue-ink" o "text-white". */
  ink: string;
  className?: string;
};

/** Círculo con la inicial del niño o del padre.
 *  El tamaño de fuente se deriva del diámetro (≈40%, como el mockup). */
export function Avatar({ label, size, bg, ink, className = "" }: AvatarProps) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-display font-semibold ${bg} ${ink} ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      aria-hidden="true"
    >
      {label}
    </span>
  );
}
