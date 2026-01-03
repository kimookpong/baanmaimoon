'use client'

import { useState, useEffect } from 'react'
import Header from '../../components/Header'
import BottomNav from '../../components/BottomNav'
import InteractiveCalendar from '@/components/InteractiveCalendar'
import { getMonthlyOccupancy, getUpcomingBookings, getYearlyRevenue, getBookingHistory } from '../actions/report-actions'

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
    const [bookingsData, setBookingsData] = useState<BookingData[]>([])
    const [revenueData, setRevenueData] = useState<RevenueData | null>(null)
    const [historyData, setHistoryData] = useState<BookingData[]>([])

    // Filter States
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

    useEffect(() => {
        loadData()
    }, [activeTab, currentYear])

    const getMonthlyOccupancyForCalendar = async (year: number, month: number) => {
        const data = await getMonthlyOccupancy(year, month)
        return data.map(day => ({
            date: day.date,
            available: day.total - day.occupied,
            total: day.total
        }))
    }

    const loadData = async () => {
        setLoading(true)
        try {
            if (activeTab === 'occupancy') {
                // Calendar handles its own data fetching
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

    // Room Details State handled by InteractiveCalendar



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
                        {activeTab === 'occupancy' && (
                            <InteractiveCalendar getAvailability={getMonthlyOccupancyForCalendar} />
                        )}
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
