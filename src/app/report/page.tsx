'use client'

import { useState, useEffect } from 'react'
import Header from '../../components/Header'
import BottomNav from '../../components/BottomNav'
import { getMonthlyOccupancy, getUpcomingBookings, getYearlyRevenue, getBookingHistory, getRoomStatusForDate } from '../actions/report-actions'

const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
]

// Types
type OccupancyData = { date: string; occupied: number; total: number }
type BookingData = any // Using 'any' for brevity, ideally strict types from Prisma
type RevenueData = {
    year: number;
    totalRevenue: number;
    totalDiscount: number;
    monthlyRevenue: number[];
    monthlyDiscount: number[];
}

export default function ReportPage() {
    const [activeTab, setActiveTab] = useState('occupancy')
    const [loading, setLoading] = useState(false)

    // Data States
    const [occupancyData, setOccupancyData] = useState<OccupancyData[]>([])
    const [bookingsData, setBookingsData] = useState<BookingData[]>([])
    const [revenueData, setRevenueData] = useState<RevenueData | null>(null)
    const [historyData, setHistoryData] = useState<BookingData[]>([])

    // Filter States
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

    useEffect(() => {
        loadData()
    }, [activeTab, currentMonth, currentYear])

    const loadData = async () => {
        setLoading(true)
        try {
            if (activeTab === 'occupancy') {
                const data = await getMonthlyOccupancy(currentYear, currentMonth)
                setOccupancyData(data)
            } else if (activeTab === 'bookings') {
                const data = await getUpcomingBookings()
                setBookingsData(data)
            } else if (activeTab === 'revenue') {
                const data = await getYearlyRevenue(currentYear)
                setRevenueData(data)
            } else if (activeTab === 'history') {
                const data = await getBookingHistory()
                setHistoryData(data)
            }
        } catch (error) {
            console.error("Failed to load report data", error)
        } finally {
            setLoading(false)
        }
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
            minimumFractionDigits: 0
        }).format(price)
    }

    // Room Details State
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
            console.error("Failed to load room details", error)
        } finally {
            setLoadingDetails(false)
        }
    }

    const renderOccupancy = () => (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <button
                    onClick={() => setCurrentMonth(prev => prev === 0 ? 11 : prev - 1)}
                    style={{ background: 'var(--gray-100)', border: 'none', padding: '0.5rem', borderRadius: '0.5rem' }}
                >◀</button>
                <h3 style={{ margin: 0 }}>{thaiMonths[currentMonth]} {currentYear + 543}</h3>
                <button
                    onClick={() => setCurrentMonth(prev => prev === 11 ? 0 : prev + 1)}
                    style={{ background: 'var(--gray-100)', border: 'none', padding: '0.5rem', borderRadius: '0.5rem' }}
                >▶</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                {occupancyData.map((day, index) => {
                    const date = new Date(day.date)
                    const ratio = day.occupied / day.total
                    let bg = '#f3f4f6'
                    let color = '#6b7280'
                    if (ratio > 0.8) { bg = '#fee2e2'; color = '#991b1b' }
                    else if (ratio > 0) { bg = '#fef9c3'; color = '#854d0e' }

                    return (
                        <div
                            key={index}
                            onClick={() => handleDateClick(day.date)}
                            style={{
                                background: bg,
                                color: color,
                                borderRadius: '0.5rem',
                                padding: '0.5rem',
                                textAlign: 'center',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                transition: 'transform 0.1s',
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <div style={{ fontWeight: 'bold' }}>{date.getDate()}</div>
                            <div>{day.occupied}/{day.total}</div>
                        </div>
                    )
                })}
            </div>

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
                    <div
                        style={{
                            background: 'white',
                            borderRadius: '1rem',
                            width: '100%',
                            maxWidth: '500px',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            padding: '1.5rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>
                                วันที่ {new Date(selectedDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </h3>
                            <button
                                onClick={() => setSelectedDate(null)}
                                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: '0 0.5rem' }}
                            >
                                ×
                            </button>
                        </div>

                        {loadingDetails ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>กำลังโหลด...</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {roomDetails.map((room: any) => (
                                    <div key={room.id} style={{
                                        padding: '1rem',
                                        borderRadius: '0.75rem',
                                        border: '1px solid',
                                        borderColor: room.status === 'OCCUPIED' ? '#fca5a5' : '#e5e7eb',
                                        background: room.status === 'OCCUPIED' ? '#fef2f2' : 'white',
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{
                                                    fontWeight: '700',
                                                    fontSize: '1.125rem',
                                                    color: room.status === 'OCCUPIED' ? '#991b1b' : '#374151'
                                                }}>
                                                    {room.number}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    padding: '0.125rem 0.5rem',
                                                    borderRadius: '1rem',
                                                    background: room.status === 'OCCUPIED' ? '#fee2e2' : '#f3f4f6',
                                                    color: room.status === 'OCCUPIED' ? '#991b1b' : '#6b7280',
                                                    fontWeight: '600'
                                                }}>
                                                    {room.status === 'OCCUPIED' ? 'ไม่ว่าง' : 'ว่าง'}
                                                </span>
                                            </div>
                                        </div>

                                        {room.status === 'OCCUPIED' && room.booking && (
                                            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#4b5563', paddingTop: '0.5rem', borderTop: '1px solid #fee2e2' }}>
                                                <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>
                                                    {room.booking.guestName}
                                                </div>
                                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
                                                    <div>เข้า: {new Date(room.booking.checkIn).toLocaleDateString('th-TH')}</div>
                                                    <div>ออก: {new Date(room.booking.checkOut).toLocaleDateString('th-TH')}</div>
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
        </div>
    )

    const renderBookingsList = (bookings: BookingData[], title: string) => (
        <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>{title}</h3>
            {bookings.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '2rem' }}>ไม่มีรายการ</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {bookings.map((booking: any) => (
                        <div key={booking.id} style={{
                            padding: '1rem',
                            background: 'var(--gray-50)',
                            borderRadius: '0.75rem',
                            border: '1px solid var(--gray-200)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ fontWeight: '600' }}>{booking.guest.name}</span>
                                <span style={{
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '1rem',
                                    fontSize: '0.75rem',
                                    background: booking.status === 'CONFIRMED' ? 'var(--success)' :
                                        booking.status === 'PENDING' ? 'var(--warning)' : 'var(--gray-200)',
                                    color: booking.status === 'CONFIRMED' ? 'white' : 'black'
                                }}>
                                    {booking.status}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                                <div>เข้าพัก: {new Date(booking.checkIn).toLocaleDateString('th-TH')}</div>
                                <div>ออก: {new Date(booking.checkOut).toLocaleDateString('th-TH')}</div>
                                <div>ห้อง: {booking.rooms.map((r: any) => r.room.number).join(', ')}</div>
                                <div style={{ marginTop: '0.5rem', fontWeight: '600', color: 'var(--primary)' }}>
                                    ราคา: {formatPrice(booking.totalPrice + (booking.discount || 0))}
                                    {booking.discount > 0 && (
                                        <span style={{ color: 'var(--success)', marginLeft: '0.5rem' }}>
                                            (ส่วนลด {formatPrice(booking.discount)})
                                        </span>
                                    )}
                                    <span style={{ marginLeft: '0.5rem', color: 'black' }}>
                                        = {formatPrice(booking.totalPrice)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )



    const renderRevenue = () => {
        if (!revenueData) return null
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <div style={{ fontSize: '1rem', opacity: 0.9 }}>รายได้รวมปี {revenueData.year + 543}</div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{formatPrice(revenueData.totalRevenue)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>ส่วนลดรวม</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>{formatPrice(revenueData.totalDiscount)}</div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>รายได้รายเดือน</h3>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {/* Header Row */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '0.75rem 0',
                            borderBottom: '1px solid var(--gray-200)',
                            fontWeight: '600',
                            color: 'var(--gray-600)',
                            fontSize: '0.875rem'
                        }}>
                            <div style={{ flex: 1 }}>เดือน</div>
                            <div style={{ width: '100px', textAlign: 'right' }}>ส่วนลด</div>
                            <div style={{ width: '120px', textAlign: 'right' }}>รายได้</div>
                        </div>

                        {revenueData.monthlyRevenue.map((amount, index) => (
                            <div key={index} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '0.75rem 0',
                                borderBottom: '1px solid var(--gray-100)'
                            }}>
                                <div style={{ flex: 1 }}>{thaiMonths[index]}</div>
                                <div style={{ width: '100px', textAlign: 'right', color: 'var(--gray-500)', fontSize: '0.9rem' }}>
                                    {revenueData.monthlyDiscount[index] > 0 ? formatPrice(revenueData.monthlyDiscount[index]) : '-'}
                                </div>
                                <div style={{ width: '120px', fontWeight: '600', textAlign: 'right' }}>
                                    {formatPrice(amount)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div>
            <Header title="รายงาน" />
            <main className="page-container">
                <div style={{
                    display: 'flex',
                    overflowX: 'auto',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    marginBottom: '1rem',
                    background: 'white',
                    borderRadius: '0.75rem',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    {[
                        { id: 'occupancy', label: 'การเข้าพัก' },
                        { id: 'bookings', label: 'การจอง' },
                        { id: 'revenue', label: 'รายได้' },
                        { id: 'history', label: 'ประวัติ' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                border: 'none',
                                background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                                color: activeTab === tab.id ? 'white' : 'var(--gray-600)',
                                whiteSpace: 'nowrap',
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>กำลังโหลด...</div>
                ) : (
                    <>
                        {activeTab === 'occupancy' && renderOccupancy()}
                        {activeTab === 'bookings' && renderBookingsList(bookingsData, 'รายการจองปัจจุบัน/ล่วงหน้า')}
                        {activeTab === 'revenue' && renderRevenue()}
                        {activeTab === 'history' && renderBookingsList(historyData, 'ประวัติการจองล่าสุด')}
                    </>
                )}
            </main>
            <BottomNav />
        </div>
    )
}
