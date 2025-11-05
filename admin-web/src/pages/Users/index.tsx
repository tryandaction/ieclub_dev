// 用户管理页面
import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Avatar,
  Descriptions,
  Card,
  Row,
  Col,
  Statistic,
  Badge,
} from 'antd';
import {
  UserOutlined,
  SearchOutlined,
  WarningOutlined,
  LockOutlined,
  UnlockOutlined,
  DeleteOutlined,
  EyeOutlined,
  TeamOutlined,
  UserAddOutlined,
  StopOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUsers, banUser, unbanUser, warnUser, deleteUser } from '@/store/slices/userSlice';
import type { User } from '@/types/user';
import { formatDateTime, formatRelativeTime } from '@/utils/format';
import { hasPermission } from '@/utils/auth';
import './index.less';

const Users: React.FC = () => {
  const [warnForm] = Form.useForm();
  const [banForm] = Form.useForm();
  const dispatch = useAppDispatch();
  const { admin } = useAppSelector((state) => state.auth);
  const { users, loading, total } = useAppSelector((state) => state.user);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [warnModalVisible, setWarnModalVisible] = useState(false);
  const [banModalVisible, setBanModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 10,
    keyword: '',
    role: undefined as string | undefined,
    status: undefined as string | undefined,
  });

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = () => {
    dispatch(fetchUsers(filters));
  };

  const handleSearch = (keyword: string) => {
    setFilters({ ...filters, keyword, page: 1 });
  };

  const handleViewDetail = (user: User) => {
    setSelectedUser(user);
    setDetailModalVisible(true);
  };

  const handleWarn = (user: User) => {
    setSelectedUser(user);
    warnForm.resetFields();
    setWarnModalVisible(true);
  };

  const handleBan = (user: User) => {
    setSelectedUser(user);
    banForm.resetFields();
    setBanModalVisible(true);
  };

  const handleUnban = async (userId: number) => {
    try {
      await dispatch(unbanUser(userId)).unwrap();
      message.success('解封成功');
      loadUsers();
    } catch (error: any) {
      message.error(error.message || '解封失败');
    }
  };

  const handleDelete = async (userId: number) => {
    Modal.confirm({
      title: '确认删除用户',
      content: '此操作将永久删除该用户及其所有数据，无法恢复。确定要继续吗？',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await dispatch(deleteUser(userId)).unwrap();
          message.success('删除成功');
          loadUsers();
        } catch (error: any) {
          message.error(error.message || '删除失败');
        }
      },
    });
  };

  const submitWarn = async () => {
    try {
      const values = await warnForm.validateFields();
      if (!selectedUser) return;

      await dispatch(warnUser({ id: selectedUser.id, data: values })).unwrap();
      message.success('警告成功');
      setWarnModalVisible(false);
      loadUsers();
    } catch (error: any) {
      message.error(error.message || '警告失败');
    }
  };

  const submitBan = async () => {
    try {
      const values = await banForm.validateFields();
      if (!selectedUser) return;

      await dispatch(banUser({ id: selectedUser.id, data: values })).unwrap();
      message.success('封禁成功');
      setBanModalVisible(false);
      loadUsers();
    } catch (error: any) {
      message.error(error.message || '封禁失败');
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '用户信息',
      key: 'userInfo',
      width: 250,
      render: (_, record) => (
        <Space>
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 600 }}>{record.realName || record.username}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: string) => {
        const roleMap: Record<string, { color: string; text: string }> = {
          student: { color: 'blue', text: '学生' },
          teacher: { color: 'green', text: '教师' },
        };
        const config = roleMap[role] || { color: 'default', text: role };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '学校',
      dataIndex: 'schoolName',
      key: 'schoolName',
      width: 150,
      ellipsis: true,
    },
    {
      title: '状态',
      key: 'status',
      width: 120,
      render: (_, record) => {
        if (record.isBanned) {
          return <Badge status="error" text="已封禁" />;
        }
        if (record.warningCount > 0) {
          return <Badge status="warning" text={`警告(${record.warningCount})`} />;
        }
        return <Badge status="success" text="正常" />;
      },
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 180,
      render: (date: string) => (date ? formatRelativeTime(date) : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>

          {hasPermission(admin, 'user:warn') && !record.isBanned && (
            <Button
              type="link"
              size="small"
              icon={<WarningOutlined />}
              onClick={() => handleWarn(record)}
            >
              警告
            </Button>
          )}

          {hasPermission(admin, 'user:ban') && (
            <>
              {record.isBanned ? (
                <Button
                  type="link"
                  size="small"
                  icon={<UnlockOutlined />}
                  onClick={() => handleUnban(record.id)}
                >
                  解封
                </Button>
              ) : (
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<LockOutlined />}
                  onClick={() => handleBan(record)}
                >
                  封禁
                </Button>
              )}
            </>
          )}

          {hasPermission(admin, 'user:delete') && (
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            >
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // 统计数据
  const stats = {
    total: total,
    active: users.filter((u) => !u.isBanned).length,
    banned: users.filter((u) => u.isBanned).length,
    warned: users.filter((u) => u.warningCount > 0).length,
  };

  return (
    <div className="users-page">
      <h1 className="page-title">用户管理</h1>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={stats.total}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="正常用户"
              value={stats.active}
              prefix={<UserAddOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已封禁"
              value={stats.banned}
              prefix={<StopOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已警告"
              value={stats.warned}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选 */}
      <div className="page-header">
        <Space>
          <Input.Search
            placeholder="搜索用户名、邮箱"
            allowClear
            style={{ width: 250 }}
            onSearch={handleSearch}
            enterButton={<SearchOutlined />}
          />

          <Select
            placeholder="角色"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, role: value, page: 1 })}
          >
            <Select.Option value="student">学生</Select.Option>
            <Select.Option value="teacher">教师</Select.Option>
          </Select>

          <Select
            placeholder="状态"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, status: value, page: 1 })}
          >
            <Select.Option value="normal">正常</Select.Option>
            <Select.Option value="warned">已警告</Select.Option>
            <Select.Option value="banned">已封禁</Select.Option>
          </Select>
        </Space>
      </div>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{
          current: filters.page,
          pageSize: filters.pageSize,
          total,
          onChange: (page, pageSize) => setFilters({ ...filters, page, pageSize }),
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        scroll={{ x: 1400 }}
      />

      {/* 用户详情模态框 */}
      <Modal
        title="用户详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {selectedUser && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="用户名">{selectedUser.username}</Descriptions.Item>
            <Descriptions.Item label="真实姓名">{selectedUser.realName || '-'}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{selectedUser.email}</Descriptions.Item>
            <Descriptions.Item label="角色">
              <Tag color={selectedUser.role === 'student' ? 'blue' : 'green'}>
                {selectedUser.role === 'student' ? '学生' : '教师'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="学校">{selectedUser.schoolName || '-'}</Descriptions.Item>
            <Descriptions.Item label="学号/工号">{selectedUser.studentId || '-'}</Descriptions.Item>
            <Descriptions.Item label="联系方式">{selectedUser.phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="警告次数">
              <Badge count={selectedUser.warningCount} showZero />
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              {selectedUser.isBanned ? (
                <Badge status="error" text="已封禁" />
              ) : (
                <Badge status="success" text="正常" />
              )}
            </Descriptions.Item>
            <Descriptions.Item label="注册时间">
              {formatDateTime(selectedUser.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="最后登录">
              {selectedUser.lastLoginAt ? formatRelativeTime(selectedUser.lastLoginAt) : '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* 警告模态框 */}
      <Modal
        title="警告用户"
        open={warnModalVisible}
        onOk={submitWarn}
        onCancel={() => setWarnModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={warnForm} layout="vertical">
          <Form.Item
            name="level"
            label="警告等级"
            rules={[{ required: true, message: '请选择警告等级' }]}
          >
            <Select placeholder="请选择警告等级">
              <Select.Option value={1}>轻度警告</Select.Option>
              <Select.Option value={2}>中度警告</Select.Option>
              <Select.Option value={3}>严重警告</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="reason"
            label="警告原因"
            rules={[{ required: true, message: '请输入警告原因' }]}
          >
            <Input.TextArea rows={4} placeholder="请详细说明警告原因" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 封禁模态框 */}
      <Modal
        title="封禁用户"
        open={banModalVisible}
        onOk={submitBan}
        onCancel={() => setBanModalVisible(false)}
        okText="确定"
        okType="danger"
        cancelText="取消"
      >
        <Form form={banForm} layout="vertical">
          <Form.Item
            name="duration"
            label="封禁时长"
            rules={[{ required: true, message: '请选择封禁时长' }]}
          >
            <Select placeholder="请选择封禁时长">
              <Select.Option value={1}>1天</Select.Option>
              <Select.Option value={3}>3天</Select.Option>
              <Select.Option value={7}>7天</Select.Option>
              <Select.Option value={30}>30天</Select.Option>
              <Select.Option value={-1}>永久</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="reason"
            label="封禁原因"
            rules={[{ required: true, message: '请输入封禁原因' }]}
          >
            <Input.TextArea rows={4} placeholder="请详细说明封禁原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Users;

