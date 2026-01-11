import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { SprintTask } from '@/lib/models';
import { getWeek, getYear } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const weekParam = searchParams.get('week');
    const yearParam = searchParams.get('year');

    const now = new Date();
    const currentWeek = weekParam ? parseInt(weekParam) : getWeek(now);
    const currentYear = yearParam ? parseInt(yearParam) : getYear(now);

    const filter: any = {
      sprintWeek: currentWeek,
      sprintYear: currentYear,
    };

    if (status) {
      filter.status = status;
    }

    const tasks = await SprintTask.find(filter)
      .populate('projectId')
      .sort({ priority: -1, createdAt: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      week: currentWeek,
      year: currentYear,
      tasks: tasks.map((t) => ({
        ...t,
        _id: t._id.toString(),
        projectId: t.projectId ? (t.projectId as any)._id.toString() : null,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching sprint tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sprint tasks', details: error.message },
      { status: 500 }
    );
  }
}
