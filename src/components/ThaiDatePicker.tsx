'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ThaiDatePickerProps {
    value: string
    onChange: (value: string) => void
    min?: string
    label: string
}

const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
]

const thaiDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

function formatThaiDate(dateStr: string): string {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const day = date.getDate()
    const month = thaiMonths[date.getMonth()]
    const year = date.getFullYear() + 543
    return `${day} ${month} ${year}`
}

const Portal = ({ children }: { children: React.ReactNode }) => {
    if (typeof document === 'undefined') return null
    return createPortal(children, document.body)
}

export default function ThaiDatePicker({ value, onChange, min, label }: ThaiDatePickerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [viewMonth, setViewMonth] = useState(new Date().getMonth())
    const [viewYear, setViewYear] = useState(new Date().getFullYear())
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (value) {
            const date = new Date(value)
            setViewMonth(date.getMonth())
            setViewYear(date.getFullYear())
        }
    }, [value])

    const getDaysInMonth = (month: number, year: number) => {
        return new Date(year, month + 1, 0).getDate()
    }

    const getFirstDayOfMonth = (month: number, year: number) => {
        return new Date(year, month, 1).getDay()
    }

    const handleDateClick = (day: number) => {
        const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        onChange(dateStr)
        setIsOpen(false)
    }

    const handlePrevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11)
            setViewYear(viewYear - 1)
        } else {
            setViewMonth(viewMonth - 1)
        }
    }

    const handleNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0)
            setViewYear(viewYear + 1)
        } else {
            setViewMonth(viewMonth + 1)
        }
    }

    const isDateDisabled = (day: number) => {
        if (!min) return false
        const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        return dateStr < min
    }

    const isSelected = (day: number) => {
        if (!value) return false
        const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        return dateStr === value
    }

    const isToday = (day: number) => {
        const today = new Date()
        return viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate()
    }

    const daysInMonth = getDaysInMonth(viewMonth, viewYear)
    const firstDay = getFirstDayOfMonth(viewMonth, viewYear)
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    return (
        <div className="input-group" ref={containerRef} style={{ position: 'relative' }}>
            <label className="input-label">{label}</label>
            <div
                className="input-field"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '52px',
                    borderRadius: '0.75rem',
                    padding: '0.75rem 1rem',
                }}
            >
                <span style={{ color: value ? 'var(--gray-800)' : 'var(--gray-400)', fontSize: '1rem' }}>
                    {value ? formatThaiDate(value) : 'เลือกวันที่'}
                </span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            </div>

            {isOpen && (
                <Portal>
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.5)',
                            zIndex: 9998,
                            backdropFilter: 'blur(2px)',
                        }}
                        onClick={() => setIsOpen(false)}
                    />
                    <div style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '90%',
                        maxWidth: '350px',
                        background: 'white',
                        borderRadius: '1.5rem',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        padding: '1.5rem',
                        zIndex: 9999,
                        border: '1px solid var(--gray-200)',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                    }}>
                        {/* Header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1rem',
                            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                            margin: '-1.5rem -1.5rem 1rem -1.5rem',
                            padding: '1.25rem 1.5rem',
                            borderRadius: '1.5rem 1.5rem 0 0',
                            position: 'relative',
                        }}>
                            <button
                                type="button"
                                onClick={handlePrevMonth}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    padding: '0.5rem 0.75rem',
                                    cursor: 'pointer',
                                    color: 'white',
                                    borderRadius: '0.5rem',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                            </button>
                            <span style={{ fontWeight: '600', color: 'white', fontSize: '1.125rem' }}>
                                {thaiMonths[viewMonth]} {viewYear + 543}
                            </span>
                            <button
                                type="button"
                                onClick={handleNextMonth}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    padding: '0.5rem 0.75rem',
                                    cursor: 'pointer',
                                    color: 'white',
                                    borderRadius: '0.5rem',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </button>

                            {/* Close Button X */}
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{
                                    position: 'absolute',
                                    top: '0.5rem',
                                    right: '0.5rem',
                                    background: 'rgba(0,0,0,0.2)',
                                    border: 'none',
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'white',
                                }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        {/* Day Headers */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            gap: '0.25rem',
                            marginBottom: '0.5rem',
                        }}>
                            {thaiDays.map((day, index) => (
                                <div key={day} style={{
                                    textAlign: 'center',
                                    fontSize: '0.875rem',
                                    color: index === 0 ? 'var(--danger)' : 'var(--gray-500)',
                                    fontWeight: '600',
                                    padding: '0.375rem',
                                }}>
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Days Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            gap: '0.375rem',
                        }}>
                            {Array.from({ length: firstDay }, (_, i) => (
                                <div key={`empty-${i}`} />
                            ))}
                            {days.map((day) => {
                                const disabled = isDateDisabled(day)
                                const selected = isSelected(day)
                                const today = isToday(day)
                                const dayOfWeek = (firstDay + day - 1) % 7
                                const isSunday = dayOfWeek === 0

                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => !disabled && handleDateClick(day)}
                                        style={{
                                            width: '100%',
                                            aspectRatio: '1',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '50%',
                                            border: today && !selected ? '2px solid var(--primary)' : 'none',
                                            cursor: disabled ? 'not-allowed' : 'pointer',
                                            background: selected
                                                ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))'
                                                : 'transparent',
                                            color: selected
                                                ? 'white'
                                                : disabled
                                                    ? 'var(--gray-300)'
                                                    : isSunday
                                                        ? 'var(--danger)'
                                                        : 'var(--gray-800)',
                                            fontWeight: selected || today ? '700' : '500',
                                            fontSize: '1rem',
                                            transition: 'all 0.15s ease',
                                            boxShadow: selected ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none',
                                        }}
                                    >
                                        {day}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Today Button */}
                        <button
                            type="button"
                            onClick={() => {
                                const today = new Date()
                                setViewMonth(today.getMonth())
                                setViewYear(today.getFullYear())
                            }}
                            style={{
                                width: '100%',
                                marginTop: '1.25rem',
                                padding: '0.75rem',
                                background: 'var(--gray-100)',
                                border: 'none',
                                borderRadius: '0.75rem',
                                color: 'var(--primary)',
                                fontWeight: '600',
                                fontSize: '1rem',
                                cursor: 'pointer',
                            }}
                        >
                            กลับมาเดือนปัจจุบัน
                        </button>
                    </div>
                </Portal>
            )}
        </div>
    )
}
