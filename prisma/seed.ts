import { PrismaClient } from '../node_modules/.prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import bcrypt from 'bcryptjs'

const connectionString = process.env.DATABASE_URL!
const adapter = new PrismaNeon({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin1234', 10)

    await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password: hashedPassword,
        },
    })

    // Create sample rooms
    const rooms = [
        { number: '101', name: 'ห้องเตียงเดี่ยว', price: 500 },
        { number: '102', name: 'ห้องเตียงเดี่ยว', price: 500 },
        { number: '103', name: 'ห้องเตียงคู่', price: 700 },
        { number: '201', name: 'ห้องเตียงคู่', price: 700 },
        { number: '202', name: 'ห้องเตียงคู่ดีลักซ์', price: 900 },
        { number: '203', name: 'ห้องเตียงคู่ดีลักซ์', price: 900 },
    ]

    for (const room of rooms) {
        await prisma.room.upsert({
            where: { number: room.number },
            update: {},
            create: room,
        })
    }

    console.log('Seed completed!')
    await prisma.$disconnect()
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
