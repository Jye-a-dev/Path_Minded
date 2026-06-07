"use client";

import React from "react";
import Link from "next/link";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface DashboardFooterProps {
  brandName: string;
  brandDescription: string;
  accentDotColor: string; // e.g. "bg-violet-500"
  links?: FooterLink[];
  bottomLeftText?: string;
  bottomRightText?: string;
}

export default function DashboardFooter({
  brandName,
  brandDescription,
  accentDotColor,
  links = [],
  bottomLeftText,
  bottomRightText,
}: DashboardFooterProps) {
  return (
    <footer className="mt-12 pt-8 border-t border-neutral-200/60 text-neutral-400 text-xs max-w-5xl w-full mx-auto select-none">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        {/* Brand */}
        <div>
          <p className="font-bold text-neutral-600 flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${accentDotColor}`} />
            {brandName}
          </p>
          {brandDescription && (
            <p className="mt-1 text-neutral-400 font-medium leading-relaxed max-w-sm">
              {brandDescription}
            </p>
          )}
        </div>

        {/* Links */}
        {links.length > 0 && (
          <div className="flex flex-wrap gap-x-6 gap-y-2 font-semibold">
            {links.map((link, idx) =>
              link.external ? (
                <a
                  key={idx}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-violet-500 transition-colors"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={idx}
                  href={link.href}
                  className="hover:text-violet-500 transition-colors"
                >
                  {link.label}
                </Link>
              )
            )}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      {(bottomLeftText || bottomRightText) && (
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-neutral-200/40 pt-4 text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
          <span>{bottomLeftText}</span>
          {bottomRightText && (
            <span className="flex items-center gap-1.5 mt-2 sm:mt-0">
              <span className={`h-1.5 w-1.5 rounded-full ${accentDotColor} animate-ping`} />
              {bottomRightText}
            </span>
          )}
        </div>
      )}
    </footer>
  );
}
