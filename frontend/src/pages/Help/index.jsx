import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Popconfirm, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getAllHelp, saveHelp, deleteHelp } from '../../api';

export default function HelpAdmin() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { const res = await getAllHelp(); setData(res); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (r) => { setEditing(r); form.setFieldsValue(r); setModalOpen(true); };

  const handleDelete = async (module_name) => {
    try { await deleteHelp(module_name); message.success('删除成功'); fetchData(); }
    catch (e) { message.error(e.message); }
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    try { await saveHelp(values); message.success('保存成功'); setModalOpen(false); fetchData(); }
    catch (e) { message.error(e.message); }
  };

  const columns = [
    { title: '模块名（页面路径）', dataIndex: 'module_name', width: 160 },
    { title: '帮助标题', dataIndex: 'title', width: 200 },
    { title: '帮助内容预览', dataIndex: 'content', ellipsis: true },
    { title: '更新时间', dataIndex: 'updated_at', width: 160, render: v => v?.slice(0, 16) },
    { title: '操作', width: 140, render: (_, r) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} type="primary" onClick={() => openEdit(r)}>编辑</Button>
        <Popconfirm title="确认删除该帮助文档？" onConfirm={() => handleDelete(r.module_name)} okText="删除" okType="danger" cancelText="取消">
          <Button size="small" icon={<DeleteOutlined />} danger>删除</Button>
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <div>
      <Card title="在线帮助文档管理"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>新增帮助文档</Button>}
        style={{ marginBottom: 16 }}>
        <div style={{ color: '#666', fontSize: 13, marginBottom: 12 }}>
          帮助文档按模块名与页面路径对应，用户点击各页面右上角"帮助"按钮时自动加载对应文档。
          模块名示例：dashboard、artifacts、loans 等。
        </div>
        <Table dataSource={data} columns={columns} rowKey="module_name" loading={loading} pagination={false} />
      </Card>

      <Modal title={editing ? '编辑帮助文档' : '新增帮助文档'} open={modalOpen}
        onOk={handleSubmit} onCancel={() => setModalOpen(false)} okText="保存" cancelText="取消" width={680}>
        <Form form={form} layout="vertical">
          <Form.Item name="module_name" label="模块名（对应页面路径，如 artifacts）" rules={[{ required: true }]}>
            <Input disabled={!!editing} placeholder="如 artifacts / loans / dashboard" />
          </Form.Item>
          <Form.Item name="title" label="帮助标题" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="content" label="帮助内容（支持换行）" rules={[{ required: true }]}>
            <Input.TextArea rows={10} placeholder="详细说明此页面的功能和操作方式..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
