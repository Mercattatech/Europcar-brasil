import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const config = await prisma.cieloConfig.findFirst();
    if (!config) {
      return NextResponse.json({ merchantId: '', merchantKey: '', isSandbox: true });
    }
    return NextResponse.json(config);
  } catch (error) {
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { merchantId, merchantKey, isSandbox } = await req.json();

    let config = await prisma.cieloConfig.findFirst();

    if (config) {
      config = await prisma.cieloConfig.update({
        where: { id: config.id },
        data: { merchantId, merchantKey, isSandbox }
      });
    } else {
      config = await prisma.cieloConfig.create({
        data: { merchantId, merchantKey, isSandbox }
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    return new NextResponse("Internal server error", { status: 500 });
  }
}
