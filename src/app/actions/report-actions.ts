'use server'

import { prisma } from '@/lib/prisma'

// 1. Monthly Occupancy Report
export async function getMonthlyOccupancy(year: number, month: number) {
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0)

    // Get all rooms count
    const totalRooms = await prisma.room.count()

    // Get bookings in this range
    const bookings = await prisma.booking.findMany({
        where: {
            OR: [
                {
                    checkIn: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                {
                    checkOut: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                {
                    checkIn: { lte: startDate },
                    checkOut: { gte: endDate }
                }
            ],
            status: { not: 'CANCELLED' }
        },
        include: {
            rooms: true
        }
    })

    const daysInMonth = endDate.getDate()
    const occupancyData = []

    for (let i = 1; i <= daysInMonth; i++) {
        const currentDate = new Date(year, month, i)
        let occupiedCount = 0

        // Count occupied rooms for this date
        // Note: Check-out date is not counted as occupied for that night
        bookings.forEach(booking => {
            const checkIn = new Date(booking.checkIn)
            const checkOut = new Date(booking.checkOut)

            // Normalize to start of day for comparison
            const dateCheck = new Date(currentDate)
            dateCheck.setHours(0, 0, 0, 0)
            const checkInNorm = new Date(checkIn)
            checkInNorm.setHours(0, 0, 0, 0)
            const checkOutNorm = new Date(checkOut)
            checkOutNorm.setHours(0, 0, 0, 0)

            if (dateCheck >= checkInNorm && dateCheck < checkOutNorm) {
                occupiedCount += booking.rooms.length
            }
        })

        occupancyData.push({
            date: currentDate.toISOString(),
            occupied: occupiedCount,
            total: totalRooms
        })
    }

    return occupancyData
}

// 2. Active/Upcoming Bookings Report
export async function getUpcomingBookings() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const bookings = await prisma.booking.findMany({
        where: {
            checkOut: { gte: today },
            status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] }
        },
        include: {
            guest: true,
            rooms: {
                include: {
                    room: true
                }
            }
        },
        orderBy: {
            checkIn: 'asc'
        }
    })

    return bookings
}

// 3. Revenue Report (Yearly with Monthly breakdown)
export async function getYearlyRevenue(year: number) {
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31, 23, 59, 59)

    const bookings = await prisma.booking.findMany({
        where: {
            checkOut: {
                gte: startDate,
                lte: endDate
            },
            status: { in: ['CHECKED_OUT', 'COMPLETED'] } // Assuming revenue is realized on checkout/completion
        }
    })

    const monthlyRevenue = Array(12).fill(0)
    const monthlyDiscount = Array(12).fill(0)
    let totalRevenue = 0
    let totalDiscount = 0

    bookings.forEach(booking => {
        const month = new Date(booking.checkOut).getMonth()
        monthlyRevenue[month] += booking.totalPrice
        monthlyDiscount[month] += booking.discount
        totalRevenue += booking.totalPrice
        totalDiscount += booking.discount
    })

    return {
        year,
        totalRevenue,
        totalDiscount,
        monthlyRevenue,
        monthlyDiscount
    }
}

// 4. Booking History
export async function getBookingHistory(limit: number = 20) {
    const bookings = await prisma.booking.findMany({
        where: {
            status: { in: ['CHECKED_OUT', 'CANCELLED', 'COMPLETED'] }
        },
        include: {
            guest: true,
            rooms: {
                include: {
                    room: true
                }
            }
        },
        orderBy: {
            checkOut: 'desc'
        },
        take: limit
    })

    return bookings
}

// 5. Room Status for Specific Date
export async function getRoomStatusForDate(dateStr: string) {
    const targetDate = new Date(dateStr)
    targetDate.setHours(0, 0, 0, 0)
    const nextDate = new Date(targetDate)
    nextDate.setDate(nextDate.getDate() + 1)

    // Get all rooms
    const rooms = await prisma.room.findMany({
        orderBy: { number: 'asc' }
    })

    // Get bookings overlapping with this date
    // Logic: checkIn < nextDate AND checkOut > targetDate
    const bookings = await prisma.booking.findMany({
        where: {
            status: { in: ['PENDING', 'CHECKED_IN'] },
            checkIn: { lt: nextDate },
            checkOut: { gt: targetDate }
        },
        include: {
            guest: true,
            rooms: {
                select: { roomId: true }
            }
        }
    })

    // Map rooms to status
    return rooms.map(room => {
        // Find booking for this room
        const booking = bookings.find(b =>
            b.rooms.some(br => br.roomId === room.id) &&
            // Double check overlap logic with normalized dates just to be safe
            (new Date(b.checkIn).setHours(0, 0, 0, 0) < nextDate.getTime() &&
                new Date(b.checkOut).setHours(0, 0, 0, 0) > targetDate.getTime())
        )

        if (booking) {
            return {
                id: room.id,
                number: room.number,
                status: 'OCCUPIED',
                booking: {
                    id: booking.id,
                    guestName: booking.guest.name,
                    checkIn: booking.checkIn,
                    checkOut: booking.checkOut,
                    status: booking.status
                }
            }
        }

        return {
            id: room.id,
            number: room.number,
            status: 'AVAILABLE'
        }
    })
}
