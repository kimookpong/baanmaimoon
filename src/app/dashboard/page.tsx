import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import { getRoomStats } from '@/app/actions/room-actions'
import { getTodayBookings, getMonthlyAvailability } from '@/app/actions/booking-actions'
import AvailabilityCalendar from '@/components/AvailabilityCalendar'

function formatDate(date: Date) {
    return new Date(date).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
    })
}

export default async function DashboardPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect('/login')
    }

    const stats = await getRoomStats()
    const todayBookings = await getTodayBookings()

    const checkIns = todayBookings.filter(b => b.status === 'PENDING')
    const checkOuts = todayBookings.filter(b => b.status === 'CHECKED_IN')

    return (
        <>
            <Header title="หน้าหลัก" />
            <main className="page-container">
                <AvailabilityCalendar getAvailability={getMonthlyAvailability} />

                <section style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
                        รอเช็คอินวันนี้ ({checkIns.length})
                    </h2>
                    {checkIns.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', color: '#9ca3af', padding: '1.5rem' }}>
                            ไม่มีการเช็คอินวันนี้
                        </div>
                    ) : (
                        checkIns.map((booking) => (
                            <div key={booking.id} className="card" style={{ marginBottom: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
                                            {booking.guest.name}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                            {booking.rooms.map(r => `ห้อง ${r.room.number}`).join(', ')}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                            {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                                        </div>
                                    </div>
                                    <span className="badge badge-pending">รอเช็คอิน</span>
                                </div>
                            </div>
                        ))
                    )}
                </section>

                <section>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
                        เช็คเอาท์วันนี้ ({checkOuts.length})
                    </h2>
                    {checkOuts.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', color: '#9ca3af', padding: '1.5rem' }}>
                            ไม่มีการเช็คเอาท์วันนี้
                        </div>
                    ) : (
                        checkOuts.map((booking) => (
                            <div key={booking.id} className="card" style={{ marginBottom: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
                                            {booking.guest.name}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                            {booking.rooms.map(r => `ห้อง ${r.room.number}`).join(', ')}
                                        </div>
                                    </div>
                                    <span className="badge badge-checked-in">เข้าพักอยู่</span>
                                </div>
                            </div>
                        ))
                    )}
                </section>
            </main>

            <BottomNav />
        </>
    )
}
