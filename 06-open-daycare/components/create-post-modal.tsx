"use client";

// Modal "Nueva publicación" (SPEC 06): se abre desde el botón del sidebar y
// desde el composer. El provider lo renderiza solo mientras está abierto, así
// cada apertura monta una instancia nueva y el formulario nace vacío.

import { useEffect, useRef, useState, type FormEvent } from "react";

import type { Kid } from "@/lib/kids";
import type { Audience, NewPostInput, PostPhoto, PostType } from "@/lib/posts";
import { POST_TYPE_OPTIONS, tipoClasses } from "@/lib/posts";

import { CloseIcon, PlusIcon } from "./icons";

type FieldKey = "audience" | "type" | "body";

type FieldErrors = Partial<Record<FieldKey, string>>;

const labelClass = "mb-[10px] block text-[12px] font-extrabold tracking-[.7px] text-faint";

const errorClass = "mt-2 text-[13.5px] font-bold text-coral-deep";

const textareaClass =
  "min-h-[120px] w-full resize-y rounded-[14px] border-[1.5px] border-input-border bg-white px-4 py-[14px] text-[15px] leading-[1.5] text-ink outline-none placeholder:text-placeholder focus:border-input-focus";

const chipActiveClass = "border-chip-active-bg bg-chip-active-bg text-chip-active-ink";
const chipIdleClass = "border-chip-border bg-chip-bg text-chip-ink";

function firstName(kid: Kid): string {
  return kid.name.split(" ")[0];
}

export function CreatePostModal({
  kids,
  onClose,
  onPublish,
}: {
  kids: Kid[];
  onClose: () => void;
  onPublish: (input: NewPostInput) => void;
}) {
  // Arranca vacío: nada de PARA, ningún TIPO, descripción y fotos vacías.
  const [audience, setAudience] = useState<Audience>({ kind: "kids", slugs: [] });
  const [type, setType] = useState<PostType | null>(null);
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<PostPhoto[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Object URLs creadas por este modal. Al publicar se transfieren a la
  // publicación; al desmontar se revocan las que quedaron sin publicar.
  const ownedUrls = useRef<Set<string>>(new Set());

  /** Esc cierra el modal y bloquea el scroll de la página de fondo. */
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  /** Al desmontar quedan solo las fotos que no se publicaron. */
  useEffect(() => {
    const urls = ownedUrls.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  /** Limpia el error del bloque cuando el usuario vuelve a interactuar. */
  const clearError = (field: FieldKey) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  /** Exclusión mutua: el clic en un niño libera "Toda la sala" y viceversa. */
  const toggleKid = (slug: string) => {
    clearError("audience");
    setAudience((prev) =>
      prev.kind === "room"
        ? { kind: "kids", slugs: [slug] }
        : {
            kind: "kids",
            slugs: prev.slugs.includes(slug)
              ? prev.slugs.filter((entry) => entry !== slug)
              : [...prev.slugs, slug],
          },
    );
  };

  const toggleRoom = () => {
    clearError("audience");
    setAudience((prev) =>
      prev.kind === "room" ? { kind: "kids", slugs: [] } : { kind: "room" },
    );
  };

  const selectType = (next: PostType) => {
    clearError("type");
    setType(next);
  };

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const added: PostPhoto[] = Array.from(files).map((file) => {
      const src = URL.createObjectURL(file);
      ownedUrls.current.add(src);
      return { src, label: file.name, height: 200 };
    });
    setPhotos((prev) => [...prev, ...added]);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const photo = prev[index];
      if (photo?.src && ownedUrls.current.has(photo.src)) {
        URL.revokeObjectURL(photo.src);
        ownedUrls.current.delete(photo.src);
      }
      return prev.filter((_, position) => position !== index);
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const next: FieldErrors = {};
    const hasTarget = audience.kind === "room" || audience.slugs.length > 0;
    if (!hasTarget) next.audience = "Elegí al menos un destinatario.";
    if (!type) next.type = "Elegí un tipo de publicación.";
    if (!body.trim()) next.body = "Escribí qué querés contar.";
    setErrors(next);
    if (next.audience || next.type || next.body) return;
    if (!type) return;

    // Las fotos pasan a la publicación: este modal ya no las revokea.
    ownedUrls.current.clear();
    onPublish({ audience, type, body, photos });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 md:items-center md:p-6">
      {/* Fondo oscuro: clic fuera cierra sin publicar */}
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-modal-overlay"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-post-title"
        className="relative z-10 w-full max-w-[580px] overflow-hidden rounded-[24px] border border-card-border bg-page shadow-modal"
      >
        <form onSubmit={handleSubmit} noValidate>
          {/* Header: Cancelar · Nueva publicación · Publicar */}
          <div className="flex items-center justify-between border-b border-card-border px-[26px] py-5">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer text-[15px] font-bold text-faint"
            >
              Cancelar
            </button>
            <span
              id="create-post-title"
              className="font-display text-[18px] font-semibold text-ink"
            >
              Nueva publicación
            </span>
            <button
              type="submit"
              className="cursor-pointer text-[15px] font-extrabold text-coral-strong"
            >
              Publicar
            </button>
          </div>

          <div className="px-[26px] py-6">
            {/* PARA: selección múltiple + chip exclusivo "Toda la sala" */}
            <div className="mb-[22px]">
              <span className={labelClass}>PARA</span>
              <div className="flex flex-wrap gap-[9px]">
                {kids.map((kid) => {
                  const selected =
                    audience.kind === "kids" && audience.slugs.includes(kid.slug);
                  const dimmed = audience.kind === "room";
                  return (
                    <button
                      key={kid.slug}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleKid(kid.slug)}
                      className={`flex cursor-pointer items-center gap-2 rounded-full border-[1.5px] py-[6px] pl-[6px] pr-[14px] text-[14px] font-bold transition ${
                        selected ? chipActiveClass : chipIdleClass
                      } ${dimmed ? "opacity-50" : ""}`}
                    >
                      <span
                        className={`flex size-[26px] items-center justify-center rounded-full font-display text-[13px] font-semibold ${kid.avatarBg} ${kid.avatarInk}`}
                      >
                        {kid.initial}
                      </span>
                      {firstName(kid)}
                    </button>
                  );
                })}

                <button
                  type="button"
                  aria-pressed={audience.kind === "room"}
                  onClick={toggleRoom}
                  className={`cursor-pointer rounded-full border-[1.5px] px-4 py-[6px] text-[14px] font-bold transition ${
                    audience.kind === "room" ? chipActiveClass : chipIdleClass
                  }`}
                >
                  Toda la sala
                </button>
              </div>
              {errors.audience && (
                <p role="alert" className={errorClass}>
                  {errors.audience}
                </p>
              )}
            </div>

            {/* TIPO: selección única, color de tipo en reposo y activo oscuro */}
            <div className="mb-[22px]">
              <span className={labelClass}>TIPO</span>
              <div className="flex flex-wrap gap-[9px]">
                {POST_TYPE_OPTIONS.map((option) => {
                  const active = type === option.type;
                  const colors = tipoClasses(option.type);
                  return (
                    <button
                      key={option.type}
                      type="button"
                      aria-pressed={active}
                      onClick={() => selectType(option.type)}
                      className={`cursor-pointer rounded-full border-[1.5px] px-4 py-2 text-[13.5px] font-extrabold transition ${
                        active
                          ? chipActiveClass
                          : `border-transparent ${colors.bg} ${colors.text}`
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              {errors.type && (
                <p role="alert" className={errorClass}>
                  {errors.type}
                </p>
              )}
            </div>

            {/* DESCRIPCIÓN */}
            <div className="mb-[22px]">
              <label htmlFor="create-post-body" className={labelClass}>
                DESCRIPCIÓN
              </label>
              <textarea
                id="create-post-body"
                value={body}
                onChange={(event) => {
                  clearError("body");
                  setBody(event.target.value);
                }}
                placeholder="Contá cómo le fue hoy…"
                aria-invalid={Boolean(errors.body)}
                className={textareaClass}
              />
              {errors.body && (
                <p role="alert" className={errorClass}>
                  {errors.body}
                </p>
              )}
            </div>

            {/* FOTOS: múltiples y opcionales, cada una se quita con una X */}
            <div>
              <span className={labelClass}>FOTOS</span>
              <div className="flex flex-wrap gap-3">
                {photos.map((photo, index) => (
                  <div key={`${photo.src}-${index}`} className="relative size-24">
                    {/* Object URL de la foto elegida: no pasa por next/image (SPEC 06) */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.src}
                      alt={photo.label}
                      className="size-24 rounded-[14px] border border-card-border object-cover"
                    />
                    <button
                      type="button"
                      aria-label={`Quitar ${photo.label}`}
                      onClick={() => removePhoto(index)}
                      className="absolute -right-1.5 -top-1.5 flex size-5 cursor-pointer items-center justify-center rounded-full bg-card-divider text-faint shadow-card"
                    >
                      <CloseIcon width={12} height={12} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex size-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-photo-border bg-fade text-photo-icon"
                >
                  <PlusIcon width={22} height={22} stroke="#C5503A" />
                  <span className="text-[12px]">Agregar</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => {
                  addFiles(event.target.files);
                  // Permite volver a elegir el mismo archivo.
                  event.target.value = "";
                }}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
