// 系统设置页面
import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Switch,
  Select,
  InputNumber,
  message,
  Tabs,
  Space,
  Divider,
  Upload,
  Row,
  Col,
  Alert,
  Spin,
} from 'antd';
import {
  SettingOutlined,
  SecurityScanOutlined,
  MailOutlined,
  BellOutlined,
  UploadOutlined,
  SaveOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { useAppSelector } from '@/store/hooks';
import { hasPermission } from '@/utils/auth';
import { adminAuthApi } from '@/api/admin';
import './index.less';

const { TabPane } = Tabs;
const { TextArea } = Input;

const Settings: React.FC = () => {
  const { admin, loading: authLoading } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [basicForm] = Form.useForm();
  const [securityForm] = Form.useForm();
  const [emailForm] = Form.useForm();
  const [notificationForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [passwordLoading, setPasswordLoading] = useState(false);

  // 等待 admin 信息加载（由 App.tsx 的 PrivateRoute 处理）

  // 加载中状态
  if (authLoading || !admin) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  // 检查权限
  if (!hasPermission(admin, 'system:setting')) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="权限不足"
          description="您没有权限访问系统设置"
          type="error"
          showIcon
        />
      </div>
    );
  }

  // 保存基础设置
  const handleSaveBasic = async (values: any) => {
    try {
      setLoading(true);
      // TODO: 调用API保存设置
      console.log('保存基础设置:', values);
      message.success('保存成功');
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  // 修改密码
  const handleChangePassword = async (values: any) => {
    try {
      setPasswordLoading(true);
      const { oldPassword, newPassword, confirmPassword } = values;

      if (newPassword !== confirmPassword) {
        message.error('两次输入的密码不一致');
        return;
      }

      await adminAuthApi.changePassword({
        oldPassword,
        newPassword,
      });

      message.success('密码修改成功，请重新登录');
      passwordForm.resetFields();
      
      // 延迟跳转到登录页
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (error: any) {
      // 错误消息已经在响应拦截器中显示，这里只需要处理特殊情况
      if (!error?.response && !error?.message) {
        console.error('密码修改失败:', error);
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  // 保存安全设置
  const handleSaveSecurity = async (values: any) => {
    try {
      setLoading(true);
      // TODO: 调用API保存设置
      console.log('保存安全设置:', values);
      message.success('保存成功');
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存邮件设置
  const handleSaveEmail = async (values: any) => {
    try {
      setLoading(true);
      // TODO: 调用API保存设置
      console.log('保存邮件设置:', values);
      message.success('保存成功');
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存通知设置
  const handleSaveNotification = async (values: any) => {
    try {
      setLoading(true);
      // TODO: 调用API保存设置
      console.log('保存通知设置:', values);
      message.success('保存成功');
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  // 测试邮件
  const handleTestEmail = async () => {
    try {
      const values = await emailForm.validateFields();
      setLoading(true);
      // TODO: 调用API测试邮件
      message.success('测试邮件已发送');
    } catch (error) {
      message.error('发送失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <Card>
        <Tabs defaultActiveKey="basic">
          {/* 基础设置 */}
          <TabPane
            tab={
              <span>
                <SettingOutlined />
                基础设置
              </span>
            }
            key="basic"
          >
            <Form
              form={basicForm}
              layout="vertical"
              onFinish={handleSaveBasic}
              initialValues={{
                siteName: 'IEclub',
                siteUrl: 'https://ieclub.com',
                siteDescription: 'IEclub社区平台',
                enableRegistration: true,
                enableComment: true,
                enableLike: true,
                enableBookmark: true,
              }}
            >
              <Row gutter={24}>
                <Col xs={24} lg={12}>
                  <Form.Item
                    label="网站名称"
                    name="siteName"
                    rules={[{ required: true, message: '请输入网站名称' }]}
                  >
                    <Input placeholder="IEclub" />
                  </Form.Item>
                </Col>

                <Col xs={24} lg={12}>
                  <Form.Item
                    label="网站URL"
                    name="siteUrl"
                    rules={[
                      { required: true, message: '请输入网站URL' },
                      { type: 'url', message: '请输入有效的URL' },
                    ]}
                  >
                    <Input placeholder="https://ieclub.com" />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item label="网站描述" name="siteDescription">
                    <TextArea rows={3} placeholder="网站描述" />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Divider>功能开关</Divider>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                  <Form.Item label="用户注册" name="enableRegistration" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                  <Form.Item label="评论功能" name="enableComment" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                  <Form.Item label="点赞功能" name="enableLike" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                  <Form.Item label="收藏功能" name="enableBookmark" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                  保存设置
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          {/* 安全设置 */}
          <TabPane
            tab={
              <span>
                <SecurityScanOutlined />
                安全设置
              </span>
            }
            key="security"
          >
            {/* 修改密码 */}
            <Card
              title={
                <span>
                  <LockOutlined /> 修改密码
                </span>
              }
              style={{ marginBottom: 24 }}
            >
              <Form
                form={passwordForm}
                layout="vertical"
                onFinish={handleChangePassword}
              >
                <Row gutter={24}>
                  <Col xs={24} lg={12}>
                    <Form.Item
                      label="当前密码"
                      name="oldPassword"
                      rules={[{ required: true, message: '请输入当前密码' }]}
                    >
                      <Input.Password placeholder="请输入当前密码" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} lg={12}>
                    <Form.Item
                      label="新密码"
                      name="newPassword"
                      rules={[
                        { required: true, message: '请输入新密码' },
                        { min: 8, message: '密码长度至少8位' },
                        {
                          pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                          message: '密码必须包含大小写字母、数字和特殊字符',
                        },
                      ]}
                    >
                      <Input.Password placeholder="请输入新密码（至少8位，包含大小写字母、数字和特殊字符）" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} lg={12}>
                    <Form.Item
                      label="确认新密码"
                      name="confirmPassword"
                      dependencies={['newPassword']}
                      rules={[
                        { required: true, message: '请确认新密码' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('newPassword') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('两次输入的密码不一致'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password placeholder="请再次输入新密码" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<LockOutlined />}
                    loading={passwordLoading}
                  >
                    修改密码
                  </Button>
                </Form.Item>
              </Form>
            </Card>

            {/* 系统安全设置 */}
            <Card title="系统安全设置">
              <Form
                form={securityForm}
                layout="vertical"
                onFinish={handleSaveSecurity}
                initialValues={{
                  enableTwoFactor: false,
                  loginAttempts: 5,
                  lockoutDuration: 15,
                  sessionTimeout: 24,
                  passwordMinLength: 8,
                  passwordRequireSpecial: true,
                  enableCaptcha: true,
                }}
              >
                <Row gutter={24}>
                <Col xs={24}>
                  <Form.Item
                    label="双因素认证"
                    name="enableTwoFactor"
                    valuePropName="checked"
                    extra="强制所有管理员启用双因素认证"
                  >
                    <Switch />
                  </Form.Item>
                </Col>

                <Col xs={24} lg={12}>
                  <Form.Item
                    label="登录尝试次数"
                    name="loginAttempts"
                    extra="超过此次数将锁定账号"
                  >
                    <InputNumber min={3} max={10} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>

                <Col xs={24} lg={12}>
                  <Form.Item
                    label="锁定时长（分钟）"
                    name="lockoutDuration"
                    extra="账号锁定后的解锁时间"
                  >
                    <InputNumber min={5} max={60} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>

                <Col xs={24} lg={12}>
                  <Form.Item
                    label="会话超时（小时）"
                    name="sessionTimeout"
                    extra="用户无操作后自动登出时间"
                  >
                    <InputNumber min={1} max={72} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>

                <Col xs={24} lg={12}>
                  <Form.Item
                    label="密码最小长度"
                    name="passwordMinLength"
                    extra="用户密码最小长度要求"
                  >
                    <InputNumber min={6} max={20} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item
                    label="密码复杂度"
                    name="passwordRequireSpecial"
                    valuePropName="checked"
                    extra="要求密码包含特殊字符"
                  >
                    <Switch />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item
                    label="登录验证码"
                    name="enableCaptcha"
                    valuePropName="checked"
                    extra="登录时要求输入验证码"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

                <Form.Item>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                    保存设置
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </TabPane>

          {/* 邮件设置 */}
          <TabPane
            tab={
              <span>
                <MailOutlined />
                邮件设置
              </span>
            }
            key="email"
          >
            <Form
              form={emailForm}
              layout="vertical"
              onFinish={handleSaveEmail}
              initialValues={{
                smtpHost: 'smtp.gmail.com',
                smtpPort: 587,
                smtpSecure: true,
                smtpUser: '',
                smtpFrom: 'noreply@ieclub.com',
                smtpFromName: 'IEclub',
              }}
            >
              <Row gutter={24}>
                <Col xs={24} lg={12}>
                  <Form.Item
                    label="SMTP服务器"
                    name="smtpHost"
                    rules={[{ required: true, message: '请输入SMTP服务器' }]}
                  >
                    <Input placeholder="smtp.gmail.com" />
                  </Form.Item>
                </Col>

                <Col xs={24} lg={12}>
                  <Form.Item
                    label="SMTP端口"
                    name="smtpPort"
                    rules={[{ required: true, message: '请输入端口' }]}
                  >
                    <InputNumber min={1} max={65535} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>

                <Col xs={24} lg={12}>
                  <Form.Item label="SMTP用户名" name="smtpUser">
                    <Input placeholder="用户名" />
                  </Form.Item>
                </Col>

                <Col xs={24} lg={12}>
                  <Form.Item label="SMTP密码" name="smtpPassword">
                    <Input.Password placeholder="密码" />
                  </Form.Item>
                </Col>

                <Col xs={24} lg={12}>
                  <Form.Item
                    label="发件人邮箱"
                    name="smtpFrom"
                    rules={[
                      { required: true, message: '请输入发件人邮箱' },
                      { type: 'email', message: '请输入有效的邮箱' },
                    ]}
                  >
                    <Input placeholder="noreply@ieclub.com" />
                  </Form.Item>
                </Col>

                <Col xs={24} lg={12}>
                  <Form.Item label="发件人名称" name="smtpFromName">
                    <Input placeholder="IEclub" />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item label="SSL/TLS" name="smtpSecure" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                    保存设置
                  </Button>
                  <Button onClick={handleTestEmail} loading={loading}>
                    发送测试邮件
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </TabPane>

          {/* 通知设置 */}
          <TabPane
            tab={
              <span>
                <BellOutlined />
                通知设置
              </span>
            }
            key="notification"
          >
            <Form
              form={notificationForm}
              layout="vertical"
              onFinish={handleSaveNotification}
              initialValues={{
                enableEmailNotification: true,
                enablePushNotification: true,
                notifyNewUser: true,
                notifyNewPost: false,
                notifyNewReport: true,
                notifySystemError: true,
              }}
            >
              <Row gutter={24}>
                <Col xs={24}>
                  <Form.Item
                    label="邮件通知"
                    name="enableEmailNotification"
                    valuePropName="checked"
                    extra="启用邮件通知功能"
                  >
                    <Switch />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item
                    label="推送通知"
                    name="enablePushNotification"
                    valuePropName="checked"
                    extra="启用浏览器推送通知"
                  >
                    <Switch />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Divider>通知类型</Divider>
                </Col>

                <Col xs={24}>
                  <Form.Item
                    label="新用户注册"
                    name="notifyNewUser"
                    valuePropName="checked"
                    extra="有新用户注册时通知管理员"
                  >
                    <Switch />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item
                    label="新内容发布"
                    name="notifyNewPost"
                    valuePropName="checked"
                    extra="有新帖子发布时通知管理员"
                  >
                    <Switch />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item
                    label="新举报提交"
                    name="notifyNewReport"
                    valuePropName="checked"
                    extra="有新举报提交时通知管理员"
                  >
                    <Switch />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item
                    label="系统错误"
                    name="notifySystemError"
                    valuePropName="checked"
                    extra="系统发生错误时通知管理员"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                  保存设置
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default Settings;

