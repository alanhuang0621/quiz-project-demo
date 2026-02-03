<template>
  <div class="question-management">
    <div class="header">
      <a-button type="primary" @click="handleAdd">添加题目</a-button>
      <a-upload
        name="file"
        :multiple="false"
        :action="importUrl"
        :headers="headers"
        :data="importData"
        @change="handleImportChange"
      >
        <a-button>导入题目 (Excel)</a-button>
      </a-upload>
    </div>
    
    <a-table :columns="columns" :data-source="questions" :loading="loading" row-key="question_id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <a-space>
            <a @click="handleEdit(record)">编辑</a>
            <a-popconfirm title="确定删除吗？" @confirm="handleDelete(record.question_id)">
              <a class="delete-btn">删除</a>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <QuestionManagementModal
      v-model:open="modalOpen"
      :mode="modalMode"
      :initial-data="editingQuestion"
      @success="fetchQuestions"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { message } from 'ant-design-vue';
import questionService from '../services/questionService';
import QuestionManagementModal from './QuestionManagementModal.vue';

const questions = ref([]);
const loading = ref(false);
const modalOpen = ref(false);
const modalMode = ref('add');
const editingQuestion = ref(null);

const importUrl = 'http://localhost:5000/api/questions/import';
const headers = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('authToken')}`
}));
const importData = ref({
  subject_id: 1, // Default subject
  bank_id: 1    // Default bank
});

const columns = [
  { title: 'ID', dataIndex: 'question_id', key: 'question_id' },
  { title: '题干', dataIndex: 'question_content', key: 'question_content', ellipsis: true },
  { title: '题型', dataIndex: 'question_type', key: 'question_type' },
  { title: '操作', key: 'action' }
];

const fetchQuestions = async () => {
  loading.value = true;
  try {
    const data = await questionService.getAllQuestions();
    questions.value = data;
  } catch (error) {
    message.error('获取题目失败');
  } finally {
    loading.value = false;
  }
};

const handleAdd = () => {
  modalMode.value = 'add';
  editingQuestion.value = null;
  modalOpen.value = true;
};

const handleEdit = (record) => {
  modalMode.value = 'edit';
  editingQuestion.value = { ...record };
  modalOpen.value = true;
};

const handleDelete = async (id) => {
  try {
    await questionService.deleteQuestion(id);
    message.success('删除成功');
    fetchQuestions();
  } catch (error) {
    message.error('删除失败');
  }
};

const handleImportChange = (info) => {
  if (info.file.status === 'done') {
    message.success(`${info.file.name} 导入成功`);
    fetchQuestions();
  } else if (info.file.status === 'error') {
    message.error(`${info.file.name} 导入失败`);
  }
};

onMounted(fetchQuestions);
</script>

<style scoped>
.header {
  margin-bottom: 16px;
  display: flex;
  gap: 16px;
}
.delete-btn {
  color: #ff4d4f;
}
</style>
