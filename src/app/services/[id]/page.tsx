'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/common/status-badge'
import { AutomationGradeBadge } from '@/components/common/automation-grade-badge'
import { ServiceTypeLabel } from '@/lib/constants/enums'
import type { AutomationGrade } from '@/lib/constants/enums'
import { Edit3, Save, X, Plus, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'

const ASSET_TYPES = [
  { value: 'LOGO', label: '로고' },
  { value: 'IMAGE', label: '이미지' },
  { value: 'TEXT', label: '텍스트' },
  { value: 'VIDEO', label: '영상' },
  { value: 'DOCUMENT', label: '문서' },
]

export default function ServiceDetailPage() {
  const params = useParams()
  const [service, setService] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // 편집 폼 상태
  const [editName, setEditName] = useState('')
  const [editUrl, setEditUrl] = useState('')
  const [editType, setEditType] = useState('')
  const [editDescription, setEditDescription] = useState('')

  // 자산 추가
  const [newAssetType, setNewAssetType] = useState('LOGO')
  const [newAssetName, setNewAssetName] = useState('')
  const [newAssetUrl, setNewAssetUrl] = useState('')

  function loadService() {
    if (!params.id) return
    fetch(`/api/services/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setService(data.data)
          setEditName(data.data.name)
          setEditUrl(data.data.url || '')
          setEditType(data.data.type)
          setEditDescription(data.data.description)
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadService() }, [params.id])

  async function handleSave() {
    setSaving(true)
    try {
      await fetch(`/api/services/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, url: editUrl || null, type: editType, description: editDescription }),
      })
      setEditing(false)
      loadService()
    } finally {
      setSaving(false)
    }
  }

  async function addAsset() {
    if (!newAssetName) return
    await fetch(`/api/services/${params.id}/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: newAssetType, name: newAssetName, url: newAssetUrl || null }),
    })
    setNewAssetName('')
    setNewAssetUrl('')
    loadService()
  }

  async function deleteAsset(assetId: string) {
    await fetch(`/api/services/${params.id}/assets`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetId }),
    })
    loadService()
  }

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-8 bg-muted rounded w-1/3" />
      <div className="h-40 bg-muted rounded" />
    </div>
  }

  if (!service) return <p>서비스를 찾을 수 없습니다.</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{service.name}</h2>
          <p className="text-muted-foreground">
            {ServiceTypeLabel[service.type as keyof typeof ServiceTypeLabel]}
            {service.isLocal && ' | 로컬'}{service.isApp && ' | 앱'}{service.isB2B && ' | B2B'}
          </p>
        </div>
        {!editing && (
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Edit3 className="h-4 w-4 mr-2" /> 편집
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 기본 정보 */}
        <Card>
          <CardHeader><CardTitle className="text-lg">기본 정보</CardTitle></CardHeader>
          <CardContent>
            {editing ? (
              <div className="space-y-3">
                <Input label="서비스명" value={editName} onChange={e => setEditName(e.target.value)} />
                <Input label="URL" value={editUrl} onChange={e => setEditUrl(e.target.value)} />
                <Select label="유형" value={editType} onChange={e => setEditType(e.target.value)}>
                  {Object.entries(ServiceTypeLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Select>
                <Textarea label="소개" value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={3} />
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saving} size="sm">
                    {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                    저장
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                    <X className="h-4 w-4 mr-1" /> 취소
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">소개:</span> {service.description}</p>
                {service.url && <p><span className="font-medium">URL:</span> {service.url}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 브랜드 자산 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">브랜드 자산</CardTitle>
            <CardDescription>{service.assets?.length || 0}개 자산</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {service.assets?.map((asset: any) => (
              <div key={asset.id} className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{ASSET_TYPES.find(t => t.value === asset.type)?.label || asset.type}</Badge>
                  <span className="text-sm">{asset.name}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteAsset(asset.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}

            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex gap-2">
                <Select value={newAssetType} onChange={e => setNewAssetType(e.target.value)} className="w-24 text-xs">
                  {ASSET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
                <Input value={newAssetName} onChange={e => setNewAssetName(e.target.value)} placeholder="이름" className="flex-1" />
              </div>
              <div className="flex gap-2">
                <Input value={newAssetUrl} onChange={e => setNewAssetUrl(e.target.value)} placeholder="URL" className="flex-1" />
                <Button size="sm" onClick={addAsset} disabled={!newAssetName}><Plus className="h-3 w-3 mr-1" />추가</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 목표 */}
        <Card>
          <CardHeader><CardTitle className="text-lg">운영 목표</CardTitle></CardHeader>
          <CardContent>
            {service.goals?.length === 0 ? (
              <p className="text-sm text-muted-foreground">설정된 목표가 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {service.goals?.map((goal: any) => (
                  <div key={goal.id} className="rounded-lg border p-3">
                    <p className="font-medium text-sm">{goal.description}</p>
                    {Array.isArray(goal.subGoals) && goal.subGoals.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {goal.subGoals.map((sg: any) => (
                          <Badge key={sg.id} variant="secondary" className="text-xs">{sg.description}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 채널 */}
        <Card>
          <CardHeader><CardTitle className="text-lg">연결된 채널</CardTitle></CardHeader>
          <CardContent>
            {service.channelConnections?.length === 0 ? (
              <p className="text-sm text-muted-foreground">연결된 채널이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {service.channelConnections?.map((conn: any) => (
                  <div key={conn.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{conn.channel.displayName}</span>
                      <AutomationGradeBadge grade={conn.channel.automationCapability as AutomationGrade} />
                    </div>
                    <StatusBadge status={conn.status} type="channel" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 최근 작업 */}
      {service.tasks?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">최근 작업</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {service.tasks.map((task: any) => (
              <Link key={task.id} href={`/tasks/${task.id}`}>
                <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors cursor-pointer">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{task.title}</p>
                    {task.errorReason && <p className="text-xs text-red-600">실패: {task.errorReason}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <AutomationGradeBadge grade={task.automationGrade as AutomationGrade} />
                    <StatusBadge status={task.status} type="task" />
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
