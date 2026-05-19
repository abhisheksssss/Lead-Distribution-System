import { NextResponse } from 'next/server'

import { createLeadAndAssign } from '@/lib/lead-distribution'
import { AppError } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await createLeadAndAssign({
      name: body.name,
      phoneNumber: body.phoneNumber,
      city: body.city,
      serviceId: Number(body.serviceId),
      description: body.description,
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }

    return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 })
  }
}
