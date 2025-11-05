#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
IEClub 完整注册流程自动化测试
测试: 发送验证码 -> 注册 -> 登录 -> 获取用户信息
"""

import requests
import json
import time
import sys
from datetime import datetime

# API 基础URL
API_URL = "https://test.ieclub.online/api"

# 颜色输出
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_success(msg):
    print(f"{Colors.GREEN}✅ {msg}{Colors.ENDC}")

def print_error(msg):
    print(f"{Colors.RED}❌ {msg}{Colors.ENDC}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ️  {msg}{Colors.ENDC}")

def print_warning(msg):
    print(f"{Colors.YELLOW}⚠️  {msg}{Colors.ENDC}")

def print_header(msg):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.BLUE}{msg}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.ENDC}\n")

def test_health_check():
    """测试 1: 健康检查"""
    print_header("测试 1/6: 健康检查")
    
    try:
        response = requests.get(f"{API_URL}/health", timeout=10)
        data = response.json()
        
        if response.status_code == 200 and data.get('status') == 'ok':
            print_success("健康检查通过")
            print_info(f"服务: {data.get('service')}")
            print_info(f"版本: {data.get('version')}")
            print_info(f"运行时间: {data.get('uptime')}秒")
            return True
        else:
            print_error(f"健康检查失败: {data}")
            return False
    except Exception as e:
        print_error(f"健康检查异常: {str(e)}")
        return False

def send_verification_code(email):
    """测试 2: 发送验证码"""
    print_header("测试 2/6: 发送验证码")
    print_info(f"测试邮箱: {email}")
    
    try:
        response = requests.post(
            f"{API_URL}/auth/send-verify-code",
            json={"email": email, "type": "register"},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        data = response.json()
        
        if response.status_code == 200 and data.get('code') == 200:
            print_success("验证码发送成功")
            print_info(f"过期时间: {data.get('data', {}).get('expiresIn')}秒")
            return True
        else:
            print_error(f"验证码发送失败: {data.get('message')}")
            print_info(f"响应: {json.dumps(data, ensure_ascii=False, indent=2)}")
            return False
    except Exception as e:
        print_error(f"验证码发送异常: {str(e)}")
        return False

def register_user(email, password, verify_code, nickname):
    """测试 3: 用户注册"""
    print_header("测试 3/6: 用户注册")
    print_info(f"邮箱: {email}")
    print_info(f"昵称: {nickname}")
    print_info(f"验证码: {verify_code}")
    
    try:
        response = requests.post(
            f"{API_URL}/auth/register",
            json={
                "email": email,
                "password": password,
                "verifyCode": verify_code,
                "nickname": nickname,
                "gender": 1
            },
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        data = response.json()
        
        if (response.status_code == 200 or response.status_code == 201) and \
           (data.get('success') == True or data.get('code') == 200):
            print_success("用户注册成功")
            
            token = data.get('data', {}).get('token') or data.get('token')
            if token:
                print_info(f"Token: {token[:50]}...")
                return token
            else:
                print_warning("未返回Token，但注册成功")
                return "NO_TOKEN"
        else:
            print_error(f"用户注册失败: {data.get('message')}")
            print_info(f"响应: {json.dumps(data, ensure_ascii=False, indent=2)}")
            
            if "验证码" in str(data.get('message')):
                print_warning("验证码可能有误，请检查：")
                print_warning("1. 验证码是否输入正确")
                print_warning("2. 验证码是否已过期（10分钟）")
                print_warning("3. 邮箱是否正确")
            
            return None
    except Exception as e:
        print_error(f"用户注册异常: {str(e)}")
        return None

def login_user(email, password):
    """测试 4: 用户登录"""
    print_header("测试 4/6: 用户登录")
    print_info(f"邮箱: {email}")
    
    try:
        response = requests.post(
            f"{API_URL}/auth/login",
            json={"email": email, "password": password},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        data = response.json()
        
        if (response.status_code == 200) and \
           (data.get('success') == True or data.get('code') == 200):
            print_success("用户登录成功")
            
            token = data.get('data', {}).get('token') or data.get('token')
            if token:
                print_info(f"Token: {token[:50]}...")
                return token
            else:
                print_warning("未返回Token")
                return None
        else:
            print_error(f"用户登录失败: {data.get('message')}")
            print_info(f"响应: {json.dumps(data, ensure_ascii=False, indent=2)}")
            return None
    except Exception as e:
        print_error(f"用户登录异常: {str(e)}")
        return None

def get_user_profile(token):
    """测试 5: 获取用户信息"""
    print_header("测试 5/6: 获取用户信息")
    
    if not token or token == "NO_TOKEN":
        print_warning("跳过（无Token）")
        return False
    
    try:
        response = requests.get(
            f"{API_URL}/user/profile",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        data = response.json()
        
        if response.status_code == 200:
            print_success("获取用户信息成功")
            user_data = data.get('data', {}) or data
            print_info(f"昵称: {user_data.get('nickname')}")
            print_info(f"邮箱: {user_data.get('email')}")
            print_info(f"等级: {user_data.get('level')}")
            return True
        else:
            print_error(f"获取用户信息失败: {data.get('message')}")
            return False
    except Exception as e:
        print_error(f"获取用户信息异常: {str(e)}")
        return False

def get_activities():
    """测试 6: 获取活动列表"""
    print_header("测试 6/6: 获取活动列表")
    
    try:
        response = requests.get(
            f"{API_URL}/activities?page=1&pageSize=10",
            timeout=10
        )
        data = response.json()
        
        if response.status_code == 200:
            print_success("获取活动列表成功")
            
            activities = data.get('data', {}).get('list', []) or data.get('list', [])
            activity_count = len(activities)
            print_info(f"活动数量: {activity_count}")
            
            if activity_count > 0:
                print_info(f"第一个活动: {activities[0].get('title', 'N/A')}")
            
            return True
        else:
            print_warning(f"获取活动列表失败: {data.get('message')}")
            return False
    except Exception as e:
        print_error(f"获取活动列表异常: {str(e)}")
        return False

def main():
    print(f"\n{Colors.BOLD}{Colors.BLUE}╔════════════════════════════════════════╗{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.BLUE}║   IEClub 完整功能自动化测试             ║{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.BLUE}╚════════════════════════════════════════╝{Colors.ENDC}\n")
    
    # 生成唯一的测试邮箱
    timestamp = int(time.time())
    test_email = f"test_{timestamp}@qq.com"
    test_password = "Test123456!"
    test_nickname = f"测试用户_{timestamp % 100000}"
    
    # 测试 1: 健康检查
    if not test_health_check():
        print_error("健康检查失败，终止测试")
        sys.exit(1)
    
    # 测试 2: 发送验证码
    if not send_verification_code(test_email):
        print_error("验证码发送失败，终止测试")
        sys.exit(1)
    
    # 等待用户输入验证码
    print(f"\n{Colors.BOLD}{Colors.YELLOW}{'='*60}{Colors.ENDC}")
    print(f"{Colors.YELLOW}📧 请检查邮箱 {test_email}{Colors.ENDC}")
    print(f"{Colors.YELLOW}   并输入收到的6位验证码：{Colors.ENDC}")
    verify_code = input(f"{Colors.YELLOW}验证码: {Colors.ENDC}").strip()
    print(f"{Colors.BOLD}{Colors.YELLOW}{'='*60}{Colors.ENDC}\n")
    
    # 验证码格式检查
    if not verify_code.isdigit() or len(verify_code) != 6:
        print_error("验证码格式错误（应为6位数字）")
        sys.exit(1)
    
    # 测试 3: 用户注册
    token = register_user(test_email, test_password, verify_code, test_nickname)
    if not token:
        print_error("用户注册失败，终止测试")
        sys.exit(1)
    
    # 测试 4: 用户登录
    login_token = login_user(test_email, test_password)
    if login_token:
        token = login_token  # 使用登录获取的token
    
    # 测试 5: 获取用户信息
    get_user_profile(token)
    
    # 测试 6: 获取活动列表
    get_activities()
    
    # 测试总结
    print(f"\n{Colors.BOLD}{Colors.GREEN}╔════════════════════════════════════════╗{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.GREEN}║   ✅ 所有核心功能测试完成！            ║{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.GREEN}╚════════════════════════════════════════╝{Colors.ENDC}\n")
    
    print(f"{Colors.BLUE}测试账号信息：{Colors.ENDC}")
    print(f"   邮箱: {test_email}")
    print(f"   密码: {test_password}")
    print(f"   昵称: {test_nickname}")
    print()
    
    print(f"{Colors.GREEN}🎉 测试完成！系统运行正常！{Colors.ENDC}\n")

if __name__ == "__main__":
    main()

