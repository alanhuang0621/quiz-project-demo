<template>
  <a-modal
    :open="open"
    :title="mode === 'add' ? '添加题目' : '编辑题目'"
    @ok="handleOk"
    @cancel="$emit('update:open', false)"
    :confirm-loading="loading"
    width="800px"
  >
    <a-form :model="formState" layout="vertical">
      <a-form-item label="题型" name="question_type" required>
        <a-select v-model:value="formState.question_type">
          <a-select-option value="single">单选题</a-select-option>
          <a-select-option value="multiple">多选题</a-select-option>
          <a-select-option value="true_false">判断题</a-select-option>
          <a-select-option value="essay">问答题</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="题干" name="question_content" required>
        <a-textarea v-model:value="formState.question_content" :rows="4" />
      </a-form-item>
      <a-form-item label="选项 (JSON 格式)" name="options" v-if="['single', 'multiple'].includes(formState.question_type)">
        <a-textarea v-model:value="formState.options_str" :rows="4" placeholder='例如: ["A", "B", "C", "D"]' />
      </a-form-item>
      <a-form-item label="正确答案" name="correct_answer" required>
        <a-input v-model:value="formState.correct_answer" />
      </a-form-item>
      <a-form-item label="解析" name="explanation">
        <a-textarea v-model:value="formState.explanation" :rows="3" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup>
import { reactive, watch, ref } from 'vue';
import { message } from 'ant-design-vue';
import questionService from '../services/questionService';

const props = defineProps({
  open: Boolean,
  mode: String,
  initialData: Object
});

const emit = defineEmits(['update:open', 'success']);
const loading = ref(false);

const formState = reactive({
  question_type: 'single',
  question_content: '',
  options_str: '',
  correct_answer: '',
  explanation: ''
});

watch(() => props.initialData, (newVal) => {
  if (newVal) {
    Object.assign(formState, {
      ...newVal,
      options_str: newVal.options ? JSON.stringify(newVal.options) : ''
    });
  } else {
    Object.assign(formState, {
      question_type: 'single',
      question_content: '',
      options_str: '',
      correct_answer: '',
      explanation: ''
    });
  }
}, { immediate: true });

const handleOk = async () => {
  loading.value = true;
  try {
    const payload = {
      ...formState,
      options: formState.options_str ? JSON.parse(formState.options_str) : null
    };
    
    if (props.mode === 'add') {
      await questionService.createQuestion(payload);
    } else {
      await questionService.updateQuestion(props.initialData.question_id, payload);
    }
    
    message.success('操作成功');
    emit('success');
    emit('update:open', false);
  } catch (error) {
    message.error('操作失败: ' + (error.message || '格式错误'));
  } finally {
    loading.value = false;
  }
};
</script>
