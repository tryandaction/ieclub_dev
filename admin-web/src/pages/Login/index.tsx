// 登录页面
import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Modal } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { login } from '@/store/slices/authSlice';
import QRCode from 'qrcode.react';
import './index.less';

const Login: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleLogin = async (values: any) => {
    try {
      setLoading(true);
      const result = await dispatch(login(values)).unwrap();
      
      message.success('登录成功');
      navigate('/dashboard');
    } catch (error: any) {
      // 检查是否需要2FA
      if (error.code === 4002 || error.message?.includes('2FA')) {
        setTwoFactorRequired(true);
        message.info('请输入双因素认证码');
      } else {
        message.error(error.message || '登录失败');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <Card className="login-card">
          <div className="login-header">
            <h1>IEclub 管理后台</h1>
            <p>欢迎回来，请登录您的账户</p>
          </div>

          <Form
            form={form}
            onFinish={handleLogin}
            size="large"
            autoComplete="off"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="管理员邮箱"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="登录密码"
                autoComplete="current-password"
              />
            </Form.Item>

            {twoFactorRequired && (
              <Form.Item
                name="twoFactorCode"
                rules={[
                  { required: true, message: '请输入6位验证码' },
                  { len: 6, message: '验证码为6位数字' },
                ]}
              >
                <Input
                  prefix={<SafetyOutlined />}
                  placeholder="双因素认证码"
                  maxLength={6}
                />
              </Form.Item>
            )}

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
              >
                登录
              </Button>
            </Form.Item>
          </Form>

          <div className="login-footer">
            <p>IEclub Admin © 2025</p>
            <p>仅供授权管理员使用</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;

