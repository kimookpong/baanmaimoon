'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getAvailableRooms(checkIn: Date, checkOut: Date) {
    // Get rooms that are not occupied and not booked during the date range
    const bookedRoomIds = await prisma.bookingRoom.findMany({
        where: {
            booking: {
                status: { in: ['PENDING', 'CHECKED_IN', 'CHECKED_OUT', 'COMPLETED'] },
                OR: [
                    {
                        AND: [
                            { checkIn: { lte: checkIn } },
                            { checkOut: { gt: checkIn } },
                        ],
                    },
                    {
                        AND: [
                            { checkIn: { lt: checkOut } },
                            { checkOut: { gte: checkOut } },
                        ],
                    },
                    {
                        AND: [
                            { checkIn: { gte: checkIn } },
                            { checkOut: { lte: checkOut } },
                        ],
                    },
                ],
            },
        },
        select: { roomId: true },
    })

    const bookedIds = bookedRoomIds.map(b => b.roomId)

    return await prisma.room.findMany({
        where: {
            status: 'AVAILABLE',
            id: { notIn: bookedIds },
        },
        orderBy: { number: 'asc' },
    })
}

export async function createBooking(data: {
    guestName: string
    guestPhone?: string
    checkIn: Date
    checkOut: Date
    roomIds: string[]
    totalPrice: number
    discount?: number
}) {
    // Create or find guest
    let guest = await prisma.guest.findFirst({
        where: { name: data.guestName },
    })

    if (!guest) {
        guest = await prisma.guest.create({
            data: {
                name: data.guestName,
                phone: data.guestPhone || null,
            },
        })
    } else if (data.guestPhone && guest.phone !== data.guestPhone) {
        guest = await prisma.guest.update({
            where: { id: guest.id },
            data: { phone: data.guestPhone },
        })
    }

    // Create booking
    const booking = await prisma.booking.create({
        data: {
            guestId: guest.id,
            checkIn: data.checkIn,
            checkOut: data.checkOut,
            totalPrice: data.totalPrice,
            discount: data.discount || 0,
            status: 'PENDING',
            rooms: {
                create: data.roomIds.map(roomId => ({ roomId })),
            },
        },
        include: {
            rooms: { include: { room: true } },
            guest: true,
        },
    })

    revalidatePath('/booking')
    revalidatePath('/checkin')
    revalidatePath('/dashboard')

    return booking
}

export async function getBookings(status?: string) {
    const where = status ? { status } : {}
    return await prisma.booking.findMany({
        where,
        include: {
            guest: true,
            rooms: { include: { room: true } },
        },
        orderBy: { checkIn: 'asc' },
    })
}

export async function getPendingBookings() {
    return await prisma.booking.findMany({
        where: { status: { in: ['PENDING', 'CHECKED_IN'] } },
        include: {
            guest: true,
            rooms: { include: { room: true } },
        },
        orderBy: { checkIn: 'asc' },
    })
}

export async function getTodayBookings() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return await prisma.booking.findMany({
        where: {
            OR: [
                // Check-in today
                {
                    checkIn: { gte: today, lt: tomorrow },
                    status: 'PENDING',
                },
                // Check-out today
                {
                    checkOut: { gte: today, lt: tomorrow },
                    status: 'CHECKED_IN',
                },
            ],
        },
        include: {
            guest: true,
            rooms: { include: { room: true } },
        },
        orderBy: { checkIn: 'asc' },
    })
}

export async function checkIn(bookingId: string) {
    const booking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CHECKED_IN' },
        include: { rooms: true },
    })

    // Update room status to occupied
    for (const bookingRoom of booking.rooms) {
        await prisma.room.update({
            where: { id: bookingRoom.roomId },
            data: { status: 'OCCUPIED' },
        })
    }

    revalidatePath('/checkin')
    revalidatePath('/dashboard')
    revalidatePath('/rooms')
}

export async function checkOut(bookingId: string, additionalDiscount: number = 0) {
    // If there's an additional discount, we need to update the price and discount fields
    if (additionalDiscount > 0) {
        const currentBooking = await prisma.booking.findUnique({
            where: { id: bookingId }
        })

        if (currentBooking) {
            await prisma.booking.update({
                where: { id: bookingId },
                data: {
                    totalPrice: currentBooking.totalPrice - additionalDiscount,
                    discount: (currentBooking.discount || 0) + additionalDiscount
                }
            })
        }
    }

    const booking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CHECKED_OUT' },
        include: { rooms: true },
    })

    // Update room status to available
    for (const bookingRoom of booking.rooms) {
        await prisma.room.update({
            where: { id: bookingRoom.roomId },
            data: { status: 'AVAILABLE' },
        })
    }

    revalidatePath('/checkin')
    revalidatePath('/dashboard')
    revalidatePath('/rooms')
}

export async function cancelBooking(bookingId: string) {
    await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' },
    })

    revalidatePath('/checkin')
    revalidatePath('/dashboard')
}

export async function getMonthlyAvailability(year: number, month: number) {
    // Get all rooms
    const allRooms = await prisma.room.findMany({
        where: { status: { not: 'MAINTENANCE' } },
    })
    const totalRooms = allRooms.length

    // Get first and last day of month
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0)
    const daysInMonth = endDate.getDate()

    // Get all bookings that overlap with this month
    const bookings = await prisma.booking.findMany({
        where: {
            status: { in: ['PENDING', 'CHECKED_IN', 'CHECKED_OUT'] },
            AND: [
                { checkIn: { lte: endDate } },
                { checkOut: { gt: startDate } },
            ],
        },
        include: {
            rooms: { select: { roomId: true } },
        },
    })

    // Calculate available rooms for each day
    const availability: { date: string; available: number; total: number }[] = []

    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day)
        const nextDate = new Date(year, month, day + 1)

        // Count booked rooms for this day
        const bookedRoomIds = new Set<string>()

        for (const booking of bookings) {
            // Normalize booking dates to local midnight for comparison
            const checkIn = new Date(booking.checkIn)
            checkIn.setHours(0, 0, 0, 0)
            const checkOut = new Date(booking.checkOut)
            checkOut.setHours(0, 0, 0, 0)

            // Check if this day overlaps with the booking
            // Logic:
            // 1. checkIn must be before nextDate (booking starts on or before this day)
            // 2. checkOut must be after currentDate (booking ends strictly after this day)
            // Example: Booking Jan 1 - Jan 3
            // Jan 1: checkIn(1) < Jan 2 && checkOut(3) > Jan 1 -> True (Occupied)
            // Jan 2: checkIn(1) < Jan 3 && checkOut(3) > Jan 2 -> True (Occupied)
            // Jan 3: checkIn(1) < Jan 4 && checkOut(3) > Jan 3 -> False (checkout day not occupied)
            if (checkIn < nextDate && checkOut > currentDate) {
                for (const room of booking.rooms) {
                    bookedRoomIds.add(room.roomId)
                }
            }
        }

        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        availability.push({
            date: dateStr,
            available: totalRooms - bookedRoomIds.size,
            total: totalRooms,
        })
    }

    return availability
}
