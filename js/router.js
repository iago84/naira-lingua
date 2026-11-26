// js/router.js
export function parseHash(hash) {
  const raw = String(hash || "").replace(/^#\/?/, "");
  const parts = raw.split("/").filter(Boolean);
  if (parts.length === 0) return { name: "home", param: null };
  return { name: parts[0], param: parts.slice(1).join("/") || null };
}

export function toHash(name, param) {
  if (name === "home") return "#/";
  return "#/" + name + (param ? "/" + param : "");
}
