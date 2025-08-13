"use client";
import { useEffect } from "react";

export default function TrixAssets() {
  useEffect(() => {
    const head = document.head;
    if (!head) return;
    // stylesheet
    const existingCss = head.querySelector('link[data-trix="css"]') as HTMLLinkElement | null;
    if (!existingCss) {
      const linkEl = document.createElement("link");
      linkEl.setAttribute("data-trix", "css");
      linkEl.rel = "stylesheet";
      linkEl.href = "https://unpkg.com/trix@2.1.15/dist/trix.css";
      head.appendChild(linkEl);
    }
    // script
    const existingJs = head.querySelector('script[data-trix="js"]') as HTMLScriptElement | null;
    if (!existingJs) {
      const scriptEl = document.createElement("script");
      scriptEl.setAttribute("data-trix", "js");
      scriptEl.src = "https://unpkg.com/trix@2.1.15/dist/trix.umd.min.js";
      scriptEl.defer = true;
      head.appendChild(scriptEl);
    }
  }, []);
  return null;
}


