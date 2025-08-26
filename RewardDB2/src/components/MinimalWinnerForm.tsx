import React, { useEffect, useRef, useState } from 'react'
import { useUserProfile } from '../hooks/useUserProfile'
import { db } from '../firebase'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import axios from 'axios'

const CLOUDINARY_UPLOAD_PRESET = 'rewards_unsigned'
const CLOUDINARY_CLOUD_NAME = 'dyey1kwiz'

async function uploadToCloudinary(file: File) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
  const res = await axios.post(url, formData)
  return res.data.secure_url as string
}

interface Props { onClose?: () => void }

const MinimalWinnerForm: React.FC<Props> = ({ onClose }) => {
  const { profile } = useUserProfile()
  const [heading, setHeading] = useState('')
  const [testimonial, setTestimonial] = useState('')
  const [category, setCategory] = useState('Academic')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const firstInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    // Autofocus first input for accessibility when mounted
    firstInputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!imageFile) {
      setPreview(null)
      return
    }
    const reader = new FileReader()
    reader.onload = () => setPreview(String(reader.result))
    reader.readAsDataURL(imageFile)
  }, [imageFile])

  const [fileError, setFileError] = useState<string | null>(null);
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > 150 * 1024) {
      setFileError('Image size must be 150KB or less.');
      setImageFile(null);
      return;
    }
    setFileError(null);
    setImageFile(f);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    if (!heading.trim() || !testimonial.trim()) {
      alert('Please fill the headline and testimonial.')
      return
    }
    setSubmitting(true)
    console.log('[MinimalWinnerForm] Submit started')
    try {
      let imageUrl = ''
      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile)
      }
      await addDoc(collection(db, 'winnerSubmissions'), {
  uid: profile?.uid || '',
        name: profile?.displayName || '',
        house: profile?.house || '',
        campus: profile?.campus || '',
        category,
        testimonialHeading: heading,
        testimonial,
        imageUrl,
        status: 'pending',
        createdAt: Timestamp.now()
      })
      console.log('[MinimalWinnerForm] Submission successful, closing modal')
      if (onClose) onClose()
    } catch (err: any) {
      console.error('[MinimalWinnerForm] Submit failed:', err)
      alert(`Submission failed: ${err?.message ?? 'Unknown error'}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label style={{ fontSize: 12, color: '#9aa6b2' }}>Name</label>
      <input value={profile?.displayName || ''} readOnly style={inputStyle} />

      <label style={{ fontSize: 12, color: '#9aa6b2' }}>Category</label>
      <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
        <option>Academic</option>
        <option>Culture</option>
        <option>Overall</option>
      </select>

      <label style={{ fontSize: 12, color: '#9aa6b2' }}>Headline</label>
      <input ref={firstInputRef} value={heading} onChange={e => setHeading(e.target.value)} placeholder="Short headline" style={inputStyle} />

      <label style={{ fontSize: 12, color: '#9aa6b2' }}>Testimonial</label>
      <textarea value={testimonial} onChange={e => setTestimonial(e.target.value)} rows={4} placeholder="Share a short testimonial" style={textareaStyle} />

      <label style={{ fontSize: 12, color: '#9aa6b2' }}>Photo (optional)</label>
  <input type="file" accept="image/*" onChange={onFile} />
  {fileError && <div style={{ color: '#ff0058', fontSize: 13, marginTop: 4 }}>{fileError}</div>}
  {preview && <img src={preview} alt="preview" style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8 }} />}

      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <button type="submit" disabled={submitting} style={primaryButtonStyle}>{submitting ? 'Submitting…' : 'Submit'}</button>
        <button type="button" onClick={() => onClose && onClose()} style={secondaryButtonStyle}>Cancel</button>
      </div>
    </form>
  )
}

const inputStyle: React.CSSProperties = {
  padding: 8,
  borderRadius: 6,
  border: '1px solid rgba(255,255,255,0.06)',
  background: '#07101a',
  color: '#fff'
}

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 100,
  resize: 'vertical'
}

const primaryButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 12px',
  borderRadius: 8,
  border: 'none',
  background: '#00e6d2',
  color: '#042028',
  fontWeight: 700,
  cursor: 'pointer'
}

const secondaryButtonStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.06)',
  background: 'transparent',
  color: '#fff',
  cursor: 'pointer'
}

export default MinimalWinnerForm
