'use client'

import { useState, useEffect, useTransition } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import { getPendingBookings, checkIn, checkOut, cancelBooking } from '@/app/actions/booking-actions'

interface Booking {
    id: string
    checkIn: Date
    checkOut: Date
    totalPrice: number
    discount: number
    status: string
    guest: {
        name: string
        phone: string | null
    }
    rooms: {
        room: {
            number: string
            name: string
        }
    }[]
}

const statusLabels: Record<string, string> = {
    PENDING: 'รอเช็คอิน',
    CHECKED_IN: 'เข้าพักอยู่',
}

const statusBadgeClass: Record<string, string> = {
    PENDING: 'badge-pending',
    CHECKED_IN: 'badge-checked-in',
}

function formatDate(date: Date) {
    return new Date(date).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

export default function CheckinPage() {
    const { status } = useSession()
    const router = useRouter()
    const [bookings, setBookings] = useState<Booking[]>([])
    const [isPending, startTransition] = useTransition()
    const [processingId, setProcessingId] = useState<string | null>(null)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        }
    }, [status, router])

    useEffect(() => {
        loadBookings()
    }, [])

    const loadBookings = async () => {
        const data = await getPendingBookings()
        setBookings(data)
    }

    const handleCheckIn = async (bookingId: string) => {
        setProcessingId(bookingId)
        startTransition(async () => {
            await checkIn(bookingId)
            await loadBookings()
            setProcessingId(null)
        })
    }



    const handleCancel = async (bookingId: string) => {
        if (confirm('ต้องการยกเลิกการจองนี้หรือไม่?')) {
            setProcessingId(bookingId)
            startTransition(async () => {
                await cancelBooking(bookingId)
                await loadBookings()
                setProcessingId(null)
            })
        }
    }

    // Checkout Modal State
    const [checkoutModal, setCheckoutModal] = useState<{
        isOpen: boolean
        booking: Booking | null
        discount: string
    }>({
        isOpen: false,
        booking: null,
        discount: ''
    })

    const handleCheckOutClick = (booking: Booking) => {
        setCheckoutModal({
            isOpen: true,
            booking,
            discount: ''
        })
    }

    const confirmCheckOut = async () => {
        if (!checkoutModal.booking) return

        const discountAmount = parseInt(checkoutModal.discount) || 0
        setProcessingId(checkoutModal.booking.id)
        setCheckoutModal(prev => ({ ...prev, isOpen: false })) // Close modal immediately

        startTransition(async () => {
            if (checkoutModal.booking) {
                await checkOut(checkoutModal.booking.id, discountAmount)
                await loadBookings()
                setProcessingId(null)
            }
        })
    }

    if (status === 'loading') {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>กำลังโหลด...</div>
    }

    const pendingBookings = bookings.filter(b => b.status === 'PENDING')
    const checkedInBookings = bookings.filter(b => b.status === 'CHECKED_IN')

    return (
        <>
            <Header title="เช็คอิน/เช็คเอาท์" />

            <main className="page-container">
                {/* Pending Check-ins */}
                <section style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
                        รอเช็คอิน ({pendingBookings.length})
                    </h2>

                    {pendingBookings.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', color: '#9ca3af', padding: '1.5rem' }}>
                            ไม่มีการจองที่รอเช็คอิน
                        </div>
                    ) : (
                        pendingBookings.map((booking) => (
                            <div key={booking.id} className="card" style={{ marginBottom: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                    <div>
                                        <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
                                            {booking.guest.name}
                                        </div>
                                        {booking.guest.phone && (
                                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                                {booking.guest.phone}
                                            </div>
                                        )}
                                    </div>
                                    <span className={`badge ${statusBadgeClass[booking.status]}`}>
                                        {statusLabels[booking.status]}
                                    </span>
                                </div>

                                <div style={{ fontSize: '0.9375rem', color: '#374151', marginBottom: '0.5rem' }}>
                                    <strong>ห้อง:</strong> {booking.rooms.map(r => r.room.number).join(', ')}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                                    {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                                </div>
                                <div style={{ fontSize: '0.9375rem', fontWeight: '500', color: '#2563eb', marginBottom: '0.75rem' }}>
                                    {booking.totalPrice.toLocaleString()} บาท
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleCheckIn(booking.id)}
                                        className="btn btn-success"
                                        style={{ flex: 1, padding: '0.625rem' }}
                                        disabled={isPending && processingId === booking.id}
                                    >
                                        {isPending && processingId === booking.id ? 'กำลังดำเนินการ...' : 'เช็คอิน'}
                                    </button>
                                    <button
                                        onClick={() => handleCancel(booking.id)}
                                        className="btn btn-danger"
                                        style={{ padding: '0.625rem 1rem' }}
                                        disabled={isPending && processingId === booking.id}
                                    >
                                        ยกเลิก
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </section>

                {/* Checked-in Guests */}
                <section>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
                        ผู้เข้าพักปัจจุบัน ({checkedInBookings.length})
                    </h2>

                    {checkedInBookings.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', color: '#9ca3af', padding: '1.5rem' }}>
                            ไม่มีผู้เข้าพักในขณะนี้
                        </div>
                    ) : (
                        checkedInBookings.map((booking) => (
                            <div key={booking.id} className="card" style={{ marginBottom: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                    <div>
                                        <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
                                            {booking.guest.name}
                                        </div>
                                        {booking.guest.phone && (
                                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                                {booking.guest.phone}
                                            </div>
                                        )}
                                    </div>
                                    <span className={`badge ${statusBadgeClass[booking.status]}`}>
                                        {statusLabels[booking.status]}
                                    </span>
                                </div>

                                <div style={{ fontSize: '0.9375rem', color: '#374151', marginBottom: '0.5rem' }}>
                                    <strong>ห้อง:</strong> {booking.rooms.map(r => r.room.number).join(', ')}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                                    เช็คเอาท์: {formatDate(booking.checkOut)}
                                </div>
                                {booking.discount > 0 && (
                                    <div style={{ fontSize: '0.875rem', color: 'var(--success)', marginBottom: '0.5rem' }}>
                                        ส่วนลด: {booking.discount.toLocaleString()} บาท
                                    </div>
                                )}
                                <div style={{ fontSize: '0.9375rem', fontWeight: '500', color: '#2563eb', marginBottom: '0.75rem' }}>
                                    {booking.totalPrice.toLocaleString()} บาท
                                </div>

                                <button
                                    onClick={() => handleCheckOutClick(booking)}
                                    className="btn btn-primary"
                                    style={{ width: '100%', padding: '0.625rem' }}
                                    disabled={isPending && processingId === booking.id}
                                >
                                    {isPending && processingId === booking.id ? 'กำลังดำเนินการ...' : 'เช็คเอาท์'}
                                </button>
                            </div>
                        ))
                    )}
                </section>
            </main>

            {/* Checkout Confirmation Modal */}
            {checkoutModal.isOpen && checkoutModal.booking && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '1rem',
                        width: '100%',
                        maxWidth: '400px',
                        padding: '1.5rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', color: '#1f2937' }}>
                            ยืนยันการเช็คเอาท์
                        </h3>

                        <div style={{ marginBottom: '1rem', color: '#4b5563' }}>
                            <div style={{ marginBottom: '0.5rem' }}>
                                <strong>ผู้เข้าพัก:</strong> {checkoutModal.booking.guest.name}
                            </div>
                            <div style={{ marginBottom: '0.5rem' }}>
                                <strong>ราคาที่ต้องชำระ:</strong> {checkoutModal.booking.totalPrice.toLocaleString()} บาท
                            </div>
                            {checkoutModal.booking.discount > 0 && (
                                <div style={{ marginBottom: '0.5rem', color: 'var(--success)' }}>
                                    <strong>ส่วนลดปัจจุบัน:</strong> {checkoutModal.booking.discount.toLocaleString()} บาท
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                                ส่วนลดเพิ่มเติม (บาท)
                            </label>
                            <input
                                type="number"
                                className="input-field"
                                value={checkoutModal.discount}
                                onChange={(e) => setCheckoutModal(prev => ({ ...prev, discount: e.target.value }))}
                                placeholder="ระบุส่วนลด (ถ้ามี)"
                                style={{ width: '100%' }}
                            />
                            {checkoutModal.discount && (
                                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--success)', fontWeight: '600' }}>
                                    ยอดสุทธิ: {(checkoutModal.booking.totalPrice - (parseInt(checkoutModal.discount) || 0)).toLocaleString()} บาท
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={() => setCheckoutModal(prev => ({ ...prev, isOpen: false }))}
                                className="btn"
                                style={{ flex: 1, background: '#f3f4f6', color: '#374151' }}
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={confirmCheckOut}
                                className="btn btn-primary"
                                style={{ flex: 1 }}
                            >
                                ยืนยัน
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <BottomNav />
        </>
    )
}
