import { useRef, useState } from 'react'

export default function UserProfilePage() {
  const [avatarUrl, setAvatarUrl] = useState(null)
  const fileInputRef = useRef(null)

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setAvatarUrl(reader.result?.toString() ?? null)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="page page-profile">
      <section className="profile-card" aria-labelledby="profile-heading">
        <div className="profile-avatar" aria-label="User avatar">
          {avatarUrl ? (
            <img src={avatarUrl} alt="現在のプロフィール画像" className="profile-avatar-image" />
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

        <form className="profile-form" aria-describedby="profile-note">
          <h1 id="profile-heading" className="profile-title">
            プロフィール
          </h1>

          <label className="profile-field">
            <span className="profile-label">User Name</span>
            <input
              type="text"
              name="name"
              defaultValue="COJT大好き"
              className="profile-input"
              autoComplete="name"
            />
          </label>

          <label className="profile-field">
            <span className="profile-label">Email</span>
            <input
              type="email"
              name="email"
              defaultValue="cojt@sample.com"
              className="profile-input"
              autoComplete="email"
            />
          </label>

          <label className="profile-field">
            <span className="profile-label">Password</span>
            <input
              type="password"
              name="password"
              defaultValue="••••••••••••"
              className="profile-input"
              autoComplete="current-password"
            />
          </label>

          <p id="profile-note" className="profile-note">
            プロフィール情報を更新するには各項目を編集してください。
          </p>
        </form>
      </section>
    </div>
  )
}
