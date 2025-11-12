<template>
    <div class="login">
        <el-form ref="loginRef" :rules="loginRules" label-width="auto" :model="loginForm" style="max-width: 600px"
            class="login-form">
            <h1>用户登录</h1>
            <el-form-item label="账号" prop="username">
                <el-input placeholder="账号" v-model="loginForm.username">
                    <template #prefix>
                        <el-icon>
                            <User />
                        </el-icon>
                    </template>
                </el-input>
            </el-form-item>
            <el-form-item label="密码" prop="password">
                <el-input placeholder="密码" v-model="loginForm.password" show-password>
                    <template #prefix>
                        <el-icon>
                            <Lock />
                        </el-icon>
                    </template>
                </el-input>
            </el-form-item>
            <el-checkbox v-model="loginForm.remeberMe"  label="记住密码" size="large" />
            <div class="login-btn">
                <el-button type="primary" @click.prevent="login">登录</el-button>
                <el-button type="success" @click="goToRegister">注册</el-button>
            </div>

        </el-form>

    </div>
</template>

<script setup>
import request from '@/utils/request';
import { ref } from 'vue';
import Cookies from 'js-cookie';
import router from '@/router/index';
const loginForm = ref({
    username: '',
    password: '',
    remeberMe: false,
})
const loginRef = ref(null)

const loginRules = {
    username: [{ required: true, message: '请输入账号', trigger: 'blur' },],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' },]
}
const login = () => {
    loginRef.value.validate(async (valid) => {
        if (valid) {
            const response = await request.post('user/login/', {
                username: loginForm.value.username,
                password: loginForm.value.password,
            });

            if (response.code === 200) {
                window.localStorage.setItem('token', response.token.access);
                window.localStorage.setItem('refresh_token', response.token.refresh);
                window.localStorage.setItem('username', loginForm.value.username);
                router.replace('/');
            } else {
                console.error('登录失败:', response.message);
                ElMessage.error(response.message);
            }
        }
    });
};

function getCookie() {
    const username = Cookies.get('username')
    const password = Cookies.get('password')
    const remeberMe = Cookies.get('remeberMe')
    loginForm.value = {
        username: username === undefined ? loginForm.value.username : username,
        password: password === undefined ? loginForm.value.password : password,
        remeberMe: remeberMe === undefined ? false : Boolean(remeberMe)
    }
    // console.log(loginForm.value)
}
getCookie()

const goToRegister = () => {
    router.push('/register');
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