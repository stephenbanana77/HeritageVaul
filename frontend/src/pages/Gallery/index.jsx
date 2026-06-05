import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Input, Select, Card, Tag, Modal, Button, Spin, Empty, Pagination, Image, Descriptions } from 'antd';
import { SearchOutlined, CloseOutlined } from '@ant-design/icons';
import { getPublicArtifacts, getPublicCategories } from '../../api';

const conditionColors = { '完好': 'green', '良好': 'cyan', '一般': 'orange', '破损': 'red', '修复中': 'purple' };

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23f5ebe0' width='400' height='300'/%3E%3Ctext fill='%23c9a96e' font-size='48' font-family='serif' text-anchor='middle' x='200' y='165'%3E🏺%3C/text%3E%3C/svg%3E";

export default function Gallery() {
  const [data, setData]           = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(false);
  const [categories, setCategories] = useState([]);
  const [keyword, setKeyword]     = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [page, setPage]           = useState(1);
  const [selected, setSelected]   = useState(null);
  const pageSize = 12;

  const [chatOpen, setChatOpen]         = useState(false);
  const [chatInput, setChatInput]       = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: '您好！我是非遗博物馆 AI 导览助手"小馆" 🎭\n请问您想了解什么？例如：\n• 哪些是明代的藏品？\n• 馆内有哪些陶瓷器？\n• 这件藏品有什么文化故事？' },
  ]);
  const [chatLoading, setChatLoading]   = useState(false);
  const chatBottomRef = useRef(null);
  const chatInputRef  = useRef(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, pageSize, keyword: keyword || undefined, category_id: categoryId || undefined };
      const res = await getPublicArtifacts(params);
      setData(res.data);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, categoryId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    getPublicCategories().then(setCategories);
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (chatOpen) setTimeout(() => chatInputRef.current?.focus(), 80);
  }, [chatOpen]);

  const handleChatSend = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput('');
    const history = chatMessages.filter(m => m.content);
    setChatMessages(prev => [...prev, { role: 'user', content: text }, { role: 'assistant', content: '' }]);
    setChatLoading(true);
    try {
      const resp = await fetch('/api/public/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: history.slice(-8) }),
      });
      if (!resp.ok) throw new Error('请求失败');
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') break;
          try {
            const { text: delta, error } = JSON.parse(payload);
            if (error) throw new Error(error);
            if (delta) setChatMessages(prev => {
              const msgs = [...prev];
              msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: msgs[msgs.length - 1].content + delta };
              return msgs;
            });
          } catch { /* skip malformed chunk */ }
        }
      }
    } catch {
      setChatMessages(prev => {
        const msgs = [...prev];
        msgs[msgs.length - 1] = { role: 'assistant', content: '抱歉，服务暂时不可用，请稍后再试。' };
        return msgs;
      });
    } finally {
      setChatLoading(false);
    }
  };

  const handleSearch = (val) => {
    setKeyword(val);
    setPage(1);
  };

  const handleCategory = (val) => {
    setCategoryId(val ?? null);
    setPage(1);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#faf7f2' }}>

      {/* 顶部 Banner */}
      <header style={{
        background: 'linear-gradient(135deg, #2c1810 0%, #5c3318 60%, #8B6914 100%)',
        padding: '48px 24px 40px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.06,
          backgroundImage: 'repeating-linear-gradient(45deg, #d4a843 0, #d4a843 1px, transparent 0, transparent 50%)',
          backgroundSize: '20px 20px' }} />
        <div style={{ fontSize: 48, marginBottom: 8 }}>🏛️</div>
        <h1 style={{ color: '#d4a843', fontSize: 32, fontWeight: 'bold', margin: 0, letterSpacing: 4 }}>
          非遗博物馆
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: 10, fontSize: 15, letterSpacing: 2 }}>
          传承千年技艺 · 守护文化根脉
        </p>

        {/* 搜索栏 */}
        <div style={{ marginTop: 28, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Input.Search
            placeholder="搜索藏品名称、描述或故事..."
            allowClear
            size="large"
            style={{ width: 360, borderRadius: 8 }}
            onSearch={handleSearch}
            enterButton={<SearchOutlined />}
          />
          <Select
            placeholder="按分类筛选"
            allowClear
            size="large"
            style={{ width: 160 }}
            options={categories.map(c => ({ label: c.name, value: c.category_id }))}
            onChange={handleCategory}
          />
        </div>
      </header>

      {/* 统计栏 */}
      <div style={{ background: '#fff', borderBottom: '1px solid #ede3d0', padding: '12px 24px',
        display: 'flex', justifyContent: 'center', gap: 32 }}>
        <span style={{ color: '#8B6914', fontWeight: 600 }}>共 {total} 件展出藏品</span>
        {keyword && <Tag closable color="gold" onClose={() => { setKeyword(''); setPage(1); }}>搜索：{keyword}</Tag>}
        {categoryId && (
          <Tag closable color="orange"
            onClose={() => { setCategoryId(null); setPage(1); }}>
            {categories.find(c => c.category_id === categoryId)?.name}
          </Tag>
        )}
      </div>

      {/* 藏品网格 */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}><Spin size="large" /></div>
        ) : data.length === 0 ? (
          <Empty description="暂无展出藏品" style={{ padding: '80px 0' }} />
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 24,
            }}>
              {data.map(item => (
                <ArtifactCard key={item.artifact_id} item={item} onClick={() => setSelected(item)} />
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                showTotal={t => `共 ${t} 件`}
              />
            </div>
          </>
        )}
      </main>

      {/* 底部 */}
      <footer style={{ textAlign: 'center', padding: '24px', color: '#aaa', fontSize: 12,
        borderTop: '1px solid #ede3d0', background: '#fff' }}>
        非遗博物馆藏品管理系统 · 传承文化遗产
      </footer>

      {/* 藏品详情弹窗 */}
      <ArtifactDetailModal artifact={selected} onClose={() => setSelected(null)} />

      {/* AI 导览助手浮动入口 */}
      <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1000 }}>
        {!chatOpen ? (
          <button
            onClick={() => setChatOpen(true)}
            title="AI 导览助手"
            style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'linear-gradient(135deg, #8B6914, #c0892c)',
              border: 'none', cursor: 'pointer', fontSize: 24,
              boxShadow: '0 4px 20px rgba(139,105,20,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >💬</button>
        ) : (
          <div style={{
            width: 360, height: 520,
            background: '#fff', borderRadius: 16,
            boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            {/* 标题栏 */}
            <div style={{
              background: 'linear-gradient(135deg, #2c1810, #8B6914)',
              padding: '13px 16px', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: 1 }}>🤖 AI 导览助手·小馆</span>
              <button
                onClick={() => setChatOpen(false)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 20, lineHeight: 1, opacity: 0.8, padding: 0 }}
              >×</button>
            </div>

            {/* 消息列表 */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px' }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ marginBottom: 12, display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 6 }}>
                  {msg.role === 'assistant' && (
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#f0e6c8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>🤖</div>
                  )}
                  <div style={{
                    maxWidth: '78%',
                    padding: '9px 13px',
                    borderRadius: msg.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    background: msg.role === 'user' ? '#8B6914' : '#f5f1ea',
                    color: msg.role === 'user' ? '#fff' : '#2c1810',
                    fontSize: 13, lineHeight: 1.75,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}>
                    {msg.content || (chatLoading && i === chatMessages.length - 1
                      ? <span style={{ opacity: 0.5 }}>▋</span>
                      : null)}
                  </div>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            {/* 输入区 */}
            <div style={{ padding: '10px 12px', borderTop: '1px solid #f0e6c8', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              <input
                ref={chatInputRef}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
                placeholder="问我关于藏品的任何问题…"
                disabled={chatLoading}
                style={{
                  flex: 1, border: '1px solid #e0d4b8', borderRadius: 20,
                  padding: '7px 14px', fontSize: 13, outline: 'none',
                  background: chatLoading ? '#fafafa' : '#fff',
                  color: '#2c1810',
                }}
              />
              <button
                onClick={handleChatSend}
                disabled={chatLoading || !chatInput.trim()}
                style={{
                  width: 34, height: 34, borderRadius: '50%', border: 'none',
                  background: chatLoading || !chatInput.trim() ? '#d4c9b0' : '#8B6914',
                  color: '#fff', fontSize: 15, cursor: chatLoading || !chatInput.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s', flexShrink: 0,
                }}
              >➤</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ArtifactCard({ item, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        border: '1px solid #f0e8d8',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(139,105,20,0.15)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
    >
      {/* 图片区 */}
      <div style={{ height: 200, overflow: 'hidden', background: '#f5ebe0', position: 'relative' }}>
        <img
          src={item.image_url ? `/uploads/${item.image_url.split('/uploads/')[1]}` : PLACEHOLDER}
          alt={item.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.target.src = PLACEHOLDER; }}
        />
        {item.era && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: 'rgba(44,24,16,0.75)', color: '#d4a843',
            padding: '2px 10px', borderRadius: 12, fontSize: 12, backdropFilter: 'blur(4px)',
          }}>{item.era}</div>
        )}
      </div>

      {/* 信息区 */}
      <div style={{ padding: '16px 16px 14px' }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#2c1810', marginBottom: 6,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.name}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {item.category_name && <Tag color="gold" style={{ margin: 0 }}>{item.category_name}</Tag>}
          {item.condition_status && <Tag color={conditionColors[item.condition_status]} style={{ margin: 0 }}>{item.condition_status}</Tag>}
        </div>
        <div style={{ color: '#888', fontSize: 13, lineHeight: 1.5,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {item.description || '暂无简介'}
        </div>
        {item.story && (
          <div style={{ marginTop: 8, color: '#c9a96e', fontSize: 12 }}>📜 含文化故事</div>
        )}
      </div>
    </div>
  );
}

function ArtifactDetailModal({ artifact, onClose }) {
  if (!artifact) return null;
  return (
    <Modal
      open={!!artifact}
      onCancel={onClose}
      footer={null}
      width={760}
      closeIcon={<CloseOutlined />}
      styles={{ body: { padding: 0, maxHeight: '80vh', overflowY: 'auto' } }}
    >
      {/* 顶部图片 */}
      {artifact.image_url && (
        <div style={{ width: '100%', maxHeight: 300, overflow: 'hidden', background: '#f5ebe0' }}>
          <img
            src={`/uploads/${artifact.image_url.split('/uploads/')[1]}`}
            alt={artifact.name}
            style={{ width: '100%', maxHeight: 300, objectFit: 'contain' }}
          />
        </div>
      )}

      <div style={{ padding: '24px 28px 28px' }}>
        {/* 标题 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <h2 style={{ margin: 0, color: '#2c1810', fontSize: 22, fontWeight: 700, flex: 1 }}>{artifact.name}</h2>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, paddingTop: 4 }}>
            {artifact.category_name && <Tag color="gold">{artifact.category_name}</Tag>}
            {artifact.era && <Tag color="orange">{artifact.era}</Tag>}
          </div>
        </div>

        {/* 基本属性 */}
        <Descriptions bordered column={2} size="small" style={{ marginBottom: 20 }}>
          {artifact.origin        && <Descriptions.Item label="产地">{artifact.origin}</Descriptions.Item>}
          {artifact.material      && <Descriptions.Item label="材质">{artifact.material}</Descriptions.Item>}
          {artifact.dimensions    && <Descriptions.Item label="尺寸">{artifact.dimensions}</Descriptions.Item>}
          {artifact.donor_name    && <Descriptions.Item label="捐赠人">{artifact.donor_name}</Descriptions.Item>}
          {artifact.acquisition_date && <Descriptions.Item label="入藏日期">{artifact.acquisition_date?.slice(0, 10)}</Descriptions.Item>}
          {artifact.condition_status && (
            <Descriptions.Item label="保存状态">
              <Tag color={conditionColors[artifact.condition_status]}>{artifact.condition_status}</Tag>
            </Descriptions.Item>
          )}
        </Descriptions>

        {/* 简介 */}
        {artifact.description && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, color: '#5c3318', marginBottom: 6 }}>藏品简介</div>
            <div style={{ color: '#555', lineHeight: 1.8, background: '#faf7f2', padding: '10px 14px', borderRadius: 6 }}>
              {artifact.description}
            </div>
          </div>
        )}

        {/* 文化故事 富文本 */}
        {artifact.story && (
          <div>
            <div style={{
              fontWeight: 700, fontSize: 15, color: '#8B6914',
              borderBottom: '2px solid #f0e6c8', paddingBottom: 8, marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              📜 文化故事
            </div>
            <div
              style={{ lineHeight: 1.9, color: '#333', fontSize: 14 }}
              dangerouslySetInnerHTML={{ __html: artifact.story }}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
