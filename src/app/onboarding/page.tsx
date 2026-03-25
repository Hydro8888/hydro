'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AutomationGradeBadge } from '@/components/common/automation-grade-badge'
import { ServiceTypeLabel, GoalTypeLabel } from '@/lib/constants/enums'
import type { ServiceType, GoalType, AutomationGrade } from '@/lib/constants/enums'
import type { ChannelRecommendation, ServiceAnalysis } from '@/types'
import { CheckCircle, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react'

type Step = 1 | 2 | 3 | 4 | 5

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)

  // Step 1: 서비스 정보
  const [serviceName, setServiceName] = useState('')
  const [serviceUrl, setServiceUrl] = useState('')
  const [serviceType, setServiceType] = useState<string>('WEB_SERVICE')
  const [description, setDescription] = useState('')

  // Step 2: 목표
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])

  // Step 3: 분석 결과
  const [serviceId, setServiceId] = useState<string>('')
  const [analysis, setAnalysis] = useState<ServiceAnalysis | null>(null)
  const [recommendations, setRecommendations] = useState<ChannelRecommendation[]>([])

  // Step 4: 채널 선택
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])

  // Step 1 → 서비스 등록
  async function handleServiceSubmit() {
    setLoading(true)
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: serviceName,
          url: serviceUrl || undefined,
          type: serviceType,
          description,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setServiceId(data.data.service.id)
        setAnalysis(data.data.analysis)
        setStep(2)
      }
    } finally {
      setLoading(false)
    }
  }

  // Step 2 → 목표 설정 & 추천 채널 조회
  async function handleGoalsSubmit() {
    setLoading(true)
    try {
      // 목표 저장
      for (const goalType of selectedGoals) {
        await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId,
            type: goalType,
            description: GoalTypeLabel[goalType as GoalType],
          }),
        })
      }

      // 추천 채널 조회
      const res = await fetch(`/api/channels/recommendations?serviceId=${serviceId}`)
      const data = await res.json()
      if (data.success) {
        setRecommendations(data.data.recommendations)
        setAnalysis(data.data.analysis)
      }
      setStep(3)
    } finally {
      setLoading(false)
    }
  }

  // Step 3 → 채널 연결 & 작업 생성
  async function handleChannelConnect() {
    setLoading(true)
    try {
      for (const channelName of selectedChannels) {
        // 채널 연결
        const connRes = await fetch('/api/channels/connections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serviceId, channelName }),
        })
        const connData = await connRes.json()

        if (connData.success) {
          // 작업 자동 생성
          await fetch('/api/tasks/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              serviceId,
              channelConnectionId: connData.data.id,
            }),
          })
        }
      }
      setStep(4)
    } finally {
      setLoading(false)
    }
  }

  const toggleGoal = (goalType: string) => {
    setSelectedGoals(prev =>
      prev.includes(goalType)
        ? prev.filter(g => g !== goalType)
        : [...prev, goalType]
    )
  }

  const toggleChannel = (channelName: string) => {
    setSelectedChannels(prev =>
      prev.includes(channelName)
        ? prev.filter(c => c !== channelName)
        : [...prev, channelName]
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* 진행 표시 */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                s < step ? 'bg-green-500 text-white' :
                s === step ? 'bg-primary text-primary-foreground' :
                'bg-muted text-muted-foreground'
              }`}
            >
              {s < step ? <CheckCircle className="h-5 w-5" /> : s}
            </div>
            {s < 4 && <div className={`h-0.5 w-8 ${s < step ? 'bg-green-500' : 'bg-muted'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: 서비스 정보 */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>서비스 정보 입력</CardTitle>
            <CardDescription>마케팅할 서비스의 기본 정보를 입력해주세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="서비스명 *"
              value={serviceName}
              onChange={e => setServiceName(e.target.value)}
              placeholder="예: 맛있는 피자집"
            />
            <Input
              label="서비스 URL"
              value={serviceUrl}
              onChange={e => setServiceUrl(e.target.value)}
              placeholder="https://example.com"
            />
            <Select
              label="서비스 유형 *"
              value={serviceType}
              onChange={e => setServiceType(e.target.value)}
            >
              {Object.entries(ServiceTypeLabel).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
            <Textarea
              label="서비스 소개 *"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="서비스에 대해 간단히 설명해주세요"
              rows={4}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleServiceSubmit}
                disabled={!serviceName || !description || loading}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                다음 단계
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: 목표 선택 */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>운영 목표 선택</CardTitle>
            <CardDescription>달성하고 싶은 목표를 선택해주세요 (복수 선택 가능)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(GoalTypeLabel).filter(([k]) => k !== 'CUSTOM').map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => toggleGoal(value)}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    selectedGoals.includes(value)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                이전
              </Button>
              <Button
                onClick={handleGoalsSubmit}
                disabled={selectedGoals.length === 0 || loading}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                채널 추천 받기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: 추천 채널 선택 */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>추천 채널</CardTitle>
            <CardDescription>서비스와 목표에 맞는 채널이 추천되었습니다. 연결할 채널을 선택하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis && (
              <div className="rounded-lg bg-muted p-4 text-sm space-y-1">
                <p>서비스 분석 결과: {analysis.isLocal ? '로컬 비즈니스' : ''} {analysis.isApp ? '앱 기반' : ''} {analysis.isB2B ? 'B2B' : 'B2C'}</p>
                {analysis.missingAssets.length > 0 && (
                  <p className="text-orange-600">부족한 자산: {analysis.missingAssets.join(', ')}</p>
                )}
              </div>
            )}

            <div className="space-y-3">
              {recommendations.map((rec) => (
                <button
                  key={rec.channelName}
                  onClick={() => toggleChannel(rec.channelName)}
                  className={`w-full rounded-lg border p-4 text-left transition-colors ${
                    selectedChannels.includes(rec.channelName)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{rec.displayName}</span>
                        <AutomationGradeBadge grade={rec.automationGrade as AutomationGrade} />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>적합도: {rec.score}점</span>
                        {rec.readyNow && <Badge variant="success">바로 시작 가능</Badge>}
                      </div>
                      {rec.reasons.length > 0 && (
                        <p className="text-xs text-muted-foreground">{rec.reasons[0]}</p>
                      )}
                      {rec.missingItems.length > 0 && (
                        <p className="text-xs text-orange-600">부족: {rec.missingItems.join(', ')}</p>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-primary">{rec.score}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                이전
              </Button>
              <Button
                onClick={handleChannelConnect}
                disabled={selectedChannels.length === 0 || loading}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {selectedChannels.length}개 채널 연결 & 작업 생성
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: 완료 */}
      {step === 4 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-2xl font-bold mb-2">운영 준비 완료!</h3>
            <p className="text-muted-foreground mb-6">
              {selectedChannels.length}개 채널이 연결되고 작업이 자동 생성되었습니다.
              <br />
              자동화 등급에 따라 A등급 작업은 즉시 실행되고,
              <br />
              B등급은 승인 센터에서, C등급은 반자동 작업 센터에서 확인할 수 있습니다.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.push('/tasks')}>
                작업 센터로 이동
              </Button>
              <Button onClick={() => router.push('/')}>
                대시보드로 이동
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
