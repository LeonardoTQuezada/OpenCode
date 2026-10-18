"use client";

import Link from "next/link";
import { useActionState } from "react";

import { loginAction, type LoginResult } from "@/app/login/actions";

// Estado inicial sin error: el único slot de error queda oculto hasta fallar.
const initialState: LoginResult = { ok: true };

/** Formulario de login (SPEC 09): autentica contra Supabase Auth vía
 *  loginAction. El estado "Ingresando…" y el mensaje de error en rojo
 *  vienen de useActionState; los links secundarios quedan intactos. */
export function LoginForm() {
  // useActionState pasa (prevState, FormData); loginAction solo necesita
  // el FormData (firma del spec), por eso el wrapper de un solo arg.
  const [state, formAction, isPending] = useActionState(
    (_prev: LoginResult, formData: FormData) => loginAction(formData),
    initialState,
  );

  return (
    <form action={formAction}>
      <div className="mb-2 text-[12px] font-bold tracking-[.7px] text-faint">
        EMAIL
      </div>
      <input
        type="email"
        name="email"
        autoComplete="email"
        className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-input-border bg-white px-4 py-[14px] text-[15px] text-ink outline-none focus:border-input-focus"
      />

      <div className="mb-2 text-[12px] font-bold tracking-[.7px] text-faint">
        CONTRASEÑA
      </div>
      <input
        type="password"
        name="password"
        placeholder="••••••••"
        autoComplete="current-password"
        className="mb-2.5 w-full rounded-[14px] border-[1.5px] border-input-border bg-white px-4 py-[14px] text-[15px] text-ink outline-none placeholder:text-placeholder focus:border-input-focus"
      />

      <div className="mb-5 text-right">
        <Link
          href="/forgot-password"
          className="cursor-pointer text-[13.5px] font-bold text-coral-deep"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="block w-full cursor-pointer rounded-[15px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] p-[15px] text-center text-[16px] font-extrabold text-white shadow-login disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Ingresando…" : "Iniciar sesión"}
      </button>

      {!state.ok && (
        <p className="mt-3 mb-0 text-[14px] text-[#C5503A]">{state.message}</p>
      )}

      <p className="mt-6 mb-0 text-center text-[14.5px] text-faint">
        ¿Te invitó la guardería?{" "}
        <Link
          href="/activate-account"
          className="font-extrabold text-coral-deep"
        >
          Activá tu cuenta
        </Link>
      </p>
    </form>
  );
}
