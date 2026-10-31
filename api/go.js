const SHEET_ID = "1VdfAuiBd0IWAwC4ONa8VCrh-Ww8goabVFrud_NyB-1E";
const HOJA = "Link";
const CELDA = "B1:B1";

// Dominio -> parámetro que se agrega al enlace del script ("" = enlace crudo)
const DESTINOS = {
  "codecurve.vercel.app": "?vista=empresa",
  "autogestion.vercel.app": "",
  "licenciacodecurve.vercel.app": "?vista=panel",
};

let cache = { url: "", t: 0 };

// Lee el enlace del script desde la hoja (cacheado 60 segundos)
async function obtenerBase() {
  if (cache.url && Date.now() - cache.t < 60000) return cache.url;
  const u = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(HOJA)}&range=${CELDA}&headers=0`;
  const r = await fetch(u, { redirect: "follow" });
  const txt = await r.text();
  const m = txt.match(/https:\/\/script\.google\.com\/[^",\s]+/);
  if (!m) throw new Error("No se encontró el enlace en la celda");
  cache = { url: m[0], t: Date.now() };
  return m[0];
}

module.exports = async (req, res) => {
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "")
    .split(",")[0]
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "");

  if (!(host in DESTINOS)) return res.status(404).send("Dominio no configurado");

  let BASE;
  try {
    BASE = await obtenerBase();
  } catch (err) {
    return res.status(500).send("No se pudo leer el enlace de la hoja");
  }

  const sufijo = DESTINOS[host]; // "", "?vista=empresa" o "?vista=panel"
  return res.redirect(302, `${BASE}${sufijo}`);
};
