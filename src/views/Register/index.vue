<template>
  <div class="login">
    <el-form
      ref="ruleFormRef"
      style="min-width: 400px"
      :model="ruleForm"
      status-icon
      :rules="rules"
      label-width="auto"
      class="login-form"
    >
    <h1>用户注册</h1>
      <el-form-item label="账号" prop="username">
        <el-input v-model="ruleForm.username" autocomplete="off" clearable />
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input
          v-model="ruleForm.password"
          type="password"
          autocomplete="off"
          clearable
        />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input
          v-model="ruleForm.confirmPassword"
          type="password"
          autocomplete="off"
          clearable
        />
      </el-form-item>

      <div class="login-btn">
        <!-- <el-button @click="resetForm(ruleFormRef)">重置</el-button> -->
        <el-button @click="router.push('/login')">返回</el-button>
        <el-button type="primary" @click="submitForm(ruleFormRef)">提交</el-button>
      </div>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { getRegisterApi } from "@/api/user";
import { useRouter } from "vue-router";

const router = useRouter(); // 获取路由实例
const getRegister = async () => {
  if (!ruleForm.username.trim() || !ruleForm.password.trim()) {
    ElMessage.error("用户名或密码不能为空");
    return;
  }
  try {
    // 调用注册接口，传递表单数据
    const res = await getRegisterApi({
      username: ruleForm.username,
      password: ruleForm.password,
    });
    // console.log('提交的注册数据:', {
    //     username: ruleForm.username,
    //     password: ruleForm.password,
    // });

    // 判断接口返回结果
    if (res.code === 200) {
      // console.log('注册成功:', res);
      ElMessage.success("注册成功！"); // 显示成功提示
      router.push("/login"); // 跳转到登录页面
    } else {
      console.error("注册失败:", res.message);
      ElMessage.error(res.message || "注册失败，请重试！"); // 显示错误提示
    }
  } catch (error) {
    console.error("注册请求失败:", error);
    ElMessage.error("网络错误，请稍后重试！"); // 显示网络错误提示
  }
};

const ruleFormRef = ref<FormInstance>();

const validatePassword = (rule: any, value: any, callback: any) => {
  if (value === "") {
    callback(new Error("请输入密码"));
  } else {
    if (ruleForm.confirmPassword !== "") {
      if (!ruleFormRef.value) return;
      ruleFormRef.value.validateField("confirmPassword");
    }
    callback();
  }
};

const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (value === "") {
    callback(new Error("请再次输入密码"));
  } else if (value !== ruleForm.password) {
    callback(new Error("两次输入的密码不一致"));
  } else {
    callback();
  }
};

const ruleForm = reactive({
  username: "",
  password: "",
  confirmPassword: "",
});

const rules = reactive<FormRules<typeof ruleForm>>({
  username: [{ required: true, message: "请输入账号", trigger: "blur" }],
  password: [{ required: true, validator: validatePassword, trigger: "blur" }],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: "blur" },
  ],
});

const submitForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  formEl.validate((valid) => {
    if (valid) {
      getRegister();
    } else {
      // console.log('提交失败！');
    }
  });
};

const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  formEl.resetFields();
};
</script>
<style scoped lang="scss">
.login {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    h1 {
        color: #FFF;
        font-size: 30px;
        margin-bottom: 20px;
    }
    :deep(){
        .el-form-item__label{
            color: #FFF;
        }
    }
    .login-form {
        width: 400px;
        padding: 20px;
        border: 1px solid #ccc;
        border-radius: 5px;

        // margin:auto;
        .login-btn {
            display: flex;
            justify-content: center;
            margin-top: 20px;
        }
    }
}
</style>