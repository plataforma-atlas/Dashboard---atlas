import { NextResponse } from "next/server";
import { FunnelRow } from "@/lib/types";
import { generateMockFunnel } from "@/lib/mock-data";

// Esta ruta corre en el servidor de Vercel, nunca en el navegador del cliente.
// Así el webhook de n8n nunca queda expuesto en el código del frontend.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fecha_inicio = searchParams.get("fecha_inicio") ?? "";
  const fecha_fin = searchParams.get("fecha_fin") ?? "";
  const pais = searchParams.get("pais") ?? "";
  const cliente_id = searchParams.get("cliente_id") ?? "";

  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  // Sin webhook configurado todavía -> devolvemos datos de ejemplo para poder
  // construir y revisar el dashboard hoy mismo.
  if (!webhookUrl) {
    return NextResponse.json({
      source: "mock",
      rows: generateMockFunnel(),
    });
  }

  try {
    const url = new URL(webhookUrl);
    if (fecha_inicio) url.searchParams.set("fecha_inicio", fecha_inicio);
    if (fecha_fin) url.searchParams.set("fecha_fin", fecha_fin);
    if (pais) url.searchParams.set("pais", pais);
    // Nota: hoy el workflow de n8n solo tiene una tabla (leads_lanzamiento_floppy),
    // así que este parámetro no hace nada todavía. Cuando cada cliente tenga su
    // propia tabla/subcuenta, el nodo de n8n puede leer este valor para elegir cuál usar.
    if (cliente_id) url.searchParams.set("cliente_id", cliente_id);

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`n8n respondió ${res.status}`);
    }

    const data = (await res.json()) as FunnelRow[];

    return NextResponse.json({ source: "n8n", rows: data });
  } catch (err) {
    console.error("Error consultando webhook n8n:", err);
    return NextResponse.json(
      { source: "error", rows: [], message: "No se pudo conectar al webhook de n8n" },
      { status: 502 }
    );
  }
}
