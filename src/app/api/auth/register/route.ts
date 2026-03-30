import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return new NextResponse("Dados insuficientes", { status: 400 });
    }

    // Verifica se já existe o email
    const exist = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (exist) {
      return new NextResponse("E-mail já está em uso", { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create the user
    // FOR TESTING: We are defaulting all registered users to "ADMIN" so you can access the dashboard easily.
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("ERRO NO CADASTRO", error);
    return new NextResponse("Erro interno no servidor", { status: 500 });
  }
}
