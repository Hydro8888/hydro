import { PrismaClient } from '@prisma/client'
import { CHANNEL_CATALOG } from '../src/lib/constants/channel-catalog'
import { DEFAULT_AUTOMATION_MATRIX } from '../src/lib/constants/automation-grades'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // 1. Mock 사용자 생성
  const users = [
    { id: 'user-owner', email: 'owner@hydro.dev', name: '김소유', role: 'OWNER' as const },
    { id: 'user-manager', email: 'manager@hydro.dev', name: '이운영', role: 'MANAGER' as const },
    { id: 'user-reviewer', email: 'reviewer@hydro.dev', name: '박검수', role: 'REVIEWER' as const },
    { id: 'user-worker', email: 'worker@hydro.dev', name: '최실무', role: 'WORKER' as const },
  ]

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: user,
    })
  }
  console.log(`  ${users.length} users created`)

  // 2. 채널 마스터 데이터 생성
  for (const ch of CHANNEL_CATALOG) {
    await prisma.channel.upsert({
      where: { name: ch.name },
      update: {
        displayName: ch.displayName,
        category: ch.category,
        description: ch.description,
        automationCapability: ch.automationCapability,
        riskLevel: ch.riskLevel,
        requiredAssets: ch.requiredAssets,
        supportedTaskTypes: ch.supportedTaskTypes,
      },
      create: {
        name: ch.name,
        displayName: ch.displayName,
        category: ch.category,
        description: ch.description,
        automationCapability: ch.automationCapability,
        riskLevel: ch.riskLevel,
        requiredAssets: ch.requiredAssets,
        supportedTaskTypes: ch.supportedTaskTypes,
      },
    })
  }
  console.log(`  ${CHANNEL_CATALOG.length} channels created`)

  // 3. 자동화 정책 생성
  let policyCount = 0
  for (const [channelName, taskTypes] of Object.entries(DEFAULT_AUTOMATION_MATRIX)) {
    const channel = await prisma.channel.findUnique({ where: { name: channelName } })
    if (!channel) continue

    for (const [taskType, grade] of Object.entries(taskTypes)) {
      await prisma.automationPolicy.upsert({
        where: {
          channelId_taskType: {
            channelId: channel.id,
            taskType: taskType as any,
          },
        },
        update: { grade: grade as any },
        create: {
          channelId: channel.id,
          taskType: taskType as any,
          grade: grade as any,
        },
      })
      policyCount++
    }
  }
  console.log(`  ${policyCount} automation policies created`)

  console.log('Seeding complete!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
