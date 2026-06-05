import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Tabs } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, IdcardOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../../api';
import { setAuth } from '../../utils/auth';

const { Title, Text } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('login');
  const navigate = useNavigate();

  const onLogin = async (values) => {
    setLoading(true);
    try {
      const { token, user } = await login(values);
      setAuth(token, user);
      message.success(`欢迎回来，${user.real_name || user.username}！`);
      navigate('/dashboard');
    } catch (e) {
      message.error(e.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values) => {
    setLoading(true);
    try {
      await register({
        username: values.username,
        password: values.password,
        real_name: values.real_name || '',
        email: values.email || '',
        phone: values.phone || '',
      });
      message.success('注册成功，请登录');
      setTab('login');
    } catch (e) {
      message.error(e.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #2c1810 0%, #8B6914 50%, #2c1810 100%)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 64, marginBottom: 8 }}>🏛️</div>
          <Title level={2} style={{ color: '#fff', margin: 0 }}>非遗博物馆藏品管理系统</Title>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Cultural Heritage Collection Management System</Text>
        </div>
        <Card style={{ width: 420, borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <Tabs
            activeKey={tab}
            onChange={setTab}
            centered
            items={[
              { key: 'login', label: '用户登录' },
              { key: 'register', label: '注册账号' },
            ]}
          />

          {tab === 'login' && (
            <Form onFinish={onLogin} autoComplete="off" size="large">
              <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                <Input prefix={<UserOutlined />} placeholder="用户名" />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="密码" />
              </Form.Item>
              <Form.Item style={{ marginBottom: 8 }}>
                <Button type="primary" htmlType="submit" loading={loading} block
                  style={{ height: 44, fontSize: 16, background: '#8B6914', borderColor: '#8B6914' }}>
                  登 录
                </Button>
              </Form.Item>
              <div style={{ textAlign: 'center', color: '#999', fontSize: 12, marginTop: 8 }}>
                默认管理员：admin / admin123
              </div>
            </Form>
          )}

          {tab === 'register' && (
            <Form onFinish={onRegister} autoComplete="off" size="large">
              <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }, { min: 3, message: '用户名至少3位' }]}>
                <Input prefix={<UserOutlined />} placeholder="用户名（必填）" />
              </Form.Item>
              <Form.Item name="real_name">
                <Input prefix={<IdcardOutlined />} placeholder="真实姓名（选填）" />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="密码（至少6位）" />
              </Form.Item>
              <Form.Item name="confirm" dependencies={['password']}
                rules={[{ required: true, message: '请确认密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) return Promise.resolve();
                      return Promise.reject(new Error('两次密码不一致'));
                    },
                  }),
                ]}>
                <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
              </Form.Item>
              <Form.Item name="email" rules={[{ type: 'email', message: '邮箱格式不正确' }]}>
                <Input prefix={<MailOutlined />} placeholder="邮箱（选填）" />
              </Form.Item>
              <Form.Item name="phone">
                <Input prefix={<PhoneOutlined />} placeholder="手机号（选填）" />
              </Form.Item>
              <Form.Item style={{ marginBottom: 8 }}>
                <Button type="primary" htmlType="submit" loading={loading} block
                  style={{ height: 44, fontSize: 16, background: '#8B6914', borderColor: '#8B6914' }}>
                  注 册
                </Button>
              </Form.Item>
            </Form>
          )}
        </Card>
      </div>
    </div>
  );
}
