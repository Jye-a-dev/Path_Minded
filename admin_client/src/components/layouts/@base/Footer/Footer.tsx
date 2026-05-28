import React from "react";
import { Link } from "react-router-dom";

export interface FooterLink {
  label: string;
  to?: string;
  href?: string;
  external?: boolean;
}

export interface FooterProps {
  className?: string;
  brandName?: string;
  brandDescription?: string;
  brandIndicatorColor?: string;
  links?: FooterLink[];
  bottomLeftText?: string;
  bottomRightText?: string;
  children?: React.ReactNode;
  brandTextClass?: string;
  descriptionTextClass?: string;
  linkClass?: string;
  bottomTextClass?: string;
}

export default function Footer({
  className = "mt-auto border-t border-zinc-200 bg-white/70 py-8 text-zinc-500 text-xs select-none",
  brandName,
  brandDescription,
  brandIndicatorColor = "bg-indigo-655",
  links = [],
  bottomLeftText,
  bottomRightText,
  brandTextClass = "font-bold text-zinc-800 flex items-center gap-1.5",
  descriptionTextClass = "mt-1 text-zinc-500 font-medium",
  linkClass = "hover:text-indigo-600 transition-colors",
  bottomTextClass = "mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-zinc-200/50 pt-4 text-[10px] uppercase tracking-wider text-zinc-550 font-bold",
  children,
}: FooterProps) {
  return (
    <footer className={className}>
      {children ? (
        children
      ) : (
        <div className="mx-auto max-w-5xl w-full px-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className={brandTextClass}>
                <span className={`h-2 w-2 rounded ${brandIndicatorColor}`}></span>
                {brandName}
              </p>
              {brandDescription && (
                <p className={descriptionTextClass}>{brandDescription}</p>
              )}
            </div>
            {links.length > 0 && (
              <div className="flex flex-wrap gap-x-6 gap-y-2 font-bold">
                {links.map((link, idx) => {
                  if (link.external || link.href) {
                    return (
                      <a
                        key={idx}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className={linkClass}
                      >
                        {link.label}
                      </a>
                    );
                  }
                  return (
                    <Link
                      key={idx}
                      to={link.to || "#"}
                      className={linkClass}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
          {(bottomLeftText || bottomRightText) && (
            <div className={bottomTextClass}>
              <span>{bottomLeftText}</span>
              {bottomRightText && (
                <span className="flex items-center gap-1.5 mt-2 sm:mt-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                  {bottomRightText}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </footer>
  );
}
