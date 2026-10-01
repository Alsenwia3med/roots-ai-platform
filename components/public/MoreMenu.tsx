"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * C-05 §2 "More menu" — the overflow navigation disclosure.
 *
 * This component exists because both headers previously rendered a bare
 * `<button>More</button>` with no handler and no menu, so the button looked
 * interactive and did nothing. C-05 lists five screens whose ONLY entry point is
 * "More menu" (PUB-06 Healthcare Professionals, PUB-07 Pilot, PUB-08 About,
 * PUB-09 Contact, PUB-11 Blog Landing); without it those pages were unreachable
 * except by typing the URL.
 *
 * Behaviour implemented here, because C-05 requires keyboard operability and a
 * menu must not trap focus:
 *   - opens on click, closes on Escape
 *   - closes on outside click
 *   - focus returns to the trigger when the menu closes
 *   - ArrowDown opens and focuses the first item
 *
 * The item labels and destinations are quoted from the C-05 screen inventory.
 * They are not invented: each href is a route C-05 already declares.
 */
export const MORE_MENU_ITEMS = [
  { label: "Healthcare Professionals", href: "/healthcare-professionals" },
  { label: "Pilot", href: "/pilot" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Blog", href: "/blog" },
] as const;

export function MoreMenu({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Escape closes and returns focus to the trigger.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        // aria-expanded/aria-controls are what make this announceable; without
        // them a screen reader says only "More, button".
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="more-menu"
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            window.requestAnimationFrame(() => {
              menuRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
            });
          }
        }}
        className={`min-h-11 inline-flex items-center hover:underline ${
          open ? "underline" : ""
        }`}
      >
        More
        <span aria-hidden="true" className="ml-1 text-xs">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open ? (
        <div
          id="more-menu"
          ref={menuRef}
          role="menu"
          aria-label="More pages"
          className="absolute right-0 top-full z-50 mt-1 min-w-[15rem] rounded-xl border border-[#D8DEE8] bg-white p-2 text-[#1A1A1A] shadow-xl"
        >
          {MORE_MENU_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              role="menuitem"
              className="flex min-h-11 items-center rounded-lg px-3 text-sm hover:bg-[#F3F4F6]"
            >
              {item.label}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}