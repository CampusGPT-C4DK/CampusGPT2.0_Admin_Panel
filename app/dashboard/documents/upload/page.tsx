'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI, handleApiError } from '@/lib/api';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import {
  Upload, X, FileText, UploadCloud, FilePlus2,
  Loader2, ArrowLeft, CheckCircle, Trash2,
  File, Tag, AlignLeft, Sparkles,
} from 'lucide-react';

type UploadTab = 'single' | 'batch';

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

export default function UploadPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<UploadTab>('single');

  /* ── Single upload state ── */
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('general');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ── Batch upload state ── */
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchDragOver, setBatchDragOver] = useState(false);
  const batchRef = useRef<HTMLInputElement>(null);

  const handleSingleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) { toast.error('File and title are required'); return; }
    setUploading(true);
    try {
      await adminAPI.uploadDocument(file, title.trim(), description.trim(), category);
      toast.success(`"${title}" uploaded successfully! 🎉`);
      router.push('/dashboard/documents');
    } catch (err) {
      toast.error(handleApiError(err, 'Upload failed'));
    } finally {
      setUploading(false);
    }
  };

  const handleBatchUpload = async () => {
    if (batchFiles.length === 0) return;
    setUploading(true);
    let ok = 0, fail = 0;
    for (const f of batchFiles) {
      try {
        await adminAPI.uploadDocument(f, f.name.replace(/\.[^/.]+$/, ''), '', 'general');
        ok++;
      } catch { fail++; }
    }
    setUploading(false);
    if (ok) toast.success(`${ok} file${ok > 1 ? 's' : ''} uploaded successfully! 🎉`);
    if (fail) toast.error(`${fail} file${fail > 1 ? 's' : ''} failed to upload`);
    if (ok > 0) router.push('/dashboard/documents');
  };

  const tabStyle = (active: boolean) => ({
    flex: 1, padding: '12px 0', borderRadius: '10px', border: 'none',
    fontSize: '14px', fontWeight: active ? '700' : '500',
    cursor: 'pointer', transition: 'all 0.2s',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    ...(active ? {
      backgroundImage: 'linear-gradient(135deg, rgba(96,165,250,0.12), rgba(167,139,250,0.08))',
      color: '#60a5fa',
      boxShadow: '0 0 16px rgba(96,165,250,0.08)',
    } : {
      backgroundColor: 'transparent',
      color: '#64748b',
    }),
  } as React.CSSProperties);

  const inputContainerStyle = {
    position: 'relative' as const, borderRadius: '12px',
    backgroundColor: 'rgba(10,14,23,0.6)',
    borderWidth: '1px', borderStyle: 'solid' as const, borderColor: 'rgba(255,255,255,0.06)',
    transition: 'all 0.2s',
  };

  const inputStyle = {
    width: '100%', padding: '13px 14px 13px 42px',
    background: 'transparent', border: 'none', outline: 'none',
    color: '#f0f4ff', fontSize: '14px', fontFamily: 'Inter, sans-serif', borderRadius: '12px',
  };

  const labelStyle = {
    display: 'block' as const, fontSize: '12px', fontWeight: '600',
    color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.03em',
  };

  return (
    <div>
      <Header
        title="Upload Documents"
        subtitle="Add new documents to your CampusGPT knowledge base"
        actions={
          <button
            onClick={() => router.push('/dashboard/documents')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '9px 18px', borderRadius: '10px', border: 'none',
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.08)',
              color: '#94a3b8', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#f0f4ff'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <ArrowLeft size={14} /> Back to Documents
          </button>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ padding: '28px 32px', maxWidth: '780px', margin: '0 auto' }}
      >
        {/* ═══ TAB SWITCHER ═══ */}
        <div style={{
          display: 'flex', gap: '4px', padding: '4px', borderRadius: '14px',
          backgroundColor: 'rgba(255,255,255,0.02)',
          borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.04)',
          marginBottom: '28px',
        }}>
          <button onClick={() => setActiveTab('single')} style={tabStyle(activeTab === 'single')}>
            <UploadCloud size={16} /> Single Upload
          </button>
          <button onClick={() => setActiveTab('batch')} style={tabStyle(activeTab === 'batch')}>
            <FilePlus2 size={16} /> Batch Upload
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* ═══════ SINGLE UPLOAD ═══════ */}
          {activeTab === 'single' && (
            <motion.div
              key="single"
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25 }}
            >
              <div style={{
                padding: '32px', borderRadius: '18px',
                background: 'linear-gradient(145deg, rgba(23,28,37,0.85), rgba(15,19,29,0.92))',
                borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.05)',
                borderTop: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    backgroundImage: 'linear-gradient(135deg, rgba(96,165,250,0.12), rgba(167,139,250,0.08))',
                    borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(96,165,250,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Upload size={20} color="#60a5fa" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#f0f4ff' }}>Upload Document</h3>
                    <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>A live processing tracker will appear after upload</p>
                  </div>
                </div>

                <form onSubmit={handleSingleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                  {/* ── Dropzone ── */}
                  <motion.div
                    whileHover={{ scale: 1.005 }}
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => {
                      e.preventDefault(); setDragOver(false);
                      const f = e.dataTransfer.files[0];
                      if (f) { setFile(f); setTitle(f.name.replace(/\.[^/.]+$/, '')); }
                    }}
                    style={{
                      padding: '40px', borderRadius: '14px', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px',
                      backgroundColor: dragOver ? 'rgba(96,165,250,0.06)' : 'rgba(10,14,23,0.5)',
                      borderWidth: '2px', borderStyle: 'dashed',
                      borderColor: dragOver ? 'rgba(96,165,250,0.35)' : 'rgba(255,255,255,0.06)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {file ? (
                      <>
                        <div style={{
                          width: '56px', height: '56px', borderRadius: '14px',
                          backgroundImage: 'linear-gradient(135deg, rgba(96,165,250,0.12), rgba(96,165,250,0.05))',
                          borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(96,165,250,0.18)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <FileText size={26} color="#60a5fa" />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '15px', fontWeight: '600', color: '#f0f4ff' }}>{file.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>{formatSize(file.size)}</div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setFile(null); setTitle(''); }}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            padding: '6px 14px', borderRadius: '8px', border: 'none',
                            backgroundColor: 'rgba(239,68,68,0.08)', color: '#f87171',
                            fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.15)')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)')}
                        >
                          <X size={12} /> Remove
                        </button>
                      </>
                    ) : (
                      <>
                        <div style={{
                          width: '60px', height: '60px', borderRadius: '16px',
                          backgroundImage: 'linear-gradient(135deg, rgba(96,165,250,0.1), rgba(96,165,250,0.04))',
                          borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(96,165,250,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <UploadCloud size={26} color="#60a5fa" />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '15px', fontWeight: '600', color: '#f0f4ff' }}>Drop your file here or click to browse</div>
                          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '5px' }}>PDF, DOCX, TXT supported • Max 50MB</div>
                        </div>
                      </>
                    )}
                    <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.doc" style={{ display: 'none' }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setTitle(f.name.replace(/\.[^/.]+$/, '')); } }} />
                  </motion.div>

                  {/* ── Form fields ── */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                    <div>
                      <label style={labelStyle}><File size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Title *</label>
                      <div style={inputContainerStyle}>
                        <Tag size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
                        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Document title" required style={inputStyle} />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Category</label>
                      <div style={{ ...inputContainerStyle, padding: 0 }}>
                        <select value={category} onChange={e => setCategory(e.target.value)}
                          style={{
                            width: '100%', padding: '13px 14px',
                            background: 'transparent', border: 'none', outline: 'none',
                            color: '#f0f4ff', fontSize: '14px', fontFamily: 'Inter, sans-serif', borderRadius: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="general" style={{ background: '#0f131d' }}>General</option>
                          <option value="academic" style={{ background: '#0f131d' }}>Academic</option>
                          <option value="administrative" style={{ background: '#0f131d' }}>Administrative</option>
                          <option value="research" style={{ background: '#0f131d' }}>Research</option>
                          <option value="policies" style={{ background: '#0f131d' }}>Policies</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}><AlignLeft size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Description (optional)</label>
                    <div style={inputContainerStyle}>
                      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of this document..."
                        rows={3}
                        style={{
                          width: '100%', padding: '13px 14px', resize: 'vertical',
                          background: 'transparent', border: 'none', outline: 'none',
                          color: '#f0f4ff', fontSize: '14px', fontFamily: 'Inter, sans-serif', borderRadius: '12px',
                          lineHeight: '1.6',
                        }}
                      />
                    </div>
                  </div>

                  {/* ── Submit Buttons ── */}
                  <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                    <motion.button
                      type="submit" disabled={!file || !title.trim() || uploading}
                      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      style={{
                        flex: 1, padding: '14px', borderRadius: '12px', border: 'none',
                        backgroundImage: (!file || !title.trim() || uploading) ? 'none' : 'linear-gradient(135deg, #3b82f6, #6366f1, #7c3aed)',
                        backgroundColor: (!file || !title.trim() || uploading) ? 'rgba(59,130,246,0.2)' : undefined,
                        color: 'white', fontSize: '14px', fontWeight: '700', cursor: (!file || !title.trim() || uploading) ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        boxShadow: (!file || !title.trim() || uploading) ? 'none' : '0 6px 24px rgba(59,130,246,0.3)',
                        transition: 'all 0.3s', opacity: (!file || !title.trim() || uploading) ? 0.6 : 1,
                      }}
                    >
                      {uploading ? (
                        <><Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Uploading...</>
                      ) : (
                        <><Sparkles size={15} /> Upload & Process</>
                      )}
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard/documents')}
                      style={{
                        padding: '14px 24px', borderRadius: '12px', border: 'none',
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.08)',
                        color: '#94a3b8', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* ═══════ BATCH UPLOAD ═══════ */}
          {activeTab === 'batch' && (
            <motion.div
              key="batch"
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
            >
              <div style={{
                padding: '32px', borderRadius: '18px',
                background: 'linear-gradient(145deg, rgba(23,28,37,0.85), rgba(15,19,29,0.92))',
                borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.05)',
                borderTop: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    backgroundImage: 'linear-gradient(135deg, rgba(167,139,250,0.12), rgba(96,165,250,0.08))',
                    borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(167,139,250,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FilePlus2 size={20} color="#a78bfa" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#f0f4ff' }}>Batch Upload</h3>
                    <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Upload up to 10 files at once with auto-detected names</p>
                  </div>
                </div>

                {/* ── Batch Dropzone ── */}
                <motion.div
                  whileHover={{ scale: 1.005 }}
                  onClick={() => batchRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setBatchDragOver(true); }}
                  onDragLeave={() => setBatchDragOver(false)}
                  onDrop={e => {
                    e.preventDefault(); setBatchDragOver(false);
                    const files = Array.from(e.dataTransfer.files).slice(0, 10);
                    setBatchFiles(prev => [...prev, ...files].slice(0, 10));
                  }}
                  style={{
                    padding: '40px', borderRadius: '14px', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px',
                    backgroundColor: batchDragOver ? 'rgba(167,139,250,0.06)' : 'rgba(10,14,23,0.5)',
                    borderWidth: '2px', borderStyle: 'dashed',
                    borderColor: batchDragOver ? 'rgba(167,139,250,0.35)' : 'rgba(255,255,255,0.06)',
                    transition: 'all 0.2s', marginBottom: '20px',
                  }}
                >
                  <div style={{
                    width: '60px', height: '60px', borderRadius: '16px',
                    backgroundImage: 'linear-gradient(135deg, rgba(167,139,250,0.1), rgba(167,139,250,0.04))',
                    borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(167,139,250,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FilePlus2 size={26} color="#a78bfa" />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#f0f4ff' }}>Drop multiple files here</div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '5px' }}>Up to 10 files • PDF, DOCX, TXT</div>
                  </div>
                  <input ref={batchRef} type="file" multiple accept=".pdf,.docx,.txt,.doc" style={{ display: 'none' }}
                    onChange={e => { const files = Array.from(e.target.files || []).slice(0, 10); setBatchFiles(prev => [...prev, ...files].slice(0, 10)); }} />
                </motion.div>

                {/* ── File List ── */}
                {batchFiles.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>
                      {batchFiles.length} file{batchFiles.length > 1 ? 's' : ''} selected
                    </div>
                    {batchFiles.map((f, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '11px 14px', borderRadius: '10px',
                          backgroundColor: 'rgba(255,255,255,0.02)',
                          borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.04)',
                        }}
                      >
                        <FileText size={15} color="#60a5fa" />
                        <span style={{ flex: 1, fontSize: '13px', color: '#c1c7d3', fontWeight: '500' }}>{f.name}</span>
                        <span style={{ fontSize: '11px', color: '#475569' }}>{formatSize(f.size)}</span>
                        <button
                          onClick={() => setBatchFiles(prev => prev.filter((_, j) => j !== i))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', transition: 'color 0.2s' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* ── Batch Buttons ── */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <motion.button
                    onClick={handleBatchUpload}
                    disabled={batchFiles.length === 0 || uploading}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    style={{
                      flex: 1, padding: '14px', borderRadius: '12px', border: 'none',
                      backgroundImage: (batchFiles.length === 0 || uploading) ? 'none' : 'linear-gradient(135deg, #a78bfa, #6366f1, #3b82f6)',
                      backgroundColor: (batchFiles.length === 0 || uploading) ? 'rgba(167,139,250,0.2)' : undefined,
                      color: 'white', fontSize: '14px', fontWeight: '700',
                      cursor: (batchFiles.length === 0 || uploading) ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      boxShadow: (batchFiles.length === 0 || uploading) ? 'none' : '0 6px 24px rgba(167,139,250,0.25)',
                      opacity: (batchFiles.length === 0 || uploading) ? 0.6 : 1, transition: 'all 0.3s',
                    }}
                  >
                    {uploading ? (
                      <><Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Uploading {batchFiles.length} files...</>
                    ) : (
                      <><UploadCloud size={15} /> Upload {batchFiles.length} File{batchFiles.length !== 1 ? 's' : ''}</>
                    )}
                  </motion.button>
                  <button
                    onClick={() => { setBatchFiles([]); }}
                    style={{
                      padding: '14px 24px', borderRadius: '12px', border: 'none',
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.08)',
                      color: '#94a3b8', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)')}
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info note */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{
            marginTop: '20px', padding: '16px 18px', borderRadius: '12px',
            backgroundColor: 'rgba(34,211,238,0.04)',
            borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(34,211,238,0.1)',
            display: 'flex', gap: '12px', alignItems: 'flex-start',
          }}
        >
          <CheckCircle size={16} color="#22d3ee" style={{ flexShrink: 0, marginTop: '1px' }} />
          <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.7' }}>
            <span style={{ color: '#22d3ee', fontWeight: '700' }}>AI Processing.</span>{' '}
            After upload, our AI engine will automatically chunk your documents, generate vector embeddings, and index them for instant retrieval. You can track progress in real-time.
          </div>
        </motion.div>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
