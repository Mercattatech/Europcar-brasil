import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

const ADMIN_EMAILS = ["grupomercatta@gmail.com", "matheus@grupomercatta.com.br", "matheusconti@gmail.com", "matheus@grupomercatta.com"];

async function checkAdmin() {
   const session = await getServerSession(authOptions);
   if (!session?.user?.email) return false;
   if (ADMIN_EMAILS.includes(session.user.email)) return true;
   const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
   return dbUser?.role === 'ADMIN';
}

export async function GET(req: Request) {
   if (!(await checkAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }

   try {
      const { searchParams } = new URL(req.url);
      const statusFilter = searchParams.get('status');
      const search = searchParams.get('search');

      const where: any = {};
      if (statusFilter && statusFilter !== 'ALL') {
         where.status = statusFilter;
      }
      if (search) {
         where.OR = [
            { resNumber: { contains: search } },
            { merchantOrderId: { contains: search } },
         ];
      }

      const reservations = await prisma.localReservation.findMany({
         where,
         orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json(reservations);
   } catch (error: any) {
      console.error('Error fetching reservations:', error);
      return NextResponse.json({ error: 'Erro ao buscar reservas' }, { status: 500 });
   }
}
