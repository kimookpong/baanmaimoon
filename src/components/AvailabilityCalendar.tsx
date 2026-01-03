'use client'

import { useState, useEffect } from 'react'

interface AvailabilityCalendarProps {
    getAvailability: (year: number, month: number) => Promise<{ date: string; available: number; total: number }[]>
}

const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
]

const thaiDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

export default function AvailabilityCalendar({ getAvailability }: AvailabilityCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
    const [availability, setAvailability] = useState<{ date: string; available: number; total: number }[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadAvailability()
    }, [currentMonth, currentYear])

    const loadAvailability = async () => {
        setLoading(true)
        const data = await getAvailability(currentYear, currentMonth)
        setAvailability(data)
        setLoading(false)
    }

    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11)
            setCurrentYear(currentYear - 1)
        } else {
            setCurrentMonth(currentMonth - 1)
        }
    }

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0)
            setCurrentYear(currentYear + 1)
        } else {
            setCurrentMonth(currentMonth + 1)
        }
    }

    const getFirstDayOfMonth = () => {
        return new Date(currentYear, currentMonth, 1).getDay()
    }

    const getAvailabilityColor = (available: number, total: number) => {
        if (available > 0) return { bg: '#dcfce7', text: '#166534' } // Green - available
        return { bg: '#f3f4f6', text: '#6b7280' } // Gray - full
    }

    const firstDay = getFirstDayOfMonth()
    const today = new Date()
    const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear

    return (
        <div className="card" style={{ marginBottom: '1rem' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
            }}>
                <button
                    onClick={handlePrevMonth}
                    style={{
                        background: 'var(--gray-100)',
                        border: 'none',
                        padding: '0.5rem 0.75rem',
                        cursor: 'pointer',
                        color: 'var(--gray-700)',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        fontWeight: '600',
                    }}
                >
                    ◀
                </button>
                <h3 style={{ fontWeight: '600', color: 'var(--gray-800)', fontSize: '1.0625rem', margin: 0 }}>
                    {thaiMonths[currentMonth]} {currentYear + 543}
                </h3>
                <button
                    onClick={handleNextMonth}
                    style={{
                        background: 'var(--gray-100)',
                        border: 'none',
                        padding: '0.5rem 0.75rem',
                        cursor: 'pointer',
                        color: 'var(--gray-700)',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        fontWeight: '600',
                    }}
                >
                    ▶
                </button>
            </div>

            {/* Legend */}
            <div style={{
                display: 'flex',
                gap: '0.75rem',
                marginBottom: '0.75rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#dcfce7' }}></div>
                    <span>ว่าง</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f3f4f6' }}></div>
                    <span>เต็ม</span>
                </div>
            </div>

            {/* Day Headers */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '2px',
                marginBottom: '2px',
            }}>
                {thaiDays.map((day, index) => (
                    <div key={day} style={{
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        color: index === 0 ? 'var(--danger)' : 'var(--gray-500)',
                        fontWeight: '600',
                        padding: '0.375rem',
                    }}>
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>
                    กำลังโหลด...
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '2px',
                }}>
                    {/* Empty cells */}
                    {Array.from({ length: firstDay }, (_, i) => (
                        <div key={`empty-${i}`} style={{ aspectRatio: '1' }} />
                    ))}

                    {/* Day cells */}
                    {availability.map((day, index) => {
                        const dayNum = index + 1
                        const colors = getAvailabilityColor(day.available, day.total)
                        const isToday = isCurrentMonth && today.getDate() === dayNum
                        const dayOfWeek = (firstDay + index) % 7
                        const isSunday = dayOfWeek === 0

                        return (
                            <div
                                key={day.date}
                                style={{
                                    aspectRatio: '1',
                                    background: colors.bg,
                                    borderRadius: '0.375rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: isToday ? '2px solid var(--primary)' : 'none',
                                    position: 'relative',
                                }}
                            >
                                <span style={{
                                    fontSize: '0.8125rem',
                                    fontWeight: isToday ? '700' : '500',
                                    color: isSunday && day.available === day.total ? 'var(--danger)' : colors.text,
                                }}>
                                    {dayNum}
                                </span>
                                <span style={{
                                    fontSize: '0.625rem',
                                    color: colors.text,
                                    fontWeight: '600',
                                }}>
                                    {day.available}/{day.total}
                                </span>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
