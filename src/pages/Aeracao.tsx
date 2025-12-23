import { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAeration } from '@/hooks/use-aeration'
import { format } from 'date-fns'
import { Fan } from 'lucide-react'
import { useTheme } from '@/lib/theme'

const BARRACAO_CONFIG = {
  1: 4,
  2: 5
}

const MotorCard = ({ barracao, index, activeEvent, onStart, onStop }: any) => {
  const isActive = !!activeEvent
  const [elapsed, setElapsed] = useState<string>('')

  useEffect(() => {
    let timer: any
    const updateElapsed = () => {
      const start = activeEvent?.start_at ? new Date(activeEvent.start_at) : null
      if (!start) {
        setElapsed('')
        return
      }
      const diffMs = Date.now() - start.getTime()
      const totalSec = Math.floor(diffMs / 1000)
      const hours = Math.floor(totalSec / 3600)
      const mins = Math.floor((totalSec % 3600) / 60)
      const secs = totalSec % 60
      setElapsed(hours > 0 ? `${hours}h ${mins}m` : `${mins}m ${secs}s`)
    }

    if (isActive) {
      updateElapsed()
      timer = setInterval(updateElapsed, 1000)
    } else {
      setElapsed('')
    }

    return () => clearInterval(timer)
  }, [activeEvent, isActive])

  return (
    <div className="border rounded p-3 flex flex-col items-start gap-2 min-w-[160px] flex-1">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded"><Fan className="w-6 h-6 text-cyan-600" /></div>
          <div>
            <div className="font-semibold">Motor {index}</div>
            <div className="text-sm text-muted-foreground">Barracão {barracao}</div>
          </div>
        </div>
        <div>
          {isActive ? (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            </div>
          ) : (
            <span className="w-3 h-3 rounded-full bg-gray-300" />
          )}
        </div>
      </div>
      <div className={isActive ? 'text-xs text-muted-foreground' : 'text-xs text-red-600'}>
        {isActive ? `Ligado em ${format(new Date(activeEvent.start_at), 'dd/MM/yyyy HH:mm')} • ${elapsed}` : 'Desligado'}
      </div>
      <div className="mt-2 w-full">
        {isActive ? (
          <Button variant="destructive" className="w-full" onClick={() => onStop(activeEvent)}>Desligar</Button>
        ) : (
          <Button className="w-full" onClick={() => onStart()}>Ligar</Button>
        )}
      </div>
    </div>
  )
}

const Aeracao = () => {
  const { events, loading, startEvent, stopEvent, fetchEvents } = useAeration()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  // Render all barracões and their motors
  const barracoes = useMemo(() => Object.keys(BARRACAO_CONFIG).map(k => Number(k)), [])

  const [filterDate, setFilterDate] = useState<string>('')

  // helper: decide which date to show (filterDate or today)
  const selectedDate = filterDate || format(new Date(), 'yyyy-MM-dd')

  // events for selected date (start_at or end_at falls on that day)
  const eventsForSelectedDate = useMemo(() => {
    return events.filter(e => e.start_at?.startsWith(selectedDate) || e.end_at?.startsWith(selectedDate))
  }, [events, selectedDate])

  // accumulated totals for selected date (per barracao)
  const totalsForSelectedDate = useMemo(() => {
    const acc: Record<number, { totalMinutes: number }> = {}
    Object.keys(BARRACAO_CONFIG).forEach(k => acc[Number(k)] = { totalMinutes: 0 })
    eventsForSelectedDate.forEach(e => {
      const b = e.barracao
      const start = e.start_at ? new Date(e.start_at) : null
      const end = e.end_at ? new Date(e.end_at) : new Date()
      if (start) {
        const diff = (end.getTime() - start.getTime()) / (1000 * 60)
        acc[b].totalMinutes += Math.max(0, diff)
      }
    })
    return acc
  }, [eventsForSelectedDate])

  // overall accumulated totals (all time)
  const totalsAllTime = useMemo(() => {
    const acc: Record<number, { totalMinutes: number }> = {}
    Object.keys(BARRACAO_CONFIG).forEach(k => acc[Number(k)] = { totalMinutes: 0 })
    events.forEach(e => {
      const b = e.barracao
      const start = e.start_at ? new Date(e.start_at) : null
      const end = e.end_at ? new Date(e.end_at) : new Date()
      if (start) {
        const diff = (end.getTime() - start.getTime()) / (1000 * 60)
        acc[b].totalMinutes += Math.max(0, diff)
      }
    })
    return acc
  }, [events])

  const clearFilter = () => setFilterDate('')

  const generateReportText = (forDate: string) => {
    const evs = forDate ? events.filter(e => e.start_at?.startsWith(forDate) || e.end_at?.startsWith(forDate)) : events
    const dateLabel = forDate || 'Todos os registros'
    let lines: string[] = []
    lines.push(`Aeração — Relatório: ${dateLabel}`)
    lines.push('')
    Object.keys(BARRACAO_CONFIG).forEach(k => {
      const b = Number(k)
      const minutes = (forDate ? totalsForSelectedDate[b].totalMinutes : totalsAllTime[b].totalMinutes) || 0
      lines.push(`Barracão ${b}: ${(minutes/60).toFixed(2)} h`)
    })
    lines.push('')
    lines.push('Eventos:')
    evs.forEach(ev => {
      const start = ev.start_at ? new Date(ev.start_at).toLocaleString() : '-'
      const end = ev.end_at ? new Date(ev.end_at).toLocaleString() : '-'
      lines.push(`B${ev.barracao} M${ev.motor_index} — ${start} → ${end} (${ev.status || (ev.end_at ? 'off' : 'on')})`)
    })
    return lines.join('\n')
  }

  const handleCopyReport = async () => {
    try {
      const txt = generateReportText(filterDate)
      await navigator.clipboard.writeText(txt)
      // minimal feedback via console; UI toast can be added later
      console.info('Relatório copiado para área de transferência')
    } catch (err) {
      console.error('Erro ao copiar relatório:', err)
    }
  }

  const handlePrintReport = () => {
    const forDate = filterDate
    const evs = forDate ? events.filter(e => e.start_at?.startsWith(forDate) || e.end_at?.startsWith(forDate)) : events
    const htmlLines: string[] = []
    htmlLines.push('<html><head><title>Relatório Aeração</title><style>body{font-family:Arial,Helvetica,sans-serif;padding:16px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}</style></head><body>')
    htmlLines.push(`<h2>Aeração — Relatório: ${forDate || 'Todos os registros'}</h2>`)
    htmlLines.push('<h3>Acumulados</h3><ul>')
    Object.keys(BARRACAO_CONFIG).forEach(k => {
      const b = Number(k)
      const minutes = (forDate ? totalsForSelectedDate[b].totalMinutes : totalsAllTime[b].totalMinutes) || 0
      htmlLines.push(`<li>Barracão ${b}: ${(minutes/60).toFixed(2)} h</li>`)
    })
    htmlLines.push('</ul>')
    htmlLines.push('<h3>Eventos</h3>')
    htmlLines.push('<table><thead><tr><th>Barracão</th><th>Motor</th><th>Início</th><th>Fim</th><th>Status</th></tr></thead><tbody>')
    evs.forEach(ev => {
      const start = ev.start_at ? new Date(ev.start_at).toLocaleString() : '-'
      const end = ev.end_at ? new Date(ev.end_at).toLocaleString() : '-'
      htmlLines.push(`<tr><td>${ev.barracao}</td><td>${ev.motor_index}</td><td>${start}</td><td>${end}</td><td>${ev.status || (ev.end_at ? 'off' : 'on')}</td></tr>`)
    })
    htmlLines.push('</tbody></table>')
    htmlLines.push('</body></html>')
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(htmlLines.join(''))
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 300)
  }

  // determine active event per motor (last event with no end_at)
  const activeByMotor = useMemo(() => {
    const map: Record<string, any> = {}
    events.forEach(e => {
      if (!e.end_at) {
        map[`m_${e.barracao}_${e.motor_index}`] = e
      }
    })
    return map
  }, [events])

  // optimistic local map for immediate UI when starting/stopping before server roundtrip
  const [optimisticMap, setOptimisticMap] = useState<Record<string, any>>({})

  const combinedActive = (b: number, i: number) => {
    const key = `m_${b}_${i}`
    return activeByMotor[key] || optimisticMap[key]
  }

  // active counts per barracao (includes optimistic starts)
  const activeCounts = useMemo(() => {
    const acc: Record<number, number> = {}
    Object.keys(BARRACAO_CONFIG).forEach(k => acc[Number(k)] = 0)
    // real events
    Object.values(activeByMotor).forEach((e: any) => {
      if (e && e.barracao) acc[e.barracao] = (acc[e.barracao] || 0) + 1
    })
    // optimistic
    Object.keys(optimisticMap).forEach(k => {
      const parts = k.split('_') // m_<b>_<i>
      if (parts.length === 3) {
        const b = Number(parts[1])
        acc[b] = (acc[b] || 0) + 1
      }
    })
    return acc
  }, [activeByMotor, optimisticMap])

  const handleStart = async (motorIndex: number, barracaoNumber?: number) => {
    const b = typeof barracaoNumber === 'number' ? barracaoNumber : 1
    const key = `m_${b}_${motorIndex}`
    const temp = { id: `temp-${key}-${Date.now()}`, barracao: b, motor_index: motorIndex, start_at: new Date().toISOString(), status: 'on' }
    setOptimisticMap(prev => ({ ...prev, [key]: temp }))
    try {
      const real = await startEvent(b, motorIndex)
      // ensure global TV flag
      try { localStorage.setItem('aeration_on', 'true') } catch (e) {}
      // remove optimistic entry (real event will be in `events` from hook)
      setOptimisticMap(prev => {
        const copy = { ...prev }
        delete copy[key]
        return copy
      })
      await fetchEvents()
      return real
    } catch (err) {
      // cleanup optimistic on error
      setOptimisticMap(prev => {
        const copy = { ...prev }
        delete copy[key]
        return copy
      })
      console.error('Erro ao iniciar motor:', err)
      throw err
    }
  }

  const handleStop = async (event: any) => {
    try {
      // try to find real active event by barracao/motor
      const real = events.find(e => !e.end_at && e.barracao === event.barracao && e.motor_index === event.motor_index)
      if (real && real.id) {
        await stopEvent(real.id)
      } else if (event.id && !String(event.id).startsWith('temp')) {
        await stopEvent(event.id)
      } else {
        // fallback: refresh and try again
        await fetchEvents()
        const after = events.find(e => !e.end_at && e.barracao === event.barracao && e.motor_index === event.motor_index)
        if (after && after.id) await stopEvent(after.id)
        else console.error('Não foi possível localizar evento real para parar o motor', event)
      }
      // cleanup optimistic
      const key = `m_${event.barracao}_${event.motor_index}`
      setOptimisticMap(prev => {
        const copy = { ...prev }
        delete copy[key]
        return copy
      })
      await fetchEvents()
      try {
        const anyActive = events.some(e => !e.end_at) || Object.keys(optimisticMap).length > 0
        localStorage.setItem('aeration_on', anyActive ? 'true' : 'false')
      } catch (e) {}
    } catch (err) {
      console.error('Erro ao parar motor:', err)
      throw err
    }
  }

  // daily history summarised by barracao
  const todayIso = format(new Date(), 'yyyy-MM-dd')
  const historyEvents = eventsForSelectedDate
  const headerDateDisplay = filterDate ? format(new Date(filterDate), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')

  const summaryByBarracao = useMemo(() => {
    const acc: Record<number, { totalMinutes: number }>= {}
    Object.keys(BARRACAO_CONFIG).map(k => acc[Number(k)] = { totalMinutes: 0 })

    historyEvents.forEach(e => {
      const b = e.barracao
      const start = e.start_at ? new Date(e.start_at) : null
      const end = e.end_at ? new Date(e.end_at) : new Date()
      if (start) {
        const diff = (end.getTime() - start.getTime()) / (1000 * 60)
        acc[b].totalMinutes += Math.max(0, diff)
      }
    })
    return acc
  }, [historyEvents])

  const formatDuration = (startAt?: string, endAt?: string) => {
    if (!startAt) return '-'
    const start = new Date(startAt)
    const end = endAt ? new Date(endAt) : new Date()
    const diffMs = Math.max(0, end.getTime() - start.getTime())
    const totalSec = Math.floor(diffMs / 1000)
    const hours = Math.floor(totalSec / 3600)
    const mins = Math.floor((totalSec % 3600) / 60)
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  const formatMinutesOrHours = (minutes?: number) => {
    const m = Math.max(0, Math.round(minutes || 0))
    if (m < 60) return `${m} m`
    const hours = Math.floor(m / 60)
    const rem = m % 60
    return rem === 0 ? `${hours}h` : `${hours}h ${rem}m`
  }

  const navigate = useNavigate()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/dashboard')} className="p-2 rounded bg-muted/5 hover:bg-muted/10">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded"><Fan className="w-6 h-6 text-cyan-600" /></div>
                <div>
                  <CardTitle>Controle de Aeração</CardTitle>
                  <div className="text-sm text-muted-foreground">Gerenciar aeradores</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">B1 ligados: <span className="font-semibold text-green-600">{activeCounts[1] || 0}</span></div>
              <div className="text-sm text-muted-foreground">B2 ligados: <span className="font-semibold text-green-600">{activeCounts[2] || 0}</span></div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mt-4 space-y-6">
            {barracoes.map(b => {
              const motors = Array.from({ length: BARRACAO_CONFIG[b] }, (_, i) => i + 1)
              return (
                <div key={b}>
                  <h4 className="font-semibold mb-2">Barracão {b}</h4>
                  <div className="flex flex-wrap gap-4">
                    {motors.map(i => (
                      <MotorCard
                        key={`b${b}m${i}`}
                        barracao={b}
                        index={i}
                        activeEvent={combinedActive(b, i)}
                        onStart={() => handleStart(i, b)}
                        onStop={(ev: any) => handleStop(ev)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

            <div className="mt-6">
            <h3 className="font-semibold">Histórico diário ({headerDateDisplay})</h3>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.keys(summaryByBarracao).map(k => (
                <div key={k} className={`border rounded p-3 ${isDark ? 'bg-slate-800' : ''}`}>
                  <div className="font-medium">Barracão {k}</div>
                  <div className="text-sm text-muted-foreground">Total ligado: {formatMinutesOrHours(summaryByBarracao[Number(k)].totalMinutes)}</div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-2 text-left">Barracão</th>
                    <th className="p-2 text-left">Motor</th>
                    <th className="p-2 text-left">Início</th>
                    <th className="p-2 text-left">Fim</th>
                    <th className="p-2 text-left">Tempo ligado</th>
                    <th className="p-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {historyEvents.map(ev => {
                    const rowClass = isDark ? '' : (ev.barracao === 1 ? 'bg-cyan-50' : 'bg-orange-50')
                    const statusText = ev.status || (ev.end_at ? 'off' : 'on')
                    return (
                      <tr key={ev.id} className={`${rowClass} border-t`}>
                        <td className="p-2">{ev.barracao}</td>
                        <td className="p-2">{ev.motor_index}</td>
                        <td className="p-2">{ev.start_at ? format(new Date(ev.start_at), 'dd/MM/yyyy HH:mm') : '-'}</td>
                        <td className="p-2">{ev.end_at ? format(new Date(ev.end_at), 'dd/MM/yyyy HH:mm') : '-'}</td>
                        <td className="p-2">{formatDuration(ev.start_at, ev.end_at)}</td>
                        <td className="p-2">{statusText === 'off' ? <span className="text-red-600 font-semibold">Desligado</span> : (statusText === 'on' ? <span className="text-green-600 font-semibold">Ligado</span> : statusText)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <label className="font-medium">Filtrar por data:</label>
              <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="p-2 border rounded bg-white dark:bg-slate-700 text-sm" />
              <button className="px-3 py-2 bg-muted/10 dark:bg-slate-700 rounded" onClick={clearFilter}>Limpar</button>
              <div className="ml-auto flex items-center gap-2">
                <button className="px-3 py-2 bg-primary text-white rounded dark:bg-cyan-600" onClick={handleCopyReport}>Copiar Relatório</button>
                <button className="px-3 py-2 bg-secondary text-white rounded dark:bg-amber-600" onClick={handlePrintReport}>Relatório (PDF/Imprimir)</button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Aeracao
