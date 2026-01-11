import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { UserContext } from '@/lib/models';

/**
 * API endpoint to add contextual signals to MongoDB
 * This is what The Librarian Agent would use to ingest data
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      userId = 'default_user',
      signalType,
      source,
      rawContent,
      subject,
      concepts = [],
      duration,
      detectedDueDate,
      metadata = {},
    } = body;

    // Validation
    if (!signalType || !source || !rawContent) {
      return NextResponse.json(
        { error: 'Missing required fields: signalType, source, rawContent' },
        { status: 400 }
      );
    }

    // Create user context document
    const context = await UserContext.create({
      userId,
      signalType,
      source,
      rawContent,
      subject,
      concepts,
      timestamp: new Date(),
      duration,
      detectedDueDate: detectedDueDate ? new Date(detectedDueDate) : undefined,
      metadata,
    });

    return NextResponse.json({
      success: true,
      context: {
        id: context._id.toString(),
        signalType: context.signalType,
        timestamp: context.timestamp.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error adding context:', error);
    return NextResponse.json(
      { error: 'Failed to add context', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to fetch user context
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default_user';
    const limit = parseInt(searchParams.get('limit') || '50');

    const contexts = await UserContext.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      count: contexts.length,
      contexts: contexts.map((c) => ({
        ...c,
        _id: c._id.toString(),
      })),
    });
  } catch (error: any) {
    console.error('Error fetching context:', error);
    return NextResponse.json(
      { error: 'Failed to fetch context', details: error.message },
      { status: 500 }
    );
  }
}
