"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOut() {
  return (
    <button
      onClick={() => signOut({ redirectTo: "/login" })}
      className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-sm font-medium text-slate-300 hover:text-white transition-colors"
    >
      <LogOut size={16} />
      Sign Out
    </button>
  );
}
