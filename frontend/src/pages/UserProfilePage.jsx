import { useEffect, useRef, useState } from 'react'
import { fetchProfile, updateProfile } from '../api/profile.js'

export default function UserProfilePage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    avatarUrl: null,
  })
  const [status, setStatus] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    let isMounted = true

    const loadProfile = async () => {
      try {
        const profile = await fetchProfile()
        if (isMounted) {
          setForm({
            name: profile.name ?? '',
            email: profile.email ?? '',
            password: profile.password ?? '',
            avatarUrl: profile.avatarUrl ?? null,
          })
        }
      } catch (error) {
        if (isMounted) {
          setStatus({ type: 'error', message: 'プロフィールの読み込みに失敗しました。' })
        }
        console.error(error)
      }
    }

    loadProfile()

    return () => {
      isMounted = false
    }
  }, [])

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const value = reader.result?.toString() ?? null
      setForm((prev) => ({ ...prev, avatarUrl: value }))
    }
    reader.readAsDataURL(file)
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setStatus(null)

    try {
      await updateProfile(form)
      setStatus({ type: 'success', message: 'プロフィールを保存しました。' })
    } catch (error) {
      setStatus({ type: 'error', message: 'プロフィールの保存に失敗しました。' })
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="page page-profile">
      <section className="profile-card" aria-labelledby="profile-heading">
        <div className="profile-avatar" aria-label="User avatar">
          {form.avatarUrl ? (
            <img src={form.avatarUrl} alt="現在のプロフィール画像" className="profile-avatar-image" />
          ) : (
            <div className="profile-avatar-figure" aria-hidden="true" />
          )}
          <button
            type="button"
            className="profile-avatar-upload"
            onClick={handleAvatarClick}
          >
            <img src="/camera_icon.png" alt="" aria-hidden="true" />
            <span className="sr-only">写真を変更</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="sr-only"
          />
        </div>

        <form className="profile-form" aria-describedby="profile-note" onSubmit={handleSubmit}>
          <h1 id="profile-heading" className="profile-title">
            プロフィール
          </h1>

          <label className="profile-field">
            <span className="profile-label">User Name</span>
            <input
              type="text"
              name="name"
              value={form.name}
              className="profile-input"
              autoComplete="name"
              onChange={handleInputChange}
            />
          </label>

          <label className="profile-field">
            <span className="profile-label">Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              className="profile-input"
              autoComplete="email"
              onChange={handleInputChange}
            />
          </label>

          <label className="profile-field">
            <span className="profile-label">Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              className="profile-input"
              autoComplete="current-password"
              onChange={handleInputChange}
            />
          </label>

          <p id="profile-note" className="profile-note">
            プロフィール情報を更新するには各項目を編集してください。
          </p>

          <div className="profile-actions">
            <button type="submit" className="profile-save-button" disabled={isSaving}>
              {isSaving ? '保存中…' : '保存する'}
            </button>
            {status ? (
              <p className={`profile-status profile-status-${status.type}`}>{status.message}</p>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  )
}
