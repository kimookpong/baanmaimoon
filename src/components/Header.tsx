'use client'

import { signOut } from 'next-auth/react'

import Image from 'next/image'

interface HeaderProps {
    title: string
    showLogout?: boolean
}

export default function Header({ title, showLogout = true }: HeaderProps) {
    return (
        <header className="page-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Image
                    src="/logo.png"
                    alt="BanMaimoon Logo"
                    width={40}
                    height={40}
                    style={{ borderRadius: '8px' }}
                />
                <h1 className="page-title">{title}</h1>
            </div>
            {showLogout && (
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="btn btn-secondary"
                    style={{ padding: '0.5rem 1rem', minHeight: 'auto' }}
                >
                    ออกจากระบบ
                </button>
            )}
        </header>
    )
}
