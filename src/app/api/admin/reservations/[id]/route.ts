import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
export const dynamic = 'force-dynamic';

const ADMIN_EMAILS = ["grupomercatta@gmail.com", "matheus@grupomercatta.com.br", "matheusconti@gmail.com", "matheus@grupomercatta.com"];

async function checkAdmin() {
   const session = await getServerSession(authOptions);
   if (!session?.user?.email) return false;
   if (ADMIN_EMAILS.includes(session.user.email)) return true;
   const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
   return dbUser?.role === 'ADMIN';
}

// PATCH - Update reservation status
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
   if (!(await checkAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }

   try {
      const body = await req.json();
      const updateData: any = {};

      if (body.status !== undefined) updateData.status = body.status;

      const updated = await prisma.localReservation.update({
         where: { id: params.id },
         data: updateData,
      });

      return NextResponse.json(updated);
   } catch (error: any) {
      console.error('Error updating reservation:', error);
      return NextResponse.json({ error: 'Erro ao atualizar reserva' }, { status: 500 });
   }
}

// DELETE - Delete reservation
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
   if (!(await checkAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }

   try {
      await prisma.localReservation.delete({ where: { id: params.id } });
      return NextResponse.json({ success: true });
   } catch (error: any) {
      console.error('Error deleting reservation:', error);
      return NextResponse.json({ error: 'Erro ao excluir reserva' }, { status: 500 });
   }
}
