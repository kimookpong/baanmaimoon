'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getRooms() {
    return await prisma.room.findMany({
        orderBy: { number: 'asc' },
    })
}

export async function getRoomStats() {
    const rooms = await prisma.room.findMany()
    return {
        total: rooms.length,
        available: rooms.filter(r => r.status === 'AVAILABLE').length,
        occupied: rooms.filter(r => r.status === 'OCCUPIED').length,
        maintenance: rooms.filter(r => r.status === 'MAINTENANCE').length,
    }
}

export async function createRoom(data: { number: string; name: string; price: number }) {
    await prisma.room.create({ data })
    revalidatePath('/rooms')
}

export async function updateRoom(id: string, data: { number: string; name: string; price: number; status: string }) {
    await prisma.room.update({
        where: { id },
        data,
    })
    revalidatePath('/rooms')
}

export async function deleteRoom(id: string) {
    await prisma.room.delete({ where: { id } })
    revalidatePath('/rooms')
}

export async function updateRoomStatus(id: string, status: string) {
    await prisma.room.update({
        where: { id },
        data: { status },
    })
    revalidatePath('/rooms')
    revalidatePath('/dashboard')
}
