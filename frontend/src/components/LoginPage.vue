<template>
  <div class="login-page">
    <a-card title="答题系统 - 登录" class="login-card">
      <a-form :model="formState" @finish="onFinish" layout="vertical">
        <a-form-item label="用户名" name="username" :rules="[{ required: true, message: '请输入用户名' }]">
          <a-input v-model:value="formState.username" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item label="密码" name="password" :rules="[{ required: true, message: '请输入密码' }]">
          <a-input-password v-model:value="formState.password" placeholder="请输入密码" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="loading" block>登录</a-button>
        </a-form-item>
        <div class="footer-links">
          <a @click="$emit('navigate', 'register')">立即注册</a>
          <a @click="$emit('navigate', 'forgotPassword')">忘记密码</a>
        </div>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import authService from '../services/authService';

const emit = defineEmits(['navigate', 'loginSuccess']);
const loading = ref(false);

const formState = reactive({
  username: '',
  password: ''
});

const onFinish = async (values) => {
  loading.value = true;
  try {
    const data = await authService.login(values.username, values.password);
    message.success('登录成功');
    emit('loginSuccess', data);
  } catch (error) {
    message.error(error.response?.data?.message || '登录失败');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f0f2f5;
}
.login-card {
  width: 400px;
}
.footer-links {
  display: flex;
  justify-content: space-between;
}
</style>
