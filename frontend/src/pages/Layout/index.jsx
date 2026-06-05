import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Modal, Descriptions, message, Tag } from 'antd';
import {
  DashboardOutlined, PictureOutlined, TeamOutlined, BankOutlined,
  CalendarOutlined, SwapOutlined, BarChartOutlined, TagsOutlined,
  QuestionCircleOutlined, UserOutlined, LogoutOutlined, AuditOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { getUser, clearAuth, isAdmin } from '../../utils/auth';
import { getHelp } from '../../api';

const { Header, Sider, Content } = Layout;

const navItems = [
  { key: 'dashboard',   icon: <DashboardOutlined />,  label: '仪表盘' },
  { key: 'artifacts',   icon: <PictureOutlined />,    label: '藏品管理' },
  { key: 'donors',      icon: <TeamOutlined />,       label: '捐赠人管理' },
  { key: 'halls',       icon: <BankOutlined />,       label: '展馆管理' },
  { key: 'exhibitions', icon: <CalendarOutlined />,   label: '展览管理' },
  { key: 'loans',       icon: <SwapOutlined />,       label: '借展管理' },
  { key: 'reports',     icon: <BarChartOutlined />,   label: '统计报表' },
  { key: 'categories',  icon: <TagsOutlined />,       label: '分类管理' },
  { key: 'help-admin',  icon: <QuestionCircleOutlined />, label: '帮助管理', adminOnly: true },
  { key: 'users',       icon: <UserOutlined />,       label: '用户管理', adminOnly: true },
  { key: 'auditlog',    icon: <AuditOutlined />,      label: '操作日志', adminOnly: true },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  const [helpVisible, setHelpVisible] = useState(false);
  const [helpContent, setHelpContent] = useState({});

  const currentModule = location.pathname.replace('/', '') || 'dashboard';

  const handleHelp = async () => {
    try {
      const data = await getHelp(currentModule);
      setHelpContent(data);
      setHelpVisible(true);
    } catch {
      message.warning('暂无此页面的帮助文档');
    }
  };

  const handleLogout = () => {
    clearAuth();
    message.success('已退出登录');
    navigate('/login');
  };

  const userMenu = {
    items: [
      { key: 'info', icon: <UserOutlined />, label: `${user?.real_name || user?.username}（${user?.role}）`, disabled: true },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
    ],
    onClick: ({ key }) => key === 'logout' && handleLogout(),
  };

  const menuItems = navItems
    .filter(i => !i.adminOnly || isAdmin())
    .map(({ key, icon, label }) => ({ key, icon, label }));

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="dark"
        style={{ background: 'linear-gradient(180deg, #2c1810 0%, #3d2314 100%)' }}>
        <div style={{ padding: '20px 16px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 32 }}>🏛️</div>
          <div style={{ color: '#d4a843', fontWeight: 'bold', fontSize: 13, marginTop: 4 }}>非遗博物馆</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>藏品管理系统</div>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[currentModule]}
          items={menuItems}
          onClick={({ key }) => navigate(`/${key}`)}
          style={{ background: 'transparent', border: 'none' }}
        />
      </Sider>
      <Layout>
        <Header style={{
          background: '#fff', padding: '0 24px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#8B6914' }}>
            {navItems.find(i => i.key === currentModule)?.label || '首页'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button icon={<QuestionCircleOutlined />} onClick={handleHelp}>帮助</Button>
            <Dropdown menu={userMenu} placement="bottomRight">
              <Avatar style={{ background: '#8B6914', cursor: 'pointer' }} icon={<UserOutlined />} />
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: 24, minHeight: 'calc(100vh - 112px)' }}>
          <Outlet />
        </Content>
      </Layout>

      <Modal title={helpContent.title} open={helpVisible} onCancel={() => setHelpVisible(false)}
        footer={<Button onClick={() => setHelpVisible(false)}>关闭</Button>} width={600}>
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: '#333', padding: '8px 0' }}>
          {helpContent.content}
        </div>
      </Modal>
    </Layout>
  );
}
