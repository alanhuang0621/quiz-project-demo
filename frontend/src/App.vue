<template>
  <div id="app">
    <LoginPage 
      v-if="currentPage === 'login'" 
      @navigate="handleNavigate" 
      @loginSuccess="handleLoginSuccess" 
    />
    <RegisterPage 
      v-else-if="currentPage === 'register'" 
      @navigate="handleNavigate" 
    />
    <HomePage 
      v-else-if="currentPage === 'home'" 
      @navigate="handleNavigate" 
      @logout="handleLogout"
    />
    <SelectPage 
      v-else-if="currentPage === 'select'" 
      @navigate="handleNavigate" 
    />
    <QuestionManagement 
      v-else-if="currentPage === 'questionManagement'" 
      @navigate="handleNavigate" 
    />
    <!-- Add more pages as needed -->
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import LoginPage from './components/LoginPage.vue';
import RegisterPage from './components/RegisterPage.vue';
import HomePage from './components/HomePage.vue';
import QuestionManagement from './components/QuestionManagement.vue';
import authService from './services/authService';

const currentPage = ref('login');

onMounted(() => {
  if (authService.isAuthenticated()) {
    currentPage.value = 'home';
  }
});

const handleNavigate = (page) => {
  currentPage.value = page;
};

const handleLoginSuccess = () => {
  currentPage.value = 'home';
};

const handleLogout = () => {
  currentPage.value = 'login';
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
</style>
