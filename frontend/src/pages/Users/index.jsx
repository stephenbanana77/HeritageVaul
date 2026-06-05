import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select,
  message, Popconfirm, Card, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';
import { getUsers, createUser, updateUser, deleteUser, resetPassword } from '../../api';
import { getUser } from '../../utils/auth';

const roleOpts  = ['admin','staff','visitor'].map(v => ({ label: v, value: v }));
const roleColor = { admin: 'red', staff: 'blue', visitor: 'default' };
const roleLabel = { admin: '管理员', staff: '工作人员', visitor: '访客' };

export default function Users() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen]   = useState(false);
  const [pwdModalOpen, setPwdOpen]  = useState(false);
  const [editing, setEditing] = useState(null);
  const [pwdTarget, setPwdTarget] = useState(null);
  const currentUser = getUser();
  const [form] = Form.useForm();
  const [pwdForm] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { const res = await getUsers(); setData(res); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd  = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (r) => { setEditing(r); form.setFieldsValue(r); setModalOpen(true); };
  const openPwd  = (r) => { setPwdTarget(r); pwdForm.resetFields(); setPwdOpen(true); };

  const handleDelete = async (id) => {
    try { await deleteUser(id); message.success('删除成功'); fetchData(); }
    catch (e) { message.error(e.message); }
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      if (editing) { await updateUser(editing.user_id, values); message.success('更新成功'); }
      else         { await createUser(values);                   message.success('创建成功'); }
      setModalOpen(false); fetchData();
    } catch (e) { message.error(e.message); }
  };

  const handleResetPwd = async () => {
    const { new_password } = await pwdForm.validateFields();
    try { await resetPassword(pwdTarget.user_id, new_password); message.success('密码重置成功'); setPwdOpen(false); }
    catch (e) { message.error(e.message); }
  };

  const columns = [
    { title: '编号', dataIndex: 'user_id', width: 70 },
    { title: '用户名', dataIndex: 'username', width: 120 },
    { title: '真实姓名', dataIndex: 'real_name', width: 100 },
    { title: '角色', dataIndex: 'role', width: 100, render: v => <Tag color={roleColor[v]}>{roleLabel[v]}</Tag> },
    { title: '邮箱', dataIndex: 'email', ellipsis: true },
    { title: '电话', dataIndex: 'phone', width: 130 },
    { title: '创建时间', dataIndex: 'created_at', width: 160, render: v => v?.slice(0, 16) },
    { title: '最后登录', dataIndex: 'last_login', width: 160, render: v => v?.slice(0, 16) || '从未登录' },
    { title: '操作', width: 200, render: (_, r) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} type="primary" onClick={() => openEdit(r)}>编辑</Button>
        <Button size="small" icon={<KeyOutlined />} onClick={() => openPwd(r)}>重置密码</Button>
        <Popconfirm title="确认删除该用户？" onConfirm={() => handleDelete(r.user_id)}
          okText="删除" okType="danger" cancelText="取消"
          disabled={r.user_id === currentUser?.user_id}>
          <Button size="small" icon={<DeleteOutlined />} danger disabled={r.user_id === currentUser?.user_id}>删除</Button>
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <div>
      <Card title={`系统用户管理（共 ${data.length} 个用户）`} extra={<Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>新增用户</Button>}>
        <Table dataSource={data} columns={columns} rowKey="user_id" loading={loading} pagination={false} scroll={{ x: 1100 }} />
      </Card>

      <Modal title={editing ? '编辑用户' : '新增用户'} open={modalOpen}
        onOk={handleSubmit} onCancel={() => setModalOpen(false)} okText="保存" cancelText="取消" width={520}>
        <Form form={form} layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
            <Input disabled={!!editing} />
          </Form.Item>
          {!editing && (
            <Form.Item name="password" label="密码" rules={[{ required: true }, { min: 6, message: '至少6位' }]}>
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item name="real_name" label="真实姓名"><Input /></Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}><Select options={roleOpts} /></Form.Item>
          <Form.Item name="email" label="邮箱"><Input /></Form.Item>
          <Form.Item name="phone" label="电话"><Input /></Form.Item>
        </Form>
      </Modal>

      <Modal title={`重置密码 —— ${pwdTarget?.username}`} open={pwdModalOpen}
        onOk={handleResetPwd} onCancel={() => setPwdOpen(false)} okText="确认重置" cancelText="取消">
        <Form form={pwdForm} layout="vertical">
          <Form.Item name="new_password" label="新密码" rules={[{ required: true }, { min: 6, message: '至少6位' }]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
