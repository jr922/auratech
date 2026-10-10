import { NextResponse } from "next/server";
import { getProducts } from "@/lib/api/products";

export async function GET() {
  try {
    // Obtenemos 4 productos al azar (o recientes) para recomendar
    const recommendations = await getProducts({ take: 4 });
    return NextResponse.json(recommendations);
  } catch {
    return NextResponse.json({ error: "Error fetching recommendations" }, { status: 500 });
  }
}
