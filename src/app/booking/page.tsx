'use client'

import { useState, useEffect, useTransition } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import ThaiDatePicker from '@/components/ThaiDatePicker'
import { getAvailableRooms, createBooking } from '@/app/actions/booking-actions'

interface Room {
    id: string
    number: string
    name: string
    price: number
}

export default function BookingPage() {
    const { status } = useSession()
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

    const [step, setStep] = useState(1)
    const [checkIn, setCheckIn] = useState(today)
    const [checkOut, setCheckOut] = useState(tomorrow)
    const [availableRooms, setAvailableRooms] = useState<Room[]>([])
    const [selectedRooms, setSelectedRooms] = useState<string[]>([])
    const [guestName, setGuestName] = useState('')
    const [guestPhone, setGuestPhone] = useState('')
    const [discount, setDiscount] = useState<number>(0)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        }
    }, [status, router])



    const calculateNights = () => {
        if (!checkIn || !checkOut) return 0
        const start = new Date(checkIn)
        const end = new Date(checkOut)
        const diff = end.getTime() - start.getTime()
        return Math.ceil(diff / (1000 * 60 * 60 * 24))
    }

    const calculateTotalPrice = () => {
        const nights = calculateNights()
        const selectedRoomObjects = availableRooms.filter(r => selectedRooms.includes(r.id))
        return (selectedRoomObjects.reduce((sum, room) => sum + room.price, 0) * nights) - discount
    }

    const calculateSubtotal = () => {
        const nights = calculateNights()
        const selectedRoomObjects = availableRooms.filter(r => selectedRooms.includes(r.id))
        return selectedRoomObjects.reduce((sum, room) => sum + room.price, 0) * nights
    }

    const handleSearchRooms = async () => {
        setError('')
        if (!checkIn || !checkOut) {
            setError('กรุณาเลือกวันที่เช็คอินและเช็คเอาท์')
            return
        }

        if (new Date(checkIn) >= new Date(checkOut)) {
            setError('วันเช็คเอาท์ต้องมากกว่าวันเช็คอิน')
            return
        }

        const rooms = await getAvailableRooms(new Date(checkIn), new Date(checkOut))
        setAvailableRooms(rooms)
        setStep(2)
    }

    const handleRoomToggle = (roomId: string) => {
        setSelectedRooms(prev =>
            prev.includes(roomId)
                ? prev.filter(id => id !== roomId)
                : [...prev, roomId]
        )
    }

    const handleConfirmRooms = () => {
        if (selectedRooms.length === 0) {
            setError('กรุณาเลือกอย่างน้อย 1 ห้อง')
            return
        }
        setError('')
        setStep(3)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!guestName.trim()) {
            setError('กรุณากรอกชื่อ-สกุล')
            return
        }

        startTransition(async () => {
            try {
                await createBooking({
                    guestName: guestName.trim(),
                    guestPhone: guestPhone.trim() || undefined,
                    checkIn: new Date(checkIn),
                    checkOut: new Date(checkOut),
                    roomIds: selectedRooms,
                    totalPrice: calculateTotalPrice(),
                    discount: discount,
                })
                setSuccess(true)
            } catch {
                setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
            }
        })
    }

    const resetForm = () => {
        setStep(1)
        setCheckIn('')
        setCheckOut('')
        setAvailableRooms([])
        setSelectedRooms([])
        setGuestName('')

        setGuestPhone('')
        setDiscount(0)
        setError('')
        setSuccess(false)
    }

    if (status === 'loading') {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>กำลังโหลด...</div>
    }

    if (success) {
        return (
            <>
                <Header title="จองห้องพัก" />
                <main className="page-container">
                    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: 'linear-gradient(135deg, #16a34a, #15803d)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                        }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                            จองสำเร็จ!
                        </h2>
                        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                            รายละเอียดการจองถูกบันทึกเรียบร้อยแล้ว
                        </p>
                        <button onClick={resetForm} className="btn btn-primary">
                            จองอีกครั้ง
                        </button>
                    </div>
                </main>
                <BottomNav />
            </>
        )
    }

    return (
        <>
            <Header title="จองห้องพัก" />

            <main className="page-container">
                {/* Step Indicator */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', gap: '0.5rem' }}>
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            style={{
                                width: '2rem',
                                height: '2rem',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: step >= s ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#e5e7eb',
                                color: step >= s ? 'white' : '#9ca3af',
                                fontWeight: '600',
                                fontSize: '0.875rem',
                            }}
                        >
                            {s}
                        </div>
                    ))}
                </div>

                {error && (
                    <div style={{
                        background: '#fee2e2',
                        color: '#991b1b',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1rem',
                    }}>
                        {error}
                    </div>
                )}

                {/* Step 1: Select Dates */}
                {step === 1 && (
                    <div className="card" style={{ position: 'relative' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
                            เลือกวันที่เข้าพัก
                        </h2>

                        <ThaiDatePicker
                            label="วันเช็คอิน"
                            value={checkIn}
                            onChange={setCheckIn}
                            min={today}
                        />

                        <ThaiDatePicker
                            label="วันเช็คเอาท์"
                            value={checkOut}
                            onChange={setCheckOut}
                            min={checkIn || today}
                        />

                        {checkIn && checkOut && calculateNights() > 0 && (
                            <div style={{ textAlign: 'center', color: '#2563eb', fontWeight: '500', marginBottom: '1rem' }}>
                                จำนวน {calculateNights()} คืน
                            </div>
                        )}

                        <button onClick={handleSearchRooms} className="btn btn-primary" style={{ width: '100%' }}>
                            ค้นหาห้องว่าง
                        </button>
                    </div>
                )}

                {/* Step 2: Select Rooms */}
                {step === 2 && (
                    <>
                        <div style={{ marginBottom: '1rem' }}>
                            <button onClick={() => setStep(1)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', minHeight: 'auto' }}>
                                ← เปลี่ยนวันที่
                            </button>
                        </div>

                        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                            เลือกห้องพัก ({availableRooms.length} ห้องว่าง)
                        </h2>

                        {availableRooms.length === 0 ? (
                            <div className="empty-state">
                                <p>ไม่มีห้องว่างในช่วงเวลาที่เลือก</p>
                            </div>
                        ) : (
                            <>
                                {availableRooms.map((room) => (
                                    <div
                                        key={room.id}
                                        className={`room-card ${selectedRooms.includes(room.id) ? 'selected' : ''}`}
                                        onClick={() => handleRoomToggle(room.id)}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedRooms.includes(room.id)}
                                            onChange={() => { }}
                                            style={{ width: '24px', height: '24px', accentColor: '#2563eb' }}
                                        />
                                        <div className="room-number">{room.number}</div>
                                        <div className="room-info">
                                            <div className="room-name">{room.name}</div>
                                            <div className="room-price">{room.price.toLocaleString()} บาท/คืน</div>
                                        </div>
                                    </div>
                                ))}

                                {selectedRooms.length > 0 && (
                                    <div className="summary-box">
                                        <div className="summary-row">
                                            <span>ห้องที่เลือก</span>
                                            <span>{selectedRooms.length} ห้อง</span>
                                        </div>
                                        <div className="summary-row">
                                            <span>จำนวนคืน</span>
                                            <span>{calculateNights()} คืน</span>
                                        </div>
                                        <div className="summary-total">
                                            <span>รวมทั้งหมด</span>
                                            <span>{calculateTotalPrice().toLocaleString()} บาท</span>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleConfirmRooms}
                                    className="btn btn-primary"
                                    style={{ width: '100%', marginTop: '1rem' }}
                                    disabled={selectedRooms.length === 0}
                                >
                                    ถัดไป
                                </button>
                            </>
                        )}
                    </>
                )}

                {/* Step 3: Guest Information */}
                {step === 3 && (
                    <>
                        <div style={{ marginBottom: '1rem' }}>
                            <button onClick={() => setStep(2)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', minHeight: 'auto' }}>
                                ← เลือกห้องใหม่
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="card" style={{ marginBottom: '1rem' }}>
                                <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
                                    ข้อมูลผู้เข้าพัก
                                </h2>

                                <div className="input-group">
                                    <label className="input-label">ชื่อ-สกุล *</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={guestName}
                                        onChange={(e) => setGuestName(e.target.value)}
                                        placeholder="กรอกชื่อ-สกุล"
                                        required
                                    />
                                </div>

                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="input-label">เบอร์โทรศัพท์ (ไม่บังคับ)</label>
                                    <input
                                        type="tel"
                                        className="input-field"
                                        value={guestPhone}
                                        onChange={(e) => setGuestPhone(e.target.value)}
                                        placeholder="กรอกเบอร์โทรศัพท์"
                                    />
                                </div>
                                <div className="input-group" style={{ marginTop: '1rem' }}>
                                    <label className="input-label">ส่วนลด (บาท)</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        value={discount}
                                        onChange={(e) => setDiscount(Number(e.target.value))}
                                        placeholder="0.00"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="summary-box">
                                <div className="summary-row">
                                    <span>ห้องที่เลือก</span>
                                    <span>
                                        {availableRooms
                                            .filter(r => selectedRooms.includes(r.id))
                                            .map(r => r.number)
                                            .join(', ')}
                                    </span>
                                </div>
                                <div className="summary-row">
                                    <span>วันเข้าพัก</span>
                                    <span>{new Date(checkIn).toLocaleDateString('th-TH')} - {new Date(checkOut).toLocaleDateString('th-TH')}</span>
                                </div>
                                <div className="summary-row">
                                    <span>จำนวนคืน</span>
                                    <span>{calculateNights()} คืน</span>
                                </div>
                                <div className="summary-row">
                                    <span>รวมทั้งหมด</span>
                                    <span>{calculateSubtotal().toLocaleString()} บาท</span>
                                </div>
                                {discount > 0 && (
                                    <div className="summary-row" style={{ color: 'var(--success)' }}>
                                        <span>ส่วนลด</span>
                                        <span>-{discount.toLocaleString()} บาท</span>
                                    </div>
                                )}
                                <div className="summary-total">
                                    <span>ยอดสุทธิ</span>
                                    <span>{calculateTotalPrice().toLocaleString()} บาท</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-success"
                                style={{ width: '100%', marginTop: '1rem' }}
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <>
                                        <span className="spinner"></span>
                                        กำลังบันทึก...
                                    </>
                                ) : (
                                    'ยืนยันการจอง'
                                )}
                            </button>
                        </form>
                    </>
                )}
            </main >

            <BottomNav />
        </>
    )
}
