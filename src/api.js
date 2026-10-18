export async function api(path, options = {}) {
  const headers = { "X-Atelier-Request": "local", ...options.headers };
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    options = { ...options, body: JSON.stringify(options.body) };
  }
  const response = await fetch(`/api${path}`, { ...options, headers });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      data.error ||
        data.errors?.map((e) => `${e.name} : ${e.message}`).join("\n") ||
        "La requête a échoué.",
    );
  return data;
}
export const date = (value) =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
export const bytes = (n) =>
  n < 1024
    ? `${n} o`
    : n < 1048576
      ? `${Math.round(n / 1024)} Ko`
      : `${(n / 1048576).toFixed(1)} Mo`;
export const download = (path) => {
  const a = document.createElement("a");
  a.href = `/api${path}`;
  a.download = "";
  a.click();
};
