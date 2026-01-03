'use client'

import { useState } from 'react'
import AvailabilityCalendar from '@/components/AvailabilityCalendar'
import { getRoomStatusForDate } from '@/app/actions/report-actions'

type DashboardCalendarClientProps = {
    getAvailability: (year: number, month: number) => Promise<{ date: string; available: number; total: number }[]>
}

export default function DashboardCalendarClient({ getAvailability }: DashboardCalendarClientProps) {
    const [selectedDate, setSelectedDate] = useState<string | null>(null)
    const [roomDetails, setRoomDetails] = useState<any[]>([])
    const [loadingDetails, setLoadingDetails] = useState(false)

    const handleDateClick = async (dateStr: string) => {
        setSelectedDate(dateStr)
        setLoadingDetails(true)
        try {
            const data = await getRoomStatusForDate(dateStr)
            setRoomDetails(data)
        } catch (error) {
            console.error('Failed to fetch room details', error)
        } finally {
            setLoadingDetails(false)
        }
    }

    return (
        <>
            <AvailabilityCalendar
                getAvailability={getAvailability}
                onDateClick={handleDateClick}
            />

            {/* Room Details Modal */}
            {selectedDate && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }} onClick={() => setSelectedDate(null)}>
                    <div style={{
                        background: 'white',
                        borderRadius: '1rem',
                        width: '100%',
                        maxWidth: '500px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        padding: '1.5rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1f2937' }}>
                                สถานะห้องพัก {new Date(selectedDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </h3>
                            <button
                                onClick={() => setSelectedDate(null)}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: '#6b7280'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        {loadingDetails ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>กำลังโหลด...</div>
                        ) : (
                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                {roomDetails.map((room) => (
                                    <div key={room.id} style={{
                                        padding: '1rem',
                                        borderRadius: '0.5rem',
                                        background: room.status === 'OCCUPIED' ? '#fee2e2' : '#dcfce7',
                                        border: '1px solid',
                                        borderColor: room.status === 'OCCUPIED' ? '#fecaca' : '#bbf7d0',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{
                                                fontWeight: 'bold',
                                                fontSize: '1.125rem',
                                                color: room.status === 'OCCUPIED' ? '#991b1b' : '#374151'
                                            }}>
                                                {room.number}
                                            </span>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '1rem',
                                                background: room.status === 'OCCUPIED' ? '#ef4444' : '#22c55e',
                                                color: 'white',
                                                fontWeight: '500'
                                            }}>
                                                {room.status === 'OCCUPIED' ? 'ไม่ว่าง' : 'ว่าง'}
                                            </span>
                                        </div>

                                        {room.status === 'OCCUPIED' && room.booking && (
                                            <div style={{ textAlign: 'right', fontSize: '0.875rem' }}>
                                                <div style={{ fontWeight: '600', color: '#991b1b' }}>{room.booking.guestName}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#b91c1c' }}>
                                                    {new Date(room.booking.checkIn).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} - {new Date(room.booking.checkOut).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
