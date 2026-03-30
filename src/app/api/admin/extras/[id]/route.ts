import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";
export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const bypassEmails = ["grupomercatta@gmail.com", "matheus@grupomercatta.com.br", "matheusconti@gmail.com", "matheus@grupomercatta.com"];
    
    if (!session || !session.user || !session.user.email) {
       return new NextResponse("Unauthorized", { status: 403 });
    }
    
    if (!bypassEmails.includes(session.user.email)) {
       const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
       if (!dbUser || dbUser.role?.toUpperCase() !== "ADMIN") {
          return new NextResponse("Unauthorized", { status: 403 });
       }
    }

    const json = await req.json();
    const extra = await prisma.extra.update({
       where: { id: params.id },
       data: {
          name: json.name,
          description: json.description,
          pricePerDay: json.pricePerDay,
          type: json.type,
          active: json.active,
          imageUrl: json.imageUrl
       }
    });

    return NextResponse.json(extra);
  } catch (e) {
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
       return new NextResponse("Unauthorized", { status: 403 });
    }

    await prisma.extra.delete({
       where: { id: params.id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return new NextResponse("Internal server error", { status: 500 });
  }
}
