import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/services/[id]/assets - 자산 목록
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assets = await prisma.brandAsset.findMany({
      where: { serviceId: params.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ success: true, data: assets })
  } catch (error) {
    return NextResponse.json({ success: false, error: '자산 목록 조회에 실패했습니다' }, { status: 500 })
  }
}

// POST /api/services/[id]/assets - 자산 등록
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { type, name, url, content } = body

    if (!type || !name) {
      return NextResponse.json(
        { success: false, error: '자산 유형과 이름은 필수입니다' },
        { status: 400 }
      )
    }

    const asset = await prisma.brandAsset.create({
      data: {
        serviceId: params.id,
        type,
        name,
        url: url || null,
        content: content || null,
      },
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'BrandAsset',
        entityId: asset.id,
        action: 'CREATE',
        after: { type, name, url },
      },
    })

    return NextResponse.json({ success: true, data: asset })
  } catch (error) {
    return NextResponse.json({ success: false, error: '자산 등록에 실패했습니다' }, { status: 500 })
  }
}

// DELETE /api/services/[id]/assets - 자산 삭제 (body에 assetId)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { assetId } = await request.json()

    if (!assetId) {
      return NextResponse.json({ success: false, error: 'assetId가 필요합니다' }, { status: 400 })
    }

    await prisma.brandAsset.delete({ where: { id: assetId } })

    await prisma.auditLog.create({
      data: {
        entityType: 'BrandAsset',
        entityId: assetId,
        action: 'DELETE',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: '자산 삭제에 실패했습니다' }, { status: 500 })
  }
}
