import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/supabase/server'

// POST /api/auth/sync - Sync Supabase user to our local DB
export async function POST(request: Request) {
  try {
    const supabaseUserId = await getAuthenticatedUserId()

    if (!supabaseUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, name } = body

    // Upsert user in our local DB using Supabase user ID
    const user = await db.user.upsert({
      where: { id: supabaseUserId },
      update: {
        email: email || `user-${supabaseUserId}@tradediary.ai`,
        name: name || 'Trader',
      },
      create: {
        id: supabaseUserId,
        email: email || `user-${supabaseUserId}@tradediary.ai`,
        name: name || 'Trader',
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error syncing user:', error)
    return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 })
  }
}
