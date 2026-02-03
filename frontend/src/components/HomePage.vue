<template>
  <div class="home-page">
    <a-layout>
      <a-layout-header class="header">
        <div class="logo">答题系统</div>
        <div class="user-info">
          <span>{{ user.realName }} ({{ user.username }})</span>
          <a-button type="link" @click="handleLogout">退出登录</a-button>
        </div>
      </a-layout-header>
      <a-layout-content class="content">
        <a-row :gutter="24">
          <a-col :span="8">
            <a-card title="个人信息">
              <p><strong>真实姓名:</strong> {{ user.realName }}</p>
              <p><strong>账号:</strong> {{ user.username }}</p>
              <p><strong>邮箱:</strong> {{ user.email }}</p>
              <p><strong>部门:</strong> {{ user.departmentName }}</p>
              <p><strong>等级:</strong> Lv.{{ user.level }}</p>
              <p><strong>经验:</strong> {{ user.experience }}</p>
            </a-card>
          </a-col>
          <a-col :span="16">
            <a-row :gutter="[16, 16]">
              <a-col :span="12">
                <a-button type="primary" block size="large" @click="$emit('navigate', 'select')">
                  进入练习题库
                </a-button>
              </a-col>
              <a-col :span="12">
                <a-button block size="large" @click="goToDailyQuestionManagement">
                  今日测验
                </a-button>
              </a-col>
              <a-col :span="12">
                <a-button block size="large" @click="$emit('navigate', 'questionManagement')">
                  题库管理
                </a-button>
              </a-col>
            </a-row>
          </a-col>
        </a-row>
      </a-layout-content>
    </a-layout>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import userService from '../services/userService';
import authService from '../services/authService';

const emit = defineEmits(['navigate', 'logout']);
const user = ref({
  username: '',
  realName: '',
  email: '',
  departmentName: '',
  level: 1,
  experience: 0
});

onMounted(async () => {
  try {
    const profile = await userService.getProfile();
    user.value = profile;
  } catch (error) {
    message.error('获取个人信息失败');
  }
});

const handleLogout = () => {
  authService.logout();
  emit('logout');
};

const goToDailyQuestionManagement = () => {
  emit('navigate', 'dailyQuestionManagement');
};
</script>

<style scoped>
.home-page {
  height: 100vh;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.logo {
  font-size: 20px;
  font-weight: bold;
}
.content {
  padding: 24px;
}
</style>
