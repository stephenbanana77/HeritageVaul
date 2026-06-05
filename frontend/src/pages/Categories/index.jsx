import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, InputNumber,
  message, Popconfirm, Card, Tag, Badge } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getCategories, getCategoriesFlat, createCategory, updateCategory, deleteCategory } from '../../api';

export default function Categories() {
  const [treeData, setTreeData]   = useState([]);
  const [flatData, setFlatData]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tree, flat] = await Promise.all([getCategories(), getCategoriesFlat()]);
      setTreeData(tree);
      setFlatData(flat.filter(c => !c.parent_id).map(c => ({ label: c.name, value: c.category_id })));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = (parentId) => {
    setEditing(null);
    form.resetFields();
    if (parentId) form.setFieldsValue({ parent_id: parentId });
    setModalOpen(true);
  };
  const openEdit = (r) => {
    setEditing(r);
    form.setFieldsValue({ name: r.name, parent_id: r.parent_id, description: r.description, sort_order: r.sort_order });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try { await deleteCategory(id); message.success('删除成功'); fetchData(); }
    catch (e) { message.error(e.message); }
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      if (editing) { await updateCategory(editing.category_id, values); message.success('更新成功'); }
      else         { await createCategory(values);                       message.success('创建成功'); }
      setModalOpen(false); fetchData();
    } catch (e) { message.error(e.message); }
  };

  const columns = [
    { title: '分类名称', dataIndex: 'name', render: (v, r) => (
      <span style={{ fontWeight: r.parent_id ? 'normal' : 'bold', color: r.parent_id ? '#333' : '#8B6914' }}>{v}</span>
    )},
    { title: '藏品数量', dataIndex: 'artifact_count', width: 100, render: v => <Badge count={v} color="#8B6914" showZero /> },
    { title: '排序', dataIndex: 'sort_order', width: 80 },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    { title: '操作', width: 220, render: (_, r) => (
      <Space>
        {!r.parent_id && <Button size="small" icon={<PlusOutlined />} onClick={() => openAdd(r.category_id)}>添加子分类</Button>}
        <Button size="small" icon={<EditOutlined />} type="primary" onClick={() => openEdit(r)}>编辑</Button>
        <Popconfirm title="确认删除？" onConfirm={() => handleDelete(r.category_id)} okText="删除" okType="danger" cancelText="取消">
          <Button size="small" icon={<DeleteOutlined />} danger>删除</Button>
        </Popconfirm>
      </Space>
    )},
  ];

  const tableData = [];
  treeData.forEach(parent => {
    tableData.push({ ...parent, key: parent.category_id });
    parent.children?.forEach(child => tableData.push({ ...child, key: child.category_id }));
  });

  return (
    <div>
      <Card title="藏品分类管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openAdd(null)}>新增顶级分类</Button>}>
        <Table dataSource={tableData} columns={columns} rowKey="category_id" loading={loading} pagination={false}
          expandable={{ defaultExpandAllRows: true, expandedRowKeys: treeData.map(r => r.category_id) }} />
      </Card>
      <Modal title={editing ? '编辑分类' : '新增分类'} open={modalOpen}
        onOk={handleSubmit} onCancel={() => setModalOpen(false)} okText="保存" cancelText="取消">
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="分类名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="parent_id" label="父分类（不选则为顶级）">
            <Select options={flatData} allowClear placeholder="不选则为顶级分类" />
          </Form.Item>
          <Form.Item name="sort_order" label="排序（数字越小越靠前）"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
