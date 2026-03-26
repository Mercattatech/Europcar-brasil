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

export async function GET() {
   if (!(await checkAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }

   try {
      const [
         totalUsers,
         blockedUsers,
         adminUsers,
         totalReservations,
         paidReservations,
         pendingReservations,
         cancelledReservations,
         recentUsers,
         recentReservations
      ] = await Promise.all([
         prisma.user.count(),
         prisma.user.count({ where: { status: 'BLOCKED' } }),
         prisma.user.count({ where: { role: 'ADMIN' } }),
         prisma.localReservation.count(),
         prisma.localReservation.count({ where: { status: 'CONFIRMED_PREPAID' } }),
         prisma.localReservation.count({ where: { status: { in: ['PENDING_PIX', 'CONFIRMED_NON_PREPAID'] } } }),
         prisma.localReservation.count({ where: { status: 'CANCELLED' } }),
         prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, name: true, email: true, createdAt: true } }),
         prisma.localReservation.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
      ]);

      const activeUsers = totalUsers - blockedUsers;

      return NextResponse.json({
         users: { total: totalUsers, active: activeUsers, blocked: blockedUsers, admins: adminUsers },
         reservations: { total: totalReservations, paid: paidReservations, pending: pendingReservations, cancelled: cancelledReservations },
         recentUsers,
         recentReservations
      });
   } catch (error: any) {
      console.error('Dashboard error:', error);
      return NextResponse.json({ error: 'Erro ao carregar dashboard' }, { status: 500 });
   }
}
