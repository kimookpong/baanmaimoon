'use client'

import { useState, useEffect, useTransition } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import { getRooms, createRoom, updateRoom, deleteRoom, updateRoomStatus } from '@/app/actions/room-actions'

interface Room {
    id: string
    number: string
    name: string
    price: number
    status: string
}

const statusLabels: Record<string, string> = {
    AVAILABLE: 'ว่าง',
    OCCUPIED: 'มีผู้พัก',
    MAINTENANCE: 'ปิดปรับปรุง',
}

const statusBadgeClass: Record<string, string> = {
    AVAILABLE: 'badge-available',
    OCCUPIED: 'badge-occupied',
    MAINTENANCE: 'badge-maintenance',
}

export default function RoomsPage() {
    const { status } = useSession()
    const router = useRouter()
    const [rooms, setRooms] = useState<Room[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingRoom, setEditingRoom] = useState<Room | null>(null)
    const [isPending, startTransition] = useTransition()

    const [formData, setFormData] = useState({
        number: '',
        name: '',
        price: '',
        status: 'AVAILABLE',
    })

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        }
    }, [status, router])

    useEffect(() => {
        loadRooms()
    }, [])

    const loadRooms = async () => {
        const data = await getRooms()
        setRooms(data)
    }

    const openModal = (room?: Room) => {
        if (room) {
            setEditingRoom(room)
            setFormData({
                number: room.number,
                name: room.name,
                price: room.price.toString(),
                status: room.status,
            })
        } else {
            setEditingRoom(null)
            setFormData({ number: '', name: '', price: '', status: 'AVAILABLE' })
        }
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingRoom(null)
        setFormData({ number: '', name: '', price: '', status: 'AVAILABLE' })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        startTransition(async () => {
            if (editingRoom) {
                await updateRoom(editingRoom.id, {
                    number: formData.number,
                    name: formData.name,
                    price: parseFloat(formData.price),
                    status: formData.status,
                })
            } else {
                await createRoom({
                    number: formData.number,
                    name: formData.name,
                    price: parseFloat(formData.price),
                })
            }
            await loadRooms()
            closeModal()
        })
    }

    const handleDelete = async (id: string) => {
        if (confirm('ต้องการลบห้องนี้หรือไม่?')) {
            startTransition(async () => {
                await deleteRoom(id)
                await loadRooms()
            })
        }
    }

    const handleStatusChange = async (id: string, newStatus: string) => {
        startTransition(async () => {
            await updateRoomStatus(id, newStatus)
            await loadRooms()
        })
    }

    if (status === 'loading') {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>กำลังโหลด...</div>
    }

    return (
        <>
            <Header title="ห้องพัก" />

            <main className="page-container">
                <button
                    onClick={() => openModal()}
                    className="btn btn-primary"
                    style={{ width: '100%', marginBottom: '1rem' }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    เพิ่มห้องพัก
                </button>

                {rooms.length === 0 ? (
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                        <p>ยังไม่มีห้องพัก</p>
                        <p>กดปุ่มด้านบนเพื่อเพิ่มห้องพัก</p>
                    </div>
                ) : (
                    rooms.map((room) => (
                        <div key={room.id} className="room-card">
                            <div className="room-number">{room.number}</div>
                            <div className="room-info">
                                <div className="room-name">{room.name}</div>
                                <div className="room-price">{room.price.toLocaleString()} บาท/คืน</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                                <span className={`badge ${statusBadgeClass[room.status]}`}>
                                    {statusLabels[room.status]}
                                </span>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => openModal(room)}
                                        className="btn btn-secondary"
                                        style={{ padding: '0.375rem 0.75rem', minHeight: 'auto', fontSize: '0.875rem' }}
                                    >
                                        แก้ไข
                                    </button>
                                    {room.status !== 'OCCUPIED' && (
                                        <button
                                            onClick={() => handleDelete(room.id)}
                                            className="btn btn-danger"
                                            style={{ padding: '0.375rem 0.75rem', minHeight: 'auto', fontSize: '0.875rem' }}
                                        >
                                            ลบ
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </main>

            <BottomNav />

            {/* Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                    zIndex: 100,
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.25rem' }}>
                            {editingRoom ? 'แก้ไขห้องพัก' : 'เพิ่มห้องพัก'}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label className="input-label">หมายเลขห้อง</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={formData.number}
                                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                                    placeholder="เช่น 101"
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">ชื่อห้อง</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="เช่น ห้องเตียงคู่"
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">ราคา (บาท/คืน)</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="เช่น 700"
                                    required
                                    min="0"
                                />
                            </div>

                            {editingRoom && (
                                <div className="input-group">
                                    <label className="input-label">สถานะ</label>
                                    <select
                                        className="input-field"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="AVAILABLE">ว่าง</option>
                                        <option value="MAINTENANCE">ปิดปรับปรุง</option>
                                        {formData.status === 'OCCUPIED' && (
                                            <option value="OCCUPIED">มีผู้พัก</option>
                                        )}
                                    </select>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                                <button type="button" onClick={closeModal} className="btn btn-secondary" style={{ flex: 1 }}>
                                    ยกเลิก
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isPending}>
                                    {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
