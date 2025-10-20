// frontend/src/pages/login/index.jsx
import { useState, useEffect } from 'react';
import { View, Input, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import './index.scss';

const LoginPage = () => {
  const [mode, setMode] = useState('login'); // login, register, forgot
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  // 登录表单
  const [loginForm, setLoginForm] = useState({
    account: '',
    password: ''
  });

  // 注册表单
  const [registerForm, setRegisterForm] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    verificationCode: ''
  });

  // 忘记密码表单
  const [forgotForm, setForgotForm] = useState({
    email: '',
    verificationCode: '',
    newPassword: '',
    confirmPassword: '',
    resetToken: ''
  });

  // 倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 发送验证码
  const sendVerificationCode = async (email, type = 'register') => {
    if (!email) {
      Taro.showToast({
        title: '请输入邮箱',
        icon: 'none'
      });
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Taro.showToast({
        title: '邮箱格式不正确',
        icon: 'none'
      });
      return;
    }

    setLoading(true);

    try {
      const res = await Taro.request({
        url: `${process.env.TARO_APP_API}/auth/send-code`,
        method: 'POST',
        data: {
          email,
          type
        }
      });

      if (res.data.code === 200) {
        Taro.showToast({
          title: '验证码已发送',
          icon: 'success'
        });
        setCountdown(60);
      } else {
        Taro.showToast({
          title: res.data.message || '发送失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('发送验证码失败:', error);
      Taro.showToast({
        title: '发送失败，请稍后重试',
        icon: 'none'
      });
    } finally {
      setLoading(false);
    }
  };

  // 登录
  const handleLogin = async () => {
    const { account, password } = loginForm;

    if (!account || !password) {
      Taro.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    setLoading(true);

    try {
      const res = await Taro.request({
        url: `${process.env.TARO_APP_API}/auth/login`,
        method: 'POST',
        data: {
          account,
          password
        }
      });

      if (res.data.code === 200) {
        // 保存 token 和用户信息
        Taro.setStorageSync('token', res.data.data.token);
        Taro.setStorageSync('userInfo', res.data.data.user);

        Taro.showToast({
          title: '登录成功',
          icon: 'success'
        });

        setTimeout(() => {
          Taro.switchTab({
            url: '/pages/index/index'
          });
        }, 1500);
      } else {
        Taro.showToast({
          title: res.data.message || '登录失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('登录失败:', error);
      Taro.showToast({
        title: '登录失败，请稍后重试',
        icon: 'none'
      });
    } finally {
      setLoading(false);
    }
  };

  // 注册
  const handleRegister = async () => {
    const { email, username, password, confirmPassword, verificationCode } = registerForm;

    if (!email || !username || !password || !verificationCode) {
      Taro.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    if (password !== confirmPassword) {
      Taro.showToast({
        title: '两次密码不一致',
        icon: 'none'
      });
      return;
    }

    if (password.length < 8) {
      Taro.showToast({
        title: '密码至少8个字符',
        icon: 'none'
      });
      return;
    }

    setLoading(true);

    try {
      const res = await Taro.request({
        url: `${process.env.TARO_APP_API}/auth/register`,
        method: 'POST',
        data: {
          email,
          username,
          password,
          verificationCode
        }
      });

      if (res.data.code === 201) {
        // 保存 token 和用户信息
        Taro.setStorageSync('token', res.data.data.token);
        Taro.setStorageSync('userInfo', res.data.data.user);

        Taro.showToast({
          title: '注册成功',
          icon: 'success'
        });

        setTimeout(() => {
          Taro.switchTab({
            url: '/pages/index/index'
          });
        }, 1500);
      } else {
        Taro.showToast({
          title: res.data.message || '注册失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('注册失败:', error);
      Taro.showToast({
        title: '注册失败，请稍后重试',
        icon: 'none'
      });
    } finally {
      setLoading(false);
    }
  };

  // 忘记密码 - 第一步：验证邮箱
  const handleForgotPasswordStep1 = async () => {
    const { email, verificationCode } = forgotForm;

    if (!email || !verificationCode) {
      Taro.showToast({
        title: '请填写邮箱和验证码',
        icon: 'none'
      });
      return;
    }

    setLoading(true);

    try {
      const res = await Taro.request({
        url: `${process.env.TARO_APP_API}/auth/forgot-password`,
        method: 'POST',
        data: {
          email,
          verificationCode
        }
      });

      if (res.data.code === 200) {
        setForgotForm({
          ...forgotForm,
          resetToken: res.data.data.resetToken
        });
        setMode('reset');
        Taro.showToast({
          title: '验证成功',
          icon: 'success'
        });
      } else {
        Taro.showToast({
          title: res.data.message || '验证失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('验证失败:', error);
      Taro.showToast({
        title: '验证失败，请稍后重试',
        icon: 'none'
      });
    } finally {
      setLoading(false);
    }
  };

  // 重置密码 - 第二步：设置新密码
  const handleResetPassword = async () => {
    const { resetToken, newPassword, confirmPassword } = forgotForm;

    if (!newPassword || !confirmPassword) {
      Taro.showToast({
        title: '请填写新密码',
        icon: 'none'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Taro.showToast({
        title: '两次密码不一致',
        icon: 'none'
      });
      return;
    }

    if (newPassword.length < 8) {
      Taro.showToast({
        title: '密码至少8个字符',
        icon: 'none'
      });
      return;
    }

    setLoading(true);

    try {
      const res = await Taro.request({
        url: `${process.env.TARO_APP_API}/auth/reset-password`,
        method: 'POST',
        data: {
          resetToken,
          newPassword
        }
      });

      if (res.data.code === 200) {
        Taro.showToast({
          title: '密码重置成功',
          icon: 'success'
        });

        setTimeout(() => {
          setMode('login');
          setForgotForm({
            email: '',
            verificationCode: '',
            newPassword: '',
            confirmPassword: '',
            resetToken: ''
          });
        }, 1500);
      } else {
        Taro.showToast({
          title: res.data.message || '重置失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('重置密码失败:', error);
      Taro.showToast({
        title: '重置失败，请稍后重试',
        icon: 'none'
      });
    } finally {
      setLoading(false);
    }
  };

  // 渲染登录表单
  const renderLoginForm = () => (
    <View className="form">
      <View className="form-title">欢迎回来</View>
      <View className="form-subtitle">登录 IEClub</View>

      <View className="input-group">
        <View className="input-wrapper">
          <User size={20} className="input-icon" />
          <Input
            className="input"
            type="text"
            placeholder="用户名或邮箱"
            value={loginForm.account}
            onInput={(e) => setLoginForm({ ...loginForm, account: e.detail.value })}
          />
        </View>

        <View className="input-wrapper">
          <Lock size={20} className="input-icon" />
          <Input
            className="input"
            type={showPassword ? 'text' : 'password'}
            placeholder="密码"
            value={loginForm.password}
            onInput={(e) => setLoginForm({ ...loginForm, password: e.detail.value })}
          />
          <View className="input-action" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </View>
        </View>
      </View>

      <View className="form-link" onClick={() => setMode('forgot')}>
        忘记密码？
      </View>

      <Button
        className="submit-btn"
        onClick={handleLogin}
        loading={loading}
      >
        登录
      </Button>

      <View className="switch-mode">
        还没有账号？
        <View className="switch-link" onClick={() => setMode('register')}>
          立即注册
        </View>
      </View>
    </View>
  );

  // 渲染注册表单
  const renderRegisterForm = () => (
    <View className="form">
      <View className="form-title">加入我们</View>
      <View className="form-subtitle">创建 IEClub 账号</View>

      <View className="input-group">
        <View className="input-wrapper">
          <Mail size={20} className="input-icon" />
          <Input
            className="input"
            type="text"
            placeholder="学校邮箱"
            value={registerForm.email}
            onInput={(e) => setRegisterForm({ ...registerForm, email: e.detail.value })}
          />
        </View>

        <View className="input-wrapper">
          <Input
            className="input code-input"
            type="text"
            placeholder="验证码"
            maxlength={6}
            value={registerForm.verificationCode}
            onInput={(e) => setRegisterForm({ ...registerForm, verificationCode: e.detail.value })}
          />
          <Button
            className="code-btn"
            disabled={countdown > 0 || loading}
            onClick={() => sendVerificationCode(registerForm.email, 'register')}
          >
            {countdown > 0 ? `${countdown}s` : '获取验证码'}
          </Button>
        </View>

        <View className="input-wrapper">
          <User size={20} className="input-icon" />
          <Input
            className="input"
            type="text"
            placeholder="用户名（3-20个字符）"
            value={registerForm.username}
            onInput={(e) => setRegisterForm({ ...registerForm, username: e.detail.value })}
          />
        </View>

        <View className="input-wrapper">
          <Lock size={20} className="input-icon" />
          <Input
            className="input"
            type={showPassword ? 'text' : 'password'}
            placeholder="密码（至少8个字符）"
            value={registerForm.password}
            onInput={(e) => setRegisterForm({ ...registerForm, password: e.detail.value })}
          />
          <View className="input-action" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </View>
        </View>

        <View className="input-wrapper">
          <Lock size={20} className="input-icon" />
          <Input
            className="input"
            type={showPassword ? 'text' : 'password'}
            placeholder="确认密码"
            value={registerForm.confirmPassword}
            onInput={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.detail.value })}
          />
        </View>
      </View>

      <Button
        className="submit-btn"
        onClick={handleRegister}
        loading={loading}
      >
        注册
      </Button>

      <View className="switch-mode">
        已有账号？
        <View className="switch-link" onClick={() => setMode('login')}>
          立即登录
        </View>
      </View>
    </View>
  );

  // 渲染忘记密码表单
  const renderForgotForm = () => (
    <View className="form">
      <View className="form-title">重置密码</View>
      <View className="form-subtitle">验证您的邮箱</View>

      <View className="input-group">
        <View className="input-wrapper">
          <Mail size={20} className="input-icon" />
          <Input
            className="input"
            type="text"
            placeholder="注册邮箱"
            value={forgotForm.email}
            onInput={(e) => setForgotForm({ ...forgotForm, email: e.detail.value })}
          />
        </View>

        <View className="input-wrapper">
          <Input
            className="input code-input"
            type="text"
            placeholder="验证码"
            maxlength={6}
            value={forgotForm.verificationCode}
            onInput={(e) => setForgotForm({ ...forgotForm, verificationCode: e.detail.value })}
          />
          <Button
            className="code-btn"
            disabled={countdown > 0 || loading}
            onClick={() => sendVerificationCode(forgotForm.email, 'reset')}
          >
            {countdown > 0 ? `${countdown}s` : '获取验证码'}
          </Button>
        </View>
      </View>

      <Button
        className="submit-btn"
        onClick={handleForgotPasswordStep1}
        loading={loading}
      >
        下一步
      </Button>

      <View className="switch-mode">
        <View className="switch-link" onClick={() => setMode('login')}>
          返回登录
        </View>
      </View>
    </View>
  );

  // 渲染重置密码表单
  const renderResetForm = () => (
    <View className="form">
      <View className="form-title">设置新密码</View>
      <View className="form-subtitle">请输入您的新密码</View>

      <View className="input-group">
        <View className="input-wrapper">
          <Lock size={20} className="input-icon" />
          <Input
            className="input"
            type={showPassword ? 'text' : 'password'}
            placeholder="新密码（至少8个字符）"
            value={forgotForm.newPassword}
            onInput={(e) => setForgotForm({ ...forgotForm, newPassword: e.detail.value })}
          />
          <View className="input-action" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </View>
        </View>

        <View className="input-wrapper">
          <Lock size={20} className="input-icon" />
          <Input
            className="input"
            type={showPassword ? 'text' : 'password'}
            placeholder="确认新密码"
            value={forgotForm.confirmPassword}
            onInput={(e) => setForgotForm({ ...forgotForm, confirmPassword: e.detail.value })}
          />
        </View>
      </View>

      <Button
        className="submit-btn"
        onClick={handleResetPassword}
        loading={loading}
      >
        完成
      </Button>
    </View>
  );

  return (
    <View className="login-page">
      <View className="background">
        <View className="gradient-circle circle-1"></View>
        <View className="gradient-circle circle-2"></View>
        <View className="gradient-circle circle-3"></View>
      </View>

      <View className="content">
        <View className="logo">
          <View className="logo-icon">IE</View>
          <View className="logo-text">IEClub</View>
        </View>

        {mode === 'login' && renderLoginForm()}
        {mode === 'register' && renderRegisterForm()}
        {mode === 'forgot' && renderForgotForm()}
        {mode === 'reset' && renderResetForm()}
      </View>
    </View>
  );
};

export default LoginPage;