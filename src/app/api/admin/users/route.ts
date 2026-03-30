import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function GET() {
   try {
      const users = await prisma.user.findMany();
      return NextResponse.json(users);
   } catch (error) {
      return NextResponse.json({ error: 'Erro ao buscar' }, { status: 500 });
   }
}

export async function PUT(req: Request) {
   try {
      const { id, role } = await req.json();
      
      const updatedUser = await prisma.user.update({
         where: { id },
         data: { role }
      });

      return NextResponse.json(updatedUser);
   } catch (error) {
      return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
   }
}
