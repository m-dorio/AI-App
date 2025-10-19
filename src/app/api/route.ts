// src/app/api/route.ts

import { NextResponse } from 'next/server'

export async function GET() {
    return NextResponse.json({ message: 'Hello from Next.js API Routes (App Router)!' })
}

export async function POST(req: Request) {
    const data = await req.json()
    return NextResponse.json({ receivedData: data })
}
